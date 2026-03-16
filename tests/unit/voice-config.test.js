/**
 * Lume Voice Config — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { loadVoiceConfig, matchesVoiceCommand } from '../../src/intent-resolver/voice-config.js'

describe('VoiceConfig: loadVoiceConfig', () => {
    it('returns defaults when no config file', () => {
        const config = loadVoiceConfig('/nonexistent/path')
        assert.ok(config.voice)
        assert.ok(config.voice.enabled)
    })
    it('defaults engine to system', () => { assert.equal(loadVoiceConfig('/nonexistent').voice.engine, 'system') })
    it('defaults language to en-US', () => { assert.equal(loadVoiceConfig('/nonexistent').voice.language, 'en-US') })
    it('has filler_words list', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.filler_words.length > 0) })
    it('has compile_commands', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.compile_commands.includes('compile')) })
    it('has cancel_commands', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.cancel_commands.includes('clear')) })
    it('has undo_commands', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.undo_commands.includes('undo')) })
    it('has readback_commands', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.readback_commands.includes('read it back')) })
    it('has pause_commands', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.pause_commands.includes('pause')) })
    it('has resume_commands', () => { assert.ok(loadVoiceConfig('/nonexistent').voice.resume_commands.includes('resume')) })
})

describe('VoiceConfig: matchesVoiceCommand', () => {
    it('matches exact command', () => { assert.ok(matchesVoiceCommand('compile', ['compile', 'done'])) })
    it('matches with trailing punctuation', () => { assert.ok(matchesVoiceCommand('compile!', ['compile'])) })
    it('matches ending with command', () => { assert.ok(matchesVoiceCommand('please compile', ['compile'])) })
    it('does not match partial', () => { assert.ok(!matchesVoiceCommand('compiler', ['compile'])) })
    it('case insensitive', () => { assert.ok(matchesVoiceCommand('COMPILE', ['compile'])) })
})
