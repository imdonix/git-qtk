export const MEMORY_THRESHOLD = 10000000

export const WILDCARD = {
    ANY: '$',
    SEP: ';',
    NL: '\n',
    SP: '__'
}

export const OPERATOR = {
    LESS: (a,b) => a < b,
    MORE: (a,b) => a > b,
}

export const LOG = {
    VOID : {
        log: (message) => {}
    },
    STD : {
        log : (message) => console.log(message)
    }
}

/* Decompose a statement based on a conjunction into separate statements */
export function decompose(str)
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

export function wrap(body, params)
{
    const header = `(${params.join(',')})`
    
    try
    {
        return eval(`${header} => { return ${body} }`)
    }
    catch(err)
    {
        throw new Error(`Syntax error in script file: ${err.massage}`)
    }
       
}

export function getRepoFromURL(url)
{
    return url.indexOf('http') >= 0 ? url.substring(url.lastIndexOf('/')+1).replace('.git', '') : url
}

/* Return the joined records count in a human readable way */
export function readable(num)
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