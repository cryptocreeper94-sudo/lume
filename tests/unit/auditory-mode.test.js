/**
 * ═══════════════════════════════════════════════════════════
 *  Auditory Mode — CHI §7.2 Test Suite
 *  Tests TTS text generation, voice approval interpretation,
 *  and AuditoryMode controller logic.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AuditoryMode, CLIAuditoryEngine } from '../../src/intent-resolver/auditory-mode.js'

// ══════════════════════════════════════
//  AuditoryMode Controller
// ══════════════════════════════════════

describe('AuditoryMode: Controller', () => {
    it('creates with default options', () => {
        const am = new AuditoryMode(null, { enabled: false })
        assert.ok(am)
        assert.equal(am.enabled, false)
    })

    it('auto-approves high confidence, low risk entries', async () => {
        // Disabled engine so it doesn't try to speak
        const am = new AuditoryMode(null, { enabled: false })
        const result = await am.speakAndApprove({
            line: 1, source: 'show greeting', intent: 'DISPLAY greeting',
            confidence: 0.99, risk: 'LOW', resolvedBy: 'ExactPatternMatch'
        })
        assert.ok(result.approved)
        assert.equal(result.action, 'auto')
    })

    it('returns approval when disabled', async () => {
        const am = new AuditoryMode(null, { enabled: false })
        const result = await am.speakAndApprove({
            line: 1, confidence: 0.5, risk: 'HIGH'
        })
        assert.ok(result.approved)
    })

    it('tracks interaction history', async () => {
        const am = new AuditoryMode(null, { enabled: false })
        await am.speakAndApprove({ line: 1, confidence: 0.99, risk: 'LOW', intent: 'test' })
        await am.speakAndApprove({ line: 2, confidence: 0.99, risk: 'LOW', intent: 'test2' })
        // When disabled, no history tracked
        assert.equal(am.history.length, 0)
    })
})

// ══════════════════════════════════════
//  Speech Formatting
// ══════════════════════════════════════

describe('AuditoryMode: Speech formatting', () => {
    it('formats speech with line number', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 5, intent: 'DISPLAY greeting', confidence: 0.95, risk: 'LOW'
        })
        assert.ok(speech.includes('Line 5'))
    })

    it('includes intent in speech', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 1, intent: 'DELETE all users', confidence: 0.9, risk: 'HIGH'
        })
        assert.ok(speech.includes('DELETE all users'))
    })

    it('includes warning for HIGH risk', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 1, intent: 'DELETE data', confidence: 0.9, risk: 'HIGH'
        })
        assert.ok(speech.includes('high risk'))
    })

    it('includes note for MEDIUM risk', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 1, intent: 'UPDATE config', confidence: 0.9, risk: 'MEDIUM'
        })
        assert.ok(speech.includes('moderate risk'))
    })

    it('includes confidence percentage', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 1, intent: 'test', confidence: 0.87, risk: 'LOW'
        })
        assert.ok(speech.includes('87 percent'))
    })

    it('includes filter when present', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 1, intent: 'QUERY users', filter: 'active = true', confidence: 0.95, risk: 'LOW'
        })
        assert.ok(speech.includes('active = true'))
    })

    it('asks for compilation approval', () => {
        const am = new AuditoryMode(null, { enabled: true })
        const speech = am._formatSpeech({
            line: 1, intent: 'test', confidence: 0.9, risk: 'LOW'
        })
        assert.ok(speech.includes('Shall I compile'))
    })
})

// ══════════════════════════════════════
//  Interaction Log
// ══════════════════════════════════════

describe('AuditoryMode: Interaction log', () => {
    it('getLog returns structured data', () => {
        const am = new AuditoryMode(null, { enabled: false })
        const log = am.getLog()
        assert.equal(log.interactions, 0)
        assert.equal(log.approvals, 0)
        assert.equal(log.rejections, 0)
        assert.ok(Array.isArray(log.history))
    })
})

// ══════════════════════════════════════
//  CLI Engine
// ══════════════════════════════════════

describe('AuditoryMode: CLIAuditoryEngine', () => {
    it('creates with default options', () => {
        const engine = new CLIAuditoryEngine({ platform: 'test' })
        assert.ok(engine)
        assert.equal(engine.enabled, true)
    })

    it('detects platform', () => {
        const engine = new CLIAuditoryEngine()
        assert.ok(['darwin', 'linux', 'win32', 'browser'].includes(engine.platform))
    })
})
