
const fs = require('fs')
const Database = require('./database')
const { getRepoFromURL } = require('./utils')
const Git = require('nodegit')

const params = {
    repository : {
        type: 'string',
        keys: ['r', 'repository'],
        required : true  
    },
    script : {
        type: 'string',
        keys: ['s', 'script'],
        required : false
    },
    clean : {
        type: 'bool',
        keys: ['c', 'clean'],
        required : false
    }
}

class Query
{
    constructor(input, logger)
    {
        this.query = input
        this.plugins = loadPlugins()
        this.logger = logger
        this.tracker = new Object()
    }

    async track(fun)
    {
        let start = Date.now()
        await fun.bind(this)()
        this.tracker[fun.name] = (Date.now() - start) / 1000
    }

    async run()
    {
        this.validate()
        this.db = new Database(this.plugins)

        await this.track(this.open)
        await this.track(this.init)
        await this.track(this.fetch)
        await this.track(this.post)

        //this.db.log()
    }

    async open()
    {
        let name = getRepoFromURL(this.query.repository)

        try
        {
            this.repo = await Git.Repository.open(name)
            return
        }
        catch(err)
        {
            this.logger.log(`Repository (${name}) not found!`)
        }

        try
        {
            this.logger.log(`Cloning ${this.query.repository} ...`)
            this.repo = await Git.Clone(this.query.repository, `./${name}`)
            return
        }
        catch(err)
        {
            throw new Error(`Repository can't be cloned! ${err}`)
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
                await this.process(commit)

                let parents = await commit.getParents()
                queue.push(...parents)
            }
        }

        this.logger.log(`${visited.size} commit are parsed`)
    }

    async init()
    {
        for (const [_, plugin] of Object.entries(this.plugins)) 
        {
            plugin.init(this.db)
        }
    }

    async process(commit)
    {
        for (const [_, plugin] of Object.entries(this.plugins)) 
        {
            await plugin.parse(this.db, commit)
        }
    }

    async post()
    {
        for (const [_, plugin] of Object.entries(this.plugins)) 
        {
            plugin.post(this.db)
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

    view()
    {
        return this.db
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