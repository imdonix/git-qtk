const { MEMORY_THRESHOLD, wrap, readable } = require('./utils')

async function runner()
{
    let cache = [new Object()]
    const added = new Set()
    const models = [...this.from.entries()]
    const wheres = sortRunnable(this.where)

    let task = wheres.shift()
    while(task)
    {
        let next = nextJoin(added, task)
        if(next.length > 0)
        {
            cache = j2(this.logger, this.db, this.from, this.join, added, cache, next)
        }
        else
        {
            //Skip join part
            if(task.part != 'true')
            {
                const pred = wrap(task.expression, ['__o', '__f'])
                const before = cache.length;
                cache = cache.filter(r => pred(r, this.functions))
                this.logger.log(`Filtering: P${task.id}(${task.bind.join(', ')}) => ${task.part} | [${readable(before)} -> ${readable(cache.length)}]`)
            }

            task = wheres.shift()
        }
    }

    let rem = remain(added, models)
    while(rem)
    {
        cache = j2(this.logger, this.db, this.from, this.join, added, cache, rem)
        rem = remain(added, models)
    }
    
    this.tracker['set'] = cache.length;
    this.result = cache
}

function hasjoin(joins, added, nexts)
{
    for (const join of joins) 
    {
        for (const next of nexts) 
        {
            if(join.on == next)
            {
                if(added.has(join.with))
                {
                    return [true, join]
                }
                else
                {
                    return [false, join.with]
                }
            }   
        }
    }

    return [false, nexts[0]]
}

function remain(added, models)
{
    for (const model of models) 
    {
        if(!added.has(model[0]))
        {
            return model
        }
    }

    return null
}

function sortRunnable(where)
{
    return where.sort((a,b) => a.bind.length - b.bind.length)
}

function nextJoin(added, where)
{
    const tmp = new Array()

    for(const model of where.bind)
    {
        if(!added.has(model))
        {
            tmp.push(model)
        }
    }

    return tmp;
}

function mix(old, values, model)
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
            const comp = new Object()
            for(const [key, value] of Object.entries(right))
            {
                comp[`${model}.${key}`] = value
            }

            tmp.push({
                ...left,
                ...comp
            })
        }
    }

    return tmp
}

function j2(logger, db, from, join, added, cache, next)
{
    let [on, w] = hasjoin(join, added, next)
    let tmp;

    if(on)
    {
        added.add(w.on)
        tmp = joinOn(db, from, cache, w)
        logger.log(`Join on: -> ${w.on} (by ${w.with}) | [${readable(cache.length)} -> ${readable(tmp.length)}]`)
    }
    else
    {
        added.add(w)
        tmp = joinWith(db, from, cache, w)
        logger.log(`Join with: -> ${w} | [${readable(cache.length)} -> ${readable(tmp.length)}]`)
    }

    return tmp
}

function joinWith(db, from, cache, model)
{
    return mix(cache, db.get(from.get(model)), model)
}

function joinOn(db, from, cache, join)
{
    const tmp = new Array()

    const lt = db.view(from.get(join.on))
    for (const left of cache) 
    {
        const right = lt.get(left[`${join.with}.${join.model}`])
        if(right)
        {
            const comp = new Object()
            for(const [key, value] of Object.entries(right))
            {
                comp[`${join.on}.${key}`] = value
            }

            tmp.push({
                ...left,
                ...comp
            })
        }

    }

    return tmp
}


module.exports = runner