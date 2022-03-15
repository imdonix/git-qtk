const Plugin = require('../core/plugin')

const Author = require('../models/author')
const Commit = require('../models/commit')
const File = require('../models/file')

class Git extends Plugin
{

    constructor()
    {
        super()
        this.auth = new Author()
        this.commit = new Commit()
        this.file = new File()
    }

    models()
    {
        return [ this.auth, this.commit, this.file ]
    }

    init(db) 
    {
        this.filecache = new Map()
    }

    async parse(db, commit)
    {
        let sha = commit.sha()

        let changed = new Array()
        let diffs = await commit.getDiff()
        for (const dif of diffs) 
        {
            for (let i = 0; i < dif.numDeltas(); i++) 
            {
                let delta = dif.getDelta(i)
                changed.push(delta.newFile().path())
            }    
        }

        db.add(this.auth, this.auth.parse(commit.author()))
        db.add(this.commit, this.commit.parse(commit, changed))

        for (const file of changed) 
        {
            if(this.filecache.has(file))
            {
                this.filecache.get(file).modified = sha
            }
            else
            {
                this.filecache.set(file, {
                    path: file,
                    created : sha,
                    modified: sha
                })
            }
        }
    }

    post(db) 
    {
        for (const [_, cached] of this.filecache) 
        {
            db.add(this.file, this.file.parse(cached))
        }
    }
}

module.exports = Git