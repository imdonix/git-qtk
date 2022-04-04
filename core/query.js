
const fs = require('fs')
const yaml = require('yaml')
const Database = require('./database')
const { getRepoFromURL } = require('./utils')
const Git = require('nodegit')
const runner = require('./runner')
const { parseFrom, parseSelect, parseWhere, parseLimit } = require('./parse')

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
        let res = await fun.bind(this)()
        let time = Math.ceil((Date.now() - start) / 1000)
        this.tracker[fun.name] = time 
        return res
    }

    async load()
    {
        this.validate()
        this.db = new Database(this.plugins)

        this.yaml = this.openQuery()

        await this.track(this.openRepository)
        await this.track(this.init)
        await this.track(this.fetch)
        await this.track(this.post)
        return this.tracker
    }

    async run()
    {
        return await this.track(runner)
    }



    openQuery()
    {
        const file = fs.readFileSync(this.query.script, 'utf8')
        return yaml.parse(file)
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
        parseFrom(this)
        parseSelect(this)
        parseWhere(this)
        parseLimit(this)

        let before = this.plugins.length
        this.plugins = filterUnusedPlugins(this.plugins, this.from)
        this.logger.log(`${before} of ${this.plugins.length} plugin will be used`)

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

function filterUnusedPlugins(plugins, from)
{
    const filtered = new Array()
    for (const plugin of plugins) 
    {
        for (const [key, value] of from) 
        {
            if(plugin.models().find(model => model == value))
            {
                filtered.push(plugin)
                break;
            }
        }
    }
    return filtered
}

module.exports = { Query, params } 