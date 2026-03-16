/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Hint Parser — Comprehensive Test Suite
 *  Tests performance hint extraction from instructions:
 *  algorithm, cache, parallel, limit, loading, batch,
 *  retry, timeout, streaming, priority + code wrappers.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    extractHints, generateCacheWrapper, generateRetryWrapper,
    generateTimeoutWrapper, generateParallelWrapper, summarizeHints
} from '../../src/intent-resolver/hint-parser.js'

// ══════════════════════════════════════
//  extractHints — Algorithm
// ══════════════════════════════════════

describe('HintParser: Algorithm hints', () => {
    it('extracts "using quicksort"', () => {
        const r = extractHints('sort the data using quicksort')
        assert.ok(r.hasHints)
        assert.equal(r.hints.algorithm, 'quicksort')
    })
    it('extracts "using binary search"', () => {
        const r = extractHints('find the item using binary search')
        assert.ok(r.hasHints)
        assert.equal(r.hints.algorithm, 'binary search')
    })
    it('cleans hint from instruction', () => {
        const r = extractHints('sort the data using quicksort')
        assert.ok(!r.instruction.includes('quicksort'))
    })
})

// ══════════════════════════════════════
//  extractHints — Cache
// ══════════════════════════════════════

describe('HintParser: Cache hints', () => {
    it('extracts "cache for 5 minutes"', () => {
        const r = extractHints('get user data cache for 5 minutes')
        assert.ok(r.hasHints)
        assert.equal(r.hints.cache.duration, 5)
    })
    it('extracts "cache indefinitely"', () => {
        const r = extractHints('load config cache indefinitely')
        assert.equal(r.hints.cache.duration, -1)
    })
    it('extracts "don\'t cache"', () => {
        const r = extractHints("fetch data don't cache")
        assert.ok(r.hints.cache.disabled)
    })
})

// ══════════════════════════════════════
//  extractHints — Parallel
// ══════════════════════════════════════

describe('HintParser: Parallel hints', () => {
    it('extracts "in parallel"', () => {
        const r = extractHints('process each user in parallel')
        assert.ok(r.hints.parallel.enabled)
    })
    it('extracts "with 4 workers"', () => {
        const r = extractHints('process tasks with 4 workers')
        assert.equal(r.hints.parallel.workers, 4)
    })
})

// ══════════════════════════════════════
//  extractHints — Limit
// ══════════════════════════════════════

describe('HintParser: Limit hints', () => {
    it('extracts "limit to 100"', () => {
        const r = extractHints('get all records limit to 100')
        assert.equal(r.hints.limit, '100')
    })
    it('extracts "first 50 only"', () => {
        const r = extractHints('get users first 50 only')
        assert.equal(r.hints.limit, '50')
    })
})

// ══════════════════════════════════════
//  extractHints — Retry
// ══════════════════════════════════════

describe('HintParser: Retry hints', () => {
    it('extracts "retry 3 times"', () => {
        const r = extractHints('send email retry 3 times')
        assert.equal(r.hints.retry.count, 3)
    })
    it('extracts "with exponential backoff"', () => {
        const r = extractHints('fetch data with exponential backoff')
        assert.equal(r.hints.retry.backoff, 'exponential')
    })
})

// ══════════════════════════════════════
//  extractHints — Timeout
// ══════════════════════════════════════

describe('HintParser: Timeout hints', () => {
    it('extracts "timeout after 30 seconds"', () => {
        const r = extractHints('fetch data timeout after 30 seconds')
        assert.equal(r.hints.timeout.value, 30)
    })
})

// ══════════════════════════════════════
//  extractHints — No Hints
// ══════════════════════════════════════

describe('HintParser: No hints', () => {
    it('returns false when no hints', () => {
        const r = extractHints('get the user data')
        assert.equal(r.hasHints, false)
    })
    it('preserves full instruction', () => {
        const r = extractHints('show the results')
        assert.equal(r.instruction, 'show the results')
    })
})

// ══════════════════════════════════════
//  Wrapper Generators
// ══════════════════════════════════════

describe('HintParser: generateCacheWrapper', () => {
    it('generates cache wrapper', () => {
        const js = generateCacheWrapper('getUser()', { duration: 5, unit: 'minute' })
        assert.ok(js.includes('Map'))
        assert.ok(js.includes('getUser()'))
    })
    it('skips wrapper when disabled', () => {
        const js = generateCacheWrapper('getUser()', { disabled: true })
        assert.equal(js, 'getUser()')
    })
})

describe('HintParser: generateRetryWrapper', () => {
    it('generates retry loop', () => {
        const js = generateRetryWrapper('fetchData()', { count: 3, backoff: 'none' })
        assert.ok(js.includes('attempt'))
        assert.ok(js.includes('3'))
    })
    it('includes exponential backoff', () => {
        const js = generateRetryWrapper('fetchData()', { count: 5, backoff: 'exponential' })
        assert.ok(js.includes('Math.pow'))
    })
})

describe('HintParser: generateTimeoutWrapper', () => {
    it('generates Promise.race timeout', () => {
        const js = generateTimeoutWrapper('fetchData()', { value: 30, unit: 'second' })
        assert.ok(js.includes('Promise.race'))
        assert.ok(js.includes('Timeout'))
    })
})

describe('HintParser: generateParallelWrapper', () => {
    it('generates Promise.all', () => {
        const js = generateParallelWrapper('items', { enabled: true })
        assert.ok(js.includes('Promise.all'))
    })
    it('includes worker count in comment', () => {
        const js = generateParallelWrapper('items', { enabled: true, workers: 4 })
        assert.ok(js.includes('4'))
    })
})

// ══════════════════════════════════════
//  summarizeHints
// ══════════════════════════════════════

describe('HintParser: summarizeHints', () => {
    it('summarizes algorithm hint', () => {
        const r = summarizeHints({ algorithm: 'quicksort' })
        assert.ok(r.includes('quicksort'))
    })
    it('summarizes multiple hints', () => {
        const r = summarizeHints({ algorithm: 'bfs', limit: '100', retry: { count: 3, backoff: 'none' } })
        assert.ok(r.includes('bfs'))
        assert.ok(r.includes('100'))
        assert.ok(r.includes('3'))
    })
    it('returns empty for no hints', () => {
        assert.equal(summarizeHints({}), '')
    })
})
