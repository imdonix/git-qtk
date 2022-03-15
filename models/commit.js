const Model = require('../core/model')

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
            author : 'author',
            date: 'Date',
            message: 'string',
            changes: 'array'
        }
    }

    key()
    {
        return 'sha'
    }

    parse(input, set)
    { 
        return {
            sha: input.sha(),
            author: input.author().email(),
            date: input.date(),
            message: input.message(),
            changes: [...set]
        }
    }

}

module.exports = Commit;