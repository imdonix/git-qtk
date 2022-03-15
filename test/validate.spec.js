const assert = require('assert');
const { emptyLogger } = require('../core/utils')
const { Query } = require('../app') 

describe('validate', () =>
{
    it('required', () =>
    {
        let query = new Query({}, emptyLogger())
        try
        {
            query.validate()
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })
})