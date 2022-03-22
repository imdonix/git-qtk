
const fs = require('fs')
const yaml = require('yaml')
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
        this.models = loadModels(this.plugins)
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

        this.openQuery()

        await this.track(this.openRepository)
        await this.track(this.init)
        await this.track(this.fetch)
        await this.track(this.post)
    }

    openQuery()
    {
        const file = fs.readFileSync(this.query.script, 'utf8')
        this.yaml = yaml.parse(file)
    }

    async openRepository()
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
                    this.logger.log(`${visited} commit are parsed`)
                    res(visited)
                })

                history.start()
            })
            .catch(err => rej(err))
        })        
    }

    async init()
    {

        if(!this.yaml.hasOwnProperty('from') || this.yaml['from'] == null )
        {
            throw new Error("The query must define: 'from'")
        }

        

        this.from = new Map()
        const insert = (key, val) =>
        {
            if(this.from.has(key))
            {
                throw new Error(`A model with this name (${key}) is already in the query.`)
            }
            else
            {
                this.from.set(key, val)
            }
        }

        const cs = this.yaml.from.split(',').map(str => str.trim())
        for (const o of cs) 
        {
            const splitted = o.split(' ').map(str => str.trim())
            if(splitted.length > 1)
            {
                let model = splitted[0]
                let name = splitted[1]
                insert(name, this.findModel(model))
            }
            else
            {
                let name = splitted[0]
                insert(name, this.findModel(name))
            }
        }

        console.log(this.from)
        //Init tables

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

    findModel(name)
    {
        let i = this.models.findIndex(model => model.name() == name)
        if(i >= 0 )
        {
            return this.models[i]
        }
        else
        {
            throw new Error(`No model exist with the name of '${name}'`)
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

function loadModels(plugins)
{
    const models = new Array()
    for (const plugin of plugins)
    {
        models.push(...plugin.models())
    }
    return models
}

module.exports = { Query, params } 