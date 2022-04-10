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
            sha: ['string', "The commit's SHA"],
            author : ['string', "The author email address"],
            date: ['Date', "The commit date"],
            message: ['string', 'The commit message'],
            changes: ['Array', 'List of the changed files']
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