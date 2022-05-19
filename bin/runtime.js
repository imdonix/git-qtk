const { readdir, writeFile } = require('fs/promises')
const path = require('path');
const { getRepoFromURL } = require('../core/utils')
const { Query }= require('../core/query')
const { WILDCARD } = require('../core/utils');

const tests = [
    'https://github.com/imdonix/example',
    'https://github.com/imdonix/git-qtk',
    'https://github.com/Ericsson/CodeCompass',
    'https://github.com/catchorg/Catch2',
    'https://github.com/microsoft/playwright',
    'https://github.com/vlang/v',
    'https://github.com/git/git',
]

const examples = path.join(__dirname, '../examples');
const outfile = path.join(__dirname, '../measurement.csv');

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
        tracker.runner,
        tracker.set
    ]

    return res.join(WILDCARD.SEP).concat(WILDCARD.NL)
}

let output = 'repository;query;commits;open;setup;fetch;post;runner;set'.concat(WILDCARD.NL)
let count = 0

async function run()
{
    const all = await readdir(examples)

    for (const runtime of tests) 
    {       
        for(const file of all)
        {
            if(file.indexOf('.yaml') > 0)
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
        
                const out = tracker2log(runtime, file, query.tracker)
                output = output.concat(out)
    
                console.log(`(${count}) [${getRepoFromURL(runtime)}] --> ${out}`);
                console.log(`(${count}) [${getRepoFromURL(runtime)}] Query '${file}' finished`);
                console.log(`-----`);
            }
        }
    }
}

run()
.then(() => writeFile(outfile, output))
.then(() => console.log("[RM] finished successfully!"))
