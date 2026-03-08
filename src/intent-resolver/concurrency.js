/**
 * ═══════════════════════════════════════════════════════
 *  GAP 14: Concurrency & Async Patterns
 *
 *  - "at the same time:" → Promise.all
 *  - "use whichever finishes first:" → Promise.race
 *  - "try all and report:" → Promise.allSettled
 *  - "first/then/finally" sequential chains
 *  - Timers: "do X every N seconds", "after N seconds"
 * ═══════════════════════════════════════════════════════
 */

// ── Parallel Block Patterns ──
const PARALLEL_PATTERNS = [
    { regex: /^(?:at\s+the\s+same\s+time|do\s+these\s+simultaneously|wait\s+for\s+all\s+of)\s*:\s*$/i, type: 'ParallelBlock' },
    { regex: /^use\s+whichever\s+finishes\s+first\s*:\s*$/i, type: 'RaceBlock' },
    { regex: /^try\s+all\s+of\s+these\s+and\s+report(?:\s+what\s+happened)?\s*:\s*$/i, type: 'AllSettledBlock' },
]

// ── Sequential Chain Pattern ──
const FIRST_PATTERN = /^first,?\s+(.+)$/i
const THEN_PATTERN = /^then,?\s+(.+)$/i
const FINALLY_PATTERN = /^finally,?\s+(.+)$/i

// ── Timer Patterns ──
const INTERVAL_PATTERN = /^do\s+(.+?)\s+every\s+(\d+)\s+(seconds?|minutes?|milliseconds?)\s*$/i
const TIMEOUT_PATTERN = /^do\s+(.+?)\s+after\s+(\d+)\s+(seconds?|minutes?|milliseconds?)\s*$/i
const BACKGROUND_PATTERN = /^do\s+(.+?)\s+in\s+the\s+background\s*$/i
const GIVE_UP_PATTERN = /^(.+?),?\s+but\s+give\s+up\s+after\s+(\d+)\s+(seconds?|minutes?)\s*$/i

/**
 * Detect concurrency block start
 */
export function detectConcurrencyBlock(line) {
    const trimmed = line.trim()
    for (const p of PARALLEL_PATTERNS) {
        if (p.regex.test(trimmed)) return { type: p.type }
    }
    return null
}

/**
 * Detect sequential chain start
 */
export function detectSequentialChain(line) {
    return FIRST_PATTERN.test(line.trim())
}

/**
 * Detect timer instruction
 */
export function detectTimerInstruction(line) {
    const trimmed = line.trim()
    if (INTERVAL_PATTERN.test(trimmed)) return 'interval'
    if (TIMEOUT_PATTERN.test(trimmed)) return 'timeout'
    if (BACKGROUND_PATTERN.test(trimmed)) return 'background'
    if (GIVE_UP_PATTERN.test(trimmed)) return 'timeout-abort'
    return null
}

/**
 * Parse a parallel/race/allSettled block
 */
export function parseConcurrencyBlock(lines, startIdx) {
    const header = detectConcurrencyBlock(lines[startIdx].trim())
    if (!header) return null

    const operations = []
    let i = startIdx + 1

    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed) { i++; continue }
        if (!trimmed.startsWith('-') && !line.startsWith('  ') && !line.startsWith('\t')) break
        if (trimmed.startsWith('-')) {
            operations.push(trimmed.slice(1).trim())
        }
        i++
    }

    // Check for "then combine the results" or "show which ones succeeded"
    let combineResults = false
    let reportResults = false
    if (i < lines.length) {
        const nextLine = lines[i]?.trim()
        if (/^then\s+combine\s+the\s+results/i.test(nextLine)) { combineResults = true; i++ }
        if (/^show\s+which\s+ones?\s+succeeded/i.test(nextLine)) { reportResults = true; i++ }
    }

    return {
        type: header.type,
        operations,
        combineResults,
        reportResults,
        endIdx: i,
    }
}

/**
 * Parse a sequential chain: first/then/finally
 */
export function parseSequentialChain(lines, startIdx) {
    const steps = []
    let i = startIdx

    while (i < lines.length) {
        const trimmed = lines[i].trim()
        if (!trimmed) { i++; continue }

        const firstMatch = trimmed.match(FIRST_PATTERN)
        if (firstMatch) { steps.push({ order: 'first', action: firstMatch[1] }); i++; continue }

        const thenMatch = trimmed.match(THEN_PATTERN)
        if (thenMatch) { steps.push({ order: 'then', action: thenMatch[1] }); i++; continue }

        const finallyMatch = trimmed.match(FINALLY_PATTERN)
        if (finallyMatch) { steps.push({ order: 'finally', action: finallyMatch[1] }); i++; continue }

        break
    }

    if (steps.length === 0) return null

    return {
        type: 'SequentialChain',
        steps,
        endIdx: i,
    }
}

/**
 * Parse a timer instruction
 */
export function parseTimerInstruction(line) {
    const trimmed = line.trim()

    // "do X every N seconds"
    const intervalMatch = trimmed.match(INTERVAL_PATTERN)
    if (intervalMatch) {
        return {
            type: 'TimerStatement',
            timerType: 'interval',
            action: intervalMatch[1],
            ms: toMs(Number(intervalMatch[2]), intervalMatch[3]),
        }
    }

    // "do X after N seconds"
    const timeoutMatch = trimmed.match(TIMEOUT_PATTERN)
    if (timeoutMatch) {
        return {
            type: 'TimerStatement',
            timerType: 'timeout',
            action: timeoutMatch[1],
            ms: toMs(Number(timeoutMatch[2]), timeoutMatch[3]),
        }
    }

    // "do X in the background"
    const bgMatch = trimmed.match(BACKGROUND_PATTERN)
    if (bgMatch) {
        return {
            type: 'TimerStatement',
            timerType: 'background',
            action: bgMatch[1],
            ms: null,
        }
    }

    // "X, but give up after N seconds"
    const giveUpMatch = trimmed.match(GIVE_UP_PATTERN)
    if (giveUpMatch) {
        return {
            type: 'TimerStatement',
            timerType: 'timeout-abort',
            action: giveUpMatch[1],
            ms: toMs(Number(giveUpMatch[2]), giveUpMatch[3]),
        }
    }

    return null
}

/**
 * Convert time unit to milliseconds
 */
function toMs(value, unit) {
    if (unit.startsWith('millisecond')) return value
    if (unit.startsWith('second')) return value * 1000
    if (unit.startsWith('minute')) return value * 60 * 1000
    return value * 1000
}

/**
 * Compile a ParallelBlock to JavaScript
 */
export function compileParallelBlock(node) {
    const lines = []
    const varNames = node.operations.map((_, i) => `__result${i}`)

    if (node.type === 'ParallelBlock') {
        lines.push(`const [${varNames.join(', ')}] = await Promise.all([`)
        for (const op of node.operations) {
            lines.push(`  (async () => { /* ${op} */ })(),`)
        }
        lines.push(`]);`)
    } else if (node.type === 'RaceBlock') {
        lines.push(`const __raceResult = await Promise.race([`)
        for (const op of node.operations) {
            lines.push(`  (async () => { /* ${op} */ })(),`)
        }
        lines.push(`]);`)
    } else if (node.type === 'AllSettledBlock') {
        lines.push(`const __allResults = await Promise.allSettled([`)
        for (const op of node.operations) {
            lines.push(`  (async () => { /* ${op} */ })(),`)
        }
        lines.push(`]);`)
        if (node.reportResults) {
            lines.push(`const __succeeded = __allResults.filter(r => r.status === 'fulfilled');`)
            lines.push(`const __failed = __allResults.filter(r => r.status === 'rejected');`)
            lines.push('console.log(`${__succeeded.length} succeeded, ${__failed.length} failed`);')
        }
    }

    return lines.join('\n')
}

/**
 * Compile a SequentialChain to JavaScript
 */
export function compileSequentialChain(node) {
    const lines = []
    for (const step of node.steps) {
        lines.push(`// ${step.order}: ${step.action}`)
    }
    return lines.join('\n')
}

/**
 * Compile a TimerStatement to JavaScript
 */
export function compileTimerStatement(node) {
    switch (node.timerType) {
        case 'interval':
            return `setInterval(() => { /* ${node.action} */ }, ${node.ms});`
        case 'timeout':
            return `setTimeout(() => { /* ${node.action} */ }, ${node.ms});`
        case 'background':
            return `(async () => { /* ${node.action} */ })(); // non-blocking`
        case 'timeout-abort': {
            return [
                `const __controller = new AbortController();`,
                `const __timeout = setTimeout(() => __controller.abort(), ${node.ms});`,
                `try {`,
                `  /* ${node.action} */`,
                `} finally {`,
                `  clearTimeout(__timeout);`,
                `}`,
            ].join('\n')
        }
        default:
            return `// ${node.action}`
    }
}
