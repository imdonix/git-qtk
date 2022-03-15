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
            path: 'string',
            created : 'commit',
            modified: 'commit'
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