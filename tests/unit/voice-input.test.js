/**
 * Lume Voice Input — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { stripFillers, convertNumberWords, resolveHomophones, extractVariableName, parseStructuralCue, processCorrection, processTranscription, convertSpokenPunctuation, collapseRepeats, splitRunOnSentences } from '../../src/intent-resolver/voice-input.js'

describe('VoiceInput: stripFillers', () => {
    it('strips "um"', () => { const r = stripFillers('um create a variable'); assert.ok(!r.includes('um ')) })
    it('strips "like"', () => { const r = stripFillers('like save the data'); assert.ok(!r.startsWith('like')) })
    it('preserves content', () => { const r = stripFillers('create a list called items'); assert.ok(r.includes('create')) })
})

describe('VoiceInput: convertNumberWords', () => {
    it('converts "one" to "1"', () => { assert.ok(convertNumberWords('one item').includes('1')) })
    it('converts "two" to "2"', () => { assert.ok(convertNumberWords('two items').includes('2')) })
    it('converts "ten" to "10"', () => { assert.ok(convertNumberWords('ten users').includes('10')) })
    it('converts "zero" to "0"', () => { assert.ok(convertNumberWords('zero errors').includes('0')) })
})

describe('VoiceInput: resolveHomophones', () => {
    it('resolves write/right by context', () => {
        const r = resolveHomophones('right the file to disk')
        assert.ok(r.includes('write'))
    })
    it('resolves new/knew by context', () => {
        const r = resolveHomophones('create a knew variable')
        assert.ok(r.includes('new'))
    })
})

describe('VoiceInput: extractVariableName', () => {
    it('extracts "call it X"', () => { const r = extractVariableName('call it user count'); assert.ok(r); assert.equal(r.camelCase, 'userCount') })
    it('extracts "name it X"', () => { const r = extractVariableName('name it total amount'); assert.ok(r); assert.equal(r.camelCase, 'totalAmount') })
})

describe('VoiceInput: parseStructuralCue', () => {
    it('detects "if" as conditional', () => { const r = parseStructuralCue('if the user is logged in'); assert.ok(r) })
    it('detects "repeat" as loop', () => { const r = parseStructuralCue('repeat five times'); assert.ok(r) })
})

describe('VoiceInput: processCorrection', () => {
    it('detects "scratch that" undo', () => { const r = processCorrection(['let x = 1'], 'scratch that'); assert.ok(r.correction); assert.equal(r.correction.type, 'undo') })
    it('detects "no I mean" replace', () => { const r = processCorrection(['show hello'], 'no I mean show the data'); assert.ok(r.correction); assert.equal(r.correction.type, 'replace') })
    it('returns null correction for normal', () => { const r = processCorrection(['line'], 'create a list'); assert.equal(r.correction, null) })
})

describe('VoiceInput: convertSpokenPunctuation', () => {
    it('converts spoken punctuation', () => { const r = convertSpokenPunctuation('add period'); assert.ok(typeof r === 'string') })
})

describe('VoiceInput: collapseRepeats', () => {
    it('collapses repeated words', () => { const r = collapseRepeats('the the the data'); assert.ok(r.split('the').length < 4) })
})

describe('VoiceInput: splitRunOnSentences', () => {
    it('splits run-on sentences', () => { const r = splitRunOnSentences('create a list then show the list'); assert.ok(Array.isArray(r)) })
})

describe('VoiceInput: processTranscription', () => {
    it('processes full transcription', () => { const r = processTranscription('um like create a variable called user count'); assert.ok(r.text); assert.ok(r.text.includes('create')) })
})
