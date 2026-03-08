/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Voice Input Processor
 *  Post-processes speech-to-text transcriptions before they
 *  enter the Intent Resolver pipeline.
 *
 *  Handles:
 *    - Structural cue parsing ("when", "if", "then" → block structure)
 *    - Verbal corrections ("scratch that", "no I mean")
 *    - Pause detection (gaps → block boundaries)
 *    - Variable naming from speech ("call it user count" → userCount)
 *    - Filler word stripping
 *    - Number word conversion
 * ═══════════════════════════════════════════════════════════
 */

/* ── Filler Words ────────────────────────────────────── */

const FILLER_WORDS = new Set([
    'um', 'uh', 'like', 'you know', 'basically', 'so', 'well', 'right',
    'okay', 'ok', 'let me think', 'hmm', 'er', 'ah', 'actually',
    'i guess', 'sort of', 'kind of', 'honestly', 'literally',
])

/**
 * Strip filler words from transcribed text.
 */
export function stripFillers(text) {
    let result = text

    // Multi-word fillers first (greedy)
    for (const filler of FILLER_WORDS) {
        if (filler.includes(' ')) {
            const regex = new RegExp(`\\b${filler}\\b[,.]?\\s*`, 'gi')
            result = result.replace(regex, '')
        }
    }

    // Single-word fillers
    const words = result.split(/\s+/)
    const filtered = words.filter(w => !FILLER_WORDS.has(w.toLowerCase().replace(/[,.]$/, '')))
    result = filtered.join(' ').trim()

    // Clean up double spaces
    return result.replace(/\s{2,}/g, ' ').trim()
}

/* ── Correction Phrases ──────────────────────────────── */

const CORRECTION_TRIGGERS = [
    { pattern: /\bno,?\s+I\s+mean\b/i, type: 'replace_last' },
    { pattern: /\bactually,?\s+make\s+that\b/i, type: 'replace_last' },
    { pattern: /\bwait,?\s*/i, type: 'replace_last' },
    { pattern: /\bsorry,?\s*/i, type: 'replace_last' },
    { pattern: /\bI\s+meant?\b/i, type: 'replace_last' },
    { pattern: /\bscratch\s+that\b/i, type: 'undo_last' },
    { pattern: /\bnot\s+that,?\s*/i, type: 'replace_last' },
    { pattern: /\bcorrection:?\s*/i, type: 'replace_last' },
    { pattern: /\bno,?\s+wait\b/i, type: 'replace_last' },
]

/**
 * Process correction phrases in a transcription stream.
 * Returns the corrected array of lines (some may be removed or replaced).
 *
 * @param {string[]} lines - Array of transcribed lines (accumulated)
 * @param {string} newLine - The new line being added
 * @returns {{ lines: string[], correction: { type: string, original: string, fixed: string } | null }}
 */
export function processCorrection(lines, newLine) {
    for (const trigger of CORRECTION_TRIGGERS) {
        const match = newLine.match(trigger.pattern)
        if (match) {
            if (trigger.type === 'undo_last') {
                // Remove the last line entirely
                const removed = lines.length > 0 ? lines[lines.length - 1] : ''
                return {
                    lines: lines.slice(0, -1),
                    correction: { type: 'undo', original: removed, fixed: '(removed)' },
                }
            }

            if (trigger.type === 'replace_last') {
                // Replace the last line with the text after the correction trigger
                const replacement = newLine.slice(match.index + match[0].length).trim()
                if (replacement && lines.length > 0) {
                    const original = lines[lines.length - 1]
                    const newLines = [...lines.slice(0, -1), replacement]
                    return {
                        lines: newLines,
                        correction: { type: 'replace', original, fixed: replacement },
                    }
                }
            }
        }
    }

    // No correction — add the line normally
    return { lines: [...lines, newLine], correction: null }
}

/* ── Structural Cue Parsing ──────────────────────────── */

const BLOCK_START_CUES = [
    { pattern: /^when\b/i, type: 'when_block' },
    { pattern: /^if\b/i, type: 'if_block' },
    { pattern: /^for\s+each\b/i, type: 'foreach_block' },
    { pattern: /^for\s+every\b/i, type: 'foreach_block' },
    { pattern: /^repeat\b/i, type: 'repeat_block' },
    { pattern: /^while\b/i, type: 'while_block' },
    { pattern: /^inside\s+that\b/i, type: 'nested_block' },
    { pattern: /^in\s+that\s+case\b/i, type: 'nested_block' },
]

const BLOCK_END_CUES = [
    /^end\b/i,
    /^that'?s\s+it\b/i,
    /^done\b/i,
    /^finished\b/i,
    /^stop\b/i,
    /^close\b/i,
]

const SEQUENTIAL_CUES = [
    /^then\b/i,
    /^next\b/i,
    /^after\s+that\b/i,
    /^once\s+that'?s?\s+done\b/i,
    /^and\s+then\b/i,
]

/**
 * Parse structural cues from a line.
 *
 * @param {string} line - A transcribed line
 * @returns {{ type: string, text: string, indent: number } | null}
 */
export function parseStructuralCue(line) {
    const trimmed = line.trim()

    // Check for block-ending cues
    for (const cue of BLOCK_END_CUES) {
        if (cue.test(trimmed)) {
            return { type: 'block_end', text: '', indent: -1 }
        }
    }

    // Check for block-starting cues
    for (const cue of BLOCK_START_CUES) {
        if (cue.pattern.test(trimmed)) {
            return { type: cue.type, text: trimmed, indent: 1 }
        }
    }

    // Check for sequential cues (remove the cue word, keep the instruction)
    for (const cue of SEQUENTIAL_CUES) {
        const match = trimmed.match(cue)
        if (match) {
            const instruction = trimmed.slice(match[0].length).trim()
            return { type: 'sequential', text: instruction || trimmed, indent: 0 }
        }
    }

    return null
}

/* ── Variable Naming ─────────────────────────────────── */

const NAMING_PATTERNS = [
    /call\s+it\s+(.+)/i,
    /name\s+it\s+(.+)/i,
    /and\s+call\s+it\s+(.+)/i,
    /store\s+(?:it\s+)?(?:as|in)\s+(.+)/i,
    /save\s+(?:it\s+)?(?:as|in)\s+(.+)/i,
    /put\s+(?:it\s+)?(?:in(?:to)?)\s+(.+)/i,
]

/**
 * Extract a variable name from spoken naming instructions.
 * "call it user count" → "userCount"
 * "name it total price" → "totalPrice"
 *
 * @param {string} text - Transcribed text
 * @returns {{ name: string, camelCase: string, remained: string } | null}
 */
export function extractVariableName(text) {
    for (const pattern of NAMING_PATTERNS) {
        const match = text.match(pattern)
        if (match) {
            const rawName = match[1].trim()
                .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
                .trim()

            // Convert to camelCase
            const words = rawName.split(/\s+/)
            const camelCase = words[0].toLowerCase() +
                words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')

            return {
                name: rawName,
                camelCase,
                remained: text.slice(0, match.index).trim(),
            }
        }
    }
    return null
}

/* ── Number Word Conversion ──────────────────────────── */

const NUMBER_WORDS = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
    'seventy': 70, 'eighty': 80, 'ninety': 90,
    'a hundred': 100, 'hundred': 100,
    'a thousand': 1000, 'thousand': 1000,
    'a million': 1000000, 'million': 1000000,
    'a couple': 2, 'a few': 3, 'several': 5,
    'a dozen': 12, 'half a dozen': 6,
}

/**
 * Convert number words to digits.
 * "five" → "5", "a hundred" → "100", "twenty three" → "23"
 *
 * @param {string} text - Input text
 * @returns {string} Text with number words replaced by digits
 */
export function convertNumberWords(text) {
    let result = text

    // Multi-word numbers first ("twenty three" → "23")
    // Handle compound numbers like "twenty three", "fifty five"
    const tens = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
    const ones = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

    for (const t of tens) {
        for (const o of ones) {
            const compound = `${t} ${o}`
            const value = NUMBER_WORDS[t] + NUMBER_WORDS[o]
            result = result.replace(new RegExp(`\\b${compound}\\b`, 'gi'), String(value))
        }
    }

    // Multi-word number phrases
    for (const [phrase, value] of Object.entries(NUMBER_WORDS)) {
        if (phrase.includes(' ')) {
            result = result.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), String(value))
        }
    }

    // Single number words
    for (const [word, value] of Object.entries(NUMBER_WORDS)) {
        if (!word.includes(' ')) {
            result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(value))
        }
    }

    return result
}

/* ── Pause Detection ─────────────────────────────────── */

/**
 * Detect if a pause boundary should create a new logical block.
 * In speech, a long pause (>2 seconds) typically indicates a new thought.
 *
 * @param {number} pauseDurationMs - Duration of silence in milliseconds
 * @param {number} [threshold=2000] - Minimum pause to trigger a block break
 * @returns {boolean}
 */
export function isPauseBlockBreak(pauseDurationMs, threshold = 2000) {
    return pauseDurationMs >= threshold
}

/* ── Full Transcription Pipeline ─────────────────────── */

/**
 * Process a raw transcription line through the voice cleanup pipeline.
 * Order: strip fillers → convert numbers → extract variable names → structural cues
 *
 * @param {string} rawLine - Raw transcribed text from speech engine
 * @returns {{ text: string, structuralCue: object|null, variableName: object|null, corrections: string[] }}
 */
export function processTranscription(rawLine) {
    const corrections = []

    // Step 1: Strip filler words
    let processed = stripFillers(rawLine)
    if (processed !== rawLine.trim()) {
        corrections.push(`Stripped fillers: "${rawLine.trim()}" → "${processed}"`)
    }

    // Step 2: Convert number words to digits
    const withNumbers = convertNumberWords(processed)
    if (withNumbers !== processed) {
        corrections.push(`Number conversion: "${processed}" → "${withNumbers}"`)
        processed = withNumbers
    }

    // Step 3: Check for variable naming
    const varName = extractVariableName(processed)

    // Step 4: Parse structural cues
    const structuralCue = parseStructuralCue(processed)

    return {
        text: processed,
        structuralCue,
        variableName: varName,
        corrections,
    }
}

/**
 * Convert a stream of voice transcription lines into a .lume file.
 *
 * @param {string[]} rawLines - Array of transcribed lines from speech engine
 * @param {object} [options] - { mode: 'english'|'natural', pauseThreshold: number }
 * @returns {{ source: string, corrections: Array<{ line: number, message: string }> }}
 */
export function transcriptionToLume(rawLines, options = {}) {
    const mode = options.mode || 'natural'
    const corrections = []

    // ── Pass 1: Accumulate lines with corrections applied ──
    let accumulatedLines = []

    for (let i = 0; i < rawLines.length; i++) {
        const rawLine = rawLines[i].trim()
        if (!rawLine) continue

        // Check for corrections FIRST
        const correctionResult = processCorrection(accumulatedLines, rawLine)
        if (correctionResult.correction) {
            corrections.push({ line: i + 1, message: `[voice-correct] ${correctionResult.correction.type}: "${correctionResult.correction.original}" → "${correctionResult.correction.fixed}"` })
            accumulatedLines = correctionResult.lines
            continue
        }
        accumulatedLines = correctionResult.lines
    }

    // ── Pass 2: Process accumulated lines through pipeline and build output ──
    const outputLines = [`mode: ${mode}`]
    let indentLevel = 0

    for (let i = 0; i < accumulatedLines.length; i++) {
        const line = accumulatedLines[i]

        // Process through pipeline (strip fillers, convert numbers, etc.)
        const processed = processTranscription(line)

        if (processed.corrections.length > 0) {
            corrections.push(...processed.corrections.map(c => ({ line: i + 1, message: `[voice-clean] ${c}` })))
        }

        // Handle structural cues
        if (processed.structuralCue) {
            if (processed.structuralCue.type === 'block_end') {
                indentLevel = Math.max(0, indentLevel - 1)
                continue
            }
            if (processed.structuralCue.indent > 0) {
                outputLines.push('  '.repeat(indentLevel) + processed.text)
                indentLevel++
                continue
            }
        }

        outputLines.push('  '.repeat(indentLevel) + processed.text)
    }

    return {
        source: outputLines.join('\n') + '\n',
        corrections,
    }
}
