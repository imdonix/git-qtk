
const fs = require('fs')
const yaml = require('yaml')
const Git = require('nodegit')

const Database = require('./database')
const runner = require('./runner')
const { getRepoFromURL, loadModels, loadPlugins } = require('./utils')
const { parseFrom, parseSelect, parseWhere, parseLimit, parseOrder, parseGroup } = require('./parse')

const params = {
    
    repository : {
        type: 'string',
        description: "The repository relative 'URL' or 'folder name' where you want to run the query",
        keys: ['r', 'repository'],
        required : true  
    },
    
    script : {
        type: 'string',
        description: "Relative path to the script",
        keys: ['s', 'script'],
        required : true
    },

    clean : {
        type: 'bool',
        description: "Force cloning a clean the repository",
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
        await this.track(this.setup)
        await this.track(this.fetch)
        await this.track(this.post)
        return this.tracker
    }

    openQuery()
    {
        const file = fs.readFileSync(this.query.script, 'utf8')
        return yaml.parse(file)
    }

    async openRepository()
    {
        let name = getRepoFromURL(this.query.repository)

        if(!this.query.clean)
        {
            try
            {
                this.repo = await Git.Repository.open(name)
                return
            }
            catch(err)
            {
                this.logger.log(`Repository '${name}' not found!`)
            }
        }
        else
        {
            try
            {
                fs.rmSync(`./${name}`, { recursive: true, force: true })
                this.logger.log(`Repository '${name}' deleted!`)
            }
            catch(err)
            {
                this.logger.log(`Repository '${name}' not found!`)
            }
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

    async setup()
    {
        parseFrom(this)
        usePlugins(this, this.logger)
        
        parseSelect(this)
        parseWhere(this)
        parseLimit(this)
        parseOrder(this)
        parseGroup(this)

        this.init()
    }

    async run()
    {
        return await this.track(runner)
    }

    init()
    {
        for (const plugin of this.plugins) 
        {
            plugin.init(this.db)
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
                    this.tracker['commits'] = visited
                    res(visited)
                })

                history.start()
            })
            .catch(err => rej(err))
        })        
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

function usePlugins(query)
{
    let before = query.plugins.length
    query.plugins = filterUnusedPlugins(query.plugins, query.from)

    query.functions = new Object()
    for (const plugin of query.plugins) 
    {
        for (const fun of plugin.functions()) 
        {
            query.functions[fun.name] = fun
        }
    }

    query.logger.log(`${before} of ${query.plugins.length} plugin will be used`)
}

module.exports = { Query, params, usePlugins } 