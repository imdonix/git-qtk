const { readdir } = require('fs/promises')
const path = require('path');
const { getRepoFromURL } = require('../core/utils')
const { Query }= require('../core/query')

const tests = [
    'https://github.com/imdonix/example',
    'https://github.com/Ericsson/CodeCompass',
    //'https://github.com/git/git',
    //'https://github.com/llvm/llvm-project'
]

const examples = path.join(__dirname, '../examples/basic');


async function run()
{
    const all = await readdir(examples)

    for (const runtime of tests) 
    {
        console.log(`[${getRepoFromURL(runtime)}] Tests started`);
        

        
        for(const file of all)
        {
            console.log(`[${getRepoFromURL(runtime)}] Running '${file}'`);
            
            let logger = {
                log : (msg) => console.log(`[${getRepoFromURL(runtime)}]' ${msg}'`)
            }

            let query = new Query({
                repository: runtime,
                script: path.join(examples, file)
            }, logger)
            
            await query.load()
            await query.run()
    
            console.log(query.tracker) //TODO export to file insted
        }

        console.log(`[${getRepoFromURL(runtime)}] Tests finished`);       
    }
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
