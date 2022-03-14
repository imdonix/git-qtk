const Plugin = require('../core/plugin')

const Author = require('../models/author')
const Commit = require('../models/commit')

class Git extends Plugin
{

    constructor()
    {
        super()
        this.auth = new Author()
        this.commit = new Commit()
    }

    models()
    {
        return [ this.auth, this.commit ]
    }

    parse(db, commit)
    {
        db.add(this.auth, this.auth.parse(commit.author()))
        db.add(this.commit, this.commit.parse(commit))
    }

}

module.exports = Git