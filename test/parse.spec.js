const assert = require('assert');
const { LOG, OPERATOR, WILDCARD } = require('../core/utils')
const { Query, params, usePlugins } = require('../core/query')
const { parseFrom, parseSelect, parseWhere, parseLimit, parseOrder, parseJoin, parseStart } = require('../core/parse')

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
            query.yaml = {from : 'author; commit'}
            parseFrom(query)
        })

        it('should work for any whitespace', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author;     commit'}
            parseFrom(query)
            query.yaml = {from : '     author ;     commit'}
            parseFrom(query)
            query.yaml = {from : 'author;commit'}
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
            parseSelect(query)

            assert.equal(1, query.select.length)
        })

        it('should work for multiple select', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'a.name; a.name'}
            parseFrom(query)
            parseSelect(query)

            assert.equal(2, query.select.length)
        })

        it('should fail on missing model', () =>
        {
            let query = new Query(params, LOG.VOID)
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
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'a.namee'}
            parseFrom(query)

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
            query.yaml = {from : 'author a', select: 'short(a.name)'}
            parseFrom(query)
            parseSelect(query)

            assert.equal(query.select[0][0], `${WILDCARD.SP}f.short(${WILDCARD.SP}o['a.name'])`)
            assert.equal(query.select[0][1], 'short(a.name)')
        })

        it('should work with functions (multiple)', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = {from : 'author a', select: 'short(short(a.name + 1))'}
            parseFrom(query)
            parseSelect(query)

            assert.equal(query.select[0][0], `${WILDCARD.SP}f.short(${WILDCARD.SP}f.short(${WILDCARD.SP}o['a.name'] + 1))`)
            assert.equal(query.select[0][1], 'short(short(a.name + 1))')

        })

    })

    describe('when parsing the: where', () =>
    {
        it('should be empty if not given', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author', where : null }
            parseFrom(query)
            parseWhere(query)

            assert.equal(query.where.length, 0)          
        })

        it('should be normaly set', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author', where : 'true || true' }
            parseFrom(query)
            parseWhere(query)

            assert.equal(query.where[0].expression, 'true || true')
            
        })

        it('should handle fields', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where : 'a.name' }
            parseFrom(query)
            parseWhere(query)

            assert.equal(query.where[0].expression, `${WILDCARD.SP}o['a.name']`)
        })

        it('should handle functions', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where : "short('lajos')" }
            parseFrom(query)
            parseWhere(query)

            assert.equal(query.where[0].expression, `${WILDCARD.SP}f.short('lajos')`)  
        })

        it('should handle functions & fields mixed', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where : "short(a.name)" }
            parseFrom(query)
            parseWhere(query)

            assert.equal(query.where[0].expression, `${WILDCARD.SP}f.short(${WILDCARD.SP}o['a.name'])`)  
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

    describe('when parsing the: order', () => 
    {
        it('should work on a model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', order: 'a.name' }
            parseFrom(query)
            parseOrder(query)

            assert.equal(query.order[0], `${WILDCARD.SP}o['a.name']`)
            assert.equal(query.order[1], OPERATOR.LESS)
        })

        it('should work on a order modifier', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', order: 'a.name ASC' }
            parseFrom(query)
            parseOrder(query)

            assert.equal(query.order[0],`${WILDCARD.SP}o['a.name']`)
            assert.equal(query.order[1], OPERATOR.MORE)
        })

        it('should work if missing', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', }
            parseFrom(query)
            parseOrder(query)

            assert.equal(query.order, null)
        })

        it('should fail on invalid modifier', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', order: 'a.name LAJOS' }
            parseFrom(query)
            
            try
            {
                parseOrder(query)
                assert.fail()
            }
            catch(err){}
        })

    })

    describe('when parsing the: join', () => 
    {
        it('should ignore if: both side is a constant', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where: '1 == 1' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 0)
        })

        it('should ignore if: left side is constant ', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where: '1 == a.email' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 0)
        })

        it('should ignore if: right side is constant ', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a', where: 'a.email == 1' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 0)
        })

        it('should ignore if: wrapped into function', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a; commit c', where: 'short(a.email) == c.author' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 0)
        })

        it('should ignore if: same model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a; commit c', where: 'c.author == c.author' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 0)
        })

        it('should work on a left join', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a; commit c', where: 'a.email == c.author' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 1)
            assert.equal(query.join[0].exp, 'a.email == c.author')
        })

        it('should work on a full join', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a; commit c', where: 'a.email == c.sha' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 1)
            assert.equal(query.join[0].exp, 'a.email == c.sha')
        })

        it('should work for multiple join', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a; commit c; author aa; commit cc', where: 'a.email == c.sha && aa.email == cc.sha' }
            parseFrom(query)
            parseJoin(query)

            assert.equal(query.join.length, 2)
            assert.equal(query.join[0].exp, 'a.email == c.sha')
            assert.equal(query.join[1].exp, 'aa.email == cc.sha')
        })

        it('should work fail on invalid model', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { from: 'author a; commit c; author aa; commit cc', where: 'a.email == c.sha && aba.email == cc.sha' }
            parseFrom(query)

            try
            {
                parseJoin(query)
                assert.fail()
            }
            catch(err){}

        })

    })

    describe('when parsing the: start', () => 
    {
        it('should work', () =>
        {
            let query = new Query(params, LOG.VOID)
            query.yaml = { start : 'valami' , from: 'author a', where: '1 == 1' }
            parseStart(query)

            assert.equal(query.start, 'valami')
        })
    })
    
})
