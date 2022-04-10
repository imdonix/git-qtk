const Model = require('../core/model')

class File extends Model
{
    name()
    { 
        return "file" 
    }

    model()
    {
        return {
            path: ['string', 'Full path to the file'],
            created : ['string', 'The SHA of the commit when the file is created' ],
            modified: ['string', 'The SHA of the commit when the file is last changed']
        }
    }

    key()
    {
        return 'path'
    }

    parse(input)
    { 
        return Object.assign(new Object(), input);
    }

}

module.exports = File;