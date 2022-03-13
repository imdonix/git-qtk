#! /usr/bin/env node
const cli = require('../core/cli')
const { Query, params } = require('../core/query')

let input = cli(process.argv)
let query = new Query(input);

let missings = query.validate()

if(missings.length > 0)
{
    let prettify = missings.map(par => params[par].keys.map(key => `-${key}`).join(' or ')).join(" and ")
    console.error(`You must give the paramater: ${prettify}`)
}
else
{
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