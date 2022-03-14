const Model = require('../core/model')

const Git = require('nodegit')

class Commit extends Model
{
    name()
    { 
        return "commit" 
    }

    model()
    {
        return {
            sha: 'string',
            author : 'string',
            date: 'Date',
            message: 'string'
        }
    }

    key()
    {
        return 'sha'
    }

    parse(input)
    { 
        return {
            sha: input.sha(),
            author: input.author().email(),
            date: input.date(),
            message: input.message()
        }
    }

}

module.exports = Commit;