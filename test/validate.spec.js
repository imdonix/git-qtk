const assert = require('assert');
const { Query } = require('../app') 

describe('validate', () =>
{
    it('required', () =>
    {
        let query = new Query({})
        try
        {
            query.validate()
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })
})