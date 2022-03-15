const assert = require('assert');
const { Query } = require('../app') 
const Git = require('../plugins/git')

describe('validate', () =>
{
    it('required', () =>
    {
        let query = new Query({})
        try
        {
            query.validate()
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })
})

describe('run', () =>
{
    let db;
    before((done) => {
        let query = new Query({
            repository: 'https://github.com/imdonix/example'
        })
        query.run()
        .then(() =>
        {
            db = query.view()
            done()
        })
    })

    it('parsed', () => {})

    let models = (new Git()).models()
    for (const model of models) 
    {
        it(`${model.name()} model view`, () => 
        {
            assert.notEqual(db.view(model).size, 0)   
        })
    }
  });