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