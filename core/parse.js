import { WILDCARD, OPERATOR, decompose } from './utils.js'

const JOIN = /([a-zA-Z][a-zA-Z1-9._]*\.[a-zA-Z][a-zA-Z1-9._]*)\s*==\s*([a-zA-Z][a-zA-Z1-9._]*\.[a-zA-Z][a-zA-Z1-9._]*)/g
const VAR = /{([a-zA-Z_$][a-zA-Z0-9_$]*)}/g

export function parseRepository(query)
{
    if(!query.yaml.hasOwnProperty('repo') || query.yaml['repo'] == null )
    {
        throw new Error("Missing field from script [repo]")
    }

    query.repository = resolveParameters(query, query.yaml['repo'])
}

export function parseFrom(query)
{
    if(!query.yaml.hasOwnProperty('from') || query.yaml['from'] == null )
    {
        throw new Error("Missing field from script [from]")
    }

    const resolved = resolveParameters(query, query.yaml.from)

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

    const cs = resolved.split(WILDCARD.SEP).map(str => str.trim())
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

export function parseSelect(query)
{
    if(!query.yaml.hasOwnProperty('select') || query.yaml['select'] == null )
    {
        throw new Error("Missing field from script [select]")
    }

    const resolved = resolveParameters(query, query.yaml.select)

    query.select = new Array()
    const cs = resolved.split(WILDCARD.SEP).map(str => str.trim())
    for (const candidate of cs) 
    {
        //Check wildcards
        if(candidate == WILDCARD.ANY)
        {
            query.select.push(WILDCARD.ANY)
        }

        let exp = candidate
        exp = insertFieldBinding(query, exp)
        exp = insertFunctionBinding(query, exp)
        exp = insertReductorBinding(query, exp)
        query.select.push([exp, candidate])
    }

}

export function parseWhere(query)
{
    let expression = 'true'
    if(query.yaml.hasOwnProperty('where') && query.yaml['where'])
    {
        expression = resolveParameters(query, query.yaml['where'].toString()) 
    }

    if(query.join)
    {
        expression = clearJoinRelatedConjuction(expression, query.join)
    }

    let id = 0
    query.where = decompose(expression)
    .map(part => {

        let finished = false
        let expression = part.trim()
        let bind = findBinding(query, part)
        expression = insertFieldBinding(query, expression)
        expression = insertFunctionBinding(query, expression)
        
        id++
        return { id, part, expression, bind, finished }
    })
    .filter(part => part.expression != 'true')
   
}

export function parseLimit(query)
{
    if(!query.yaml.hasOwnProperty('limit'))
    {
        query.limit = null
    }
    else
    {
        query.limit = parseInt(resolveParameters(query, query.yaml.limit))

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

export function parseOrder(query)
{
    if(!query.yaml.hasOwnProperty('order') || query.yaml['order'] == null)
    {
        query.order = null
    }
    else
    {
        const inp = resolveParameters(query, query.yaml.order)
        
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

        expression = insertFieldBinding(query, expression)
        expression = insertFunctionBinding(query, expression)
        query.order = [expression, op]
        
    }
}

export function parseGroup(query)
{
    if(!query.yaml.hasOwnProperty('group') || query.yaml['group'] == null)
    {
        query.group = null
    }
    else
    {
        const selector = resolveParameters(query, query.yaml.group)
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

export function parseJoin(query)
{
    const join = new Array()
    // parsing the join from where
    if(query.yaml.hasOwnProperty('where') && query.yaml['where'] != null)
    {   
        let input = resolveParameters(query, query.yaml.where)
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

function insertFunctionBinding(query, expression)
{
    for(const [key, _] of Object.entries(query.functions))
    {
        expression = expression.replace(new RegExp(`${key}\\(`, 'g'), `${WILDCARD.SP}f.${key}(` )
    }

    return expression
}

function insertReductorBinding(query, expression)
{
    for(const [key, _] of Object.entries(query.reductors))
    {
        expression = expression.replace(new RegExp(`${key}\\(`, 'g'), `${WILDCARD.SP}r.${key}(${WILDCARD.SP}tmp,` )
    }

    return expression
}

function insertFieldBinding(query, expression)
{
    for(const field of query.fields)
    {
        let name = field[0]
        expression = expression.replace(new RegExp(`${name}`, 'g'), `${WILDCARD.SP}o['${name}']`)
    }

    return expression
}

function clearJoinRelatedConjuction(input, joins)
{
    for (const join of joins) 
    {
        input = input.replace(join.exp, 'true')
    }

    return input
}

function resolveParameters(query, expression)
{
    let filled = expression

    for(const match of expression.matchAll(VAR))
    {
        const key = match[1]
        if(Object.hasOwn(query.query.params, key))
        {
            filled = filled.replaceAll(`{${key}}`, query.query.params[key])
        }
        else
        {
            throw new Error(`Script uses '${key}' parameter but its not given in command line [param=value]`)
        }        
    }

    return filled
}