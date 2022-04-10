const Model = require('../core/model')

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

    parse(input)
    { 
        return {
            email: input.email(),
            name: input.name()
        }
    }

}

module.exports = Author;