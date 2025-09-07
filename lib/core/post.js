import { WILDCARD, wrap } from './utils.js'

export async function post()
{
    const ordered = order(this.result, this.order, this.functions)
    const grouped = group(ordered, this.group)
    const limited = limit(grouped, this.limit, this.functions)

    return select(limited, this.select, this.group, this.functions, this.reductors, this.fields)
}


function order(input, order, funs)
{
    if(order != null)
    {
        const [exp, pre] = order
        const p = wrap(exp.toString(), ['__o', '__f'])
    
        input.sort((a,b) => pre(p(a, funs), p(b, funs)) ? 1 : -1)
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

    if(group != null)
    {
        // Find reductors in select
        for (const sel of select) 
        {
            if(sel[0].indexOf(`${WILDCARD.SP}r`) >= 0)
            {
                reduced.push([sel, null])
            }
        }

        // Create the reductor functions
        const redfun = new Object()
        for (const r of reduced)
        {
            redfun[r[0][0]] = wrap(r[0][0].toString(), ['__o', '__f', '__r', '__tmp'])
        }

        // Process
        for (const [_, value] of input.entries()) 
        {   
            //Reset reduced
            for (const r of reduced)
            {
                r[1] = null
            }

            for(const record of value)
            {
                for (const r of reduced) 
                {
                    r[1] = redfun[r[0][0]](record, funs, reductors, r[1])
                }
            }

            if(value.length > 0)
            {
                let record = value[0]
                for (const r of reduced)
                {
                    record[r[0][1]] = r[1]
                }
                flatview.push(record)
            }
        }   

        input = flatview   

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

    const preds = new Object()
    for(const se of select)
    {
        preds[se[0]] = wrap(se[0], ['__o', '__f'])
    }

    for (const record of input) 
    {
        const res = new Object()

        for(const se of select)
        {
            const found = reduced.find(r => r[0][0] == se[0])
            if(found)
            {
                res[se[1]] = record[se[1]]
            }
            else
            {
                res[se[1]] = preds[se[0]](record, funs)
            }
            
        }

        selected.push(res)
    }

    return selected
    
}