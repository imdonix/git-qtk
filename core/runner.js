const { WILDCARD } = require('./utils')

async function runner()
{
    let models = new Array()
    for (const [key, value] of this.from)
    {
        let dbrep = new Array() // we lose the key

        for (const it of this.db.models[value.name()].values()) 
        {
            dbrep.push(it)
        }

        let extracted = dbrep.map(model => [[key, model]])
        models.push(extracted)
    }

    let cache = models.pop()
    while(models.length > 0)
    {
        let acc = new Array()
        let model = models.pop()
        for (const k of model) 
        {
            for (const curr of cache) 
            {
                acc.push([...curr, ...k])
            }
        }

        cache = acc
    }
   
    let compossed = composse(cache)
    let limited = limit(compossed, this.limit, this.functions)
    let filtered = where(limited, this.where, this.functions)

    return select(filtered, this.select, this.functions)
}

function composse(input)
{
    let records = new Array()

    for (const record of input) 
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
        
        records.push(line)
    }

    return records
}

function select(input, select, funs)
{
    if(select.has(WILDCARD.ANY))
    {
        return input
    }
    else
    {
        let selected = new Array()
    
        function sel(obj, se)
        {
            const _ = obj
            const $ = funs
            return eval(se.toString())
        }

        for (const record of input) 
        {
            const res = new Object()

            for(const se of select)
            {
                res[se[1]] = sel(record, se[0])
            }

            selected.push(res)
        }
    
        return selected
    }
}

function where(input, where, funs)
{
    const filtered = new Array()
    
    function test(obj)
    {
        const _ = obj
        const $ = funs
        return eval(where.toString())
    }

    for (const record of input) 
    {
        if(test(record))
        {
            filtered.push(record)
        }
    }

    return filtered
}

function limit(input, lim)
{
    if(lim == null)
    {
        return input
    }
    else
    {
        let limited = new Array()
    
        for (let i = 0; i <= lim && i < input.length; i++) 
        {
            limited.push(input[i])
        }
    
        return limited
    }
}

module.exports = runner