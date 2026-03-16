/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Temporal Resolver — Comprehensive Test Suite
 *  Tests natural language time expression parsing:
 *  today, yesterday, tomorrow, relative periods, "N days ago",
 *  "in N hours", "at 5pm", "every Monday", and more.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveTemporal, hasTemporalExpression } from '../../src/intent-resolver/temporal-resolver.js'

// ══════════════════════════════════════
//  hasTemporalExpression
// ══════════════════════════════════════

describe('TemporalResolver: hasTemporalExpression', () => {
    it('detects "today"', () => {
        assert.ok(hasTemporalExpression('get today orders'))
    })
    it('detects "yesterday"', () => {
        assert.ok(hasTemporalExpression('show yesterday logs'))
    })
    it('detects "tomorrow"', () => {
        assert.ok(hasTemporalExpression('schedule for tomorrow'))
    })
    it('detects "last week"', () => {
        assert.ok(hasTemporalExpression('report from last week'))
    })
    it('detects "last month"', () => {
        assert.ok(hasTemporalExpression('sales last month'))
    })
    it('detects "this year"', () => {
        assert.ok(hasTemporalExpression('this year revenue'))
    })
    it('detects "next month"', () => {
        assert.ok(hasTemporalExpression('next month forecast'))
    })
    it('detects "N days ago"', () => {
        assert.ok(hasTemporalExpression('created 3 days ago'))
    })
    it('detects "in N hours"', () => {
        assert.ok(hasTemporalExpression('due in 2 hours'))
    })
    it('detects "at 5pm"', () => {
        assert.ok(hasTemporalExpression('meeting at 5pm'))
    })
    it('detects "every Monday"', () => {
        assert.ok(hasTemporalExpression('run every Monday'))
    })
    it('detects "right now"', () => {
        assert.ok(hasTemporalExpression('execute right now'))
    })
    it('returns false for non-temporal text', () => {
        assert.equal(hasTemporalExpression('get user data'), false)
    })
})

// ══════════════════════════════════════
//  resolveTemporal — Relative Days
// ══════════════════════════════════════

describe('TemporalResolver: Relative days', () => {
    it('resolves "today"', () => {
        const result = resolveTemporal('get today orders')
        assert.ok(result.hasTemporalRef)
        assert.equal(result.expressions.length, 1)
        assert.ok(result.expressions[0].resolved.includes('new Date'))
    })
    it('resolves "yesterday"', () => {
        const result = resolveTemporal('show yesterday logs')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('86400000'))
    })
    it('resolves "tomorrow"', () => {
        const result = resolveTemporal('schedule for tomorrow')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('+ 86400000'))
    })
})

// ══════════════════════════════════════
//  resolveTemporal — Relative Periods
// ══════════════════════════════════════

describe('TemporalResolver: Relative periods', () => {
    it('resolves "last week"', () => {
        const result = resolveTemporal('report from last week')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('7'))
    })
    it('resolves "last month"', () => {
        const result = resolveTemporal('sales from last month')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "last year"', () => {
        const result = resolveTemporal('last year total')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "this week"', () => {
        const result = resolveTemporal('this week meetings')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "this month"', () => {
        const result = resolveTemporal('this month expenses')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "next week"', () => {
        const result = resolveTemporal('next week plan')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "next month"', () => {
        const result = resolveTemporal('next month forecast')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "next year"', () => {
        const result = resolveTemporal('next year budget')
        assert.ok(result.hasTemporalRef)
    })
})

// ══════════════════════════════════════
//  resolveTemporal — N Units Ago
// ══════════════════════════════════════

describe('TemporalResolver: N units ago', () => {
    it('resolves "3 days ago"', () => {
        const result = resolveTemporal('created 3 days ago')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('3'))
    })
    it('resolves "2 weeks ago"', () => {
        const result = resolveTemporal('updated 2 weeks ago')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "1 hour ago"', () => {
        const result = resolveTemporal('posted 1 hour ago')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('3600000'))
    })
    it('resolves "30 minutes ago"', () => {
        const result = resolveTemporal('sent 30 minutes ago')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('60000'))
    })
    it('resolves "6 months ago"', () => {
        const result = resolveTemporal('started 6 months ago')
        assert.ok(result.hasTemporalRef)
    })
})

// ══════════════════════════════════════
//  resolveTemporal — In N Units
// ══════════════════════════════════════

describe('TemporalResolver: In N units', () => {
    it('resolves "in 5 days"', () => {
        const result = resolveTemporal('due in 5 days')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('+'))
    })
    it('resolves "in 2 hours"', () => {
        const result = resolveTemporal('expires in 2 hours')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "in 10 minutes"', () => {
        const result = resolveTemporal('remind in 10 minutes')
        assert.ok(result.hasTemporalRef)
    })
})

// ══════════════════════════════════════
//  resolveTemporal — At Time
// ══════════════════════════════════════

describe('TemporalResolver: At time', () => {
    it('resolves "at 5pm"', () => {
        const result = resolveTemporal('meeting at 5pm')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('setHours'))
    })
    it('resolves "at 9am"', () => {
        const result = resolveTemporal('start at 9am')
        assert.ok(result.hasTemporalRef)
    })
    it('resolves "at 3:30"', () => {
        const result = resolveTemporal('call at 3:30')
        assert.ok(result.hasTemporalRef)
    })
})

// ══════════════════════════════════════
//  resolveTemporal — Scheduling
// ══════════════════════════════════════

describe('TemporalResolver: Scheduling', () => {
    it('resolves "every Monday"', () => {
        const result = resolveTemporal('run every Monday')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('dayOfWeek'))
    })
    it('resolves "every Friday"', () => {
        const result = resolveTemporal('report every Friday')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('5'))
    })
})

// ══════════════════════════════════════
//  resolveTemporal — Right Now
// ══════════════════════════════════════

describe('TemporalResolver: Right now', () => {
    it('resolves "right now"', () => {
        const result = resolveTemporal('do it right now')
        assert.ok(result.hasTemporalRef)
        assert.ok(result.expressions[0].resolved.includes('new Date()'))
    })
    it('resolves "currently"', () => {
        const result = resolveTemporal('currently active users')
        assert.ok(result.hasTemporalRef)
    })
})

// ══════════════════════════════════════
//  resolveTemporal — No Match
// ══════════════════════════════════════

describe('TemporalResolver: No match', () => {
    it('returns no temporal for plain text', () => {
        const result = resolveTemporal('get user data')
        assert.equal(result.hasTemporalRef, false)
        assert.equal(result.expressions.length, 0)
    })
    it('preserves input text', () => {
        const result = resolveTemporal('hello world')
        assert.equal(result.input, 'hello world')
    })
})
