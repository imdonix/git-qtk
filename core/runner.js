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

    return compose(cache)
}

function compose(output)
{
    let records = new Array()

    for (const record of output) 
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

module.exports = runner