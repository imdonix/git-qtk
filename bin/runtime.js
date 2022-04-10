const { readdir, writeFile } = require('fs/promises')
const path = require('path');
const { getRepoFromURL } = require('../core/utils')
const { Query }= require('../core/query')
const { WILDCARD } = require('../core/utils')

const tests = [
    'https://github.com/imdonix/example',
    'https://github.com/Ericsson/CodeCompass',
    //'https://github.com/git/git',
    //'https://github.com/llvm/llvm-project'
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

    return res.join(WILDCARD.SEP).concat(WILDCARD.NL)
}

let output = 'repository;query;commits;open;setup;fetch;post;runner'.concat(WILDCARD.NL)
let count = 0

async function run()
{
    const all = await readdir(examples)

    for (const runtime of tests) 
    {       
        for(const file of all)
        {
            count++

            console.log(`(${count}) [${getRepoFromURL(runtime)}] Running '${file}'`);
            
            let logger = {
                log : (msg) => console.log(`(${count}) [${getRepoFromURL(runtime)}] --> ${msg}`)
            }

            let query = new Query({
                repository: runtime,
                script: path.join(examples, file)
            }, logger)
            
            await query.load()
            await query.run()
    
            output = output.concat(tracker2log(runtime, file, query.tracker))

            console.log(`(${count}) [${getRepoFromURL(runtime)}] Query '${file}' finished`);
            console.log(`-----`);
        }
    }
}

run()
.then(() =>
{
    console.log("[RM] finished successfully!")
})
.catch((err) => 
{
    console.error(`[RM] failed with \\ ${err}`)
})
.finally(async () => {
    await writeFile(outfile, output)
    console.log(`[RM] tracked result: '${outfile}'`)
})
