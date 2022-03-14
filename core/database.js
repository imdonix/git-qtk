class Database
{
    constructor(plugins)
    {
        this.models = new Object()
        for (const [key, plugin] of Object.entries(plugins)) 
        {
            for (const model of plugin.models()) 
            {
                console.log(model.name())  
                this.models[model] = new Map()
            }
        }
    }

    add(model, data)
    {
        this.models[model].set(data[model.key()], data)
    }

    log()
    {
        for (const [key, model] of Object.entries(this.models))
        {
            console.log(model)
        }
    }

}

module.exports = Database