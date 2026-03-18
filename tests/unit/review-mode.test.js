/**
 * ═══════════════════════════════════════════════════════════
 *  Review Mode — CHI §8.3 Test Suite
 *  Tests review entry formatting, report generation,
 *  risk assessment, and auditory text generation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    formatReviewEntry, generateReviewReport,
    playgroundReviewData, auditoryReviewText
} from '../../src/intent-resolver/review-mode.js'

// ══════════════════════════════════════
//  Format Review Entry
// ══════════════════════════════════════

describe('ReviewMode: formatReviewEntry', () => {
    it('formats a ShowStatement node', () => {
        const entry = formatReviewEntry(
            { type: 'ShowStatement', target: 'greeting', line: 1, resolvedBy: 'layer_a_exact' },
            'show the greeting'
        )
        assert.equal(entry.line, 1)
        assert.equal(entry.source, 'show the greeting')
        assert.ok(entry.intent.includes('DISPLAY'))
        assert.equal(entry.risk, 'LOW')
        assert.equal(entry.resolvedBy, 'ExactPatternMatch')
    })

    it('flags DeleteOperation as HIGH risk', () => {
        const entry = formatReviewEntry(
            { type: 'DeleteOperation', target: 'users', line: 5, resolvedBy: 'layer_a_exact' },
            'delete all users'
        )
        assert.equal(entry.risk, 'HIGH')
        assert.ok(entry.intent.includes('DELETE'))
    })

    it('flags UpdateOperation as MEDIUM risk', () => {
        const entry = formatReviewEntry(
            { type: 'UpdateOperation', target: 'config', line: 3, resolvedBy: 'layer_a_fuzzy' },
            'update the config'
        )
        assert.equal(entry.risk, 'MEDIUM')
    })

    it('flags SendOperation as HIGH risk', () => {
        const entry = formatReviewEntry(
            { type: 'SendOperation', target: 'email', line: 7, resolvedBy: 'layer_a_exact' },
            'send an email'
        )
        assert.equal(entry.risk, 'HIGH')
    })

    it('marks VariableDeclaration as LOW risk', () => {
        const entry = formatReviewEntry(
            { type: 'VariableDeclaration', name: 'x', line: 1, resolvedBy: 'layer_a_exact' },
            'set x to 10'
        )
        assert.equal(entry.risk, 'LOW')
    })

    it('translates resolvedBy to human name', () => {
        const cases = [
            ['layer_a_exact', 'ExactPatternMatch'],
            ['layer_a_fuzzy', 'FuzzyPatternMatch'],
            ['layer_b_ai', 'AIResolver'],
            ['manifest_cache', 'ManifestCache'],
        ]
        for (const [raw, expected] of cases) {
            const entry = formatReviewEntry(
                { type: 'ShowStatement', line: 1, resolvedBy: raw },
                'test'
            )
            assert.equal(entry.resolvedBy, expected, `${raw} should map to ${expected}`)
        }
    })
})

// ══════════════════════════════════════
//  Generate Review Report
// ══════════════════════════════════════

describe('ReviewMode: generateReviewReport', () => {
    const ast = [
        { type: 'ShowStatement', target: 'greeting', line: 1, resolvedBy: 'layer_a_exact' },
        { type: 'DeleteOperation', target: 'users', line: 2, resolvedBy: 'layer_a_exact' },
        { type: 'VariableDeclaration', name: 'x', line: 3, resolvedBy: 'layer_a_fuzzy', similarity: 0.7 },
    ]
    const sourceLines = ['show the greeting', 'delete all users', 'set x to 10']

    it('generates correct entry count', () => {
        const report = generateReviewReport(ast, sourceLines, {})
        assert.equal(report.entries.length, 3)
    })

    it('identifies high-risk entries', () => {
        const report = generateReviewReport(ast, sourceLines, {})
        assert.equal(report.summary.highRiskCount, 1)  // DeleteOperation
    })

    it('flags needsAttention when high-risk exists', () => {
        const report = generateReviewReport(ast, sourceLines, {})
        assert.ok(report.needsAttention)
    })

    it('calculates average confidence', () => {
        const report = generateReviewReport(ast, sourceLines, {})
        assert.ok(report.summary.averageConfidence > 0)
        assert.ok(report.summary.averageConfidence <= 1)
    })
})

// ══════════════════════════════════════
//  Playground Review Data
// ══════════════════════════════════════

describe('ReviewMode: playgroundReviewData', () => {
    it('returns modal-ready structure', () => {
        const ast = [
            { type: 'ShowStatement', target: 'data', line: 1, resolvedBy: 'layer_a_exact' },
        ]
        const report = generateReviewReport(ast, ['show the data'], {})
        const data = playgroundReviewData(report)
        assert.equal(data.type, 'review_modal')
        assert.ok(data.title)
        assert.ok(data.entries.length > 0)
        assert.ok(data.actions.includes('approve_all'))
    })

    it('sets risk colors correctly', () => {
        const ast = [
            { type: 'DeleteOperation', target: 'x', line: 1, resolvedBy: 'layer_a_exact' },
        ]
        const report = generateReviewReport(ast, ['delete x'], {})
        const data = playgroundReviewData(report)
        assert.equal(data.entries[0].risk, 'HIGH')
        assert.equal(data.entries[0].riskColor, '#ff4444')
    })

    it('marks entries needing approval', () => {
        const ast = [
            { type: 'DeleteOperation', target: 'x', line: 1, resolvedBy: 'layer_a_exact' },
        ]
        const report = generateReviewReport(ast, ['delete x'], {})
        const data = playgroundReviewData(report)
        assert.ok(data.entries[0].needsApproval)
    })
})

// ══════════════════════════════════════
//  Auditory Review Text
// ══════════════════════════════════════

describe('ReviewMode: auditoryReviewText', () => {
    it('generates TTS-ready strings', () => {
        const ast = [
            { type: 'ShowStatement', target: 'greeting', line: 1, resolvedBy: 'layer_a_exact' },
        ]
        const report = generateReviewReport(ast, ['show the greeting'], {})
        const texts = auditoryReviewText(report)
        assert.ok(texts.length >= 2) // header + at least 1 entry
        assert.ok(texts[0].includes('Review Mode'))
    })

    it('includes warning for high-risk operations', () => {
        const ast = [
            { type: 'DeleteOperation', target: 'users', line: 1, resolvedBy: 'layer_a_exact' },
        ]
        const report = generateReviewReport(ast, ['delete all users'], {})
        const texts = auditoryReviewText(report)
        const deleteText = texts.find(t => t.includes('high risk'))
        assert.ok(deleteText, 'should include high risk warning')
    })

    it('includes confidence percentage', () => {
        const ast = [
            { type: 'ShowStatement', target: 'data', line: 1, resolvedBy: 'layer_a_exact' },
        ]
        const report = generateReviewReport(ast, ['show the data'], {})
        const texts = auditoryReviewText(report)
        const entryText = texts.find(t => t.includes('percent'))
        assert.ok(entryText, 'should include confidence percentage')
    })
})
