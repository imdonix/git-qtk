class Database
{
    constructor(plugins)
    {
        this.db = Array()
    }

    add(model, data)
    {
        this.db.push([model, data])
    }

    log()
    {
        console.log(this.db)
    }

    count()
    {
        return this.db.length
    }
}

module.exports = Database