const Git = require('nodegit')
const fs = require('fs')

console.log(fs.readdirSync(`${__dirname}/plugins`))