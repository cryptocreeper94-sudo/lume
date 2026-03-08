/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Auto-Correct Layer
 *  Spell check + context-aware correction + voice cleanup
 *  Runs BEFORE the Tolerance Chain
 * ═══════════════════════════════════════════════════════════
 */

import { correctSentence } from './fuzzy-matcher.js'

/* ── Filler Words (stripped from voice input) ────────── */
const FILLER_WORDS = new Set([
    'um', 'uh', 'like', 'you know', 'basically', 'so', 'well', 'right',
    'okay', 'ok', 'let me think', 'hmm', 'er', 'ah', 'actually',
    'i mean', 'sort of', 'kind of', 'i guess', 'you see',
])

/* ── Self-Correction Phrases ─────────────────────────── */
const CORRECTION_TRIGGERS = [
    'no,', 'no ', 'i mean', 'actually,', 'actually ', 'wait,', 'wait ',
    'sorry,', 'sorry ', 'i meant', 'scratch that', 'not that',
    'correction', 'let me rephrase',
]

/* ── Number Word Map ─────────────────────────────────── */
const NUMBER_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    hundred: 100, thousand: 1000, million: 1000000,
    a: 1, couple: 2, few: 3, several: 5, dozen: 12,
}

/* ── Voice Phonetic Corrections ──────────────────────── */
const VOICE_CORRECTIONS = {
    'sequel': 'SQL', 'es queue el': 'SQL',
    'jason': 'JSON', 'jay son': 'JSON',
    'h t t p': 'HTTP', 'h t m l': 'HTML',
    'u r l': 'URL', 'a p i': 'API',
    'c s s': 'CSS', 'j s': 'JS',
    'no js': 'Node.js', 'node js': 'Node.js',
    'react js': 'React', 'vue js': 'Vue',
}

/**
 * Main auto-correct pipeline.
 * Returns { corrected, corrections[], wasModified }
 */
export function autoCorrect(input, context = {}, options = {}) {
    if (options.noAutocorrect) return { corrected: input, corrections: [], wasModified: false }

    const corrections = []
    let text = input

    // Step 1: Strip filler words
    text = stripFillers(text, corrections)

    // Step 2: Handle self-corrections ("no, I mean...")
    text = handleSelfCorrections(text, corrections)

    // Step 3: Voice phonetic corrections
    text = applyVoiceCorrections(text, corrections)

    // Step 4: Number word → digit conversion (in numeric contexts)
    text = convertNumberWords(text, corrections)

    // Step 5: Misspelling dictionary + contraction normalization
    const { corrected: spellChecked, corrections: spellCorrections } = correctSentence(text)
    text = spellChecked
    corrections.push(...spellCorrections.map(c => ({ type: 'spelling', original: c.original, fixed: c.fixed })))

    // Step 6: Context-aware corrections (uses project data if available)
    if (context.variables || context.tables || context.functions) {
        text = contextCorrect(text, context, corrections)
    }

    return {
        corrected: text.trim(),
        corrections,
        wasModified: corrections.length > 0,
    }
}

/* ── Step 1: Strip Filler Words ──────────────────────── */
function stripFillers(text, corrections) {
    let result = text
    for (const filler of FILLER_WORDS) {
        const regex = new RegExp(`\\b${filler}\\b,?\\s*`, 'gi')
        if (regex.test(result)) {
            corrections.push({ type: 'filler', original: filler, fixed: '' })
            result = result.replace(regex, ' ')
        }
    }
    return result.replace(/\s+/g, ' ').trim()
}

/* ── Step 2: Handle Self-Corrections ─────────────────── */
function handleSelfCorrections(text, corrections) {
    for (const trigger of CORRECTION_TRIGGERS) {
        const idx = text.toLowerCase().lastIndexOf(trigger)
        if (idx > 0) {
            const before = text.substring(0, idx).trim()
            const after = text.substring(idx + trigger.length).trim()
            if (after.length > 0) {
                corrections.push({ type: 'self-correction', original: before, fixed: after })
                return after
            }
        }
    }
    return text
}

/* ── Step 3: Voice Phonetic Corrections ──────────────── */
function applyVoiceCorrections(text, corrections) {
    let result = text
    for (const [spoken, correct] of Object.entries(VOICE_CORRECTIONS)) {
        const regex = new RegExp(`\\b${spoken}\\b`, 'gi')
        if (regex.test(result)) {
            corrections.push({ type: 'voice', original: spoken, fixed: correct })
            result = result.replace(regex, correct)
        }
    }
    return result
}

/* ── Step 4: Number Word Conversion ──────────────────── */
function convertNumberWords(text, corrections) {
    return text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|couple|few|several|dozen)\b/gi, (match) => {
        const num = NUMBER_WORDS[match.toLowerCase()]
        if (num !== undefined) {
            corrections.push({ type: 'number', original: match, fixed: String(num) })
            return String(num)
        }
        return match
    })
}

/* ── Step 6: Context-Aware Corrections ───────────────── */
function contextCorrect(text, context, corrections) {
    const words = text.split(/\s+/)
    const knownNames = [
        ...(context.variables || []),
        ...(context.tables || []),
        ...(context.functions || []),
    ]

    return words.map(word => {
        const clean = word.replace(/[^a-zA-Z0-9_]/g, '')
        if (!clean || clean.length < 3) return word

        // Check if the word is close to a known project name
        for (const name of knownNames) {
            if (clean.toLowerCase() === name.toLowerCase()) return word
            const distance = levenshteinLight(clean.toLowerCase(), name.toLowerCase())
            const sim = 1 - distance / Math.max(clean.length, name.length)
            if (sim >= 0.75 && sim < 1) {
                corrections.push({ type: 'context', original: clean, fixed: name })
                return word.replace(clean, name)
            }
        }
        return word
    }).join(' ')
}

/* ── Lightweight Levenshtein (inline for context correct) */
function levenshteinLight(a, b) {
    const la = a.length, lb = b.length
    if (la === 0) return lb
    if (lb === 0) return la
    const dp = Array.from({ length: la + 1 }, (_, i) => {
        const row = new Array(lb + 1)
        row[0] = i
        return row
    })
    for (let j = 1; j <= lb; j++) dp[0][j] = j
    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1, dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            )
        }
    }
    return dp[la][lb]
}

/**
 * Format corrections for compiler output
 */
export function formatCorrections(corrections, lineNum) {
    return corrections.map(c =>
        `[auto-correct] Line ${lineNum}: "${c.original}" -> "${c.fixed}" (${c.type})`
    )
}
