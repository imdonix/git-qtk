const { params } = require('./query')

const processors = {
    string : inputProcessor,
    bool : toggleProcessor
}

function cli(args)
{
    let query = new Object();

    while(args.length > 0)
    {
        let key = args.shift()
        let par = findParam(key.substring(1));
        if(par)
        {
            let type = params[par].type
            processors[type](query, par, args)
        }
    }

    return query;
}

function inputProcessor(query, param, args)
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

function toggleProcessor(query, param, args)
{
    query[param] = true;
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

function prettyPrint(output)
{
    for (const record of output) 
    {
        let line = record.map(selector => {
            const obj = new Object()
            for (const [key, value] of Object.entries(selector[1])) 
            {
                obj[`${selector[0]}.${key}`] = value
            }
            return obj
        })
        .reduce((res, cur) => Object.assign(res, cur), new Object())
        
        console.log(line)
    }
}

module.exports = { cli, prettyPrint }