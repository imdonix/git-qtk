const Git = require('nodegit')

module.exports = async function parser(db)
{
    return Git.Clone("https://github.com/nodegit/nodegit", "./tmp")
    .then(repo => repo.getCommit("59b20b8d5c6ff8d09518454d4dd8b7b30f095ab5"))
    .then(commit => db.add(commit.sha()))
}