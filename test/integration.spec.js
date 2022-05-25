const assert = require('assert');
const unzipper = require('unzipper')
const fs = require('fs')

const { Query } = require('../app') 
const Git = require('../plugins/git')
const { LOG } = require('../core/utils')


describe('running an query on example repository', () =>
{
    const query = new Query({
        repository: 'test/example', 
        yaml: {
            from: 'commit c',
            select: '$'
        }
    }, LOG.VOID)

    before(done => {
        
        fs.createReadStream('test/example.zip')
        .pipe(unzipper.Extract({ path: 'test' }))
        .on('close', () => query.load().then(() => done()))
    })

    it('database contains all model', () => {
        let models = (new Git()).models()
        for (const model of models) 
        {
            it(`${model.name()} model view`, () => 
            {
                assert.notEqual(query.view().view(model).size, 0)   
            })
        }
    })

    it('commits are presented', () => {
        assert.equal(query.view().view('commit').size, 10)
        assert.equal(query.view().view('author').size, 1)
        assert.equal(query.view().view('file').size, 6)
    })

    it('it can run the query', () => {
        query.run()
        .then(res =>
        {
            assert.equal(res[0]['c.author'] == 'tamas.donix@gmail.com')
        })
    })


  });