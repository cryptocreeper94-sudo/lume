/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Clarification — Comprehensive Test Suite
 *  Tests ClarificationCache, generateOptions, voice/playground
 *  clarification, and non-interactive mode.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ClarificationCache, generateOptions, enterClarificationMode, formatVoiceClarification, formatPlaygroundClarification } from '../../src/intent-resolver/clarification.js'

// ══════════════════════════════════════
//  ClarificationCache
// ══════════════════════════════════════

describe('Clarification: ClarificationCache', () => {
    it('creates a cache instance', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        assert.ok(cache)
    })
    it('initially has no entries', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        assert.equal(cache.has('anything'), false)
    })
    it('get returns null for missing phrase', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        assert.equal(cache.get('nonexistent'), null)
    })
    it('set then has returns true', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        cache.set('process the data', {
            resolvedAs: 'FilterOperation',
            astType: 'FilterOperation',
            originalConfidence: 0.6,
            choiceIndex: 1,
        })
        assert.ok(cache.has('process the data'))
    })
    it('set then get returns resolution', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        cache.set('handle errors', {
            resolvedAs: 'TryBlock',
            astType: 'TryBlock',
            originalConfidence: 0.5,
            choiceIndex: 2,
        })
        const result = cache.get('handle errors')
        assert.ok(result)
        assert.equal(result.resolved_as, 'TryBlock')
    })
    it('clear removes all entries', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        cache.set('foo', { resolvedAs: 'X', astType: 'X', originalConfidence: 0.5, choiceIndex: 1 })
        cache.clear()
        assert.equal(cache.has('foo'), false)
    })
    it('is case-insensitive', () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        cache.set('Process The Data', { resolvedAs: 'X', astType: 'X', originalConfidence: 0.5, choiceIndex: 1 })
        assert.ok(cache.has('process the data'))
    })
})

// ══════════════════════════════════════
//  generateOptions
// ══════════════════════════════════════

describe('Clarification: generateOptions', () => {
    it('returns 4 default options', () => {
        const options = generateOptions('do something')
        assert.equal(options.length, 4)
    })
    it('each option has index', () => {
        const options = generateOptions('process data')
        assert.ok(options.every(o => typeof o.index === 'number'))
    })
    it('each option has label', () => {
        const options = generateOptions('process data')
        assert.ok(options.every(o => typeof o.label === 'string'))
    })
    it('each option has astType', () => {
        const options = generateOptions('do things')
        assert.ok(options.every(o => typeof o.astType === 'string'))
    })
    it('uses AI results when provided', () => {
        const aiResults = [
            { interpretation: 'Filter data', confidence: 0.9, ast: { type: 'FilterOp' } },
            { interpretation: 'Transform data', confidence: 0.8, ast: { type: 'TransformOp' } },
        ]
        const options = generateOptions('process data', aiResults)
        assert.equal(options[0].label, 'Filter data')  // highest confidence first
    })
    it('generates verb-specific options for "process"', () => {
        const options = generateOptions('process the records')
        assert.ok(options.length >= 4)
    })
    it('generates verb-specific options for "handle"', () => {
        const options = generateOptions('handle the error')
        assert.ok(options.some(o => o.label.includes('handler') || o.label.includes('Route') || o.label.includes('error') || o.label.includes('Process')))
    })
    it('generates verb-specific options for "manage"', () => {
        const options = generateOptions('manage the users')
        assert.ok(options.some(o => o.label.includes('Create') || o.label.includes('Track') || o.label.includes('resource')))
    })
    it('limits to 4 options from AI results', () => {
        const aiResults = Array.from({ length: 10 }, (_, i) => ({ interpretation: `opt${i}`, confidence: i * 0.1 }))
        const options = generateOptions('test', aiResults)
        assert.equal(options.length, 4)
    })
})

// ══════════════════════════════════════
//  enterClarificationMode — Non-Interactive
// ══════════════════════════════════════

describe('Clarification: enterClarificationMode non-interactive', () => {
    it('fails with LUME-E040 in non-interactive mode', async () => {
        const result = await enterClarificationMode('do stuff', 5, 0.6, { nonInteractive: true })
        assert.equal(result.resolved, false)
        assert.ok(result.error)
        assert.equal(result.error.code, 'LUME-E040')
    })
    it('error message includes line number', async () => {
        const result = await enterClarificationMode('handle it', 10, 0.4, { nonInteractive: true })
        assert.ok(result.error.message.includes('10'))
    })
    it('error message includes confidence', async () => {
        const result = await enterClarificationMode('process', 1, 0.3, { nonInteractive: true })
        assert.ok(result.error.message.includes('30%'))
    })
})

// ══════════════════════════════════════
//  enterClarificationMode — Cached
// ══════════════════════════════════════

describe('Clarification: enterClarificationMode cached', () => {
    it('returns from cache if available', async () => {
        const cache = new ClarificationCache('/tmp/lume-test-' + Date.now())
        cache.set('process the data', { resolvedAs: 'FilterOp', astType: 'FilterOperation', originalConfidence: 0.5, choiceIndex: 1 })
        const result = await enterClarificationMode('process the data', 5, 0.5, { cache })
        assert.ok(result.resolved)
        assert.ok(result.fromCache)
    })
})

// ══════════════════════════════════════
//  formatVoiceClarification
// ══════════════════════════════════════

describe('Clarification: formatVoiceClarification', () => {
    it('returns a spoken string', () => {
        const choices = [{ label: 'Filter' }, { label: 'Transform' }]
        const result = formatVoiceClarification('do things', 0.5, choices)
        assert.equal(typeof result, 'string')
        assert.ok(result.includes('do things'))
    })
    it('includes option labels', () => {
        const choices = [{ label: 'Sort the items' }, { label: 'Filter the items' }]
        const result = formatVoiceClarification('organize data', 0.6, choices)
        assert.ok(result.includes('sort the items'))
    })
})

// ══════════════════════════════════════
//  formatPlaygroundClarification
// ══════════════════════════════════════

describe('Clarification: formatPlaygroundClarification', () => {
    it('returns clarification object', () => {
        const result = formatPlaygroundClarification('do stuff', 5, 0.4)
        assert.equal(result.type, 'clarification')
        assert.equal(result.line, 5)
        assert.equal(result.instruction, 'do stuff')
        assert.equal(result.confidence, 0.4)
    })
    it('includes options array', () => {
        const result = formatPlaygroundClarification('process data', 1, 0.5)
        assert.ok(Array.isArray(result.options))
        assert.ok(result.options.length >= 4)
    })
    it('includes rephrase option', () => {
        const result = formatPlaygroundClarification('handle it', 1, 0.3)
        assert.ok(result.rephraseOption)
    })
})
