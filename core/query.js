
const fs = require('fs')
const yaml = require('yaml')
const Git = require('nodegit')

const Plugin = require('./plugin')
const Database = require('./database')

const runner = require('./runner')
const post = require('./post')

const { getRepoFromURL, loadModels, loadPlugins } = require('./utils')
const { parseFrom, parseSelect, parseWhere, parseLimit, parseOrder, parseGroup, parseJoin, parseStart } = require('./parse')

const params = {
    
    repository : {
        type: 'string',
        description: "The repository relative 'URL' or 'folder name' where you want to run the query",
        keys: ['r', 'repository'],
        required : true,
        or: []
    },
    
    script : {
        type: 'string',
        description: "Relative path to the script",
        keys: ['s', 'script'],
        required : true,
        or: ['yaml']
    },

    clean : {
        type: 'bool',
        description: "Force cloning a clean the repository",
        keys: ['c', 'clean'],
        required : false,
        or: []
    },

    root : {
        type: 'bool',
        description: "The root folder to checkout the repositories",
        keys: ['root'],
        required : false,
        or: []
    },

    full : {
        type: 'bool',
        description: "Use all available plugin when parsing the history ",
        keys: ['f', 'full'],
        required : false,
        or: []
    },

    yaml : {
        type: 'string',
        description: "Manualy set the script from string",
        keys: ['yaml'],
        required : false,
        or: []
    }

}

class Query
{
    constructor(input, logger, extension)
    {
        this.tracker = new Object()
        
        if(input)
        {
            this.query = input
        }
        else
        {
            throw new Error("Input params must be passed!")
        }

        this.plugins = loadPlugins()
        if(extension)
        {
            for (const plug of extension) 
            {
                if(plug instanceof Plugin)
                {
                    this.plugins.push(plug)
                }
            }
        }
        populateFunctions(this)
        populateReductors(this)

        this.models = loadModels(this.plugins)

        if(logger)
        {
            this.logger = logger
        }
        else
        {
            this.logger = console
        }   

        this.validate()
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
        this.db = new Database(this.plugins)

        this.yaml = this.query.yaml ? this.query.yaml : this.openQuery()
        
        parseStart(this)
        parseFrom(this)
        usePlugins(this)

        await this.track(this.openRepository)
        await this.track(this.init)
        await this.track(this.fetch)
        await this.track(this.post)
  
        return this.tracker
    }

    async run()
    {
        parseFrom(this)
        parseSelect(this)
        parseJoin(this)
        parseWhere(this)
        parseLimit(this)
        parseOrder(this)
        parseGroup(this)

        await this.track(runner)
        return await this.track(post)
    }

    openQuery()
    {
        try
        {
            fs.accessSync(this.query.script, fs.R_OK)
            const file = fs.readFileSync(this.query.script, 'utf8')
            return yaml.parse(file)
        }
        catch(_)
        {
            throw new Error('The script file does not exist')
        }
    }

    async openRepository()
    {
        const name = getRepoFromURL(this.query.repository)
        const path = this.query.root ? `${this.query.root}/${name}` : `./${name}`

        if(!this.query.clean)
        {
            try
            {
                this.repo = await Git.Repository.open(path)
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
                fs.rmSync(path, { recursive: true, force: true })
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
            this.repo = await Git.Clone(this.query.repository, path)
            return
        }
        catch(err)
        {
            throw new Error(`Repository can't be cloned! ${err}`)
        }
    }

    init()
    {
        for (const plugin of this.plugins) 
        {
            plugin.init(this.db)
        }
    }

    async fetch()
    {
        let head;
        
        if(this.query.start)
        {
            head = await this.repo.getCommit(this.query.start)
        }
        else
        {
            head = await this.repo.getHeadCommit()
        }
        
        let visited = new Set()
        let queue = new Array()

        queue.push(head)
        while(queue.length > 0)
        {
            let commit = queue.shift()
            let sha = commit.sha()

            if(!visited.has(sha))
            {
                visited.add(sha)
                
                //Run parse on all plugin async
                await Promise.all(this.plugins.map(plugin => plugin.parse(this.db, commit)))

                let parents = await commit.getParents()
                queue.push(...parents)
            }
        }

        this.logger.log(`${visited.size} commit are parsed`)
        this.tracker['commits'] = visited.size
        return visited.size
    }

    async post()
    {
        for (const plugin of this.plugins) 
        {
            plugin.post(this.db)
        }

        this.db.finalize()
    }

    validate()
    {
        let problems = []

        for (const par in params) 
        {
            if(params[par].required)
            {
                if(!(par in this.query) && params[par].or.length == 0)
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
        for (const [_, value] of from) 
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
    const before = query.plugins.length
    
    if(!query.query.full)
    {
        query.plugins = filterUnusedPlugins(query.plugins, query.from)
    }

    query.logger.log(`${before} of ${query.plugins.length} plugin will be used`)
    
}

function populateFunctions(query)
{
    query.functions = new Object()
    for (const plugin of query.plugins) 
    {
        for (const fun of plugin.functions()) 
        {
            query.functions[fun.name] = fun
        }
    }
}

function populateReductors(query)
{
    query.reductors = new Object()
    for (const plugin of query.plugins) 
    {
        for (const fun of plugin.reductors()) 
        {
            query.reductors[fun.name] = fun
        }
    }
}

module.exports = { Query, params, usePlugins } 