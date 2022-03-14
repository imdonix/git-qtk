class Author extends Model
{
    model()
    {
        return {
            email : 'string',
            name : 'string'
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