
import fs from 'fs'
import yaml from 'yaml'

import { Git, Author, Commit, File } from './git.js'
import { Database } from './database.js'

import { runner } from './runner.js'
import { post } from './post.js'
import { gitVersion, gitOpen, gitClone, gitFetch } from './api.js'
import { getRepoFromURL, LOG } from './utils.js'
import { parseFrom, parseSelect, parseWhere, parseLimit, parseOrder, parseGroup, parseJoin, parseStart } from './parse.js'

import { trim, short, has } from './functions.js'
import { count, max, min, sum } from './reductors.js'

export const params = {
    
    repository : {
        type: 'string',
        description: "The repository relative 'URL' or 'folder name' where you want to run the query",
        keys: ['r', 'repository'],
        required : true,
        or: []
    },
    
    script : {
        type: 'string',
        description: "Relative path to the script on load&run",
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

export class Query
{
    constructor(input, logger)
    {
        if(!input)
        {
            throw new Error("Input script has not been passed!")
        }

        this.logger = logger ? logger : LOG.STD

        this.tracker = new Object()
        
        this.models = [ Author, Commit, File ]
        this.functions = { trim, short, has }
        this.reductors = { count, max, min, sum }

        this.db = new Database(this.models)
        this.plugin = new Git()
        this.plugin.init(this.db)

        this.query = input


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
        if(this.query.yaml)
        {
            this.yaml = this.query.yaml
            parseStart(this)
            parseFrom(this)
        }
        else if (this.query.script)
        {
            this.yaml = this.openQuery()
            parseStart(this)
            parseFrom(this)
        }
        else
        {
            this.query.full = true
        }        

        await this.track(this.openRepository)
        await this.track(this.fetch)
        await this.track(this.post)
  
        return this.tracker
    }

    async run(script)
    {
        if(script)
        {
            this.query.script = script
            this.yaml = this.openQuery()
        }

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

        const version = await gitVersion()
        this.logger.log(`[${version}]`)

        if(!this.query.clean)
        {
            try
            {
                this.repo = await gitOpen(path)
                this.logger.log(`[Open] Repository '${path}' found!`)
                return
            }
            catch(err)
            {
                this.logger.log(`[Open] Repository '${name}' not found! ${err}`)
            }
        }
        else
        {
            try
            {
                fs.rmSync(path, { recursive: true, force: true })
                this.logger.log(`[Open] Repository '${name}' deleted!`)
            }
            catch(err)
            {
                this.logger.log(`[Open] Repository '${name}' not found!`)
            }
        }       

        try
        {
            this.logger.log(`[Open] Cloning ${this.query.repository} ...`)
            this.repo = await gitClone(this.query.repository, path)
            return
        }
        catch(err)
        {
            throw new Error(`Repository can't be cloned! ${err}`)
        }
    }

    async fetch()
    {
        let visited = 0

        await gitFetch(this.repo, (commit) => {
            visited++
            this.plugin.parse(this.db, commit)
        })

        this.logger.log(`[Parser] ${visited} commits have been parsed.`)
        this.tracker['commits'] = visited

        return visited
    }

    async post()
    {

        this.plugin.post(this.db)
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