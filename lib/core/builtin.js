/*
List of builtin Scripts into the tool
*/

const COMMITS_FROM = {
    name : 'commits-from',
    desc : 'Get a single author commits from a repository',

    repo : '{repo}',
    from : 'author; commit',
    select : 'commit.sha; commit.message',
    where : 'author.email == commit.author && has(author.email, "{email}")',
}

const KNOWS = {
    name : 'knows',
    desc : 'Get a single author commits from a repository',

    repo : '{repo}',
    from : 'author; commit',
    select : 'author.email; count(commit.sha)',
    where : 'author.email == commit.author && has(commit.changes, "{path}")',
    group : 'author.email'
}

export default { 
    COMMITS_FROM,
    KNOWS
}