const { getRepoFromURL } = require('../core/utils')
const { Query }= require('../core/query')

const runtimeTests = [
    'https://github.com/imdonix/example',
    'https://github.com/Ericsson/CodeCompass',
    'https://github.com/git/git',
    'https://github.com/llvm/llvm-project'
]

async function run()
{
    for (const test of runtimeTests) 
    {
        console.log(`Test started: ${getRepoFromURL(test)}`);
    
        let query = new Query({
            repository: test
        }, console)
        
        await query.run()

        console.log(query.tracker) //TODO export to file insted

        console.log(`Test finished: ${getRepoFromURL(test)}`);       
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
