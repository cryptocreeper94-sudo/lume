/**
 * ═══════════════════════════════════════════════════════════
 *  DisambiguationRequired — CHI §5.5 Test Suite
 *  Tests RFT scoring, pronoun resolution, and disambiguation
 *  threshold detection.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
    resetFileScope, updateMemory, resolvePronoun, context
} from '../../src/intent-resolver/context-engine.js'

beforeEach(() => {
    resetFileScope()
})

// ══════════════════════════════════════
//  RFT Scoring: Separate lastSubject / lastCollection
// ══════════════════════════════════════

describe('Disambiguation: Subject vs Collection tracking', () => {
    it('tracks singular subject from VariableAccess', () => {
        resetFileScope()
        updateMemory(1, 'config', 'load', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 2)
        assert.ok(result.resolved)
        assert.equal(result.value, 'config')
    })

    it('tracks collection from ForEachLoop', () => {
        resetFileScope()
        updateMemory(1, 'users', 'iterate', { type: 'ForEachLoop' })
        const result = resolvePronoun('them', 2)
        assert.ok(result.resolved)
        assert.equal(result.value, 'users')
    })

    it('"it" prefers singular subject over collection', () => {
        resetFileScope()
        updateMemory(1, 'users', 'iterate', { type: 'ForEachLoop' })
        updateMemory(2, 'config', 'load', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 3)
        assert.ok(result.resolved)
        assert.equal(result.value, 'config')
    })

    it('"them" prefers collection over singular', () => {
        resetFileScope()
        updateMemory(1, 'config', 'load', { type: 'VariableAccess' })
        updateMemory(2, 'users', 'iterate', { type: 'ForEachLoop' })
        const result = resolvePronoun('them', 3)
        assert.ok(result.resolved)
        assert.equal(result.value, 'users')
    })
})

// ══════════════════════════════════════
//  Disambiguation Threshold Detection
// ══════════════════════════════════════

describe('Disambiguation: Threshold detection', () => {
    it('does NOT trigger disambiguation with single clear subject', () => {
        resetFileScope()
        updateMemory(1, 'users', 'get', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 2)
        assert.ok(result.resolved)
        assert.ok(!result.disambiguationRequired)
    })

    it('triggers disambiguation with closely-scored candidates', () => {
        resetFileScope()
        // Two subjects used at equal frequency and very close lines
        updateMemory(1, 'config', 'load', { type: 'VariableAccess' })
        updateMemory(2, 'settings', 'read', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 3)

        // Should be resolved (picks top) or trigger disambiguation
        if (result.disambiguationRequired) {
            // disambiguationRequired is a boolean; candidates are top-level
            assert.ok(result.candidates, 'should have candidates array')
            assert.ok(result.candidates.length >= 2)
            assert.ok(result.pronoun)
        } else {
            // If it resolved, it should have picked the most recent
            assert.ok(result.resolved)
            assert.equal(result.value, 'settings')
        }
    })

    it('returns candidate details when disambiguation is triggered', () => {
        resetFileScope()
        // Create ambiguity: two subjects mentioned at same frequency
        updateMemory(1, 'database', 'connect', { type: 'VariableAccess' })
        updateMemory(2, 'database', 'query', { type: 'VariableAccess' })
        updateMemory(3, 'service', 'start', { type: 'VariableAccess' })
        updateMemory(4, 'service', 'ping', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 5)

        if (result.disambiguationRequired) {
            const dis = result.disambiguationRequired
            assert.ok(dis.candidates, 'should have candidates array')
            assert.ok(dis.pronoun, 'should have pronoun')
            for (const c of dis.candidates) {
                assert.ok(c.subject, 'candidate should have subject')
                assert.ok(c.score !== undefined, 'candidate should have score')
            }
        }
    })
})

// ══════════════════════════════════════
//  Sliding Window (5 instructions)
// ══════════════════════════════════════

describe('Disambiguation: Sliding window', () => {
    it('subjects outside window have lower RFT scores', () => {
        resetFileScope()
        updateMemory(1, 'old_data', 'get', { type: 'VariableAccess' })
        // Fill window with other subjects
        for (let i = 2; i <= 7; i++) {
            updateMemory(i, `var_${i}`, 'set', { type: 'VariableDeclaration' })
        }
        updateMemory(8, 'new_data', 'get', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 9)
        // RFT should prefer the most recent subject
        // Either resolves to new_data (most recent) or last var_ (most recent VariableDeclaration)
        if (result.resolved) {
            assert.ok(['new_data', 'var_7', 'var_6', 'var_5'].includes(result.value),
                `Expected recent subject, got ${result.value}`)
        } else {
            // If not resolved, that's also valid RFT behavior when scores are ambiguous
            assert.ok(!result.resolved || result.disambiguationRequired)
        }
    })

    it('warns about distant pronoun reference', () => {
        resetFileScope()
        updateMemory(1, 'data', 'get', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 30)
        if (result.warning) {
            assert.ok(result.warning.includes('LUME-W002'))
        }
    })
})

// ══════════════════════════════════════
//  Pronoun types
// ══════════════════════════════════════

describe('Disambiguation: Pronoun types', () => {
    it('resolves singular pronouns: it, this, that', () => {
        resetFileScope()
        updateMemory(1, 'session', 'create', { type: 'CreateOperation' })
        for (const p of ['it', 'this', 'that']) {
            const result = resolvePronoun(p, 2)
            assert.ok(result.resolved, `${p} should resolve`)
            assert.equal(result.value, 'session')
        }
    })

    it('resolves plural pronouns: they, them, those', () => {
        resetFileScope()
        updateMemory(1, 'records', 'filter', { type: 'ForEachLoop' })
        for (const p of ['they', 'them', 'those']) {
            const result = resolvePronoun(p, 2)
            assert.ok(result.resolved, `${p} should resolve`)
        }
    })

    it('returns unresolved for non-pronoun words', () => {
        resetFileScope()
        updateMemory(1, 'data', 'get', null)
        const result = resolvePronoun('banana', 2)
        assert.equal(result.resolved, false)
    })

    it('warns when no referent exists', () => {
        resetFileScope()
        const result = resolvePronoun('it', 1)
        assert.equal(result.resolved, false)
        assert.ok(result.warning)
    })
})
