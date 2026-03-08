/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Sentence Splitter
 *  Detects sentence boundaries in multi-operation input
 *  Splits compound sentences into atomic operations
 * ═══════════════════════════════════════════════════════════
 */

/* ── Connectors that create splits ────────────────────── */
const SEQUENTIAL_CONNECTORS = [
    /,?\s+then\s+/i,
    /,?\s+after that\s+/i,
    /,?\s+next\s+/i,
    /,?\s+once that'?s done,?\s+/i,
    /,?\s+finally\s+/i,
    /,?\s+afterwards?\s+/i,
]

const PARALLEL_CONNECTORS = [
    /,?\s+also\s+/i,
    /,?\s+and also\s+/i,
    /,?\s+meanwhile\s+/i,
    /,?\s+at the same time\s+/i,
    /,?\s+simultaneously\s+/i,
    /,?\s+in parallel\s+/i,
    /,?\s+while that'?s happening\s+/i,
]

/* ── Verbs (for detecting "and" between two verbs) ───── */
const VERB_STARTERS = new Set([
    'get', 'fetch', 'grab', 'pull', 'find', 'read', 'load', 'retrieve',
    'show', 'display', 'render', 'print', 'output', 'log',
    'save', 'store', 'persist', 'write', 'keep', 'insert',
    'delete', 'remove', 'destroy', 'erase', 'clear', 'wipe',
    'create', 'make', 'build', 'generate', 'add',
    'update', 'modify', 'change', 'edit', 'set',
    'send', 'fire', 'dispatch', 'post', 'push',
    'sort', 'filter', 'select', 'pick', 'choose',
    'connect', 'link', 'hook', 'wire',
    'wait', 'pause', 'delay', 'sleep',
    'redirect', 'navigate', 'go',
    'return', 'give', 'send',
    'check', 'verify', 'validate', 'test',
    'ask', 'think', 'analyze',
    'monitor', 'track', 'watch', 'observe',
    'heal', 'fix', 'repair', 'recover', 'retry',
    'optimize', 'improve', 'speed',
    'evolve', 'adapt', 'learn',
    'import', 'export', 'expose', 'bring',
    'hide', 'prevent', 'block', 'stop',
])

/**
 * @typedef {Object} SplitResult
 * @property {string} text - The atomic operation text
 * @property {string} relation - 'root' | 'sequential' | 'parallel'
 * @property {number} index - Order in the original sentence
 */

/**
 * Split a compound sentence into atomic operations.
 * "get the user and show their name" → 2 ops
 * "get the user's name and email" → 1 op (noun conjunction)
 * @param {string} input
 * @returns {SplitResult[]}
 */
export function splitSentence(input) {
    const trimmed = input.trim()
    if (!trimmed) return []

    // Step 1: Check for sequential connectors ("then", "after that", etc.)
    for (const regex of SEQUENTIAL_CONNECTORS) {
        if (regex.test(trimmed)) {
            const parts = trimmed.split(regex).filter(Boolean).map(s => s.trim()).filter(Boolean)
            if (parts.length > 1) {
                return parts.map((text, i) => ({
                    text,
                    relation: i === 0 ? 'root' : 'sequential',
                    index: i,
                }))
            }
        }
    }

    // Step 2: Check for parallel connectors ("also", "meanwhile", etc.)
    for (const regex of PARALLEL_CONNECTORS) {
        if (regex.test(trimmed)) {
            const parts = trimmed.split(regex).filter(Boolean).map(s => s.trim()).filter(Boolean)
            if (parts.length > 1) {
                return parts.map((text, i) => ({
                    text,
                    relation: i === 0 ? 'root' : 'parallel',
                    index: i,
                }))
            }
        }
    }

    // Step 3: Check for "and" between two VERBS (split) vs "and" between NOUNS (don't split)
    const andSplit = splitOnVerbAnd(trimmed)
    if (andSplit.length > 1) return andSplit

    // Step 4: Check for comma + verb pattern ("fetch the data, filter it, sort by date")
    const commaSplit = splitOnCommaVerb(trimmed)
    if (commaSplit.length > 1) return commaSplit

    // No split needed — return as single operation
    return [{ text: trimmed, relation: 'root', index: 0 }]
}

/**
 * Split on "and" ONLY when it appears between two verbs.
 * "get the user and show their name" → splits (verb AND verb)
 * "get the name and email" → does NOT split (noun AND noun)
 */
function splitOnVerbAnd(input) {
    const andIndex = input.toLowerCase().indexOf(' and ')
    if (andIndex === -1) return [input]

    const before = input.substring(0, andIndex).trim()
    const after = input.substring(andIndex + 5).trim()

    // Check if the word after "and" starts with a verb
    const afterFirstWord = after.split(/\s+/)[0].toLowerCase()
    if (VERB_STARTERS.has(afterFirstWord)) {
        return [
            { text: before, relation: 'root', index: 0 },
            { text: after, relation: 'sequential', index: 1 },
        ]
    }

    // "and" is between nouns — don't split
    return [input]
}

/**
 * Split on commas when followed by a verb.
 * "fetch the data, filter it, sort by date" → 3 ops
 */
function splitOnCommaVerb(input) {
    const parts = input.split(/,\s*/)
    if (parts.length <= 1) return [input]

    // Check if at least the second part starts with a verb
    const secondFirst = parts[1].trim().split(/\s+/)[0].toLowerCase()
    if (!VERB_STARTERS.has(secondFirst)) return [input]

    return parts.map((text, i) => ({
        text: text.trim(),
        relation: i === 0 ? 'root' : 'sequential',
        index: i,
    })).filter(p => p.text.length > 0)
}
