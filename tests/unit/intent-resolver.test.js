/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Intent-Resolver — Comprehensive Test Suite
 *  Tests the NLP pipeline: fuzzy-matcher, auto-correct,
 *  canonicalizer, and sentence-splitter modules.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    levenshtein, similarity, extractKeyWords, wordBagSimilarity,
    soundex, phoneticMatch, correctWord, correctSentence,
    findBestMatch, commonMisspellings, contractions
} from '../../src/intent-resolver/fuzzy-matcher.js'
import { autoCorrect, formatCorrections } from '../../src/intent-resolver/auto-correct.js'
import {
    canonicalize, canonicalizeFile, isCanonical,
    VERB_SYNONYMS, NOUN_SYNONYMS
} from '../../src/intent-resolver/canonicalizer.js'
import { splitSentence } from '../../src/intent-resolver/sentence-splitter.js'

// ══════════════════════════════════════
//  FUZZY MATCHER
// ══════════════════════════════════════

// ── Levenshtein Distance ─────────────

describe('FuzzyMatcher: levenshtein', () => {
    it('returns 0 for identical strings', () => {
        assert.equal(levenshtein('hello', 'hello'), 0)
    })
    it('returns string length for empty vs non-empty', () => {
        assert.equal(levenshtein('', 'hello'), 5)
        assert.equal(levenshtein('hello', ''), 5)
    })
    it('returns 0 for two empty strings', () => {
        assert.equal(levenshtein('', ''), 0)
    })
    it('correctly measures single substitution', () => {
        assert.equal(levenshtein('cat', 'bat'), 1)
    })
    it('correctly measures single insertion', () => {
        assert.equal(levenshtein('cat', 'cats'), 1)
    })
    it('correctly measures single deletion', () => {
        assert.equal(levenshtein('cats', 'cat'), 1)
    })
    it('handles completely different strings', () => {
        assert.ok(levenshtein('abc', 'xyz') >= 3)
    })
    it('handles transpositions', () => {
        assert.equal(levenshtein('ab', 'ba'), 2) // Levenshtein (not Damerau)
    })
    it('handles multi-character differences', () => {
        assert.equal(levenshtein('kitten', 'sitting'), 3)
    })
})

// ── Similarity ───────────────────────

describe('FuzzyMatcher: similarity', () => {
    it('returns 1.0 for identical strings', () => {
        assert.equal(similarity('hello', 'hello'), 1.0)
    })
    it('returns 1.0 for two empty strings', () => {
        assert.equal(similarity('', ''), 1.0)
    })
    it('is case insensitive', () => {
        assert.equal(similarity('Hello', 'hello'), 1.0)
    })
    it('returns value between 0 and 1', () => {
        const score = similarity('cat', 'car')
        assert.ok(score >= 0 && score <= 1)
    })
    it('higher for similar words', () => {
        const catCar = similarity('cat', 'car')
        const catXyz = similarity('cat', 'xyz')
        assert.ok(catCar > catXyz)
    })
    it('returns 0 for maximally different equal-length strings', () => {
        const score = similarity('abc', 'xyz')
        assert.equal(score, 0)
    })
})

// ── Soundex ──────────────────────────

describe('FuzzyMatcher: soundex', () => {
    it('returns a 4-character code', () => {
        assert.equal(soundex('Robert').length, 4)
    })
    it('same code for phonetically similar words', () => {
        assert.equal(soundex('Robert'), soundex('Rupert'))
    })
    it('first character is uppercase letter', () => {
        const code = soundex('hello')
        assert.ok(/^[A-Z]/.test(code))
    })
    it('works for single character', () => {
        const code = soundex('A')
        assert.equal(code, 'A000')
    })
    it('pads with zeros', () => {
        const code = soundex('Bo')
        assert.ok(code.endsWith('0'))
    })
})

describe('FuzzyMatcher: phoneticMatch', () => {
    it('matches phonetically similar names', () => {
        assert.ok(phoneticMatch('Robert', 'Rupert'))
    })
    it('does not match different sounds', () => {
        assert.equal(phoneticMatch('Robert', 'Alice'), false)
    })
})

// ── Extract Key Words ────────────────

describe('FuzzyMatcher: extractKeyWords', () => {
    it('removes stop words', () => {
        const words = extractKeyWords('the cat is on the mat')
        assert.ok(!words.includes('the'))
        assert.ok(!words.includes('is'))
        assert.ok(!words.includes('on'))
    })
    it('keeps content words', () => {
        const words = extractKeyWords('the cat is on the mat')
        assert.ok(words.includes('cat'))
        assert.ok(words.includes('mat'))
    })
    it('lowercases all words', () => {
        const words = extractKeyWords('HELLO World')
        assert.ok(words.includes('hello'))
        assert.ok(words.includes('world'))
    })
    it('removes punctuation', () => {
        const words = extractKeyWords('hello, world!')
        assert.ok(words.includes('hello'))
        assert.ok(words.includes('world'))
    })
    it('filters single-character words', () => {
        const words = extractKeyWords('I a x y z')
        assert.equal(words.length, 0)
    })
    it('handles empty input', () => {
        assert.deepEqual(extractKeyWords(''), [])
    })
})

// ── Word-Bag Similarity ──────────────

describe('FuzzyMatcher: wordBagSimilarity', () => {
    it('returns 1.0 for identical sentences', () => {
        assert.equal(wordBagSimilarity('get the user', 'get the user'), 1.0)
    })
    it('returns 0 for no shared keywords', () => {
        assert.equal(wordBagSimilarity('fetch report', 'delete account'), 0)
    })
    it('returns score for partial overlap', () => {
        const score = wordBagSimilarity('get user name', 'get user email')
        assert.ok(score > 0 && score < 1)
    })
    it('handles empty strings', () => {
        assert.equal(wordBagSimilarity('', 'hello'), 0)
    })
})

// ── Correct Word ─────────────────────

describe('FuzzyMatcher: correctWord', () => {
    it('corrects known misspelling', () => {
        const r = correctWord('fucntion')
        assert.equal(r.corrected, 'function')
        assert.ok(r.wasCorrected)
    })
    it('corrects contraction', () => {
        const r = correctWord('dont')
        assert.equal(r.corrected, "don't")
        assert.ok(r.wasCorrected)
    })
    it('returns original for correct word', () => {
        const r = correctWord('function')
        assert.equal(r.corrected, 'function')
        assert.equal(r.wasCorrected, false)
    })
    it('handles retrun → return', () => {
        assert.equal(correctWord('retrun').corrected, 'return')
    })
    it('handles varibale → variable', () => {
        assert.equal(correctWord('varibale').corrected, 'variable')
    })
    it('handles databse → database', () => {
        assert.equal(correctWord('databse').corrected, 'database')
    })
    it('handles shwo → show', () => {
        assert.equal(correctWord('shwo').corrected, 'show')
    })
})

// ── Correct Sentence ─────────────────

describe('FuzzyMatcher: correctSentence', () => {
    it('corrects multiple misspellings', () => {
        const r = correctSentence('retrun the varibale')
        assert.ok(r.corrected.includes('return'))
        assert.ok(r.corrected.includes('variable'))
    })
    it('preserves spacing', () => {
        const r = correctSentence('hello world')
        assert.equal(r.corrected, 'hello world')
    })
    it('returns corrections array', () => {
        const r = correctSentence('shwo the databse')
        assert.ok(r.corrections.length >= 2)
    })
})

// ── Find Best Match ──────────────────

describe('FuzzyMatcher: findBestMatch', () => {
    it('finds exact match', () => {
        const r = findBestMatch('hello', ['hello', 'world', 'foo'])
        assert.ok(r)
        assert.equal(r.match, 'hello')
    })
    it('finds close match', () => {
        const r = findBestMatch('helo', ['hello', 'world', 'foo'], 0.7)
        assert.ok(r)
        assert.equal(r.match, 'hello')
    })
    it('returns null when no match above threshold', () => {
        const r = findBestMatch('xyz', ['hello', 'world'], 0.9)
        assert.equal(r, null)
    })
    it('handles empty reference list', () => {
        const r = findBestMatch('hello', [])
        assert.equal(r, null)
    })
})

// ── Misspelling Dictionary Completeness ─

describe('FuzzyMatcher: Dictionaries', () => {
    it('has 40+ common misspellings', () => {
        assert.ok(Object.keys(commonMisspellings).length >= 40)
    })
    it('has 15+ contractions', () => {
        assert.ok(Object.keys(contractions).length >= 15)
    })
})

// ══════════════════════════════════════
//  AUTO-CORRECT
// ══════════════════════════════════════

describe('AutoCorrect: autoCorrect', () => {
    it('returns corrected text', () => {
        const r = autoCorrect('hello')
        assert.ok(r.corrected)
        assert.equal(typeof r.corrected, 'string')
    })
    it('returns corrections array', () => {
        const r = autoCorrect('hello')
        assert.ok(Array.isArray(r.corrections))
    })
    it('returns wasModified flag', () => {
        const r = autoCorrect('hello')
        assert.equal(typeof r.wasModified, 'boolean')
    })
    it('skips correction with noAutocorrect', () => {
        const r = autoCorrect('um hello um', {}, { noAutocorrect: true })
        assert.equal(r.corrected, 'um hello um')
        assert.equal(r.wasModified, false)
    })
    it('strips filler words (um, uh)', () => {
        const r = autoCorrect('um get the um data')
        assert.ok(!r.corrected.includes('um'))
    })
    it('handles self-corrections (no, I mean)', () => {
        const r = autoCorrect('get the old thing no, get the new thing')
        assert.ok(r.corrected.includes('new'))
    })
    it('converts number words', () => {
        const r = autoCorrect('set timeout to five')
        assert.ok(r.corrected.includes('5'))
    })
    it('applies voice phonetic corrections', () => {
        const r = autoCorrect('use sequel database')
        assert.ok(r.corrected.includes('SQL'))
    })
    it('context-corrects near-match variable names', () => {
        const r = autoCorrect('get the usr data', { variables: ['user'] })
        // 'usr' is in commonMisspellings → 'user', so should be corrected
        assert.ok(r.corrected.includes('user'))
    })
})

describe('AutoCorrect: formatCorrections', () => {
    it('formats correction with line number', () => {
        const corrections = [{ type: 'filler', original: 'um', fixed: '' }]
        const lines = formatCorrections(corrections, 5)
        assert.ok(lines[0].includes('Line 5'))
    })
    it('includes type in output', () => {
        const corrections = [{ type: 'spelling', original: 'shwo', fixed: 'show' }]
        const lines = formatCorrections(corrections, 1)
        assert.ok(lines[0].includes('spelling'))
    })
    it('handles empty corrections', () => {
        const lines = formatCorrections([], 1)
        assert.equal(lines.length, 0)
    })
})

// ══════════════════════════════════════
//  CANONICALIZER
// ══════════════════════════════════════

describe('Canonicalizer: canonicalize', () => {
    it('returns canonical text', () => {
        const r = canonicalize('fetch the data')
        assert.ok(r.canonical)
        assert.equal(typeof r.canonical, 'string')
    })
    it('returns changes array', () => {
        const r = canonicalize('hello')
        assert.ok(Array.isArray(r.changes))
    })
    it('has wasModified flag', () => {
        const r = canonicalize('hello')
        assert.equal(typeof r.wasModified, 'boolean')
    })
    it('maps "grab" → "get"', () => {
        const r = canonicalize('grab the report')
        assert.ok(r.canonical.includes('get'))
    })
    it('maps "display" → "show"', () => {
        const r = canonicalize('display the results')
        assert.ok(r.canonical.includes('show'))
    })
    it('maps "store" → "save"', () => {
        const r = canonicalize('store the data')
        assert.ok(r.canonical.includes('save'))
    })
    it('maps "remove" → "delete"', () => {
        const r = canonicalize('remove the user')
        assert.ok(r.canonical.includes('delete'))
    })
    it('maps "make" → "create"', () => {
        const r = canonicalize('make a new user')
        assert.ok(r.canonical.includes('create'))
    })
    it('maps "modify" → "update"', () => {
        const r = canonicalize('modify the record')
        assert.ok(r.canonical.includes('update'))
    })
    it('maps "fire" → "send"', () => {
        const r = canonicalize('fire an event')
        assert.ok(r.canonical.includes('send'))
    })
    it('maps "arrange" → "sort"', () => {
        const r = canonicalize('arrange by date')
        assert.ok(r.canonical.includes('sort'))
    })
    it('removes filler phrases ("just")', () => {
        const r = canonicalize('just get the data')
        assert.ok(!r.canonical.includes('just'))
    })
    it('removes filler phrases ("please")', () => {
        const r = canonicalize('please show the results')
        assert.ok(!r.canonical.match(/\bplease\b/i))
    })
    it('normalizes isn\'t → is not', () => {
        const r = canonicalize("value isn't valid")
        assert.ok(r.canonical.includes('is not'))
    })
    it('normalizes can\'t → cannot', () => {
        const r = canonicalize("can't connect")
        assert.ok(r.canonical.includes('cannot'))
    })
    it('skips comments', () => {
        const r = canonicalize('// this is a comment')
        assert.equal(r.wasModified, false)
    })
    it('skips mode declarations', () => {
        const r = canonicalize('mode: english')
        assert.equal(r.wasModified, false)
    })
    it('skips empty lines', () => {
        const r = canonicalize('')
        assert.equal(r.wasModified, false)
    })
    it('maps noun synonyms (db → database)', () => {
        const r = canonicalize('connect to db')
        assert.ok(r.canonical.includes('database'))
    })
})

describe('Canonicalizer: Synonym Tables', () => {
    it('VERB_SYNONYMS has 30+ entries', () => {
        assert.ok(Object.keys(VERB_SYNONYMS).length >= 30)
    })
    it('NOUN_SYNONYMS has entries', () => {
        assert.ok(Object.keys(NOUN_SYNONYMS).length > 0)
    })
})

describe('Canonicalizer: canonicalizeFile', () => {
    it('processes multiple lines', () => {
        const r = canonicalizeFile('grab data\ndisplay it')
        assert.ok(r.lines.length >= 2)
    })
    it('returns summary with counts', () => {
        const r = canonicalizeFile('grab data\nshow it')
        assert.ok(r.summary.total >= 2)
        assert.ok(r.summary.modified >= 1)
    })
    it('returns combined output', () => {
        const r = canonicalizeFile('grab data')
        assert.equal(typeof r.output, 'string')
    })
})

describe('Canonicalizer: isCanonical', () => {
    it('returns true for already canonical text', () => {
        assert.ok(isCanonical('// comment'))
    })
    it('returns false for non-canonical text', () => {
        assert.equal(isCanonical('grab the data'), false)
    })
})

// ══════════════════════════════════════
//  SENTENCE SPLITTER
// ══════════════════════════════════════

describe('SentenceSplitter: splitSentence', () => {
    it('returns array', () => {
        const r = splitSentence('hello')
        assert.ok(Array.isArray(r))
    })
    it('single operation has relation "root"', () => {
        const r = splitSentence('get the data')
        assert.equal(r.length, 1)
        assert.equal(r[0].relation, 'root')
    })
    it('splits on "then"', () => {
        const r = splitSentence('get the data then show it')
        assert.ok(r.length >= 2)
        assert.equal(r[0].relation, 'root')
        assert.equal(r[1].relation, 'sequential')
    })
    it('splits on "after that"', () => {
        const r = splitSentence('fetch results after that filter them')
        assert.ok(r.length >= 2)
    })
    it('splits on "also" (parallel)', () => {
        const r = splitSentence('get users also get orders')
        assert.ok(r.length >= 2)
        if (r.length >= 2) assert.equal(r[1].relation, 'parallel')
    })
    it('splits on "meanwhile" (parallel)', () => {
        const r = splitSentence('get data meanwhile show loading')
        assert.ok(r.length >= 2)
    })
    it('splits verb and verb ("get X and show Y")', () => {
        const r = splitSentence('get the user and show their name')
        assert.ok(r.length >= 2)
    })
    it('does NOT split noun and noun ("get name and email")', () => {
        const r = splitSentence('get the name and email')
        assert.equal(r.length, 1)
    })
    it('splits comma + verb pattern', () => {
        const r = splitSentence('fetch the data, filter it, sort by date')
        assert.ok(r.length >= 2)
    })
    it('does NOT split comma + noun', () => {
        const r = splitSentence('get name, email, and phone')
        // "email" is not a verb, so should not split
        assert.equal(r.length, 1)
    })
    it('handles empty input', () => {
        const r = splitSentence('')
        assert.deepEqual(r, [])
    })
    it('assigns correct index numbers', () => {
        const r = splitSentence('get data then show it then save it')
        for (let i = 0; i < r.length; i++) {
            assert.equal(r[i].index, i)
        }
    })
    it('splits on "finally"', () => {
        const r = splitSentence('get the data finally save it')
        assert.ok(r.length >= 2)
    })
})
