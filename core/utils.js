const fs = require('fs')

function wrap(body, params)
{
    const header = `(${params.join(',')})`
    const f = eval(`${header} => { return ${body} }`)
    return f
}

function getRepoFromURL(url)
{
    return url.substring(url.lastIndexOf('/')+1).replace('.git', '')
}

function abs()
{
    throw new Error("Abstract method");
}

function loadPlugins()
{
    const plugins = new Array()
    const paths = fs.readdirSync(`${__dirname}/../plugins`)
    for (const file of paths) 
    {
        const Class = require(`${__dirname}/../plugins/${file}`)
        plugins.push(new Class())
    }

    return plugins
}

function loadModels(plugins)
{
    const models = new Array()
    for (const plugin of plugins)
    {
        models.push(...plugin.models())
    }
    return models
}

const LOG = {
    VOID : {
        log: () => {}
    }
}

const WILDCARD = {
    ANY: '$',
    SEP: ';',
    NL: '\n',
    SP: '__'
}

const OPERATOR = {
    LESS: (a,b) => a < b,
    MORE: (a,b) => a > b,
}

module.exports = { wrap, loadPlugins, loadModels, getRepoFromURL, abs, LOG, WILDCARD, OPERATOR }