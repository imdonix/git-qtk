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

    return cache
}

function f(n)
{
    let arr = []
    for (let i = 0; i < n; i++) 
    {
        arr.push(["A","d","a","t"])
    }
    return arr
}

module.exports = runner