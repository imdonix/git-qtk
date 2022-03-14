const Plugin = require('../core/plugin')

const Author = require('../models/author')

class Git extends Plugin
{

    constructor()
    {
        this.auth = new Author()
    }

    models()
    {
        return [ this.auth ]
    }

    parse(db, commit)
    {
        db.add(this.auth, this.auth.parse(commit.author()))
    }

}

module.exports = Git