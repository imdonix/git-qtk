const fs = require('fs')

//Decompose a statement into sub parts by &&
function decompose(str)
{
    const tmp = new Array()

    let expression = new String()
    let and = 0
    let depth = 0

    for (let i = 0; i < str.length; i++) 
    {
        if(str[i] == '&')
        {
            and++

            if(depth == 0)
            {
                if(and == 2)
                {
                    tmp.push(expression)
                    and = 0
                    expression = new String()
                }
            }
            else
            {
                expression += str[i] 
            }
        }
        else if (str[i]  == '(')
        {
            depth++
            expression += str[i] 
        }
        else if (str[i]  == ')')
        {
            depth--
            expression += str[i] 
        }
        else
        {
            expression += str[i] 
            and = 0
        }
    }

    tmp.push(expression)

    return tmp.map(str => str.trim())
}

function wrap(body, params)
{
    const header = `(${params.join(',')})`
    
    try
    {
        const f = eval(`${header} => { return ${body} }`)
        return f
    }
    catch(err)
    {
        throw new Error(`Syntax error in script file: ${err.massage}`)
    }
       
}

function getRepoFromURL(url)
{
    return url.indexOf('http') >= 0 ? url.substring(url.lastIndexOf('/')+1).replace('.git', '') : url
}

function abs()
{
    throw new Error("Abstract method");
}

function loadPlugins()
{
    const plugins = new Array()
    const paths = fs.readdirSync(`${__dirname}/plugins`)
    for (const file of paths) 
    {
        const Class = require(`${__dirname}/plugins/${file}`)
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

//Return the joined records count in a human readable way
function readable(num)
{
    if(num == 1)
    {
        return `init`
    }
    else if(num < 1000)
    {
        return `${num}`
    }
    else if(num < 1000000 )
    {
        return `${Math.round(num / 1000)}k`
    }
    else
    {
        return `${Math.round(num / 1000000)}m`
    }
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

const MEMORY_THRESHOLD = 10000000

module.exports = { wrap, loadPlugins, loadModels, getRepoFromURL, abs, decompose, readable, LOG, WILDCARD, OPERATOR, MEMORY_THRESHOLD }