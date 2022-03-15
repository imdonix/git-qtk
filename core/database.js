class Database
{
    constructor(plugins)
    {
        this.models = new Object()
        for (const [_, plugin] of Object.entries(plugins)) 
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

    view(model)
    {
        return this.models[model.name()]
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