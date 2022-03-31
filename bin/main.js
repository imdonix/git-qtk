#! /usr/bin/env node
const {cli } = require('../core/cli')
const { Query } = require('../core/query')

let input = cli(process.argv)
let query = new Query(input, console);

try
{
    query.validate()
    query.run()
    .then(res => 
    {
        console.log(res)
        
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