const Model = require('../model')

class Author extends Model
{
    name()
    { 
        return "author" 
    }

    model()
    {
        return {
            email : ['string', 'The author email address'],
            name : ['string', 'The author name']
        }
    }

    key()
    {
        return 'email'
    }

    parse(commit)
    { 
        return {
            email: commit.author.email,
            name: commit.author.name
        }
    }

}

module.exports = Author;