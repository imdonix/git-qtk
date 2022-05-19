#! /usr/bin/env node
const Table = require('cli-table');
const fs = require('fs')
const path = require('path')
const yaml = require('yaml')
const { Promise } = require('nodegit');
const { cli } = require('../core/cli')
const { Query, params } = require('../core/query')
const { loadPlugins, WILDCARD } = require('../core/utils')

const global = {
    version : {
        type: 'bool',
        description: "Version of the toolkit",
        keys: ['v', 'version']
    },

    help : {
        type: 'bool',
        description: "Help guide",
        keys: ['h', 'help']
    },

    plugin : {
        type: 'bool',
        description: "List all the built in plugins",
        keys: ['p', 'plugin']
    },

    example : {
        type: 'bool',
        description: "List the example queries",
        keys: ['e', 'example']
    },

    csv : {
        type: 'string',
        description: "Pipe the output to the given csv file",
        keys: ['csv']
    }
}

const merge = {...global, ...params}
const input = cli(process.argv, merge)

if(input.version)
{
    const package = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'))
    console.log(`v${package.version}`)
}
else if(input.help || Object.keys(input).length == 0)
{
    const table = new Table({
        head: ['option', 'key(s)', 'description' ]
    });

    for (const [key, value] of Object.entries(merge)) 
    {
        const realkey = value.keys.map(k => `-${k}`).join(', ')
        table.push([key, realkey, value.description])
    }

    console.log(table.toString())
}
else if(input.plugin)
{
    const plugins = loadPlugins()
    for (const plugin of plugins) 
    {
        for (const model of plugin.models()) 
        {
            const table = new Table({
                head: [plugin.name(), 'model', 'key', 'type', 'description' ]
            });

            for (const [field, type] of Object.entries(model.model())) 
            {
                table.push(['*', model.name(), field, type[0], type[1]])
            }

            console.log(table.toString())

        }
    }
}
else if(input.example)
{
    const examples = path.join(__dirname, '../examples');
    const all = fs.readdirSync(examples)
    for (const examplePath of all) 
    {
        const table = new Table();

        const file = fs.readFileSync(path.join(__dirname, '../examples' , examplePath), 'utf8')
        const example = yaml.parse(file)

        for (const kp of Object.entries(example)) 
        {
            table.push(kp)
        }

        console.log(table.toString())
    }
}
else
{
    const query = new Query(input, console);

    try
    {
        query.validate()
        Promise.resolve()
        .then(() => query.load())   
        .then(tracker => 
        {
            console.log(`Opening : ${tracker.openRepository}s`)
            console.log(`Parsing : ${tracker.setup + tracker.fetch + tracker.post}s`)
    
            return query.run()
        })
        .then(res => {
    
            console.log(`Query : ${query.tracker.runner}s`)
            if(res.length > 0)
            {
                const template = res[0]

                if(input.csv)
                {
                    let str = Object.keys(template).join(WILDCARD.SEP).concat(WILDCARD.NL)
                    for(const rec of res)
                    {
                        str = str.concat(Object.values(rec).join(WILDCARD.SEP).concat(WILDCARD.NL))
                    }
                    fs.writeFileSync(input.csv, str)
                }
                else
                {
                    const table = new Table({
                        head: Object.keys(template)
                    });
        
                    for(const rec of res)
                    {
                        table.push(Object.values(rec))
                    }
            
                    console.log(table.toString())
                }
            }
            else
            {
                console.log('The query result is empty!')
            }
        })
        .catch(err => 
        {
            if(err.message)
            {
                console.error(`Error: ${err.message}`)
            }
            else
            {
                console.error(`Something went wrong`)
            }
            
        })
    }
    catch(err)
    {
        console.error(err.message)
    }
}
