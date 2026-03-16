/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Runtime (Self-Sustaining) — Comprehensive Test Suite
 *  Tests Monitor, Healer, Optimizer, Evolver
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Monitor } from '../../src/runtime/monitor.js'

/* ═══ Monitor Construction ═══════════════════════════════ */

describe('Runtime: Monitor Constructor', () => {
    it('creates monitor with defaults', () => {
        const m = new Monitor()
        assert.equal(m.enabled, true)
        assert.equal(m.interval, 5000)
        m.stop()
    })

    it('creates disabled monitor', () => {
        const m = new Monitor({ enabled: false })
        assert.equal(m.enabled, false)
    })

    it('accepts custom interval', () => {
        const m = new Monitor({ interval: 10000 })
        assert.equal(m.interval, 10000)
        m.stop()
    })

    it('accepts custom retention', () => {
        const m = new Monitor({ retention: 3600000 })
        assert.equal(m.retention, 3600000)
        m.stop()
    })

    it('accepts custom dashboard port', () => {
        const m = new Monitor({ port: 8080 })
        assert.equal(m.dashboardPort, 8080)
        m.stop()
    })
})

/* ═══ Function Instrumentation ═══════════════════════════ */

describe('Runtime: Function Tracking', () => {
    it('start() returns timestamp', () => {
        const m = new Monitor()
        const t = m.start('testFn')
        assert.ok(typeof t === 'number')
        assert.ok(t > 0)
        m.stop()
    })

    it('success() tracks call count', () => {
        const m = new Monitor()
        const t = m.start('testFn')
        m.success('testFn', t)
        assert.equal(m.functions.testFn.calls, 1)
        m.stop()
    })

    it('success() tracks timing', () => {
        const m = new Monitor()
        const t = m.start('testFn')
        m.success('testFn', t)
        assert.ok(m.functions.testFn.totalTime >= 0)
        assert.ok(m.functions.testFn.minTime >= 0)
        m.stop()
    })

    it('error() tracks error count', () => {
        const m = new Monitor()
        const t = m.start('errFn')
        m.error('errFn', t, new Error('test'))
        assert.equal(m.functions.errFn.errors, 1)
        assert.equal(m.functions.errFn.calls, 1)
        m.stop()
    })

    it('tracks multiple calls', () => {
        const m = new Monitor()
        for (let i = 0; i < 5; i++) {
            const t = m.start('multi')
            m.success('multi', t)
        }
        assert.equal(m.functions.multi.calls, 5)
        m.stop()
    })

    it('disabled monitor still returns timestamp', () => {
        const m = new Monitor({ enabled: false })
        const t = m.start('fn')
        assert.ok(typeof t === 'number')
    })
})

/* ═══ AI Call Tracking ═══════════════════════════════════ */

describe('Runtime: AI Call Tracking', () => {
    it('tracks AI calls', () => {
        const m = new Monitor()
        m.trackAICall('ask', 'gpt-4', 500, 100, 0.01)
        assert.equal(m.aiCalls.length, 1)
        assert.equal(m.aiCalls[0].model, 'gpt-4')
        assert.equal(m.aiCalls[0].latency, 500)
        m.stop()
    })

    it('tracks multiple AI calls', () => {
        const m = new Monitor()
        m.trackAICall('ask', 'gpt-4', 500, 100, 0.01)
        m.trackAICall('think', 'claude', 800, 200, 0.02)
        m.trackAICall('generate', 'gemini', 300, 50, 0.005)
        assert.equal(m.aiCalls.length, 3)
        m.stop()
    })

    it('disabled monitor skips tracking', () => {
        const m = new Monitor({ enabled: false })
        m.trackAICall('ask', 'gpt-4', 500)
        assert.equal(m.aiCalls.length, 0)
    })
})

/* ═══ Fetch Tracking ═════════════════════════════════════ */

describe('Runtime: Fetch Tracking', () => {
    it('tracks successful fetch', () => {
        const m = new Monitor()
        m.trackFetch('/api/users', 'GET', 200, 150)
        assert.equal(m.fetchCalls.length, 1)
        assert.equal(m.fetchCalls[0].success, true)
        m.stop()
    })

    it('tracks failed fetch', () => {
        const m = new Monitor()
        m.trackFetch('/api/users', 'POST', 500, 200)
        assert.equal(m.fetchCalls[0].success, false)
        m.stop()
    })

    it('calculates success by status range', () => {
        const m = new Monitor()
        m.trackFetch('/a', 'GET', 200, 100)
        m.trackFetch('/b', 'POST', 201, 100)
        m.trackFetch('/c', 'GET', 404, 100)
        const successes = m.fetchCalls.filter(f => f.success)
        assert.equal(successes.length, 2)
        m.stop()
    })
})

/* ═══ Healing Event Tracking ═════════════════════════════ */

describe('Runtime: Healing Events', () => {
    it('tracks healing events', () => {
        const m = new Monitor()
        m.trackHealing({ type: 'retry', target: 'dbConnect', success: true })
        assert.equal(m.healingEvents.length, 1)
        assert.ok(m.healingEvents[0].timestamp)
        m.stop()
    })
})

/* ═══ Stats API ══════════════════════════════════════════ */

describe('Runtime: Stats', () => {
    it('returns stats with uptime', () => {
        const m = new Monitor()
        const s = m.stats()
        assert.ok(s.uptime >= 0)
        m.stop()
    })

    it('calculates function error rate', () => {
        const m = new Monitor()
        for (let i = 0; i < 10; i++) {
            const t = m.start('fn')
            if (i < 3) m.error('fn', t, new Error('err'))
            else m.success('fn', t)
        }
        const s = m.stats()
        assert.ok(s.functions.fn.error_rate > 0.2)
        assert.ok(s.functions.fn.error_rate < 0.4)
        m.stop()
    })

    it('calculates AI stats', () => {
        const m = new Monitor()
        m.trackAICall('ask', 'gpt-4', 500, 100, 0.01)
        m.trackAICall('think', 'gpt-4', 300, 80, 0.008)
        const s = m.stats()
        assert.equal(s.ai.total_calls, 2)
        assert.ok(s.ai.avg_latency > 0)
        m.stop()
    })

    it('calculates fetch success rate', () => {
        const m = new Monitor()
        m.trackFetch('/ok', 'GET', 200, 100)
        m.trackFetch('/fail', 'GET', 500, 100)
        const s = m.stats()
        assert.equal(s.fetch.success_rate, 0.5)
        m.stop()
    })

    it('includes memory info', () => {
        const m = new Monitor()
        const s = m.stats()
        assert.ok('memory' in s)
        assert.ok('current' in s.memory)
        m.stop()
    })

    it('includes healing info', () => {
        const m = new Monitor()
        m.trackHealing({ type: 'test' })
        const s = m.stats()
        assert.equal(s.healing.total_events, 1)
        m.stop()
    })
})

/* ═══ Dashboard ══════════════════════════════════════════ */

describe('Runtime: Dashboard', () => {
    it('dashboard() returns formatted string', () => {
        const m = new Monitor()
        const d = m.dashboard()
        assert.ok(typeof d === 'string')
        assert.ok(d.includes('Monitor Dashboard'))
        m.stop()
    })

    it('dashboard shows function stats', () => {
        const m = new Monitor()
        const t = m.start('testFn')
        m.success('testFn', t)
        const d = m.dashboard()
        assert.ok(d.includes('testFn'))
        m.stop()
    })

    it('dashboardHTML() returns valid HTML', () => {
        const m = new Monitor()
        const html = m.dashboardHTML()
        assert.ok(html.includes('<!DOCTYPE html>'))
        assert.ok(html.includes('Lume Monitor'))
        m.stop()
    })
})

/* ═══ Cleanup ════════════════════════════════════════════ */

describe('Runtime: Cleanup', () => {
    it('stop() clears memory interval', () => {
        const m = new Monitor()
        m.stop()
        assert.equal(m._memoryInterval, null)
    })

    it('stop() is idempotent', () => {
        const m = new Monitor()
        m.stop()
        m.stop() // should not throw
        assert.equal(m._memoryInterval, null)
    })
})
