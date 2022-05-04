const { Commit } = require('nodegit')
const { Plugin } = require('../app')
const CommitSize = require('./comsize')

class Size extends Plugin
{
    constructor()
    {
        super()
        this.comsize = new CommitSize()
    }

    name() 
    {
        return "Size Plugin"
    }

    functions() 
    {
        return [ firstLetter ]
    }

    reductors()
    {
        return []
    }

    models()
    {
        return [ this.comsize ]
    }


    async init() {}

    async parse(db, commit) 
    {
        let sum = 0
        const arr = await commit.getDiff()
        for (const dif of arr) 
        {
            sum += dif.numDeltas()
        }

        db.add(this.comsize, this.comsize.parse({
            sha : commit.sha(),
            sum: sum
        }))
    }

    async post() { }
}

function firstLetter(str)
{
    return str.substring(0,1)
}

module.exports = Size