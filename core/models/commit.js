const Model = require('../model')

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

    parse(commit)
    { 
        return {
            sha: commit.hash,
            author: commit.author.email,
            date: new Date(commit.authorDate),
            message: commit.message,
            changes: [...commit.files]
        }
    }

}

module.exports = Commit;