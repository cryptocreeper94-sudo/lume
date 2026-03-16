/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Voice Input — Comprehensive Test Suite
 *  Tests the full voice transcription cleanup pipeline:
 *  homophones, fillers, stutter, punctuation, corrections,
 *  structural cues, variable naming, number words, pipeline.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    resolveHomophones,
    collapseRepeats,
    convertSpokenPunctuation,
    splitRunOnSentences,
    stripFillers,
    processCorrection,
    parseStructuralCue,
    extractVariableName,
    convertNumberWords,
    isPauseBlockBreak,
    processTranscription,
    transcriptionToLume,
} from '../../src/intent-resolver/voice-input.js'

/* ═══ Homophone Resolution ═══════════════════════════════ */

describe('Voice: resolveHomophones', () => {
    it('resolves "write" in file context', () => {
        const r = resolveHomophones('right the data to file')
        assert.ok(r.includes('write'))
    })

    it('preserves "right" in direction context', () => {
        const r = resolveHomophones('turn right direction')
        assert.ok(r.includes('right'))
    })

    it('resolves "new" in create context', () => {
        const r = resolveHomophones('knew a variable')
        assert.ok(r.includes('new'))
    })

    it('resolves "for" in loop context', () => {
        const r = resolveHomophones('four each item in list')
        assert.ok(r.includes('for'))
    })

    it('resolves "their" in possession context', () => {
        const r = resolveHomophones('get there email')
        assert.ok(r.includes('their'))
    })

    it('resolves "wait" in temporal context', () => {
        const r = resolveHomophones('weight five seconds')
        assert.ok(r.includes('wait'))
    })

    it('resolves "buy" in commerce context', () => {
        const r = resolveHomophones('by the product from store')
        assert.ok(r.includes('buy'))
    })

    it('resolves "see" in display context', () => {
        const r = resolveHomophones('sea if the screen is visible')
        assert.ok(r.includes('see'))
    })

    it('resolves "mail" in email context', () => {
        const r = resolveHomophones('male the notification to inbox')
        assert.ok(r.includes('mail'))
    })

    it('resolves "know" in understanding context', () => {
        const r = resolveHomophones('no if the check passes')
        assert.ok(r.includes('know'))
    })
})

/* ═══ Stutter Collapse ═══════════════════════════════════ */

describe('Voice: collapseRepeats', () => {
    it('collapses doubled words', () => {
        assert.equal(collapseRepeats('get get the name'), 'get the name')
    })

    it('collapses triple words', () => {
        assert.equal(collapseRepeats('the the the result'), 'the result')
    })

    it('does not collapse different words', () => {
        assert.equal(collapseRepeats('get the name'), 'get the name')
    })

    it('handles empty string', () => {
        assert.equal(collapseRepeats(''), '')
    })
})

/* ═══ Spoken Punctuation ═════════════════════════════════ */

describe('Voice: convertSpokenPunctuation', () => {
    it('converts "period" to .', () => {
        const r = convertSpokenPunctuation('save the data period')
        assert.ok(r.includes('.'))
        assert.ok(!r.includes('period'))
    })

    it('converts "comma" to ,', () => {
        const r = convertSpokenPunctuation('name comma age')
        assert.ok(r.includes(','))
    })

    it('converts "question mark" to ?', () => {
        const r = convertSpokenPunctuation('is it valid question mark')
        assert.ok(r.includes('?'))
    })

    it('converts "exclamation point" to !', () => {
        const r = convertSpokenPunctuation('error found exclamation point')
        assert.ok(r.includes('!'))
    })

    it('converts "colon" to :', () => {
        const r = convertSpokenPunctuation('if x is 5 colon')
        assert.ok(r.includes(':'))
    })

    it('converts "new line" to \\n', () => {
        const r = convertSpokenPunctuation('line one new line line two')
        assert.ok(r.includes('\n'))
    })

    it('converts "open paren" and "close paren"', () => {
        const r = convertSpokenPunctuation('call open paren x close paren')
        assert.ok(r.includes('('))
        assert.ok(r.includes(')'))
    })

    it('converts "quote"', () => {
        const r = convertSpokenPunctuation('say quote hello quote')
        assert.ok(r.includes('"'))
    })

    it('cleans up space before punctuation', () => {
        const r = convertSpokenPunctuation('hello period')
        assert.ok(!r.includes(' .'))
    })
})

/* ═══ Filler Stripping ═══════════════════════════════════ */

describe('Voice: stripFillers', () => {
    it('strips "um"', () => {
        const r = stripFillers('um get the data')
        assert.ok(!r.includes('um'))
    })

    it('strips "uh"', () => {
        const r = stripFillers('uh show the result')
        assert.ok(!r.includes('uh'))
    })

    it('strips "like"', () => {
        const r = stripFillers('like save it')
        assert.ok(!r.includes('like'))
    })

    it('strips "you know"', () => {
        const r = stripFillers('you know get the data')
        assert.ok(!r.toLowerCase().includes('you know'))
    })

    it('strips "basically"', () => {
        const r = stripFillers('basically fetch the results')
        assert.ok(!r.includes('basically'))
    })

    it('strips multiple fillers', () => {
        const r = stripFillers('um like get the uh data')
        assert.ok(!r.includes('um'))
        assert.ok(!r.includes('uh'))
    })

    it('preserves meaningful words', () => {
        const r = stripFillers('get the user name')
        assert.equal(r, 'get the user name')
    })
})

/* ═══ Run-On Sentence Splitting ══════════════════════════ */

describe('Voice: splitRunOnSentences', () => {
    it('splits on "and then"', () => {
        const r = splitRunOnSentences('get the name and then show it')
        assert.ok(r.length >= 2)
    })

    it('splits on "after that"', () => {
        const r = splitRunOnSentences('save the data after that show confirmation')
        assert.ok(r.length >= 2)
    })

    it('does not split single instruction', () => {
        const r = splitRunOnSentences('get the user name')
        assert.equal(r.length, 1)
    })

    it('returns original for empty input', () => {
        const r = splitRunOnSentences('')
        assert.ok(r.length >= 1)
    })
})

/* ═══ Correction Phrases ═════════════════════════════════ */

describe('Voice: processCorrection', () => {
    it('"scratch that" removes last line', () => {
        const r = processCorrection(['get user', 'show name'], 'scratch that')
        assert.equal(r.lines.length, 1)
        assert.equal(r.correction.type, 'undo')
    })

    it('"no I mean" replaces last line', () => {
        const r = processCorrection(['get user name'], 'no I mean get user email')
        assert.equal(r.correction.type, 'replace')
        assert.ok(r.lines[0].includes('email'))
    })

    it('"actually make that" replaces last line', () => {
        const r = processCorrection(['set x to 5'], 'actually make that set x to 10')
        assert.equal(r.correction.type, 'replace')
    })

    it('normal line adds without correction', () => {
        const r = processCorrection(['line 1'], 'line 2')
        assert.equal(r.lines.length, 2)
        assert.equal(r.correction, null)
    })
})

/* ═══ Structural Cues ════════════════════════════════════ */

describe('Voice: parseStructuralCue', () => {
    it('"if" → if_block', () => {
        const r = parseStructuralCue('if the user is logged in')
        assert.ok(r)
        assert.equal(r.type, 'if_block')
    })

    it('"when" → when_block', () => {
        const r = parseStructuralCue('when the button is clicked')
        assert.ok(r)
        assert.equal(r.type, 'when_block')
    })

    it('"for each" → foreach_block', () => {
        const r = parseStructuralCue('for each item in the list')
        assert.ok(r)
        assert.equal(r.type, 'foreach_block')
    })

    it('"done" → block_end', () => {
        const r = parseStructuralCue('done')
        assert.ok(r)
        assert.equal(r.type, 'block_end')
    })

    it('"end" → block_end', () => {
        const r = parseStructuralCue('end')
        assert.equal(r.type, 'block_end')
    })

    it('"then" → sequential', () => {
        const r = parseStructuralCue('then show the result')
        assert.ok(r)
        assert.equal(r.type, 'sequential')
    })

    it('returns null for normal text', () => {
        const r = parseStructuralCue('save the user data')
        assert.equal(r, null)
    })
})

/* ═══ Variable Naming ════════════════════════════════════ */

describe('Voice: extractVariableName', () => {
    it('"call it user count" → userCount', () => {
        const r = extractVariableName('call it user count')
        assert.ok(r)
        assert.equal(r.camelCase, 'userCount')
    })

    it('"name it total price" → totalPrice', () => {
        const r = extractVariableName('name it total price')
        assert.ok(r)
        assert.equal(r.camelCase, 'totalPrice')
    })

    it('"store as result" → result', () => {
        const r = extractVariableName('store as result')
        assert.ok(r)
        assert.equal(r.camelCase, 'result')
    })

    it('"save it in temp data" → tempData', () => {
        const r = extractVariableName('save it in temp data')
        assert.ok(r)
        assert.equal(r.camelCase, 'tempData')
    })

    it('returns null for no naming pattern', () => {
        const r = extractVariableName('get the user data')
        assert.equal(r, null)
    })
})

/* ═══ Number Word Conversion ═════════════════════════════ */

describe('Voice: convertNumberWords', () => {
    it('"five" → "5"', () => assert.ok(convertNumberWords('five items').includes('5')))
    it('"zero" → "0"', () => assert.ok(convertNumberWords('zero results').includes('0')))
    it('"ten" → "10"', () => assert.ok(convertNumberWords('ten users').includes('10')))
    it('"twenty three" → "23"', () => assert.ok(convertNumberWords('twenty three items').includes('23')))
    it('"a hundred" → "100"', () => assert.ok(convertNumberWords('a hundred records').includes('100')))
    it('"a thousand" → "1000"', () => assert.ok(convertNumberWords('a thousand rows').includes('1000')))
    it('"a dozen" → "12"', () => assert.ok(convertNumberWords('a dozen items').includes('12')))
    it('"a couple" → "2"', () => assert.ok(convertNumberWords('a couple things').includes('2')))
    it('"several" → "5"', () => assert.ok(convertNumberWords('several options').includes('5')))
})

/* ═══ Pause Detection ════════════════════════════════════ */

describe('Voice: isPauseBlockBreak', () => {
    it('long pause (3s) creates break', () => assert.equal(isPauseBlockBreak(3000), true))
    it('short pause (500ms) no break', () => assert.equal(isPauseBlockBreak(500), false))
    it('threshold pause (2000ms) creates break', () => assert.equal(isPauseBlockBreak(2000), true))
    it('custom threshold works', () => assert.equal(isPauseBlockBreak(1500, 1000), true))
})

/* ═══ Full Pipeline ══════════════════════════════════════ */

describe('Voice: processTranscription', () => {
    it('strips fillers and converts numbers', () => {
        const r = processTranscription('um get five items')
        assert.ok(!r.text.includes('um'))
        assert.ok(r.text.includes('5'))
    })

    it('tracks corrections made', () => {
        const r = processTranscription('um um like get the the data')
        assert.ok(r.corrections.length > 0)
    })

    it('detects structural cues', () => {
        const r = processTranscription('if the user is logged in')
        assert.ok(r.structuralCue)
        assert.equal(r.structuralCue.type, 'if_block')
    })

    it('extracts variable names', () => {
        const r = processTranscription('call it user name')
        assert.ok(r.variableName)
        assert.equal(r.variableName.camelCase, 'userName')
    })
})

/* ═══ Transcription to Lume ══════════════════════════════ */

describe('Voice: transcriptionToLume', () => {
    it('produces .lume source with mode header', () => {
        const r = transcriptionToLume(['get the user name', 'show it'])
        assert.ok(r.source.includes('mode:'))
    })

    it('handles corrections in stream', () => {
        const r = transcriptionToLume(['get user email', 'scratch that', 'get user name'])
        assert.ok(r.corrections.length > 0)
        assert.ok(r.source.includes('name'))
    })

    it('splits run-on sentences', () => {
        const r = transcriptionToLume(['get the name and then show it on screen'])
        assert.ok(r.source.split('\n').length >= 3) // mode + 2 instructions
    })

    it('handles empty input', () => {
        const r = transcriptionToLume([])
        assert.ok(r.source.includes('mode:'))
    })
})
