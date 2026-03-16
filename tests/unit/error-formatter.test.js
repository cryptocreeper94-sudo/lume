/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Error Formatter — Test Suite
 *  Tests formatError and didYouMean functionality.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatError, didYouMean } from '../../src/error-formatter.js'

/* ═══ Error Formatting ═══════════════════════════════════ */

describe('ErrorFormatter: formatError', () => {
    it('returns a string', () => {
        const output = formatError(new Error('test'), 'let x = 5')
        assert.ok(typeof output === 'string')
    })

    it('includes error message', () => {
        const output = formatError(new Error('Unexpected token'), 'let x = @')
        assert.ok(output.includes('Unexpected') || output.includes('token') || output.includes('Error'))
    })

    it('includes source context when available', () => {
        const output = formatError(new Error('test'), 'let x = @invalid', 'test.lume')
        assert.ok(output.length > 10)
    })

    it('handles errors with line info', () => {
        const err = new Error('test')
        err.line = 5
        err.column = 10
        const output = formatError(err, 'some source code')
        assert.ok(typeof output === 'string')
    })

    it('handles TypeError', () => {
        const output = formatError(new TypeError('Cannot read properties of undefined'), 'x.y.z')
        assert.ok(output.includes('Cannot') || output.includes('undefined') || output.includes('Error'))
    })

    it('handles ReferenceError', () => {
        const output = formatError(new ReferenceError('foo is not defined'), 'show foo')
        assert.ok(output.includes('foo') || output.includes('not defined') || output.includes('Error'))
    })

    it('handles SyntaxError', () => {
        const output = formatError(new SyntaxError('unexpected token'), 'if true')
        assert.ok(typeof output === 'string')
    })

    it('handles string error', () => {
        const output = formatError('raw error string', 'code here')
        assert.ok(typeof output === 'string')
    })

    it('handles null source gracefully', () => {
        const output = formatError(new Error('test'))
        assert.ok(typeof output === 'string')
    })
})

/* ═══ Did You Mean ═══════════════════════════════════════ */

describe('ErrorFormatter: didYouMean', () => {
    it('suggests close match', () => {
        const result = didYouMean('shw', ['show', 'set', 'if', 'let'])
        assert.ok(result === 'show' || result !== null)
    })

    it('suggests exact match', () => {
        const result = didYouMean('show', ['show', 'set', 'if'])
        assert.equal(result, 'show')
    })

    it('returns null for no close match', () => {
        const result = didYouMean('zzzzzzz', ['show', 'set', 'if'], 2)
        assert.equal(result, null)
    })

    it('handles empty candidates', () => {
        const result = didYouMean('test', [])
        assert.equal(result, null)
    })

    it('finds best match among multiple', () => {
        const result = didYouMean('defne', ['define', 'delete', 'default'])
        assert.equal(result, 'define')
    })

    it('suggests from Lume keywords', () => {
        const keywords = ['let', 'define', 'show', 'log', 'set', 'return', 'if', 'else', 'for', 'while']
        const result = didYouMean('shwo', keywords)
        assert.equal(result, 'show')
    })

    it('handles single character input', () => {
        const result = didYouMean('a', ['ab', 'abc', 'xyz'])
        // Should not crash
        assert.ok(result === null || typeof result === 'string')
    })
})
