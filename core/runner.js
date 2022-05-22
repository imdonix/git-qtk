const { MEMORY_THRESHOLD } = require('./utils')

async function runner()
{
    let cache = [[]]
    const models = [...this.from.entries()]

    console.log(this.from)
    console.log(this.join)
    console.log(this.where)

    
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

        this.logger.log(`Join: ${join.on} |-> ${join.with} (${join.model})`)
        cache = mix(cache, joined)
    }

    let mixins = models.filter(m => !this.join.find(j => j.on == m[0] || j.with == m[0]))
    for (const model of mixins) 
    {
        this.logger.log(`Join: ${model[0]}`)
        cache = mix(cache, this.db.get(model[1]))
    }

    this.tracker['set'] = cache.length;
    this.result = composse(cache, new Array(...added), mixins)
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


module.exports = runner