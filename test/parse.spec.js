const assert = require('assert');
const { emptyLogger } = require('../core/utils')
const { Query, params } = require('../core/query')
const { parseFrom, parseSelect, parseWhere, parseLimit } = require('../core/parse')

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
                parseFrom(query)
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
                parseFrom(query)
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 

            query.yaml = {from : 'commit a, author a'}

            try
            {
                parseFrom(query)
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should work for a single model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author'}
            parseFrom(query)
        })

        it('should work for multiple model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author, commit'}
            parseFrom(query)
        })

        it('should work for any whitespace', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author,     commit'}
            parseFrom(query)
            query.yaml = {from : '     author ,     commit'}
            parseFrom(query)
            query.yaml = {from : 'author,commit'}
            parseFrom(query)
        })

        it('should work for renaming a single model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a'}
            parseFrom(query)
        })

        it('should work for renaming a single model (mixed)', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a, commit'}
            parseFrom(query)
        })

        it('should work for renaming a all model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a, commit b'}
            parseFrom(query)
        })

        it('should work for multiple same model with rename', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a, author b'}
            parseFrom(query)
        })
    })

    describe('when parsing the: select', () => 
    {
        it('should work for a single select', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'a.name'}
            parseFrom(query)
            parseSelect(query)
        })

        it('should work for multiple select', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'a.name, a.name'}
            parseFrom(query)
            parseSelect(query)
        })

        it('should fail on missing model', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'b.name'}
            parseFrom(query)

            try
            {
                parseSelect(query)
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should fail on missing field', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {from : 'author a', select: 'a.namee'}
            parseFrom(query)

            try
            {
                parseSelect(query)
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
            parseLimit(query)   
        })

        it('should fail on a string', () =>
        {
            let query = new Query(params, emptyLogger())
            query.yaml = {limit: 'a' }
            try
            {
                parseLimit(query) 
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
                parseLimit(query) 
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
                parseLimit(query) 
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })
    })
})
