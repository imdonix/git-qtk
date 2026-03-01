import assert from 'assert'
import { describe, test } from 'node:test'
import { Query } from '../core/query.js'
import { LOG } from '../core/utils.js'

describe('Integration tests against current repo', () => {

    const email = 'tamas.donix@gmail.com'
    const path = 'package.json'

    test('should run top-authors builtin query successfully', async () => {
        const input = {
            script: 'top-authors',
            params: { limit: '3' }
        }
        const query = new Query(input, LOG.VOID)

        await query.load()
        const result = await query.run()

        assert.ok(Array.isArray(result))
        assert.ok(result.length <= 3)
        if (result.length > 0) {
            assert.ok(result[0]['author.name'])
        }
    })

    test('should run hot-files builtin query successfully', async () => {
        const input = {
            script: 'hot-files',
            params: { limit: '5' }
        }
        const query = new Query(input, LOG.VOID)

        await query.load()
        const result = await query.run()

        assert.ok(Array.isArray(result))
        assert.ok(result.length <= 5)
        if (result.length > 0) {
            assert.ok(result[0]['file.path'])
        }
    })

    test('should run author-work builtin query successfully', async () => {
        const input = {
            script: 'author-work',
            params: { email: email }
        }
        const query = new Query(input, LOG.VOID)

        await query.load()
        const result = await query.run()

        assert.ok(Array.isArray(result))
        if (result.length > 0) {
            assert.ok(result[0]['file.path'])
            assert.ok(result[0]['count(commit.sha)'])
        }
    })

    test('should run commits-from builtin query successfully', async () => {
        const input = {
            script: 'commits-from',
            params: { email: email }
        }
        const query = new Query(input, LOG.VOID)

        await query.load()
        const result = await query.run()

        assert.ok(Array.isArray(result))
        if (result.length > 0) {
            assert.ok(result[0]['commit.sha'])
            assert.ok(result[0]['commit.message'])
        }
    })

    test('should run file-log builtin query successfully', async () => {
        const input = {
            script: 'file-log',
            params: { path: path }
        }
        const query = new Query(input, LOG.VOID)

        await query.load()
        const result = await query.run()

        assert.ok(Array.isArray(result))
        if (result.length > 0) {
            assert.ok(result[0]['short(commit.sha)'])
            assert.ok(result[0]['commit.message'])
        }
    })

    test('should run message-search builtin query successfully', async () => {
        const input = {
            script: 'message-search',
            params: { keyword: 'refactor' }
        }
        const query = new Query(input, LOG.VOID)

        await query.load()
        const result = await query.run()

        assert.ok(Array.isArray(result))
    })
})
