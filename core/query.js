
const params = {
    script : {
        type: 'string',
        keys: ['s', 'script'],
        required : true
    },
    clean : {
        type: 'bool',
        keys: ['c', 'clean'],
        required : true
    }
}

class Query
{
    constructor(input)
    {
        this.query = input
    }

    async run()
    {
        let missings = this.validate()
        if(missings.length > 0)
        {
            let prettify = missings.map(par => params[par].keys.map(key => `-${key}`).join(' or ')).join(" and ")
            throw new Error(prettify)
        }

        return "ok"
    }

    validate()
    {
        let problems = []

        for (const par in params) 
        {
            if(params[par].required)
            {
                if(!(par in this.query))
                {
                    problems.push(par)
                }
            }
        }
    
        return problems
    }

}



module.exports = { Query, params } 