const assert = require('assert');
const { emptyLogger } = require('../core/utils')
const { Query, params } = require('../core/query')

describe('Validate cli parameters', () =>
{
    it('should fail for missing all required parameters', () =>
    {
        let query = new Query({}, emptyLogger())
        try
        {
            query.validate()
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })

    it('should fail for missing some required parameters', () =>
    {
        let query = new Query({script : ''}, emptyLogger())
        try
        {
            query.validate()
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })

    it('should pass if all required parameter is given', () =>
    {
        let query = new Query(params, emptyLogger())
        try
        {
            query.validate()
        }
        catch(err)
        {
            assert.fail("Validation failed on a valid query")
        }        
    })
})