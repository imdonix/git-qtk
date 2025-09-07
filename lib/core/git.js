export class Git {
    constructor() {
        return {
            name: () => 'Git',

            init: (db) => {
                this.filecache = new Map()
            },

            parse: (db, commit) => {
                db.add(Author, Author.parse(commit))
                db.add(Commit, Commit.parse(commit))

                for (const file of commit.files) {
                    if (this.filecache.has(file)) {
                        this.filecache.get(file).modified = commit.hash
                    }

                    else {
                        this.filecache.set(file, {
                            path: file,
                            created: commit.hash,
                            modified: commit.hash
                        })
                    }
                }
            },

            post: (db) => {
                for (const [_, cached] of this.filecache) {
                    db.add(File, File.parse(cached))
                }
            },
        }
    }
}



/* Models */
export const Author = {

    name : () => 'author',
    key : () => 'email',
    model : () => {
        return {
            email : ['string', 'The author email address'],
            name : ['string', 'The author name']
        }
    },
    parse: (commit) => { 
        return {
            email: commit.author.email,
            name: commit.author.name
        }
    }
}

export const Commit = {
    name : () => 'commit',
    key : () => 'sha',    
    model : () => {
        return {
            sha: ['string', "The commit's SHA"],
            author : ['string', "The author email address"],
            date: ['Date', "The commit date"],
            message: ['string', 'The commit message'],
            changes: ['Array', 'List of the changed files']
        }
    },
    parse : (commit) => { 
        return {
            sha: commit.hash,
            author: commit.author.email,
            date: new Date(commit.authorDate),
            message: commit.message,
            changes: [...commit.files]
        }
    }
}

export const File = {
    name : () => 'file',
    key : () =>  'path',
    model : () => {
        return {
            path: ['string', 'Full path to the file'],
            created : ['string', 'The SHA of the commit when the file is created' ],
            modified: ['string', 'The SHA of the commit when the file is last changed']
        }
    },
    parse : (input) => { 
        return Object.assign(new Object(), input)
    }
}