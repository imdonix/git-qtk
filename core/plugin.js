const { abs } = require('./utils')

class Plugin
{
    //the name of the plugin as a string
    name() { abs() }

    //a list of the functions which are injected into the statements
    functions() { abs() }

    //a list of the reductors which are injected into the statements
    reductors() { abs() }

    //a list of the instantiated models
    models() { abs() }


    //run at the start of the parsing
    async init() { abs() }

    //run for each commit
    parse(db, commit) { abs() }

    //run at the end of the parsing
    async post() { abs() }
}

module.exports = Plugin