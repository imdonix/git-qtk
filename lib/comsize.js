const { Model } = require('../app')

class CommitSize extends Model
{
    name() 
    { 
        return 'comsize'
    }

    model() 
    {
        return {
            'commit' : ['string', 'commit sha'],
            'size' : ['number', 'Size of the commit']
        }
    }

    key()
    {
        return 'commit'
    }

    parse(input) 
    {
        return {
            commit : input.sha,
            size : input.sum
        }
    }
}

module.exports = CommitSize