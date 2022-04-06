const { readdir, writeFile } = require('fs/promises')
const path = require('path');
const { getRepoFromURL } = require('../core/utils')
const { Query }= require('../core/query')

const tests = [
    'https://github.com/imdonix/example',
    'https://github.com/Ericsson/CodeCompass',
    'https://github.com/git/git',
    'https://github.com/llvm/llvm-project'
]

const examples = path.join(__dirname, '../examples/basic');
const outfile = path.join(__dirname, '../mesurement.csv');

function tracker2log(repo,query,tracker)
{
    let res = [
        repo,
        query,
        tracker.commits,
        tracker.openRepository,
        tracker.setup,
        tracker.fetch,
        tracker.post,
        tracker.runner
    ]

    return res.join(';').concat('\n')
}


async function run()
{
    const all = await readdir(examples)
    let output = 'repository;query;commits;open;setup;fetch;post;runner\n'

    for (const runtime of tests) 
    {
        console.log(`[${getRepoFromURL(runtime)}] Tests started`);
        
        for(const file of all)
        {
            console.log(`[${getRepoFromURL(runtime)}] Running '${file}'`);
            
            let logger = {
                log : (msg) => console.log(`[${getRepoFromURL(runtime)}] ${msg}`)
            }

            let query = new Query({
                repository: runtime,
                script: path.join(examples, file)
            }, logger)
            
            await query.load()
            await query.run()
    
            output = output.concat(tracker2log(runtime, file, query.tracker))

            console.log(`[${getRepoFromURL(runtime)}] Query '${file}' finished`);
        }

        console.log(`[${getRepoFromURL(runtime)}] Tests finished`);       
    }

    await writeFile(outfile, output)
}

run()
.then(() =>
{
    console.log("Runtime mesurement finished")
})
.catch((err) => 
{
    console.error(`Runtime mesurement failed: ${err}`)
})
