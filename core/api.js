const { spawn, exec } = require('child_process')
const readline = require('readline');

function gitVersion()
{
    return new Promise((res, rej) => {
        exec('git -v', (err, stdout, stderr) => {

            // Check that the process could be opened
            if(err)
            {
                rej(err.message)
            }

            // Check if we have error on stderr
            if(stderr)
            {
                rej(stderr)
            }

            // Return version
            res(stdout.replaceAll('\n', ''))
        })
    })
}

function gitOpen(path)
{
    return new Promise((res, rej) => {
        exec(`git rev-parse --is-inside-work-tree -C "${path}"`, (err, stdout, stderr) => {

            // Check that the process could be opened
            if(err)
            {
                rej(err.message)
                return
            }

            // Check if we have error on stderr
            if(stderr)
            {
                rej(stderr)
                return
            }

            const lines = stdout.split('\n')
            if(lines.length == 0)
            {
                rej(`Unexpected result from 'git rev-parse' (${stdout})`)
                return
            }

            if(lines[0] != 'true')
            {
                rej(`Repository not found (${stdout})`)
                return
            }

            res(path)
        })
    })
}

function gitClone(repository, path)
{
    return new Promise((res, rej) => {
        exec(`git clone "${repository}" "${path}"`, (err, stdout, stderr) => {

            // Check that the process could be opened
            if(err)
            {
                rej(err.message)
                return
            }

            // Git puts generic log on stder -> ignore it

            res(path)
        })
    })
}

function gitFetch(repo, commitHandler)
{
    const git = spawn('git', ['log', '--all', '--pretty=fuller', '--name-only'], { cwd : repo })

    const rl = readline.createInterface({
        input: git.stdout,
        output: process.stdout,
        terminal: false
    })

    function parsePerson(line) 
    {
        const prefixMatch = line.match(/^(Author|Commit):\s+/)
        if (!prefixMatch) throw new Error('Invalid person line: ' + line)

        const rest = line.substring(prefixMatch[0].length)
        const emailMatch = rest.match(/<([^>]+)>$/)
        if (emailMatch) 
        {
            const email = emailMatch[1]
            const name = rest.substring(0, emailMatch.index).trim()
            return { name, email }
        }

        throw new Error('Invalid person line: ' + line)
    }

    function parseDate(line) 
    {
        return line.replace(/^(AuthorDate|CommitDate):\s+/, '').trim()
    }

    return new Promise((res, rej) => {

        let currentCommit = null;
        let state = 'start';

        rl.on('line', (line) => {

            if (state === 'start') 
            {
                if (line.startsWith('commit')) 
                {
                    currentCommit = {
                        hash: line.substring(7).trim(),
                        message: [],
                        files: []
                    }

                    state = 'metadata'
                }
            } 
            else if (state === 'metadata') 
            {
                if (line.startsWith('Merge: ')) 
                {
                    currentCommit.merge = line.substring(7).trim()
                } 
                if (line.startsWith('Author: ')) 
                {
                    currentCommit.author = parsePerson(line)
                } 
                else if (line.startsWith('AuthorDate: ')) 
                {
                    currentCommit.authorDate = parseDate(line)
                } 
                else if (line.startsWith('Commit: ')) 
                {
                    currentCommit.committer = parsePerson(line)
                } 
                else if (line.startsWith('CommitDate: ')) 
                {
                    currentCommit.commitDate = parseDate(line)
                } 
                else if (line.trim() === '') 
                {
                    state = 'message'
                }
            } 
            else if (state === 'message') 
            {
                if (line.startsWith('    ')) 
                {
                    currentCommit.message.push(line.substring(4))
                } 
                else if (line.trim() === '') 
                {
                    // Merge commit does not contain any file
                    if(currentCommit.merge)
                    {
                        currentCommit.message = currentCommit.message.join('\n')
                        commitHandler(currentCommit)

                        state = 'start'
                    }
                    else
                    {
                        state = 'files'
                    }
                }
            } 
            else if (state === 'files') 
            {
                if(line.trim() === '')
                {

                    currentCommit.message = currentCommit.message.join('\n')
                    commitHandler(currentCommit)

                    state = 'start'
                }
                else
                {
                    currentCommit.files.push(line.trim())
                }
            }

        })

        git.on('close', (code) => 
        {
            // Handle last commit
            if(state === 'files')
            {
                currentCommit.message = currentCommit.message.join('\n')
                commitHandler(currentCommit)

                state = 'start'
            }

            if(code === 0)
            {
                res()  
            }

            rej(`Git log failed with error code '${code}'`)           
        })
    })

}

module.exports = { gitVersion, gitOpen, gitClone, gitFetch }