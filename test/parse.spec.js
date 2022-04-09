const assert = require('assert');
const { LOG } = require('../core/utils')
const { Query, params, usePlugins } = require('../core/query')
const { parseFrom, parseSelect, parseWhere, parseLimit } = require('../core/parse')

describe('Validate query', () =>
{
    describe('when parsing the: from', () =>
    {
        it('should fail for not giving it', () =>
        {
            let query = new Query(params, LOG.VOID)
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
            let query = new Query(params, LOG.VOID)
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
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author'}
            parseFrom(query)
        })

        it('should work for multiple model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author, commit'}
            parseFrom(query)
        })

        it('should work for any whitespace', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author,     commit'}
            parseFrom(query)
            query.yaml = {from : '     author ,     commit'}
            parseFrom(query)
            query.yaml = {from : 'author,commit'}
            parseFrom(query)
        })

        it('should work for renaming a single model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a'}
            parseFrom(query)
        })

        it('should work for renaming a single model (mixed)', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a, commit'}
            parseFrom(query)
        })

        it('should work for renaming a all model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a, commit b'}
            parseFrom(query)
        })

        it('should work for multiple same model with rename', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a, author b'}
            parseFrom(query)
        })
    })

    describe('when parsing the: select', () => 
    {
        it('should work for a single select', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'a.name'}
            parseFrom(query)
            usePlugins(query)
            parseSelect(query)

            assert.equal(1, query.select.size)
        })

        it('should work for multiple select', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'a.name, a.name'}
            parseFrom(query)
            usePlugins(query)
            parseSelect(query)

            assert.equal(2, query.select.size)
        })

        it('should fail on missing model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'b.name'}
            parseFrom(query)
            usePlugins(query)

            try
            {
                parseSelect(query)
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 
        })

        it('should fail on missing field', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'a.namee'}
            parseFrom(query)
            usePlugins(query)

            try
            {
                parseSelect(query)
                assert.fail("Validation failed on a invalid query")
            }
            catch(err){} 

        })

        it('should work with functions', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'length(a.name)'}
            parseFrom(query)
            usePlugins(query)
            parseSelect(query)

            assert.equal(query.select.keys().next().value[0], "$.length(_['a.name'])")
            assert.equal(query.select.keys().next().value[1], 'length(a.name)')
        })

        it('should work with functions (multiple)', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'length(length(a.name + 1))'}
            parseFrom(query)
            usePlugins(query)
            parseSelect(query)

            assert.equal(query.select.keys().next().value[0], "$.length($.length(_['a.name'] + 1))")
            assert.equal(query.select.keys().next().value[1], 'length(length(a.name + 1))')

        })

    })

    describe('when parsing the: where', () =>
    {
        it('should be true if not given', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { where : null }
            parseWhere(query)

            assert.equal(query.where, 'true')
            
        })

        it('should be normaly set', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author', where : 'true || true' }
            parseFrom(query)
            usePlugins(query)
            parseWhere(query)

            assert.equal(query.where, 'true || true')
            
        })

        it('should handle fields', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where : 'a.name' }
            parseFrom(query)
            usePlugins(query)
            parseWhere(query)

            assert.equal(query.where, "_['a.name']")
        })

        it('should handle functions', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where : "length('lajos')" }
            parseFrom(query)
            usePlugins(query)
            parseWhere(query)

            assert.equal(query.where, "$.length('lajos')")  
        })

        it('should handle functions & fields mixed', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where : "length(a.name)" }
            parseFrom(query)
            usePlugins(query)
            parseWhere(query)

            assert.equal(query.where, "$.length(_['a.name'])")  
        })
    })

    describe('when parsing the: limit', () => 
    {
        it('should work on a integer', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {limit: 1 }
            parseLimit(query)   
        })

        it('should fail on a string', () =>
        {
            let query = new Query(params, LOG.VOID)
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
            let query = new Query(params, LOG.VOID)
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
            let query = new Query(params, LOG.VOID)
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
