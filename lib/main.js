const { Query } = require('../app');
const Size = require('./size');

const params = {
    repository : "https://github.com/imdonix/git-qtk",    
    script : './size.yaml',
}

const query = new Query(params, console, [ new Size() ] );
query.validate()

Promise.resolve()
.then(() => query.load())   
.then(tracker => 
{
    console.log("The histroy is parsed.")
    return query.run()
})
.then(res => 
{
    if(res.length > 0)
    {
        console.log(res)
    }
    else
    {
        console.log('The query result is empty!')
    }
  
})
.catch(err => 
{
    console.error(err)
})
