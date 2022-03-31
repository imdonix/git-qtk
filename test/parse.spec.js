const assert = require('assert');
const { emptyLogger } = require('../core/utils')
const { Query, params } = require('../core/query')

describe('Validate query', () =>
{
    describe('when parsing the: from', () =>
    {
        it('should fail for not giving it', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = new Object()

            try
            {
                query.parseFrom()
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should fail for multiple model with the same name', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author, author'}

            try
            {
                query.parseFrom()
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 

            query.yaml = {from : 'commit a, author a'}

            try
            {
                query.parseFrom()
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should work for a single model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author'}
            query.parseFrom()
        })

        it('should work for multiple model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author, commit'}
            query.parseFrom()
        })

        it('should work for any whitespace', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author,     commit'}
            query.parseFrom()
            query.yaml = {from : '     author ,     commit'}
            query.parseFrom()
            query.yaml = {from : 'author,commit'}
            query.parseFrom()
        })

        it('should work for renaming a single model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a'}
            query.parseFrom()
        })

        it('should work for renaming a single model (mixed)', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a, commit'}
            query.parseFrom()
        })

        it('should work for renaming a all model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a, commit b'}
            query.parseFrom()
        })

        it('should work for multiple same model with rename', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a, author b'}
            query.parseFrom()
        })
    })

    describe('when parsing the: select', () => 
    {
        it('should work for a single select', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'a.name'}
            query.parseFrom()
            query.parseSelect()
        })

        it('should work for multiple select', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'a.name, a.name'}
            query.parseFrom()
            query.parseSelect()
        })

        it('should fail on missing model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'b.name'}
            query.parseFrom()

            try
            {
                query.parseSelect()
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should fail on missing field', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'a.namee'}
            query.parseFrom()

            try
            {
                query.parseSelect()
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })
    })

    describe('when parsing the: limit', () => 
    {
        it('should work on a integer', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {limit: 1 }
            query.parseLimit()   
        })

        it('should fail on a string', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {limit: 'a' }
            try
            {
                query.parseLimit() 
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should fail on a negative number', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {limit: -1 }
            try
            {
                query.parseLimit() 
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should fail on zero', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {limit: -1 }
            try
            {
                query.parseLimit() 
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })
    })
})
