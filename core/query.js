
const Database = require('./database')
const { getRepoFromURL } = require('./utils')
const Git = require('nodegit')

const repo = "https://github.com/git/git"

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
        let visited = new Set()
        let queue = new Array()

        let head = await this.repo.getHeadCommit()
        queue.push(head)
        while(queue.length > 0)
        {
            let commit = queue.shift()
            let sha = commit.sha()

            if(!visited.has(sha))
            {
                visited.add(sha)
                this.process(commit)

                let parents = await commit.getParents()
                queue.push(...parents)
            }
        }

        console.log(`${visited.size} commit are parsed`)
    }

    process(commit)
    {

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