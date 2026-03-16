/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Concurrency — Comprehensive Test Suite
 *  Tests parallel blocks (Promise.all/race/allSettled),
 *  sequential chains, timer instructions, and compilation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    detectConcurrencyBlock, detectSequentialChain, detectTimerInstruction,
    parseConcurrencyBlock, parseSequentialChain, parseTimerInstruction,
    compileParallelBlock, compileSequentialChain, compileTimerStatement
} from '../../src/intent-resolver/concurrency.js'

// ══════════════════════════════════════
//  detectConcurrencyBlock
// ══════════════════════════════════════

describe('Concurrency: detectConcurrencyBlock', () => {
    it('detects "at the same time:"', () => {
        const r = detectConcurrencyBlock('at the same time:')
        assert.ok(r)
        assert.equal(r.type, 'ParallelBlock')
    })
    it('detects "do these simultaneously:"', () => {
        const r = detectConcurrencyBlock('do these simultaneously:')
        assert.ok(r)
        assert.equal(r.type, 'ParallelBlock')
    })
    it('detects "use whichever finishes first:"', () => {
        const r = detectConcurrencyBlock('use whichever finishes first:')
        assert.ok(r)
        assert.equal(r.type, 'RaceBlock')
    })
    it('detects "try all of these and report:"', () => {
        const r = detectConcurrencyBlock('try all of these and report:')
        assert.ok(r)
        assert.equal(r.type, 'AllSettledBlock')
    })
    it('returns null for non-concurrent', () => {
        assert.equal(detectConcurrencyBlock('get the data'), null)
    })
})

// ══════════════════════════════════════
//  detectSequentialChain
// ══════════════════════════════════════

describe('Concurrency: detectSequentialChain', () => {
    it('detects "first, ..."', () => {
        assert.ok(detectSequentialChain('first, get the data'))
    })
    it('does not detect "then" alone', () => {
        assert.equal(detectSequentialChain('then do something'), false)
    })
})

// ══════════════════════════════════════
//  detectTimerInstruction
// ══════════════════════════════════════

describe('Concurrency: detectTimerInstruction', () => {
    it('detects interval', () => {
        assert.equal(detectTimerInstruction('do check health every 5 seconds'), 'interval')
    })
    it('detects timeout', () => {
        assert.equal(detectTimerInstruction('do send report after 30 seconds'), 'timeout')
    })
    it('detects background', () => {
        assert.equal(detectTimerInstruction('do process data in the background'), 'background')
    })
    it('detects timeout-abort', () => {
        assert.equal(detectTimerInstruction('fetch data, but give up after 10 seconds'), 'timeout-abort')
    })
    it('returns null for non-timer', () => {
        assert.equal(detectTimerInstruction('get the data'), null)
    })
})

// ══════════════════════════════════════
//  parseConcurrencyBlock
// ══════════════════════════════════════

describe('Concurrency: parseConcurrencyBlock', () => {
    it('parses parallel block with operations', () => {
        const lines = ['at the same time:', '  - fetch users', '  - fetch orders', '  - fetch products']
        const r = parseConcurrencyBlock(lines, 0)
        assert.ok(r)
        assert.equal(r.type, 'ParallelBlock')
        assert.equal(r.operations.length, 3)
    })
    it('parses race block', () => {
        const lines = ['use whichever finishes first:', '  - cdnA request', '  - cdnB request']
        const r = parseConcurrencyBlock(lines, 0)
        assert.equal(r.type, 'RaceBlock')
        assert.equal(r.operations.length, 2)
    })
    it('returns null for non-concurrent', () => {
        assert.equal(parseConcurrencyBlock(['get data'], 0), null)
    })
})

// ══════════════════════════════════════
//  parseSequentialChain
// ══════════════════════════════════════

describe('Concurrency: parseSequentialChain', () => {
    it('parses first/then/finally chain', () => {
        const lines = ['first, validate input', 'then, process data', 'finally, send response']
        const r = parseSequentialChain(lines, 0)
        assert.ok(r)
        assert.equal(r.type, 'SequentialChain')
        assert.equal(r.steps.length, 3)
        assert.equal(r.steps[0].order, 'first')
        assert.equal(r.steps[1].order, 'then')
        assert.equal(r.steps[2].order, 'finally')
    })
})

// ══════════════════════════════════════
//  parseTimerInstruction
// ══════════════════════════════════════

describe('Concurrency: parseTimerInstruction', () => {
    it('parses interval with seconds', () => {
        const r = parseTimerInstruction('do check health every 5 seconds')
        assert.ok(r)
        assert.equal(r.timerType, 'interval')
        assert.equal(r.ms, 5000)
    })
    it('parses timeout with minutes', () => {
        const r = parseTimerInstruction('do cleanup after 2 minutes')
        assert.ok(r)
        assert.equal(r.timerType, 'timeout')
        assert.equal(r.ms, 120000)
    })
    it('parses background', () => {
        const r = parseTimerInstruction('do sync data in the background')
        assert.ok(r)
        assert.equal(r.timerType, 'background')
        assert.equal(r.ms, null)
    })
    it('parses timeout-abort', () => {
        const r = parseTimerInstruction('fetch data, but give up after 30 seconds')
        assert.ok(r)
        assert.equal(r.timerType, 'timeout-abort')
        assert.equal(r.ms, 30000)
    })
})

// ══════════════════════════════════════
//  Compile Functions
// ══════════════════════════════════════

describe('Concurrency: compileParallelBlock', () => {
    it('generates Promise.all', () => {
        const js = compileParallelBlock({ type: 'ParallelBlock', operations: ['a', 'b'] })
        assert.ok(js.includes('Promise.all'))
    })
    it('generates Promise.race', () => {
        const js = compileParallelBlock({ type: 'RaceBlock', operations: ['a', 'b'] })
        assert.ok(js.includes('Promise.race'))
    })
    it('generates Promise.allSettled', () => {
        const js = compileParallelBlock({ type: 'AllSettledBlock', operations: ['a'], reportResults: true })
        assert.ok(js.includes('Promise.allSettled'))
    })
})

describe('Concurrency: compileSequentialChain', () => {
    it('generates comments for steps', () => {
        const js = compileSequentialChain({ steps: [{ order: 'first', action: 'validate' }] })
        assert.ok(js.includes('first'))
    })
})

describe('Concurrency: compileTimerStatement', () => {
    it('generates setInterval', () => {
        const js = compileTimerStatement({ timerType: 'interval', action: 'ping', ms: 5000 })
        assert.ok(js.includes('setInterval'))
    })
    it('generates setTimeout', () => {
        const js = compileTimerStatement({ timerType: 'timeout', action: 'cleanup', ms: 3000 })
        assert.ok(js.includes('setTimeout'))
    })
    it('generates async IIFE for background', () => {
        const js = compileTimerStatement({ timerType: 'background', action: 'sync' })
        assert.ok(js.includes('async'))
    })
    it('generates AbortController for timeout-abort', () => {
        const js = compileTimerStatement({ timerType: 'timeout-abort', action: 'fetch', ms: 10000 })
        assert.ok(js.includes('AbortController'))
    })
})
