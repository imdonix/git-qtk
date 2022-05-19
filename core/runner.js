const { WILDCARD, wrap, MEMORY_THRESHOLD } = require('./utils')

async function runner()
{
    let cache = [[]]
    const models = [...this.from.entries()]

    
    const added = new Set()
    for(const join of this.join)
    {
        const joined = new Array()

        const lt = this.db.view(this.from.get(join.on))
        for(const left of this.db.get(this.from.get(join.with)))
        {
            const right = lt.get(left[join.model])
            if(right)
            {
                if(!added.has(join.on) && !added.has(join.with))
                {
                    joined.push([right, left])
                }
                else if(!added.has(join.on))
                {
                    joined.push([right])
                }
                else if(!added.has(join.with))
                {
                    joined.push([left])
                }
            }
        }

        if(!added.has(join.on) && !added.has(join.with))
        {
            added.add(join.on)
            added.add(join.with)
        }
        else if(!added.has(join.on))
        {
            added.add(join.on)
        }
        else if(!added.has(join.with))
        {
            added.add(join.with)
        }

        this.logger.log(`Join: ${join.on} |-> ${join.with}`)
        cache = mix(cache, joined)
    }

    let mixins = models.filter(m => !this.join.find(j => j.on == m[0] || j.with == m[0]))
    for (const model of mixins) 
    {
        this.logger.log(`Join: ${model[0]}`)
        cache = mix(cache, this.db.get(model[1]))
    }

    this.tracker['set'] = cache.length;

    const compossed = composse(cache, new Array(...added), mixins)
    const filtered = where(compossed, this.where, this.functions)
    const ordered = order(filtered, this.order, this.functions)
    const grouped = group(ordered, this.group)
    const limited = limit(grouped, this.limit, this.functions)

    return select(limited, this.select, this.group, this.functions, this.reductors, this.fields)
}

function mix(old, values)
{
    const tmp = new Array()

    const estimated = old.length * values.length;
    if(estimated > MEMORY_THRESHOLD)
    {
        throw new Error(`The selected dataset is too large (${estimated})`)
    }

    for (const left of old) 
    {
        for (const right of values) 
        {
            if(right.length)
            {
                tmp.push([...left, ...right])
            }
            else
            {
                tmp.push([...left, right])
            }
        }
    }

    return tmp
}


function composse(input, joinmap, mixmap)
{
    let records = new Array()

    for (const line of input) 
    {
        const obj = new Object()
        
        let i = 0
        let j = 0
        for(const part of line)
        {
            if(j < joinmap.length)
            {
                for(const [key, value] of Object.entries(part))
                {
                    obj[`${joinmap[j]}.${key}`] = value
                }

                j++
            }
            else
            {
                for(const [key, value] of Object.entries(part))
                {
                    obj[`${mixmap[i][0]}.${key}`] = value
                }

                i++
            }
        }

        records.push(obj)
    }

    return records
}

function where(input, where, funs)
{
    const filtered = new Array()
    const pred = wrap(where.toString(), ['__o', '__f'])

    for (const record of input) 
    {
        if(pred(record, funs))
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
        const p = wrap(exp.toString(), ['__o', '__f'])
    
        input.sort((a,b) => pre(p(a), p(b)) ? 1 : -1)
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

module.exports = runner