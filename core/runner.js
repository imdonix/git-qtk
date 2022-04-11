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
    let grouped = group(ordered, this.group)
    let limited = limit(grouped, this.limit, this.functions)

    return select(limited, this.select, this.group, this.functions, this.reductors, this.fields)
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

function where(input, where, funs)
{
    const filtered = new Array()
    
    function f(obj)
    {
        const __o = obj
        const __f = funs
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

function order(input, order, funs)
{
    if(order != null)
    {
        const [exp, pre] = order

        function f(obj)
        {
            const __o = obj
            const __f = funs
            return eval(exp.toString())
        }
    
        input.sort((a,b) => pre(f(a), f(b)) ? 1 : -1)
    }

    return input
}

function group(input, group)
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

function limit(input, lim)
{
    if(lim != null)
    {
        input.length = Math.min(input.length, lim)
    }

    return input
}

function select(input, select, group, funs, reductors, fields)
{
    const selected = new Array()
    const reduced = new Array()
    const flatview = new Array()

    function f(obj, se)
    {
        const __o = obj
        const __f = funs
        return eval(se.toString())
    }
    
    function r(reducted, obj)
    {
        const __o = obj
        const __f = funs
        const __r = reductors

        for (const r of reducted) 
        {
            const __tmp = r[1]
            r[1] = eval(r[0][0].toString())
        }
    }

    if(group != null)
    {
        for (const sel of select) 
        {
            if(sel[0].indexOf(`${WILDCARD.SP}r`) >= 0)
            {
                reduced.push([sel, null])
            }
        }

        for (const [_, value] of input.entries()) 
        {    
            for(const record of value)
            {
                r(reduced, record)
            }

            if(value.length > 0)
            {
                let record = value[0]
                record[reduced[0][1]] = r[1]
                flatview.push(record)
            }

            input = flatview
        }      

    }

    let ind = select.indexOf('$')
    if(ind >= 0)
    {
        select.splice(ind)
        if(input.length > 0)
        {
            for (const key of fields) 
            {
                select.push([`${WILDCARD.SP}o['${key[0]}']`,key[0]])
            }
        }
    }    

    for (const record of input) 
    {
        const res = new Object()

        for(const se of select)
        {
            const found = reduced.find(r => r[0][0] == se[0])
            if(found)
            {
                res[se[1]] = found[1]
            }
            else
            {
                res[se[1]] = f(record, se[0])
            }
            
        }

        selected.push(res)
    }

    return selected
    
}

module.exports = runner