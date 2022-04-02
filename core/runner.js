const { WILDCARD_ANY } = require('./utils')

async function runner()
{

    let models = new Array()
    for (const [key, value] of this.from)
    {
        let dbrep = new Array(...this.db.models[value.name()].values()) // we lose the key
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
    let limited = limit(compossed, this.limit)
    let filtered = where(limited, this.where)

    return select(filtered, this.select)
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

function select(input, select)
{
    let selected = new Array()
    let all = select.has(WILDCARD_ANY)

    for (const record of input) 
    {
        selected.push(Object.fromEntries(Object.entries(record).filter(([key]) => 
        {

            return all || select.has(key)
        })))
    }

    return selected
}

function where(input, where)
{
    let filtered = new Array()

    function test(obj)
    {
        const _ = obj
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
    if(limit == null)
    {
        return input
    }
    else
    {
        let limited = new Array()
    
        for (let i = 0; i < lim && i < input.length; i++) 
        {
            limited.push(input[i])
        }
    
        return limited
    }
}

module.exports = runner