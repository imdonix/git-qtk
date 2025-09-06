#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import url from 'url'

import Table from 'cli-table3'

import { cli } from '../core/cli.js'
import { Query, params } from '../core/query.js'
import { WILDCARD } from '../core/utils.js'
import { gitVersion } from '../core/api.js'

import SCRIPTS from '../core/builtin.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

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

    builtin : {
        type: 'bool',
        description: "List the builtin query scripts",
        keys: ['b', 'builtin']
    },

    csv : {
        type: 'string',
        description: "Pipe the output to the given csv file",
        keys: ['csv']
    }
};

(async () => {

    const merge = {...global, ...params}
    const input = cli(process.argv, merge)

    if(input.version)                                       version() 
    else if(input.help || Object.keys(input).length == 0)   help(merge) 
    else if(input.builtin)                                  builtin() 
    else if(input.script)                                   script(input) 
})();


async function version()
{
    const pck = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'))

    try
    {
        const git = await gitVersion()
        console.log(`git-qtk: v${pck.version} [using ${git}]`)
    }
    catch(err)
    {
        console.error(`Valid Git executable not found, make sure it's added to PATH (${err})`)
    }
}

async function help(merge) 
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

async function builtin() 
{
    const table = new Table({
        head : ['Name', 'Descriptions', 'Script']
    })

    for (const script of Object.values(SCRIPTS)) 
    {
        const clean = script.script.split('\n').filter(line => line).join('\n')
        table.push([script.name, script.desc, clean]) 
    }

    console.log(table.toString())
}

async function script(input)
{
    const query = new Query(input, console)

    try
    {
        query.validate()


        await query.load()
        const result = await query.run()

        console.log(`[Time] Opening : ${query.tracker.openRepository}s`)
        console.log(`[Time] Parsing : ${query.tracker.init + query.tracker.fetch + query.tracker.post}s`)
        console.log(`[Time] Query : ${query.tracker.runner}s`)

        if(result.length > 0)
        {
            const template = result[0]

            if(input.csv)
            {
                let str = Object.keys(template).join(WILDCARD.SEP).concat(WILDCARD.NL)
                for(const rec of result)
                {
                    str = str.concat(Object.values(rec).map(str => str.replace('\n', '')).join(WILDCARD.SEP).concat(WILDCARD.NL))
                }
                fs.writeFileSync(input.csv, str)
            }
            else
            {
                const table = new Table({
                    head: Object.keys(template)
                })
    
                for(const rec of result)
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
    }
    catch(err)
    {
        if(err.message)
        {
            console.error(`Error: ${err.message}`)
            console.trace(err)
        }
        else
        {
            console.error(`Something went wrong.`)
            console.trace(err)
        }
    }
}