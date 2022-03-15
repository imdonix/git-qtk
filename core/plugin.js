const { abs } = require('./utils')

class Plugin
{
    models() { abs() }

    async init() { abs() }

    async parse(db, commit) { abs() }

    async post() { abs() }
}

module.exports = Plugin