const { MEMORY_THRESHOLD, wrap } = require('./utils')

async function runner()
{
    let cache = [new Object()]
    const added = new Set()
    const mixin = new Array()
    const models = [...this.from.entries()]
    const wheres = sortRunnable(this.where)
    
    let task = wheres.shift()
    while(task)
    {
        let next = nextJoin(added, task)
        if(next)
        {
            //TODO: Handle joins

            cache = join(this.db, this.from, cache, next)
            mixin.push(next)
            added.add(next)
        }
        else
        {
            const pred = wrap(task.expression, ['__o', '__f'])
            cache = cache.filter(r => pred(r, this.functions))
            task = wheres.shift()
        }
    }

    let rem = remain(added, models)
    while(rem)
    {
        cache = join(this.db, this.from, cache, rem[0])
        added.add(rem)
        rem = remain(added, models)
    }
    
    this.tracker['set'] = cache.length;
    this.result = cache
}

function remain(added, models)
{
    for (const model of models) 
    {
        if(!added.has(model))
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
    for(const model of where.bind)
    {
        if(!added.has(model))
        {
            return model
        }
    }

    return null;
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


function join(db, from, cache, model)
{
    return mix(cache, db.get(from.get(model)), model)
}

function joinOn(db, cache, model)
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

    this.logger.log(`Join: ${join.on} |-> ${join.with} (${join.model})`)
    return mix(cache, joined)
}


module.exports = runner