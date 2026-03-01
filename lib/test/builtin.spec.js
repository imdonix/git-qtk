import assert from 'assert'
import { describe, test } from 'node:test'
import builtin from '../core/builtin.js'

describe('Verify builtin scripts', () => {
    test('should load all YAML files from resources', () => {
        assert.ok(builtin.COMMITS_FROM, 'COMMITS_FROM should be loaded')
        assert.ok(builtin.KNOWS, 'KNOWS should be loaded')
        assert.ok(builtin.TOP_AUTHORS, 'TOP_AUTHORS should be loaded')
        assert.ok(builtin.FILE_LOG, 'FILE_LOG should be loaded')
        assert.ok(builtin.AUTHOR_WORK, 'AUTHOR_WORK should be loaded')
        assert.ok(builtin.HOT_FILES, 'HOT_FILES should be loaded')
        assert.ok(builtin.MESSAGE_SEARCH, 'MESSAGE_SEARCH should be loaded')
    })

    test('should have correct content for hot-files', () => {
        const script = builtin.HOT_FILES
        assert.equal(script.name, 'hot-files')
        assert.equal(script.group, 'file.path')
    })

    test('should have correct content for message-search', () => {
        const script = builtin.MESSAGE_SEARCH
        assert.equal(script.name, 'message-search')
        assert.ok(script.where.includes('{keyword}'))
    })

    test('should have correct content for top-authors', () => {
        const script = builtin.TOP_AUTHORS
        assert.equal(script.name, 'top-authors')
        assert.equal(script.group, 'author.email')
        assert.ok(script.order.includes('DESC'))
    })

    test('should have correct content for file-log', () => {
        const script = builtin.FILE_LOG
        assert.equal(script.name, 'file-log')
        assert.ok(script.where.includes('{path}'))
    })

    test('should have correct content for author-work', () => {
        const script = builtin.AUTHOR_WORK
        assert.equal(script.name, 'author-work')
        assert.equal(script.group, 'file.path')
    })

    test('should have correct content for commits-from', () => {
        const script = builtin.COMMITS_FROM
        assert.equal(script.name, 'commits-from')
        assert.ok(script.from)
        assert.ok(script.select)
        assert.ok(script.where)
    })

    test('should have correct content for knows', () => {
        const script = builtin.KNOWS
        assert.equal(script.name, 'knows')
        assert.ok(script.from)
        assert.ok(script.select)
        assert.ok(script.where)
        assert.ok(script.group)
    })
})
