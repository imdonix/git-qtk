
const fs = require('fs')
const Database = require('./database')
const { getRepoFromURL } = require('./utils')
const Git = require('nodegit')

const repo = "https://github.com/Ericsson/CodeCompass"

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
        this.plugins = loadPlugins()
        console.log(this.plugins)
    }

    async run()
    {
        this.validate()
        this.db = new Database(this.plugins)
        await this.open()
        await this.fetch();

        this.db.log()
    }

    async open()
    {
        let name = getRepoFromURL(repo)

        try
        {
            this.repo = await Git.Repository.open(name)
            return
        }
        catch(err)
        {
            console.log(`Repository (${name}) not found!`)
        }

        try
        {
            console.log(`Cloning ${repo} ...`)
            this.repo = await Git.Clone(repo, `./${name}`)
            return
        }
        catch(err)
        {
            throw new Error("Repository can't be cloned")
        }
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
        for (const [key, plugin] of Object.entries(this.plugins)) 
        {
            plugin.parse(this.db, commit)
        }
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
    
        if(problems.length > 0)
        {
            let prettify = problems.map(par => params[par].keys.map(key => `-${key}`).join(' or ')).join(" and ")
            throw new Error(`Missing required parameters: ${prettify}`)
        }
    }
}


function loadPlugins()
{
    const plugins = new Object()
    const paths = fs.readdirSync(`${__dirname}/../plugins`)
    for (const file of paths) 
    {
        const Class = require(`${__dirname}/../plugins/${file}`)
        plugins[file] = new Class()
    }

    return plugins
}


module.exports = { Query, params } 