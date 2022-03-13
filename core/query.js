
const Database = require('./database')
const { getRepoFromURL } = require('./utils')
const Git = require('nodegit')

const repo = "https://github.com/imdonix/watcher"

const params = {
    script : {
        type: 'string',
        keys: ['s', 'script'],
        required : true
    },
    clean : {
        type: 'bool',
        keys: ['c', 'clean'],
        required : true
    }
}

class Query
{
    constructor(input)
    {
        this.query = input
    }

    async run()
    {
        let missings = this.validate()
        if(missings.length > 0)
        {
            let prettify = missings.map(par => params[par].keys.map(key => `-${key}`).join(' or ')).join(" and ")
            throw new Error(prettify)
        }

        this.db = new Database()
        this.repo = await this.open()
        await this.fetch();

        return this.db.count()
    }

    async open()
    {
        let name = getRepoFromURL(repo)

        return Git.Repository.open(name)
        .catch(err => {
            console.log(`Repository (${name}) not found! Cloning ${repo}...`)
            return Git.Clone(repo, `./${name}`)
            .catch(err => {
                console.log(`Repository can't be cloned`)
            })
        })
    }
    
    async fetch()
    {
        //let repo = new Git.Repository()

        this.repo.getHeadCommit()
        .then(commit => {
            console.log(commit.author())
        })
    }

    validate()
    {
        let problems = []

        for (const par in params) 
        {
            if(params[par].required)
            {
                if(!(par in this.query))
                {
                    problems.push(par)
                }
            }
        }
    
        return problems
    }
}



module.exports = { Query, params } 