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

    name()
    {
        return 'Git'
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

    functions()
    {
        return [trim, short, has]
    }

    reductors()
    {
        return [count, min, max, sum]
    }
}

/// -- Functions --

function short(obj)
{
    if(typeof obj == 'string')
    {
        return obj.substring(0, 6).toUpperCase()
    }
    else if(typeof obj.getMonth === 'function')
    {
        let mm = obj.getMonth() + 1;
        let dd = obj.getDate();

        return [obj.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
                ].join('.');
    }
    else
    {
        return obj
    }
}

function trim(str)
{
    if(typeof(str) == 'string')
    {
        return str.length
    }

    throw new Error(`'trim' can't be used on '${typeof(str)}'`)
}

function has(arr, elem)
{
    return arr.indexOf(elem) >= 0
}

/// -- \Functions --

/// -- Reductors --

function count(acc, obj)
{
    if(acc == null)
    {
        acc = 0
    }

    return acc + 1
}

function sum(acc, obj)
{
    if(acc == null)
    {
        acc = 0
    }

    return acc + obj
}

function min(acc, obj)
{
    if(acc == null)
    {
        acc = obj
    }

    return acc > obj ? obj : acc
}

function max(acc, obj)
{
    if(acc == null)
    {
        acc = obj
    }

    return acc < obj ? obj : acc
}

/// -- \Reductors --

module.exports = Git