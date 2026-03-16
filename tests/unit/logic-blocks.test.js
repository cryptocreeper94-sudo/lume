/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Logic Blocks — Comprehensive Test Suite
 *  Tests compound conditionals: "if all/any of these are true:",
 *  condition bullet parsing, negation detection, else-if/else,
 *  and condition→JS compilation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    detectCompoundStart, parseConditionBullet,
    parseCompoundConditional, compileConditionExpression
} from '../../src/intent-resolver/logic-blocks.js'

// ══════════════════════════════════════
//  detectCompoundStart
// ══════════════════════════════════════

describe('LogicBlocks: detectCompoundStart', () => {
    it('detects "if all of these are true:"', () => {
        const r = detectCompoundStart('if all of these are true:')
        assert.ok(r)
        assert.equal(r.mode, 'all')
    })
    it('detects "if any of these are true:"', () => {
        const r = detectCompoundStart('if any of these are true:')
        assert.ok(r)
        assert.equal(r.mode, 'any')
    })
    it('detects "do this when:"', () => {
        const r = detectCompoundStart('do this when:')
        assert.ok(r)
    })
    it('detects "skip this if any of these are true:"', () => {
        const r = detectCompoundStart('skip this if any of these are true:')
        assert.ok(r)
        assert.ok(r.negated)
    })
    it('returns null for non-compound', () => {
        assert.equal(detectCompoundStart('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  parseConditionBullet
// ══════════════════════════════════════

describe('LogicBlocks: parseConditionBullet', () => {
    it('parses simple condition', () => {
        const r = parseConditionBullet('the user is active')
        assert.ok(r)
        assert.equal(r.type, 'Condition')
    })
    it('detects negation', () => {
        const r = parseConditionBullet("the user isn't logged in")
        assert.ok(r.negated)
    })
    it('parses inline OR', () => {
        const r = parseConditionBullet('the user is admin or the user is moderator')
        assert.equal(r.type, 'CompoundCondition')
        assert.equal(r.mode, 'any')
    })
    it('parses inline AND', () => {
        const r = parseConditionBullet('the user is active and the account is verified')
        assert.equal(r.type, 'CompoundCondition')
        assert.equal(r.mode, 'all')
    })
    it('preserves original text', () => {
        const r = parseConditionBullet('the count is zero')
        assert.equal(r.originalText, 'the count is zero')
    })
})

// ══════════════════════════════════════
//  parseCompoundConditional
// ══════════════════════════════════════

describe('LogicBlocks: parseCompoundConditional', () => {
    it('parses compound block with conditions', () => {
        const lines = [
            'if all of these are true:',
            '- the user is active',
            '- the account is verified',
            '- the subscription is valid',
        ]
        const r = parseCompoundConditional(lines, 0, 1)
        assert.ok(r)
        assert.equal(r.node.type, 'CompoundIfStatement')
        assert.equal(r.node.mode, 'all')
        assert.equal(r.node.conditions.length, 3)
    })
    it('parses any-mode block', () => {
        const lines = [
            'if any of these are true:',
            '- the user is admin',
            '- the user is moderator',
        ]
        const r = parseCompoundConditional(lines, 0, 1)
        assert.equal(r.node.mode, 'any')
    })
    it('returns null for non-compound', () => {
        assert.equal(parseCompoundConditional(['let x = 1'], 0, 1), null)
    })
})

// ══════════════════════════════════════
//  compileConditionExpression
// ══════════════════════════════════════

describe('LogicBlocks: compileConditionExpression', () => {
    it('joins with && for all mode', () => {
        const conditions = [
            { type: 'Condition', expression: 'x', negated: false },
            { type: 'Condition', expression: 'y', negated: false },
        ]
        const result = compileConditionExpression(conditions, 'all')
        assert.ok(result.includes('&&'))
    })
    it('joins with || for any mode', () => {
        const conditions = [
            { type: 'Condition', expression: 'x', negated: false },
            { type: 'Condition', expression: 'y', negated: false },
        ]
        const result = compileConditionExpression(conditions, 'any')
        assert.ok(result.includes('||'))
    })
    it('negates conditions when flagged', () => {
        const conditions = [
            { type: 'Condition', expression: 'x', negated: true },
        ]
        const result = compileConditionExpression(conditions, 'all')
        assert.ok(result.includes('!'))
    })
    it('handles nested compound conditions', () => {
        const conditions = [
            {
                type: 'CompoundCondition', mode: 'any',
                conditions: [
                    { type: 'Condition', expression: 'a', negated: false },
                    { type: 'Condition', expression: 'b', negated: false },
                ]
            }
        ]
        const result = compileConditionExpression(conditions, 'all')
        assert.ok(result.includes('||'))
        assert.ok(result.includes('('))
    })
})
