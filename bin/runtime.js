#! /usr/bin/env node
const { readdir, writeFile } = require('fs/promises')
const path = require('path');
const { getRepoFromURL } = require('../core/utils')
const { Query }= require('../core/query')
const { WILDCARD } = require('../core/utils');
const os = require('os')

const tests = [
    'https://github.com/imdonix/example',
    'https://github.com/imdonix/git-qtk',
    'https://github.com/Ericsson/CodeCompass',
    'https://github.com/catchorg/Catch2',
    'https://github.com/vlang/v',
    'https://github.com/git/git',
]

const examples = path.join(__dirname, '../examples');
const cpu = os.cpus()[0].model.trim().split(' ').join('-')
const outfile = path.join(__dirname, `../gen/${cpu}.csv`);

function tracker2log(repo,query,tracker)
{
    let res = [
        cpu,
        repo,
        query,
        tracker.commits,
        tracker.init + tracker.fetch + tracker.post,
        tracker.runner + tracker.post,
        tracker.set
    ]

    return res.join(WILDCARD.SEP).concat(WILDCARD.NL)
}

let output = 'cpu;repository;query;commits;load;run;joined'.concat(WILDCARD.NL)
let count = 0

async function run()
{
    const all = await readdir(examples)

    for (const runtime of tests) 
    {       
        const logger = {
            log : (msg) => console.log(`(${count}) [${getRepoFromURL(runtime)}] --> ${msg}`)
        }
        let query = new Query({
            repository: runtime
        }, logger)

        try
        {
            await query.load()

            for(const file of all)
            {
                if(file.indexOf('.yaml') > 0)
                {
                    count++
                    console.log(`(${count}) [${getRepoFromURL(runtime)}] Running '${file}'`);
                
                    let out;
                    try
                    {
                        await query.run(path.join(examples, file))
                        out = tracker2log(runtime, file, query.tracker)
                    }
                    catch(err)
                    {
                        out = err.message.concat(WILDCARD.NL)
                    }
                    
                    output = output.concat(out)
        
                    console.log(`(${count}) [${getRepoFromURL(runtime)}] --> ${out}`);
                    console.log(`(${count}) [${getRepoFromURL(runtime)}] Query '${file}' finished`);
                    console.log(`-----`);
                }
            }
        }
        catch(err)
        {
            console.log(`(${count}) [${getRepoFromURL(runtime)}] Failed to load! ${err}`);
        }
    }
}

run()
.then(() => writeFile(outfile, output))
.then(() => console.log("[RM] finished successfully!"))
