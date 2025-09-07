/*
Script executor
*/

import { MEMORY_THRESHOLD, wrap, readable } from './utils.js'

export async function runner()
{
    let cache = [new Object()]
    const added = new Set()
    const models = [...this.from.entries()]
    const wheres = sortPredicates(this.where)

    let task = wheres.shift()
    while(task)
    {
        let next = nextJoin(added, task)
        if(next.length > 0)
        {
            cache = j2(this.logger, this.db, this.from, this.join, added, cache, next, task, this.functions)
        }
        else
        {
            const pred = wrap(task.expression, ['__o', '__f'])
            const before = cache.length;
            cache = cache.filter(r => pred(r, this.functions))
            this.logger.log(`[Runner] Filtering: P${task.id}(${task.bind.join(', ')}) => ${task.part} | [${readable(before)} -> ${readable(cache.length)}]`)
            task.finished = true
        }

        if(task.finished)
        {
            task = wheres.shift()
        }
    }

    let rem = remainingModel(added, models)
    while(rem)
    {
        cache = j2(this.logger, this.db, this.from, this.join, added, cache, rem, null, this.functions)
        rem = remainingModel(added, models)
    }
    
    this.tracker['set'] = cache.length;
    this.result = cache
}

function joinType(joins, added, nexts)
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

function remainingModel(added, models)
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

function sortPredicates(where)
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

function j2(logger, db, from, join, added, cache, next, task, funs)
{
    let [on, w] = joinType(join, added, next)
    let tmp;

    
    if(on)
    {
        //Join on
        added.add(w.on)
        tmp = joinOn(db, from, cache, w)
        logger.log(`[Runner] Join on: |-> ${w.on} (by ${w.with}) | [${readable(cache.length)} -> ${readable(tmp.length)}]`)
    }
    else
    {
        added.add(w)
        if(task && task.bind.length == 1 && task.bind[0] == w)
        {
            //Join pred
            tmp = joinBy(db, from, cache, w, funs, task)
            logger.log(`[Runner] Join with: P${task.id}(${task.bind.join(', ')}) -> ${w} | [${readable(cache.length)} -> ${readable(tmp.length)}]`)
            task.finished = true
        }
        else
        {
            //Join with
            tmp = joinWith(db, from, cache, w)
            logger.log(`[Runner] Join with: -> ${w} | [${readable(cache.length)} -> ${readable(tmp.length)}]`)
        }
    }

    return tmp
}

function joinWith(db, from, cache, model)
{
    const tmp = new Array()

    const estimated = from.length * cache.length;
    if(estimated > MEMORY_THRESHOLD)
    {
        throw new Error(`The selected dataset is too large (${estimated})`)
    }

    for (const left of cache) 
    {
        for (const right of db.get(from.get(model))) 
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

function joinBy(db, from, cache, model, funs, task)
{
    const pred = wrap(task.expression, ['__o', '__f'])
    const tmp = new Array()
    const filtered = new Array()
    
    for (const right of db.get(from.get(model))) 
    {
        const obj = new Object()
        for(const [key, value] of Object.entries(right))
        {
            obj[`${model}.${key}`] = value
        }

        if(pred(obj, funs))
        {
            
            filtered.push(obj)
        }
    }


    const estimated = filtered.length * cache.length;
    if(estimated > MEMORY_THRESHOLD)
    {
        throw new Error(`The selected dataset is too large (${estimated})`)
    }

    for (const left of cache) 
    {
        for (const right of filtered) 
        {
            tmp.push({
                ...left,
                ...right
            })
        }
    }

    return tmp
}