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

/* ── Homophone Resolver ─────────────────────────────── */

const HOMOPHONE_RULES = [
    // [pair, contextKeywords → chosen word]
    {
        words: ['write', 'right'], rules: [
            { context: /\b(file|data|database|disk|storage|output|save|log|record|store)\b/i, pick: 'write' },
            { context: /\b(correct|direction|side|left|turn|way|answer)\b/i, pick: 'right' },
        ], default: 'write'
    },
    {
        words: ['new', 'knew'], rules: [
            { context: /\b(create|make|build|generate|add|variable|function|project|file|item|instance)\b/i, pick: 'new' },
            { context: /\b(already|before|past|yesterday|remember)\b/i, pick: 'knew' },
        ], default: 'new'
    },
    {
        words: ['for', 'four'], rules: [
            { context: /\b(each|every|loop|iterate|repeat|while|range|item|element)\b/i, pick: 'for' },
            { context: /\b(number|count|times|buttons|items|elements|users|\d)\b/i, pick: 'four' },
        ], default: 'for'
    },
    {
        words: ['their', 'there', 'they\'re'], rules: [
            { context: /\b(name|email|data|profile|account|password|setting|age)\b/i, pick: 'their' },
            { context: /\b(is|are|exists?|goes|put|place|location)\b/i, pick: 'there' },
        ], default: 'their'
    },
    {
        words: ['two', 'to', 'too'], rules: [
            { context: /\b(number|count|times|buttons|items|pair|both|\d)\b/i, pick: 'two' },
            { context: /\b(much|many|large|big|small|also|excessive)\b/i, pick: 'too' },
        ], default: 'to'
    },
    {
        words: ['no', 'know'], rules: [
            { context: /\b(not|don't|never|none|stop|cancel|deny|reject|false)\b/i, pick: 'no' },
            { context: /\b(if|whether|check|about|understand|tell|find|determine)\b/i, pick: 'know' },
        ], default: 'no'
    },
    {
        words: ['by', 'buy'], rules: [
            { context: /\b(multiply|divide|sort|filter|group|name|date|id)\b/i, pick: 'by' },
            { context: /\b(purchase|shop|cart|order|price|pay|payment|store|product)\b/i, pick: 'buy' },
        ], default: 'by'
    },
    {
        words: ['sea', 'see'], rules: [
            { context: /\b(ocean|water|beach|wave|fish|ship|marine)\b/i, pick: 'sea' },
            { context: /\b(show|display|view|look|check|screen|visible|if|whether)\b/i, pick: 'see' },
        ], default: 'see'
    },
    {
        words: ['mail', 'male'], rules: [
            { context: /\b(email|send|inbox|message|notification|letter|smtp)\b/i, pick: 'mail' },
            { context: /\b(gender|sex|female|person|user|profile|demographic)\b/i, pick: 'male' },
        ], default: 'mail'
    },
    {
        words: ['wait', 'weight'], rules: [
            { context: /\b(second|minute|pause|delay|timeout|sleep|hold|until)\b/i, pick: 'wait' },
            { context: /\b(heavy|light|measure|kg|lb|mass|load|scale|body)\b/i, pick: 'weight' },
        ], default: 'wait'
    },
]

/**
 * Resolve homophones using surrounding context.
 * Runs BEFORE auto-correct.
 */
export function resolveHomophones(text) {
    let result = text
    for (const rule of HOMOPHONE_RULES) {
        for (const word of rule.words) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi')
            if (!regex.test(result)) continue
            // Determine which word fits context
            let picked = rule.default
            for (const r of rule.rules) {
                if (r.context.test(result)) { picked = r.pick; break }
            }
            // Replace all instances of any variant with the picked word
            for (const w of rule.words) {
                if (w !== picked) {
                    result = result.replace(new RegExp(`\\b${w}\\b`, 'gi'), picked)
                }
            }
        }
    }
    return result
}

/* ── Stutter / Repeat Collapse ──────────────────────── */

/**
 * Collapse repeated/stuttered words: "get get the name" → "get the name"
 */
export function collapseRepeats(text) {
    return text.replace(/\b(\w+)(\s+\1)+\b/gi, '$1')
}

/* ── Spoken Punctuation Handler ─────────────────────── */

const SPOKEN_PUNCTUATION = [
    { pattern: /\b(?:period|full stop|dot)\b/gi, replacement: '.' },
    { pattern: /\bnew line\b/gi, replacement: '\n' },
    { pattern: /\bcomma\b/gi, replacement: ',' },
    { pattern: /\bquestion mark\b/gi, replacement: '?' },
    { pattern: /\bexclamation (?:mark|point)\b/gi, replacement: '!' },
    { pattern: /\bcolon\b/gi, replacement: ':' },
    { pattern: /\bsemicolon\b/gi, replacement: ';' },
    { pattern: /\bopen (?:paren|parenthesis|bracket)\b/gi, replacement: '(' },
    { pattern: /\bclose (?:paren|parenthesis|bracket)\b/gi, replacement: ')' },
    { pattern: /\bopen quote\b/gi, replacement: '"' },
    { pattern: /\bclose quote\b/gi, replacement: '"' },
    { pattern: /\bquote\b/gi, replacement: '"' },
]

/**
 * Convert spoken punctuation to actual characters.
 * "save the data period" → "save the data."
 */
export function convertSpokenPunctuation(text) {
    let result = text
    for (const { pattern, replacement } of SPOKEN_PUNCTUATION) {
        result = result.replace(pattern, replacement)
    }
    // Clean up space before punctuation
    result = result.replace(/\s+([.,;:!?)])/g, '$1')
    return result.trim()
}

/* ── Run-on Sentence Splitter ───────────────────────── */

const ACTION_VERBS = /\b(get|fetch|show|display|create|make|build|save|store|delete|remove|send|update|set|add|sort|filter|find|load|read|write|push|pull|check|validate|toggle|reset|swap|return|throw|navigate|redirect|log|print|render|insert|append|modify|patch|increment|decrement|repeat|monitor|track|alert|notify|try)\b/i

const CONJUNCTION_SPLITTERS = [
    /\band then\b/i,
    /\band also\b/i,
    /\bafter that\b/i,
    /\bthen\b/i,
    /\bnext\b/i,
    /\balso\b/i,
]

/**
 * Split run-on sentences into separate instructions.
 * "get the users name and then show it on the screen" → ["get the users name", "show it on the screen"]
 */
export function splitRunOnSentences(text) {
    let segments = [text]

    // Split on conjunction phrases first
    for (const conj of CONJUNCTION_SPLITTERS) {
        const newSegments = []
        for (const seg of segments) {
            const parts = seg.split(conj).map(s => s.trim()).filter(Boolean)
            newSegments.push(...parts)
        }
        segments = newSegments
    }

    // Within remaining segments, detect action verb boundaries
    // "get the name show it on screen" → ["get the name", "show it on screen"]
    const finalSegments = []
    for (const seg of segments) {
        const words = seg.split(/\s+/)
        let current = []
        let foundFirstVerb = false

        for (let i = 0; i < words.length; i++) {
            const isVerb = ACTION_VERBS.test(words[i])
            if (isVerb && foundFirstVerb && current.length >= 2) {
                // New action verb after we already have content → split
                finalSegments.push(current.join(' '))
                current = [words[i]]
            } else {
                if (isVerb) foundFirstVerb = true
                current.push(words[i])
            }
        }
        if (current.length > 0) finalSegments.push(current.join(' '))
    }

    return finalSegments.length > 0 ? finalSegments : [text]
}

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

    // Step 1: Collapse repeated/stuttered words
    let processed = collapseRepeats(rawLine.trim())
    if (processed !== rawLine.trim()) {
        corrections.push(`Stutter collapse: "${rawLine.trim()}" → "${processed}"`)
    }

    // Step 2: Convert spoken punctuation
    const withPunct = convertSpokenPunctuation(processed)
    if (withPunct !== processed) {
        corrections.push(`Spoken punctuation: "${processed}" → "${withPunct}"`)
        processed = withPunct
    }

    // Step 3: Strip filler words
    const withoutFillers = stripFillers(processed)
    if (withoutFillers !== processed) {
        corrections.push(`Stripped fillers: "${processed}" → "${withoutFillers}"`)
        processed = withoutFillers
    }

    // Step 4: Resolve homophones
    const withHomophones = resolveHomophones(processed)
    if (withHomophones !== processed) {
        corrections.push(`Homophone fix: "${processed}" → "${withHomophones}"`)
        processed = withHomophones
    }

    // Step 5: Convert number words to digits
    const withNumbers = convertNumberWords(processed)
    if (withNumbers !== processed) {
        corrections.push(`Number conversion: "${processed}" → "${withNumbers}"`)
        processed = withNumbers
    }

    // Step 6: Check for variable naming
    const varName = extractVariableName(processed)

    // Step 7: Parse structural cues
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

    // ── Pass 0: Split run-on sentences into separate lines ──
    const expandedLines = []
    for (const raw of rawLines) {
        const trimmed = raw.trim()
        if (!trimmed) continue
        const split = splitRunOnSentences(trimmed)
        if (split.length > 1) {
            corrections.push({ line: expandedLines.length + 1, message: `[voice-split] Run-on split into ${split.length} instructions` })
        }
        expandedLines.push(...split)
    }

    // ── Pass 1: Accumulate lines with corrections applied ──
    let accumulatedLines = []

    for (let i = 0; i < expandedLines.length; i++) {
        const rawLine = expandedLines[i].trim()
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
