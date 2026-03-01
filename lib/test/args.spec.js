import assert from 'assert'
import { describe, test } from 'node:test'
import { cli } from '../core/cli.js'
import { parseFrom } from '../core/parse.js'
import { Query, params } from '../core/query.js'
import { LOG } from '../core/utils.js'

describe('Positional arguments', () => {
    test('should capture positional arguments in cli', () => {
        const args = ['node', 'main.js', '-s', 'script', 'arg0', 'arg1', 'key=val']
        const input = cli(args, { script: { keys: ['s'], type: 'string' } })

        assert.deepEqual(input.args, ['arg0', 'arg1'])
        assert.equal(input.params['key'], 'val')
    })

    test('should substitute $0, $1 in query', () => {
        const input = {
            script: 'test',
            args: ['value0', 'value1'],
            params: {}
        }
        const query = new Query(input, LOG.VOID)
        query.yaml = {
            from: 'author',
            where: 'author.name == "$0" && author.email == "$1"'
        }

        parseFrom(query)
        // We can't easily test the private resolveParameters directly without exporting it
        // but we can check the effect in parseFrom or parseWhere

        query.yaml.from = 'author $0'
        parseFrom(query)
        assert.ok(query.from.has('value0'))
    })
})
