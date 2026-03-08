/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GAP 5 — Hint Annotations
 *  Parses performance-control phrases attached to instructions.
 *  "using X", "with X", "for X duration", "limited to X"
 * ═══════════════════════════════════════════════════════════
 */

/* ── Hint Extraction Patterns ── */
const HINT_PATTERNS = [
    // Algorithm: "using quicksort", "using binary search"
    { category: 'algorithm', pattern: /\s+using\s+(quicksort|mergesort|heapsort|bubblesort|insertion\s*sort|binary\s*search|linear\s*search|radix\s*sort|timsort|bfs|dfs)/i, extract: 1 },

    // Caching: "cache for 5 minutes", "cache indefinitely", "don't cache"
    { category: 'cache', pattern: /\s+cache\s+(?:the\s+result\s+)?(?:for\s+)?(\d+)\s*(seconds?|minutes?|hours?|days?|ms|milliseconds?)/i, extract: (m) => ({ duration: parseInt(m[1]), unit: m[2].replace(/s$/, '') }) },
    { category: 'cache', pattern: /\s+cache\s+(?:the\s+result\s+)?indefinitely/i, extract: () => ({ duration: -1, unit: 'forever' }) },
    { category: 'cache', pattern: /\s+(?:don't|do not)\s+cache/i, extract: () => ({ disabled: true }) },

    // Parallelism: "in parallel", "with 4 workers", "concurrently"
    { category: 'parallel', pattern: /\s+in\s+parallel/i, extract: () => ({ enabled: true }) },
    { category: 'parallel', pattern: /\s+with\s+(\d+)\s+workers?/i, extract: (m) => ({ enabled: true, workers: parseInt(m[1]) }) },
    { category: 'parallel', pattern: /\s+concurrently/i, extract: () => ({ enabled: true }) },

    // Limits: "limit to 100", "first 50 only", "at most 1000"
    { category: 'limit', pattern: /\s+(?:limit(?:ed)?\s+to|at\s+most)\s+(\d+)\s*(?:results?|records?|items?|rows?)?/i, extract: 1 },
    { category: 'limit', pattern: /\s+first\s+(\d+)\s+only/i, extract: 1 },

    // Loading: "lazily", "eagerly", "on demand"
    { category: 'loading', pattern: /\s+(lazily|eagerly|on\s+demand)/i, extract: 1 },

    // Batching: "in groups of 10", "batch by 50"
    { category: 'batch', pattern: /\s+in\s+groups?\s+of\s+(\d+)/i, extract: 1 },
    { category: 'batch', pattern: /\s+batch(?:ed)?\s+(?:by\s+)?(\d+)/i, extract: 1 },

    // Retry: "retry 3 times", "with exponential backoff"
    { category: 'retry', pattern: /\s+retry\s+(?:this\s+)?(?:up\s+to\s+)?(\d+)\s+times?/i, extract: (m) => ({ count: parseInt(m[1]) }) },
    { category: 'retry', pattern: /\s+with\s+exponential\s+backoff/i, extract: () => ({ backoff: 'exponential' }) },
    { category: 'retry', pattern: /\s+with\s+linear\s+backoff/i, extract: () => ({ backoff: 'linear' }) },

    // Timeout: "timeout after 30 seconds", "give up after 1 minute"
    { category: 'timeout', pattern: /\s+(?:timeout|give\s+up)\s+after\s+(\d+)\s*(seconds?|minutes?|ms|milliseconds?)/i, extract: (m) => ({ value: parseInt(m[1]), unit: m[2].replace(/s$/, '') }) },

    // Streaming: "stream this", "don't load it all at once"
    { category: 'streaming', pattern: /\s+(?:stream\s+this|stream\s+the)/i, extract: () => ({ enabled: true }) },
    { category: 'streaming', pattern: /\s+(?:don't|do not)\s+load\s+(?:it\s+)?all\s+at\s+once/i, extract: () => ({ enabled: true }) },

    // Priority: "this is critical", "low priority", "do this first"
    { category: 'priority', pattern: /\s+(?:this\s+is\s+)?(?:critical|highest?\s+priority)/i, extract: () => 'critical' },
    { category: 'priority', pattern: /\s+low\s+priority/i, extract: () => 'low' },
    { category: 'priority', pattern: /\s+(?:do\s+this\s+)?first/i, extract: () => 'high' },
]

/**
 * Extract hint annotations from an instruction.
 * Separates the core instruction from performance hints.
 *
 * @param {string} instruction - The full English instruction
 * @returns {{ instruction: string, hints: object, hasHints: boolean }}
 */
export function extractHints(instruction) {
    const hints = {}
    let cleaned = instruction
    let hasHints = false

    for (const { category, pattern, extract } of HINT_PATTERNS) {
        const match = cleaned.match(pattern)
        if (match) {
            hasHints = true
            // Extract the hint value
            if (typeof extract === 'function') {
                const existing = hints[category] || {}
                hints[category] = { ...existing, ...extract(match) }
            } else if (typeof extract === 'number') {
                hints[category] = match[extract].trim()
            } else {
                hints[category] = extract
            }

            // Remove the hint from the instruction
            cleaned = cleaned.replace(match[0], '').replace(/\s+/g, ' ').trim()
        }
    }

    // Merge retry hints (count + backoff)
    if (hints.retry && typeof hints.retry === 'object') {
        hints.retry = { count: hints.retry.count || 3, backoff: hints.retry.backoff || 'none' }
    }

    return { instruction: cleaned, hints, hasHints }
}

/**
 * Generate a caching wrapper for JavaScript code.
 */
export function generateCacheWrapper(code, cacheHint) {
    if (cacheHint.disabled) return code
    const ttl = cacheHint.duration === -1 ? 'Infinity' : convertToMs(cacheHint.duration, cacheHint.unit)
    return `(() => { const __cache = new Map(); const __ttl = ${ttl}; const __key = JSON.stringify(arguments); if (__cache.has(__key) && Date.now() - __cache.get(__key).t < __ttl) return __cache.get(__key).v; const __result = ${code}; __cache.set(__key, { v: __result, t: Date.now() }); return __result; })()`
}

/**
 * Generate a retry wrapper.
 */
export function generateRetryWrapper(code, retryHint) {
    const { count = 3, backoff = 'none' } = retryHint
    const delayFn = backoff === 'exponential' ? 'Math.pow(2, attempt) * 1000' : backoff === 'linear' ? 'attempt * 1000' : '0'
    return `(async () => { for (let attempt = 0; attempt < ${count}; attempt++) { try { return await (${code}); } catch(e) { if (attempt >= ${count - 1}) throw e; await new Promise(r => setTimeout(r, ${delayFn})); } } })()`
}

/**
 * Generate a timeout wrapper.
 */
export function generateTimeoutWrapper(code, timeoutHint) {
    const ms = convertToMs(timeoutHint.value, timeoutHint.unit)
    return `Promise.race([${code}, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after ${timeoutHint.value} ${timeoutHint.unit}')), ${ms}))])`
}

/**
 * Generate a parallel execution wrapper.
 */
export function generateParallelWrapper(items, parallelHint) {
    if (parallelHint.workers) {
        return `/* parallel: ${parallelHint.workers} workers */ await Promise.all(${items}.map(item => processItem(item)))`
    }
    return `await Promise.all(${items})`
}

function convertToMs(value, unit) {
    const normalized = unit.toLowerCase().replace(/s$/, '')
    const multipliers = { millisecond: 1, ms: 1, second: 1000, minute: 60000, hour: 3600000, day: 86400000 }
    return value * (multipliers[normalized] || 1000)
}

/**
 * Get a human-readable summary of hints for diagnostics.
 */
export function summarizeHints(hints) {
    const parts = []
    if (hints.algorithm) parts.push(`algorithm: ${hints.algorithm}`)
    if (hints.cache) parts.push(hints.cache.disabled ? 'no cache' : `cache: ${hints.cache.duration || '∞'} ${hints.cache.unit || ''}`)
    if (hints.parallel) parts.push(`parallel${hints.parallel.workers ? ` (${hints.parallel.workers} workers)` : ''}`)
    if (hints.limit) parts.push(`limit: ${hints.limit}`)
    if (hints.retry) parts.push(`retry: ${hints.retry.count}x${hints.retry.backoff !== 'none' ? ` (${hints.retry.backoff})` : ''}`)
    if (hints.timeout) parts.push(`timeout: ${hints.timeout.value}${hints.timeout.unit}`)
    if (hints.batch) parts.push(`batch: groups of ${hints.batch}`)
    if (hints.loading) parts.push(`loading: ${hints.loading}`)
    if (hints.streaming) parts.push('streaming')
    if (hints.priority) parts.push(`priority: ${hints.priority}`)
    return parts.join(', ')
}
