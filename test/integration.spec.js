const assert = require('assert');
const unzipper = require('unzipper')
const fs = require('fs')

const { Query } = require('../app') 
const Git = require('../plugins/git')
const { LOG } = require('../core/utils')


describe('running an query on example repository', () =>
{
    const query = new Query({ repository: 'test/example' }, LOG.VOID)

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

    it('it can run a query', async () => {
        query.yaml = {
            from: 'commit c',
            select: '$'
        }

        return query.run()
        .then(res =>
        {
            assert.equal(res[0]['c.author'], 'tamas.donix@gmail.com')
        })
    })


    it('it runs "authorcommits.yaml" correctly', async () => {
        return query.run('./examples/authorcommits.yaml')
        .then(res =>
        {
            assert.equal(res[0]['commit.sha'], 'b5b3e89454cf9644d4c576482b173178108d60c1')
            assert.equal(res.length, 10)
        })
    })

    it('it runs "commithash.yaml" correctly', async () => {
        return query.run('./examples/commithash.yaml')
        .then(res =>
        {
            assert.equal(res[0]['short(c.sha)'], 'B5B3E8')
            assert.equal(res.length, 10)
        })
    })

    it('it runs "howmuchwork.yaml" correctly', async () => {
        return query.run('./examples/howmuchwork.yaml')
        .then(res =>
        {
            console.log(res)
            assert.equal(res[0]['a.name'], 'imdonix')
            assert.equal(res[0]['count(c.sha)'], 1)
            assert.equal(res.length, 1)
        })
    })

    it('it runs "whochanged.yaml" correctly', async () => {
        return query.run('./examples/whochanged.yaml')
        .then(res =>
        {
            assert.equal(res.length, 0)
        })
    })

    it('it runs "whoonlast.yaml" correctly', async () => {
        return query.run('./examples/whoonlast.yaml')
        .then(res =>
        {
            assert.equal(res.length, 0)
        })
    })

  });