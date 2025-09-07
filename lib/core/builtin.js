const COMMITS_FROM = {
    name : 'commits-from',
    desc : 'Get a single author commits from a repository',

    repo : '{repo}',
    from : 'author; commit',
    select : 'commit.sha; commit.message',
    where : 'author.email == commit.author && has(author.email, "{email}")',
}

export default { 
    COMMITS_FROM 
}