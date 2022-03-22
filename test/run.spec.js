const assert = require('assert');
const { Query } = require('../app') 
const Git = require('../plugins/git')
const { emptyLogger } = require('../core/utils')

/*
describe('run', () =>
{
    let db;
    before((done) => {
        let query = new Query({
            repository: 'https://github.com/imdonix/example'
        }, emptyLogger())
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
  */