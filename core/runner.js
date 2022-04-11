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
    let filtered = where(compossed, this.where, this.functions)
    let ordered = order(filtered, this.order, this.functions)
    let grouped = group(ordered, this.group, this.functions)
    let limited = limit(grouped, this.limit, this.functions)

    return select(limited, this.select, this.functions)
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

function group(input, group, funs)
{
    if(group != null)
    {
        const acc = new Map()
        for (const record of input) 
        {
            const key = record[group]
            const arr = acc.get(key)
            if(arr != undefined)
            {
                arr.push(record)
            }
            else
            {
                acc.set(key, [record])
            }
        }

        return acc
    }
    
    return input
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
    
        function f(obj, se)
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
                res[se[1]] = f(record, se[0])
            }

            selected.push(res)
        }
    
        return selected
    }
}

function where(input, where, funs)
{
    const filtered = new Array()
    
    function f(obj)
    {
        const _ = obj
        const $ = funs
        return eval(where.toString())
    }

    for (const record of input) 
    {
        if(f(record))
        {
            filtered.push(record)
        }
    }

    return filtered
}

function limit(input, lim)
{
    if(lim != null)
    {
        input.length = Math.min(input.length, lim)
    }

    return input
}

function order(input, order, funs)
{
    if(order != null)
    {
        const [exp, pre] = order

        function f(obj)
        {
            const _ = obj
            const $ = funs
            return eval(exp.toString())
        }
    
        input.sort((a,b) => pre(f(a), f(b)) ? 1 : -1)
    }

    return input
}

module.exports = runner