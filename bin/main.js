#! /usr/bin/env node
const {cli, prettyPrint } = require('../core/cli')
const { Query, params } = require('../core/query')

let input = cli(process.argv)
let query = new Query(input, console);

try
{
    query.validate()
    query.run()
    .then(res => 
    {
        prettyPrint(res)
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