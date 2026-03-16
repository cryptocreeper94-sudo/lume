/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Test Framework — Comprehensive Test Suite
 *  Tests natural language test parsing: test/describe blocks,
 *  setup/teardown, 20+ assertion patterns, and Jest compilation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    detectTestBlock, detectDescribeBlock, detectSetupTeardown,
    parseAssertion, parseTestBlockFull, parseDescribeBlockFull,
    compileTestSuite
} from '../../src/intent-resolver/test-framework.js'

// ══════════════════════════════════════
//  detectTestBlock
// ══════════════════════════════════════

describe('TestFramework: detectTestBlock', () => {
    it('detects test "name":', () => {
        const r = detectTestBlock('test "adds numbers":')
        assert.ok(r)
        assert.equal(r.name, 'adds numbers')
    })
    it('detects test with single quotes', () => {
        const r = detectTestBlock("test 'validates input':")
        assert.ok(r)
    })
    it('returns null for non-test', () => {
        assert.equal(detectTestBlock('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  detectDescribeBlock
// ══════════════════════════════════════

describe('TestFramework: detectDescribeBlock', () => {
    it('detects describe "group":', () => {
        const r = detectDescribeBlock('describe "math operations":')
        assert.ok(r)
        assert.equal(r.name, 'math operations')
    })
    it('returns null for non-describe', () => {
        assert.equal(detectDescribeBlock('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  detectSetupTeardown
// ══════════════════════════════════════

describe('TestFramework: detectSetupTeardown', () => {
    it('detects "before each test:"', () => {
        const r = detectSetupTeardown('before each test:')
        assert.ok(r)
        assert.equal(r.type, 'beforeEach')
    })
    it('detects "after each test:"', () => {
        const r = detectSetupTeardown('after each test:')
        assert.equal(r.type, 'afterEach')
    })
    it('detects "before all tests:"', () => {
        const r = detectSetupTeardown('before all tests:')
        assert.equal(r.type, 'beforeAll')
    })
    it('detects "after all tests:"', () => {
        const r = detectSetupTeardown('after all tests:')
        assert.equal(r.type, 'afterAll')
    })
    it('returns null for non-setup', () => {
        assert.equal(detectSetupTeardown('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  parseAssertion
// ══════════════════════════════════════

describe('TestFramework: parseAssertion', () => {
    it('parses "X should be Y"', () => {
        const r = parseAssertion('result should be 42')
        assert.ok(r)
        assert.ok(r.jest.includes('expect'))
        assert.ok(r.jest.includes('toBe'))
    })
    it('parses "X should equal Y"', () => {
        const r = parseAssertion('result should equal "hello"')
        assert.ok(r.jest.includes('toEqual'))
    })
    it('parses "X should be greater than Y"', () => {
        const r = parseAssertion('count should be greater than 0')
        assert.ok(r.jest.includes('toBeGreaterThan'))
    })
    it('parses "X should be less than Y"', () => {
        const r = parseAssertion('count should be less than 100')
        assert.ok(r.jest.includes('toBeLessThan'))
    })
    it('parses "X should not be empty"', () => {
        const r = parseAssertion('results should not be empty')
        assert.ok(r.jest.includes('toBeGreaterThan'))
    })
    it('parses "X should be empty"', () => {
        const r = parseAssertion('errors should be empty')
        assert.ok(r.jest.includes('toHaveLength(0)'))
    })
    it('parses "X should have N items"', () => {
        const r = parseAssertion('list should have 3 items')
        assert.ok(r.jest.includes('toHaveLength(3)'))
    })
    it('parses "X should be true"', () => {
        const r = parseAssertion('isValid should be true')
        assert.ok(r.jest.includes('toBe(true)'))
    })
    it('parses "X should be false"', () => {
        const r = parseAssertion('hasErrors should be false')
        assert.ok(r.jest.includes('toBe(false)'))
    })
    it('parses "X should be null"', () => {
        const r = parseAssertion('result should be null')
        assert.ok(r.jest.includes('toBeNull'))
    })
    it('parses "X should exist"', () => {
        const r = parseAssertion('user should exist')
        assert.ok(r.jest.includes('toBeDefined'))
    })
    it('parses "it should succeed"', () => {
        const r = parseAssertion('it should succeed')
        assert.ok(r)
    })
    it('parses possessives "the user\'s name"', () => {
        const r = parseAssertion("the user's name should be \"Alice\"")
        assert.ok(r.jest.includes('user.name'))
    })
    it('returns null for non-assertion', () => {
        assert.equal(parseAssertion('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  parseTestBlockFull
// ══════════════════════════════════════

describe('TestFramework: parseTestBlockFull', () => {
    it('parses test block with body', () => {
        const lines = ['test "adds numbers":', '  result should be 5', '  count should be 1']
        const r = parseTestBlockFull(lines, 0)
        assert.ok(r)
        assert.equal(r.type, 'TestCase')
        assert.equal(r.name, 'adds numbers')
        assert.equal(r.body.length, 2)
    })
    it('returns null for non-test', () => {
        assert.equal(parseTestBlockFull(['let x = 1'], 0), null)
    })
})

// ══════════════════════════════════════
//  compileTestSuite
// ══════════════════════════════════════

describe('TestFramework: compileTestSuite', () => {
    it('compiles TestCase to Jest', () => {
        const node = { type: 'TestCase', name: 'works', body: [{ jest: 'expect(1).toBe(1);' }] }
        const js = compileTestSuite(node)
        assert.ok(js.includes("test('works'"))
        assert.ok(js.includes('expect(1)'))
    })
    it('compiles TestSuite to Jest describe', () => {
        const node = {
            type: 'TestSuite', name: 'math',
            tests: [{ type: 'TestCase', name: 'adds', body: [] }],
            setup: [], teardown: [],
        }
        const js = compileTestSuite(node)
        assert.ok(js.includes("describe('math'"))
    })
    it('includes setup/teardown', () => {
        const node = {
            type: 'TestSuite', name: 'suite',
            tests: [],
            setup: [{ type: 'beforeEach', body: ['reset state'] }],
            teardown: [{ type: 'afterEach', body: ['cleanup'] }],
        }
        const js = compileTestSuite(node)
        assert.ok(js.includes('beforeEach'))
        assert.ok(js.includes('afterEach'))
    })
})
