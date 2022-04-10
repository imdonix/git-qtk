#! /usr/bin/env node
const Table = require('cli-table');
const { Promise } = require('nodegit');
const { cli } = require('../core/cli')
const { Query } = require('../core/query')

let input = cli(process.argv)
let query = new Query(input, console);

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
            const table = new Table({
                head: Object.keys(template)
            });

            for(const rec of res)
            {
                table.push(Object.values(rec))
            }
    
            console.log(table.toString())
        }
        else
        {
            console.log('The query result is empty!')
        }
    })
    .catch(err => 
    {
        console.error(err)
    })
}
catch(err)
{
    console.error(err.message)
}