const params = {
    script : {
        processor: input,
        required : true,
        keys: ["s", "script"]
    }
}


module.exports = function cli(args)
{
    let query = new Object();

    while(args.length > 0)
    {
        let key = args.shift()
        let param = findParam(key.substring(1));
        if(param)
        {
            params[param].processor(query, param, args)
        }
    }

    let missing = checkRequired(query)
    if(missing)
    {
        let prettify = params[missing].keys.map(key => `-${key}`).join(' or ')
        console.error(`You must give the paramater: ${prettify}`)
    }

    return query;
}

function input(query, param, args)
{
    if(args.length > 0)
    {
        let val = args.shift();
        query[param] = val;
    }
    else
    {
        console.error(`You must give a value for the "${param}" parameter`)
    }
}

function findParam(key)
{
    for (const par in params) 
    {
        if(params[par].keys.includes(key))
        {
            return par;
        }
    }

    return null;
}

function checkRequired(current)
{
    for (const par in params) 
    {
        if(params[par].required)
        {
            if(!(par in current))
            {
                return par
            }
        }
    }

    return null
}
