import assert from 'assert'
import { describe, test } from 'node:test'

import { Query, params } from '../core/query.js'
import { LOG } from '../core/utils.js'

describe('check valid query inputs', () =>
{
    test('should fail for missing all required parameters', () =>
    {
        try
        {
            new Query({}, LOG.VOID)
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })

    test('should fail for missing some required parameters', () =>
    {
        try
        {
            new Query({script : ''}, LOG.VOID)
            assert.fail("Validation passed on a invalid query")
        }
        catch(err){}        
    })

    test('should pass if all required parameter is given', () =>
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