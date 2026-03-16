/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Error Translator — Comprehensive Test Suite
 *  Tests JavaScript-to-English error translation, context
 *  extraction, formatted terminal display, and step debugger.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { translateError, formatEnglishError, createStepDebugger } from '../../src/intent-resolver/error-translator.js'

// ══════════════════════════════════════
//  translateError — Cannot Read Property
// ══════════════════════════════════════

describe('ErrorTranslator: Cannot read property', () => {
    it('translates undefined property access', () => {
        const err = new Error("Cannot read properties of undefined (reading 'name')")
        const result = translateError(err)
        assert.ok(result.title)
        assert.ok(result.title.includes('empty'))
        assert.ok(result.explanation)
        assert.ok(result.suggestions.length > 0)
    })
    it('translates null property access', () => {
        const err = new Error("Cannot read property 'length' of null")
        const result = translateError(err)
        assert.ok(result.title.includes('empty'))
    })
})

// ══════════════════════════════════════
//  translateError — Not a Function
// ══════════════════════════════════════

describe('ErrorTranslator: Not a function', () => {
    it('translates function call error', () => {
        const err = new Error('calculate is not a function')
        const result = translateError(err)
        assert.ok(result.title.includes('calculate'))
        assert.ok(result.explanation.includes('calculate'))
    })
})

// ══════════════════════════════════════
//  translateError — Not Defined
// ══════════════════════════════════════

describe('ErrorTranslator: Not defined', () => {
    it('translates undefined variable', () => {
        const err = new Error('userData is not defined')
        const result = translateError(err)
        assert.ok(result.title.includes('userData'))
        assert.ok(result.suggestions.length > 0)
    })
})

// ══════════════════════════════════════
//  translateError — Stack Overflow
// ══════════════════════════════════════

describe('ErrorTranslator: Stack overflow', () => {
    it('translates infinite recursion', () => {
        const err = new Error('Maximum call stack size exceeded')
        const result = translateError(err)
        assert.ok(result.title.includes('Infinite loop'))
    })
})

// ══════════════════════════════════════
//  translateError — Network Errors
// ══════════════════════════════════════

describe('ErrorTranslator: Network errors', () => {
    it('translates ECONNREFUSED', () => {
        const err = new Error('connect ECONNREFUSED 127.0.0.1:3000')
        const result = translateError(err)
        assert.ok(result.title.includes('network'))
    })
    it('translates fetch error', () => {
        const err = new Error('fetch failed: ENOTFOUND api.example.com')
        const result = translateError(err)
        assert.ok(result.title.includes('network'))
    })
})

// ══════════════════════════════════════
//  translateError — SyntaxError
// ══════════════════════════════════════

describe('ErrorTranslator: SyntaxError', () => {
    it('translates raw block syntax error', () => {
        const err = new Error('SyntaxError: Unexpected token')
        const result = translateError(err)
        assert.ok(result.title.includes('Syntax'))
    })
})

// ══════════════════════════════════════
//  translateError — JSON Parse Error
// ══════════════════════════════════════

describe('ErrorTranslator: JSON parse error', () => {
    it('translates JSON.parse failure', () => {
        const err = new Error('Unexpected token in JSON.parse at position 0')
        const result = translateError(err)
        assert.ok(result.title.includes('data format'))
    })
})

// ══════════════════════════════════════
//  translateError — Fallback
// ══════════════════════════════════════

describe('ErrorTranslator: Fallback', () => {
    it('uses generic fallback for unknown errors', () => {
        const err = new Error('some weird unique error nobody has seen')
        const result = translateError(err)
        assert.ok(result.title.includes('Runtime error'))
    })
    it('always includes technical details', () => {
        const err = new Error('test error')
        const result = translateError(err)
        assert.ok(result.technical)
        assert.equal(result.technical.jsError, 'test error')
    })
})

// ══════════════════════════════════════
//  translateError — Source Map Context
// ══════════════════════════════════════

describe('ErrorTranslator: Source map context', () => {
    it('includes instruction from source map', () => {
        const err = new Error("Cannot read properties of undefined")
        err.stack = 'Error\n    at file.js:5:10'
        const sourceMap = {
            mappings: [{ js_line: 5, lume_line: 3, lume_instruction: 'get the user data', resolved_by: 'pattern-library', confidence: 0.9, ast_node: 'VariableAccess' }]
        }
        const result = translateError(err, sourceMap)
        assert.equal(result.instruction, 'get the user data')
        assert.equal(result.line, 3)
        assert.equal(result.resolvedBy, 'pattern-library')
        assert.equal(result.confidence, 0.9)
    })
})

// ══════════════════════════════════════
//  formatEnglishError
// ══════════════════════════════════════

describe('ErrorTranslator: formatEnglishError', () => {
    it('returns a formatted string', () => {
        const translated = translateError(new Error('x is not defined'))
        const output = formatEnglishError(translated, 'test.lume')
        assert.equal(typeof output, 'string')
        assert.ok(output.includes('test.lume'))
    })
    it('includes suggestions in output', () => {
        const translated = translateError(new Error('x is not defined'))
        const output = formatEnglishError(translated)
        assert.ok(output.includes('Suggestions'))
    })
    it('includes technical details', () => {
        const translated = translateError(new Error('x is not defined'))
        const output = formatEnglishError(translated)
        assert.ok(output.includes('Technical details'))
    })
})

// ══════════════════════════════════════
//  createStepDebugger
// ══════════════════════════════════════

describe('ErrorTranslator: createStepDebugger', () => {
    it('returns step data for AST', () => {
        const ast = [
            { type: 'VariableDeclaration', line: 1 },
            { type: 'ShowStatement', line: 2 },
        ]
        const result = createStepDebugger(ast, null)
        assert.equal(result.length, 2)
        assert.equal(result[0].step, 1)
        assert.equal(result[0].total, 2)
        assert.equal(result[0].line, 1)
        assert.equal(result[0].astType, 'VariableDeclaration')
    })
    it('includes source map instruction if available', () => {
        const ast = [{ type: 'VariableAccess', line: 3 }]
        const sm = { mappings: [{ lume_line: 3, lume_instruction: 'get user' }] }
        const result = createStepDebugger(ast, sm)
        assert.equal(result[0].instruction, 'get user')
    })
})
