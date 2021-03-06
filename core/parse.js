const { WILDCARD, OPERATOR, decompose } = require('./utils')

const JOIN = /([a-zA-Z][a-zA-Z1-9._]*\.[a-zA-Z][a-zA-Z1-9._]*)\s*==\s*([a-zA-Z][a-zA-Z1-9._]*\.[a-zA-Z][a-zA-Z1-9._]*)/g

function parseStart(query)
{
    if(!query.yaml.hasOwnProperty('start') || query.yaml['start'] == null )
    {
        query.start = null
    }
    else
    {
        query.start = query.yaml['start']
    }
}

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

    const cs = query.yaml.from.split(WILDCARD.SEP).map(str => str.trim())
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
            query.fields.push([`${key}.${field}`, type, key])
        }
    }
}

function parseSelect(query)
{
    if(!query.yaml.hasOwnProperty('select') || query.yaml['select'] == null )
    {
        throw new Error("The query must define: 'select'")
    }

    query.select = new Array()
    const cs = query.yaml.select.split(WILDCARD.SEP).map(str => str.trim())
    for (const candidate of cs) 
    {
        //Check wildcards
        if(candidate == WILDCARD.ANY)
        {
            query.select.push(WILDCARD.ANY)
        }

        let exp = candidate
        exp = insFieldBinding(query, exp)
        exp = insFunctionBinding(query, exp)
        exp = insReductorBinding(query, exp)
        query.select.push([exp, candidate])
    }

}

function parseWhere(query)
{
    let expression = 'true'
    if(query.yaml.hasOwnProperty('where') && query.yaml['where'])
    {
        expression = query.yaml['where'].toString()
    }

    if(query.join)
    {
        expression = simplify(expression, query.join)
    }

    let id = 0
    query.where = decompose(expression)
    .map(part => {

        let finished = false
        let expression = part.trim()
        let bind = findBinding(query, part)
        expression = insFieldBinding(query, expression)
        expression = insFunctionBinding(query, expression)
        
        id++
        return { id, part, expression, bind, finished }
    })
    .filter(part => part.expression != 'true')
   
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
            throw new Error("Limit must be an positive integer")
        }

        if(query.limit <= 0)
        {
            throw new Error("The limit must be greater than 0")
        }
    }
}

function parseOrder(query)
{
    if(!query.yaml.hasOwnProperty('order') || query.yaml['order'] == null)
    {
        query.order = null
    }
    else
    {
        const inp = query.yaml['order'].toString()
        
        let expression = inp
        let op = OPERATOR.LESS

        const splitted = inp.split(' ')
        if(splitted.length == 1)
        {}
        else if(splitted.length == 2)
        {
            expression = splitted[0]

            const key = splitted[1]
            if(key == 'ASC' )
            {
                op = OPERATOR.MORE
            }
            else if(key == 'DESC')
            {
                op = OPERATOR.LESS
            }
            else
            {
                throw new Error("The order must be 'DESC' or 'ASC'")
            }
        }
        else
        {
            throw new Error("The order must be set as 'model.field DESC/ASC'")
        }

        expression = insFieldBinding(query, expression)
        expression = insFunctionBinding(query, expression)
        query.order = [expression, op]
        
    }
}

function parseGroup(query)
{
    if(!query.yaml.hasOwnProperty('group') || query.yaml['group'] == null)
    {
        query.group = null
    }
    else
    {
        const selector = query.yaml['group'].toString()
        if(query.fields.find(field => field[0] == selector))
        {
            query.group = selector
        }
        else
        {
            throw new Error(`You can only group by a 'model'.'field' (${selector})`)
        }
    }
}

function parseJoin(query)
{
    const join = new Array()
    // parsing the join from where
    if(query.yaml.hasOwnProperty('where') && query.yaml['where'] != null)
    {   
        let input = query.yaml['where']
        for (const inp of input.matchAll(JOIN)) 
        {
            const exp = inp[0]
            const left = inp[1]
            const right = inp[2]
    
            const [lm, lf] = left.split('.')
            const [rm, rf] = right.split('.')

            //models can't be the same
            if(lm != rm)
            {
                if(!query.from.has(lm))
                {
                    throw new Error(`Invalid model for join '${lm}'`)
                }

                if(!query.from.has(rm))
                {
                    throw new Error(`Invalid model for join '${rm}'`)
                }


                const lkey = query.from.get(lm).key() == lf
                const rkey = query.from.get(rm).key() == rf
                const ljoined = join.find(j => j.on == lm)
                const rjoined = join.find(j => j.on == rm)

                if(lkey && !ljoined)
                {
                    join.push({
                        exp: exp,
                        on: lm,
                        with : rm,
                        model: rf
                    })
                }
                else if(rkey && ! rjoined)
                {
                    join.push({
                        exp: exp,
                        on: rm,
                        with : lm,
                        model: lf
                    })
                }
                
            }            
        }
    }

    query.join = join
}

function insFunctionBinding(query, expression)
{
    for(const [key, _] of Object.entries(query.functions))
    {
        expression = expression.replace(new RegExp(`${key}\\(`, 'g'), `${WILDCARD.SP}f.${key}(` )
    }

    return expression
}


function findBinding(query, expression)
{
    let binds = new Array()
    for(const field of query.fields)
    {
        let name = field[0]
        if(new RegExp(`${name}`, 'g').test(expression))
        {
            binds.push(field[2])
        }
    }

    return binds
}

function insReductorBinding(query, expression)
{
    for(const [key, _] of Object.entries(query.reductors))
    {
        expression = expression.replace(new RegExp(`${key}\\(`, 'g'), `${WILDCARD.SP}r.${key}(${WILDCARD.SP}tmp,` )
    }

    return expression
}


function insFieldBinding(query, expression)
{
    for(const field of query.fields)
    {
        let name = field[0]
        expression = expression.replace(new RegExp(`${name}`, 'g'), `${WILDCARD.SP}o['${name}']`)
    }

    return expression
}

function simplify(input, joins)
{
    for (const join of joins) 
    {
        input = input.replace(join.exp, 'true')
    }

    return input
}


module.exports = { parseFrom, parseSelect, parseWhere, parseLimit, parseOrder, parseGroup, parseJoin, parseStart }