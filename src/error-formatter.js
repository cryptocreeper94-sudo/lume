/**
 * ═══════════════════════════════════════════════════════════
 *  LUME — Human-Readable Error Formatter
 *  Produces friendly error messages with context and suggestions
 * ═══════════════════════════════════════════════════════════
 */

/* ── Common mistyped keywords → suggestions ── */
const SUGGESTIONS = {
    // Typos
    'shwo': 'show', 'shw': 'show', 'displya': 'display', 'pritn': 'print',
    'funciton': 'function', 'fucntion': 'function', 'funtion': 'function',
    'reutrn': 'return', 'retrun': 'return', 'retrn': 'return',
    'whiel': 'while', 'wile': 'while', 'whle': 'while',
    'repat': 'repeat', 'repet': 'repeat', 'repaet': 'repeat',
    'defien': 'define', 'defin': 'define',
    'imprt': 'import', 'improt': 'import',
    'craete': 'create', 'crate': 'create', 'creat': 'create',
    'delte': 'delete', 'delet': 'delete',
    'udpate': 'update', 'upadte': 'update',
    'moniter': 'monitor', 'montor': 'monitor',
    // Common English → Lume corrections
    'function': 'to', 'def': 'to', 'fn': 'to', 'func': 'to',
    'var': 'let', 'const': 'let', 'int': 'let',
    'print': 'show', 'echo': 'show', 'console.log': 'show', 'puts': 'show',
    'for': 'for each', 'foreach': 'for each',
    'import': 'use', 'require': 'use', 'include': 'use',
    'export': 'expose',
    'try': 'try to', 'catch': 'or fail with',
}

/* ── Error categories with human-friendly messages ── */
const ERROR_TEMPLATES = {
    'UNEXPECTED_TOKEN': (err) => {
        const token = err.token || err.found || '?'
        const expected = err.expected || 'expression'
        return {
            title: 'Unexpected syntax',
            message: `Found "${token}" but expected ${expected}.`,
            hint: `Check your syntax near this token. Lume uses indentation-based blocks, not braces.`,
        }
    },
    'UNTERMINATED_STRING': () => ({
        title: 'Unterminated string',
        message: 'A string literal is missing its closing quote.',
        hint: 'Make sure every " has a matching ".',
    }),
    'UNKNOWN_KEYWORD': (err) => {
        const word = err.word || ''
        const suggestion = SUGGESTIONS[word.toLowerCase()]
        return {
            title: `Unknown keyword: "${word}"`,
            message: suggestion
                ? `Did you mean "${suggestion}"?`
                : `"${word}" is not a recognized Lume keyword.`,
            hint: suggestion
                ? `Replace "${word}" with "${suggestion}".`
                : 'Check the Lume docs for available keywords: let, show, to, if, for each, while, repeat, use, ask, monitor, heal, optimize, evolve.',
        }
    },
    'INDENT_ERROR': () => ({
        title: 'Indentation error',
        message: 'Inconsistent indentation detected.',
        hint: 'Lume uses 4-space indentation for blocks. Make sure all lines in a block are indented consistently.',
    }),
    'SECURITY_BLOCK': (err) => ({
        title: 'Security violation',
        message: err.message || 'Dangerous code detected.',
        hint: 'The Guardian security scanner blocked this code. See the security docs for allowed patterns.',
    }),
    'AI_UNAVAILABLE': () => ({
        title: 'AI resolver unavailable',
        message: 'No API key configured and this line couldn\'t be resolved by pattern matching alone.',
        hint: 'Set OPENAI_API_KEY or LUME_AI_KEY in your environment, or rephrase using simpler patterns (get X, show X, save X to Y, etc.).',
    }),
}

/**
 * Format an error into a human-readable message with context
 * @param {Error|Object} error - The error to format
 * @param {string} source - The original source code
 * @param {string} filename - The filename
 * @returns {string} Formatted error message
 */
export function formatError(error, source = '', filename = '<input>') {
    const lines = source.split('\n')
    const line = error.line || error.lineNumber || 0
    const col = error.column || error.col || 0
    const code = error.code || categorizeError(error.message || '')

    // Get the error template
    const template = ERROR_TEMPLATES[code]
    const info = template ? template(error) : {
        title: 'Compilation error',
        message: error.message || String(error),
        hint: null,
    }

    // Build the output
    let out = ''
    out += `\x1b[31m✗ ${info.title}\x1b[0m\n`
    out += `  \x1b[2m${filename}${line ? `:${line}` : ''}${col ? `:${col}` : ''}\x1b[0m\n\n`

    // Show source context (3 lines around the error)
    if (line > 0 && lines.length > 0) {
        const start = Math.max(0, line - 3)
        const end = Math.min(lines.length, line + 1)
        for (let i = start; i < end; i++) {
            const num = String(i + 1).padStart(4, ' ')
            const isErrorLine = (i + 1) === line
            if (isErrorLine) {
                out += `\x1b[31m ${num} │ ${lines[i]}\x1b[0m\n`
                if (col > 0) {
                    out += `      │ ${' '.repeat(col - 1)}\x1b[31m^\x1b[0m\n`
                }
            } else {
                out += `\x1b[2m ${num} │ ${lines[i]}\x1b[0m\n`
            }
        }
        out += '\n'
    }

    out += `  ${info.message}\n`

    if (info.hint) {
        out += `\n  \x1b[36m💡 ${info.hint}\x1b[0m\n`
    }

    // Suggest similar keywords if applicable
    const suggestion = findSuggestion(error.message || '')
    if (suggestion && !info.message.includes('Did you mean')) {
        out += `\n  \x1b[33m→ Did you mean: "${suggestion}"?\x1b[0m\n`
    }

    return out
}

/**
 * Try to categorize an error message into a known category
 */
function categorizeError(message) {
    const lower = message.toLowerCase()
    if (lower.includes('unexpected token') || lower.includes('unexpected')) return 'UNEXPECTED_TOKEN'
    if (lower.includes('unterminated string') || lower.includes('unterminated')) return 'UNTERMINATED_STRING'
    if (lower.includes('indent')) return 'INDENT_ERROR'
    if (lower.includes('security') || lower.includes('guardian') || lower.includes('blocked')) return 'SECURITY_BLOCK'
    if (lower.includes('api key') || lower.includes('ai unavailable')) return 'AI_UNAVAILABLE'
    return null
}

/**
 * Find a keyword suggestion from a typo in the error message
 */
function findSuggestion(message) {
    const words = message.split(/\s+/)
    for (const word of words) {
        const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
        if (SUGGESTIONS[clean]) return SUGGESTIONS[clean]
    }
    return null
}

/**
 * Get a "did you mean" suggestion for an unknown word
 * Uses Levenshtein distance
 */
export function didYouMean(input, candidates, maxDistance = 2) {
    const lower = input.toLowerCase()
    let best = null
    let bestDist = Infinity

    for (const candidate of candidates) {
        const dist = levenshtein(lower, candidate.toLowerCase())
        if (dist < bestDist && dist <= maxDistance) {
            best = candidate
            bestDist = dist
        }
    }

    return best
}

function levenshtein(a, b) {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let j = 1; j <= a.length; j++) {
        let prev = j
        for (let i = 1; i <= b.length; i++) {
            const val = a[j - 1] === b[i - 1] ? matrix[i - 1] : Math.min(matrix[i - 1], prev, matrix[i]) + 1
            matrix[i - 1] = prev
            prev = val
        }
        matrix[b.length] = prev
    }
    return matrix[b.length]
}
