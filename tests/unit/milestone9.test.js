/**
 * ═══════════════════════════════════════════════════════════
 *  Milestone 9: Voice-to-Code — Test Suite
 *  Tests voice transcription processing, structural cues,
 *  correction phrases, variable naming, and the full pipeline.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    stripFillers,
    processCorrection,
    parseStructuralCue,
    extractVariableName,
    convertNumberWords,
    isPauseBlockBreak,
    processTranscription,
    transcriptionToLume,
} from '../../src/intent-resolver/voice-input.js'

/* ═══ Filler Word Stripping ════════════════════════════ */

describe('M9: Filler Word Stripping', () => {
    it('removes single-word fillers', () => {
        assert.equal(stripFillers('um get the user name'), 'get the user name')
        assert.equal(stripFillers('uh show the result'), 'show the result')
    })

    it('removes multiple fillers', () => {
        const result = stripFillers('um like get the uh user name')
        assert.ok(!result.includes('um'))
        assert.ok(!result.includes('uh'))
        assert.ok(result.includes('get'))
        assert.ok(result.includes('user name'))
    })

    it('removes multi-word fillers', () => {
        const result = stripFillers('you know get the user name')
        assert.ok(!result.includes('you know'))
        assert.ok(result.includes('get'))
    })

    it('preserves meaningful content', () => {
        const result = stripFillers('create a new user with name John')
        assert.equal(result, 'create a new user with name John')
    })

    it('handles empty input', () => {
        assert.equal(stripFillers(''), '')
    })
})

/* ═══ Correction Phrases ═══════════════════════════════ */

describe('M9: Correction Phrases', () => {
    it('handles "scratch that" — removes last line', () => {
        const result = processCorrection(
            ['get the user name', 'show the result'],
            'scratch that'
        )
        assert.deepEqual(result.lines, ['get the user name'])
        assert.equal(result.correction.type, 'undo')
    })

    it('handles "no I mean" — replaces last line', () => {
        const result = processCorrection(
            ['get the user name'],
            'no I mean get the user email'
        )
        assert.deepEqual(result.lines, ['get the user email'])
        assert.equal(result.correction.type, 'replace')
    })

    it('handles "actually make that" — replaces last line', () => {
        const result = processCorrection(
            ['show the users'],
            'actually, make that show the admins'
        )
        assert.deepEqual(result.lines, ['show the admins'])
        assert.equal(result.correction.type, 'replace')
    })

    it('handles "wait" — replaces last line', () => {
        const result = processCorrection(
            ['delete the old data'],
            'wait, archive the old data'
        )
        assert.deepEqual(result.lines, ['archive the old data'])
        assert.equal(result.correction.type, 'replace')
    })

    it('returns lines unchanged if no correction detected', () => {
        const result = processCorrection(
            ['get the user name'],
            'show the result'
        )
        assert.deepEqual(result.lines, ['get the user name', 'show the result'])
        assert.equal(result.correction, null)
    })

    it('handles scratch that on empty list', () => {
        const result = processCorrection([], 'scratch that')
        assert.deepEqual(result.lines, [])
        assert.equal(result.correction.type, 'undo')
    })
})

/* ═══ Structural Cue Parsing ═══════════════════════════ */

describe('M9: Structural Cue Parsing', () => {
    it('detects "when" as block start', () => {
        const result = parseStructuralCue('when the user clicks the button')
        assert.ok(result)
        assert.equal(result.type, 'when_block')
        assert.equal(result.indent, 1)
    })

    it('detects "if" as block start', () => {
        const result = parseStructuralCue('if the user is logged in')
        assert.ok(result)
        assert.equal(result.type, 'if_block')
        assert.equal(result.indent, 1)
    })

    it('detects "for each" as block start', () => {
        const result = parseStructuralCue('for each item in the list')
        assert.ok(result)
        assert.equal(result.type, 'foreach_block')
    })

    it('detects "repeat" as block start', () => {
        const result = parseStructuralCue('repeat 5 times')
        assert.ok(result)
        assert.equal(result.type, 'repeat_block')
    })

    it('detects "end" as block end', () => {
        const result = parseStructuralCue('end')
        assert.ok(result)
        assert.equal(result.type, 'block_end')
        assert.equal(result.indent, -1)
    })

    it('detects "that\'s it" as block end', () => {
        const result = parseStructuralCue("that's it")
        assert.ok(result)
        assert.equal(result.type, 'block_end')
    })

    it('detects "done" as block end', () => {
        const result = parseStructuralCue('done')
        assert.ok(result)
        assert.equal(result.type, 'block_end')
    })

    it('detects "then" as sequential cue', () => {
        const result = parseStructuralCue('then save the data')
        assert.ok(result)
        assert.equal(result.type, 'sequential')
        assert.equal(result.text, 'save the data')
    })

    it('detects "after that" as sequential cue', () => {
        const result = parseStructuralCue('after that show the result')
        assert.ok(result)
        assert.equal(result.type, 'sequential')
    })

    it('returns null for normal statements', () => {
        const result = parseStructuralCue('get the user name')
        assert.equal(result, null)
    })
})

/* ═══ Variable Naming ══════════════════════════════════ */

describe('M9: Variable Naming', () => {
    it('extracts "call it user count"', () => {
        const result = extractVariableName('get all users and call it user count')
        assert.ok(result)
        assert.equal(result.camelCase, 'userCount')
    })

    it('extracts "name it total price"', () => {
        const result = extractVariableName('calculate the total and name it total price')
        assert.ok(result)
        assert.equal(result.camelCase, 'totalPrice')
    })

    it('extracts "store as result"', () => {
        const result = extractVariableName('get the data store as result')
        assert.ok(result)
        assert.equal(result.camelCase, 'result')
    })

    it('extracts "save it as file path"', () => {
        const result = extractVariableName('find the file save it as file path')
        assert.ok(result)
        assert.equal(result.camelCase, 'filePath')
    })

    it('handles single-word variable names', () => {
        const result = extractVariableName('get the count call it total')
        assert.ok(result)
        assert.equal(result.camelCase, 'total')
    })

    it('returns null if no naming pattern found', () => {
        const result = extractVariableName('get the user name')
        assert.equal(result, null)
    })
})

/* ═══ Number Word Conversion ═══════════════════════════ */

describe('M9: Number Word Conversion', () => {
    it('converts single number words', () => {
        assert.equal(convertNumberWords('repeat five times'), 'repeat 5 times')
        assert.equal(convertNumberWords('wait ten seconds'), 'wait 10 seconds')
    })

    it('converts compound numbers', () => {
        assert.equal(convertNumberWords('show twenty three results'), 'show 23 results')
    })

    it('converts "a hundred"', () => {
        assert.equal(convertNumberWords('get a hundred records'), 'get 100 records')
    })

    it('converts "a couple"', () => {
        assert.equal(convertNumberWords('wait a couple seconds'), 'wait 2 seconds')
    })

    it('converts "a dozen"', () => {
        assert.equal(convertNumberWords('create a dozen items'), 'create 12 items')
    })

    it('preserves non-number content', () => {
        assert.equal(convertNumberWords('get the user name'), 'get the user name')
    })
})

/* ═══ Pause Detection ══════════════════════════════════ */

describe('M9: Pause Detection', () => {
    it('detects long pause as block break', () => {
        assert.equal(isPauseBlockBreak(3000), true)
    })

    it('ignores short pauses', () => {
        assert.equal(isPauseBlockBreak(500), false)
        assert.equal(isPauseBlockBreak(1500), false)
    })

    it('uses custom threshold', () => {
        assert.equal(isPauseBlockBreak(1000, 1000), true)
        assert.equal(isPauseBlockBreak(999, 1000), false)
    })
})

/* ═══ Full Transcription Pipeline ══════════════════════ */

describe('M9: Full Transcription Pipeline', () => {
    it('processes a simple line through the pipeline', () => {
        const result = processTranscription('um get the user name')
        assert.equal(result.text, 'get the user name')
        assert.ok(result.corrections.length > 0)
    })

    it('detects structural cues in processed text', () => {
        const result = processTranscription('when the button is clicked')
        assert.ok(result.structuralCue)
        assert.equal(result.structuralCue.type, 'when_block')
    })

    it('detects variable naming in processed text', () => {
        const result = processTranscription('get all users call it user list')
        assert.ok(result.variableName)
        assert.equal(result.variableName.camelCase, 'userList')
    })

    it('converts number words in processed text', () => {
        const result = processTranscription('repeat five times')
        assert.ok(result.text.includes('5'))
    })
})

/* ═══ Transcription-to-Lume Conversion ═════════════════ */

describe('M9: Transcription-to-Lume Conversion', () => {
    it('converts simple lines to a .lume file', () => {
        const result = transcriptionToLume([
            'get the user name',
            'show the result',
        ])
        assert.ok(result.source.startsWith('mode: natural'))
        assert.ok(result.source.includes('get the user name'))
        assert.ok(result.source.includes('show the result'))
    })

    it('handles scratch that corrections', () => {
        const result = transcriptionToLume([
            'get the user name',
            'show the wrong result',
            'scratch that',
            'show the correct result',
        ])
        assert.ok(!result.source.includes('wrong result'))
        assert.ok(result.source.includes('correct result'))
        assert.ok(result.corrections.length > 0)
    })

    it('handles structural cues for indentation', () => {
        const result = transcriptionToLume([
            'if the user is logged in',
            'show the dashboard',
            'end',
        ])
        // Should have indentation for the "show" line
        assert.ok(result.source.includes('  show the dashboard'))
    })

    it('strips filler words from output', () => {
        const result = transcriptionToLume([
            'um get the like user name',
        ])
        assert.ok(!result.source.includes(' um '))
    })

    it('respects mode option', () => {
        const result = transcriptionToLume(['get the user name'], { mode: 'english' })
        assert.ok(result.source.startsWith('mode: english'))
    })

    it('handles empty lines', () => {
        const result = transcriptionToLume(['', 'get the user name', ''])
        assert.ok(result.source.includes('get the user name'))
    })

    it('replaces lines on "no I mean" corrections', () => {
        const result = transcriptionToLume([
            'delete the user',
            'no I mean deactivate the user',
        ])
        assert.ok(!result.source.includes('delete the user'))
        assert.ok(result.source.includes('deactivate the user'))
    })
})

/* ═══ Offline Mode ═════════════════════════════════════ */

describe('M9: Offline Mode', () => {
    it('Layer A pattern matching works without network', async () => {
        // This test verifies that the basic pipeline processes locally without AI calls
        const { resolveEnglishFile } = await import('../../src/intent-resolver/index.js')
        const source = 'mode: english\nget the user name'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        // Layer A should resolve without needing AI
        assert.ok(result.ast.length > 0, 'Should resolve via pattern matching (Layer A)')
        assert.equal(result.stats.aiCallsMade, 0, 'Should not need AI calls for simple patterns')
    })
})
