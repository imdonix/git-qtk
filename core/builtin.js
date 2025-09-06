export const COMMITS_FROM = {
    name : 'commitsFrom',
    desc : 'Get a single author commits from a repository',
    script : `
repo: {repo}
from: author; commit
select: commit.sha
where: author.email == commit.author && has(author.email, {email})
`
}