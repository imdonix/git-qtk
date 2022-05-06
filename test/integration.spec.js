const assert = require('assert');

const { Query } = require('../app') 
const Git = require('../plugins/git')
const { LOG } = require('../core/utils')

describe('running an query on example repository', () =>
{
    let db;

    before((done) => {
        let query = new Query({
            repository: 'https://github.com/imdonix/example', 
            script: './examples/allcommits.yaml'}, LOG.VOID)

        
        query.validate()
        query.load()
        .then(() => query.run())
        .then(() =>
        {
            db = query.view()
            done()
        })
        
    })

    it('database contains all model', () => {
        let models = (new Git()).models()
        for (const model of models) 
        {
            it(`${model.name()} model view`, () => 
            {
                assert.notEqual(db.view(model).size, 0)   
            })
        }
    })

    it('commits are presented', () => {
        assert.equal(db.view('commit').size, 10)
        assert.equal(db.view('author').size, 1)
        assert.equal(db.view('file').size, 4) //The github init commit is preserved
    })


  });
  