class Database
{
    constructor()
    {
        this.db = Array()
    }

    add(commit)
    {
        this.db.push(commit)
    }

    count()
    {
        return this.db.length
    }
}

module.exports = Database