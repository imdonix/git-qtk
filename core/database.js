class Database
{
    constructor(plugins)
    {
        this.models = new Object()
        for (const plugin of plugins)
        {
            for (const model of plugin.models()) 
            {
                this.models[model.name()] = new Map()
            }
        }
    }

    add(model, data)
    {
        this.models[model.name()].set(data[model.key()], data)
    }

    get(model)
    {
        return this.cache[model.name()]
    }

    finalize()
    {
        this.cache = new Object()
        for (const [key, dic] of Object.entries(this.models))
        {
            this.cache[key] = [...dic.values()]
        }
    }

    view(model)
    {
        if(typeof model == 'string')
        {
            return this.models[model]
        }
        else
        {
            return this.models[model.name()]
        }
        
    }

    log()
    {
        for (const [_, model] of Object.entries(this.models))
        {
            console.log(model)
        }
    }

}

module.exports = Database