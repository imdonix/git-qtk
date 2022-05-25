const assert = require('assert');
const { LOG } = require('../core/utils')
const { Query, params } = require('../core/query')

describe('check valid query inputs', () =>
{
    it('should fail for missing all required parameters', () =>
    {
        try
        {
            new Query({}, LOG.VOID)
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })

    it('should fail for missing some required parameters', () =>
    {
        try
        {
            new Query({script : ''}, LOG.VOID)
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })

    it('should pass if all required parameter is given', () =>
    {
        try
        {
            new Query(params, LOG.VOID)
        }
        catch(err)
        {
            assert.fail("Validation failed on a valid query")
        }        
    })
})