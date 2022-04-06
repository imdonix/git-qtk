const { WILDCARD_ANY, repalceAll } = require('./utils')

function parseFrom(query)
{
    if(!query.yaml.hasOwnProperty('from') || query.yaml['from'] == null )
    {
        throw new Error("The query must define: 'from'")
    }

    query.from = new Map()
    const insert = (key, val) =>
    {
        if(query.from.has(key))
        {
            throw new Error(`A model with this name (${key}) is already in the query.`)
        }
        else
        {
            query.from.set(key, val)
        }
    }

    const cs = query.yaml.from.split(',').map(str => str.trim())
    for (const o of cs) 
    {
        const splitted = o.split(' ').map(str => str.trim())
        if(splitted.length > 1)
        {
            let model = splitted[0]
            let name = splitted[1]
            insert(name, query.findModel(model))
        }
        else
        {
            let name = splitted[0]
            insert(name, query.findModel(name))
        }
    }

    query.fields = new Array()
    for(const [key, model] of query.from)
    {
        for(const [field, type] of Object.entries(model.model()))
        {
            query.fields.push([`${key}.${field}`, type])
        }
    }
}

function parseSelect(query)
{
    if(!query.yaml.hasOwnProperty('select') || query.yaml['select'] == null )
    {
        throw new Error("The query must define: 'select'")
    }

    query.select = new Set()
    const cs = query.yaml.select.split(',').map(str => str.trim())
    for (const s of cs) 
    {
        if(s == WILDCARD_ANY)
        {
            query.select.add(WILDCARD_ANY)
            break;
        }

        const splitted = s.split('.')
        const model = splitted[0]
        const field = splitted[1]
        if(splitted.length > 1)
        {

            if(query.from.has(model))
            {
                if(query.from.get(model).has(field))
                {
                    query.select.add(`${model}.${field}`)
                }
                else
                {
                    throw new Error(`The '${model}' model does not have '${field}' named field`)
                }
            }
            else
            {
                throw new Error(`No model found with the name of '${model}'`)
            }
        }
        else
        {
            throw new Error("You must give the selected object as: 'model'.'field'")
        }
        
    }
}

function parseWhere(query)
{
    if(!query.yaml.hasOwnProperty('where') || query.yaml['where'] == null )
    {
        query.where = 'true'
    }
    else
    {
        let expression = query.yaml['where'].toString()
        for(const field of query.fields)
        {
            let name = field[0]
            expression = expression.replace(name, `_['${name}']`)
        }

        for(const [key, _] of Object.entries(query.functions))
        {
            expression = repalceAll(expression,`${key}(`, `$.${key}(` )
        }

        console.log(expression)
        query.where = expression
    }
}

function parseLimit(query)
{
    if(!query.yaml.hasOwnProperty('limit'))
    {
        query.limit = null
    }
    else
    {
        query.limit = parseInt(query.yaml['limit'])

        if(Number.isNaN(query.limit))
        {
            throw new Error("Limit must be an integer")
        }

        if(query.limit <= 0)
        {
            throw new Error("The limit must be greater than 0")
        }
    }
}


module.exports = { parseFrom, parseSelect, parseWhere, parseLimit }