
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
    
    fetch()
    {
        return new Promise((res, rej) =>
        {
            this.repo.getHeadCommit()
            .then(head =>
            {
                let visited = 0
                let history = head.history(Git.Revwalk.SORT)

                history.on('commit', (commit) =>
                {
                    for (const plugin of this.plugins) 
                    {
                        plugin.parse(this.db, commit)
                    }
        
                    visited++
                })

                history.on('error', (err) => rej(err))
        
                history.on('end', () =>
                {
                    console.log("ok")
                    this.logger.log(`${visited.size} commit are parsed`)
                    res(visited)
                })

                history.start()
            })
            .catch(err => rej(err))
        })        
    }

    async init()
    {
        for (const plugin of this.plugins) 
        {
            plugin.init(this.db)
        }
    }

    async post()
    {
        for (const plugin of this.plugins) 
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
    const plugins = new Array()
    const paths = fs.readdirSync(`${__dirname}/../plugins`)
    for (const file of paths) 
    {
        const Class = require(`${__dirname}/../plugins/${file}`)
        plugins.push(new Class())
    }

    return plugins
}

module.exports = { Query, params } 