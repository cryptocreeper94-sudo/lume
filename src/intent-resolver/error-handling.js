/**
 * ═══════════════════════════════════════════════════════
 *  GAP 11: Error Handling — Try/Catch/Retry in English
 *
 *  - "try to [action]" → try block
 *  - "if it fails, [action]" → catch block
 *  - "if it fails because [reason]" → conditional catch
 *  - "either way" / "regardless" → finally block
 *  - "retry up to N times" → retry loop
 *  - "stop with error" / "fail with" → throw
 * ═══════════════════════════════════════════════════════
 */

// ── Detection Patterns ──
const TRY_PATTERN = /^try\s+to\s+(.+)$/i
const FAIL_PATTERN = /^if\s+it\s+fails?,?\s*(.*)$/i
const FAIL_BECAUSE_PATTERN = /^if\s+it\s+fails?\s+because\s+(.+?),?\s+(.+)$/i
const FINALLY_PATTERN = /^(?:either\s+way|regardless|no\s+matter\s+what|always),?\s*(.*)$/i
const RETRY_PATTERN = /^(?:if\s+it\s+fails?,?\s*)?retry\s+(?:up\s+to\s+)?(\d+)\s+times?(?:\s+with\s+(?:a\s+)?(\d+)\s+seconds?\s+delay)?/i
const RETRY_BACKOFF_PATTERN = /with\s+exponential\s+backoff/i
const STILL_FAILS_PATTERN = /^if\s+it\s+still\s+fails?\s+after\s+retrying,?\s*(.+)$/i
const THROW_PATTERN = /^(?:stop\s+with\s+error|fail\s+with|throw\s+(?:an?\s+)?error)\s+["'](.+?)["']$/i

/**
 * Detect try block start
 */
export function detectTryBlock(line) {
    return TRY_PATTERN.test(line.trim())
}

/**
 * Detect throw statement
 */
export function detectThrowStatement(line) {
    return THROW_PATTERN.test(line.trim())
}

/**
 * Parse a throw statement
 */
export function parseThrowStatement(line) {
    const match = line.trim().match(THROW_PATTERN)
    if (!match) return null
    return { type: 'ThrowStatement', message: match[1] }
}

/**
 * Parse a complete try/catch/finally/retry block from source lines
 */
export function parseTryCatchBlock(lines, startIdx) {
    const firstLine = lines[startIdx].trim()
    const tryMatch = firstLine.match(TRY_PATTERN)
    if (!tryMatch) return null

    const tryAction = tryMatch[1]
    const tryBody = [tryAction]
    let catchBlocks = []
    let finallyBody = null
    let retryConfig = null
    let afterRetryAction = null
    let i = startIdx + 1

    // Collect indented try body lines
    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed) { i++; continue }

        // Check if indented (part of try body)
        if ((line.startsWith('  ') || line.startsWith('\t')) &&
            !FAIL_PATTERN.test(trimmed) && !FINALLY_PATTERN.test(trimmed) &&
            !RETRY_PATTERN.test(trimmed) && !STILL_FAILS_PATTERN.test(trimmed)) {
            tryBody.push(trimmed)
            i++
            continue
        }

        break
    }

    // Parse catch / finally / retry blocks
    while (i < lines.length) {
        const trimmed = lines[i].trim()
        if (!trimmed) { i++; continue }

        // "if it fails because [reason], [action]"
        const becauseMatch = trimmed.match(FAIL_BECAUSE_PATTERN)
        if (becauseMatch) {
            catchBlocks.push({
                reason: becauseMatch[1],
                action: becauseMatch[2],
                body: collectIndentedBody(lines, i + 1),
            })
            i = skipIndentedBlock(lines, i + 1)
            continue
        }

        // "if it fails, [action]"
        const failMatch = trimmed.match(FAIL_PATTERN)
        if (failMatch && !RETRY_PATTERN.test(trimmed) && !STILL_FAILS_PATTERN.test(trimmed)) {
            const action = failMatch[1]
            catchBlocks.push({
                reason: null,
                action: action || null,
                body: action ? [action] : collectIndentedBody(lines, i + 1),
            })
            i = action ? i + 1 : skipIndentedBlock(lines, i + 1)
            continue
        }

        // "retry up to N times"
        const retryMatch = trimmed.match(RETRY_PATTERN)
        if (retryMatch) {
            retryConfig = {
                maxAttempts: Number(retryMatch[1]),
                delayMs: retryMatch[2] ? Number(retryMatch[2]) * 1000 : 1000,
                exponentialBackoff: RETRY_BACKOFF_PATTERN.test(trimmed),
            }
            i++
            continue
        }

        // "if it still fails after retrying, [action]"
        const stillFailsMatch = trimmed.match(STILL_FAILS_PATTERN)
        if (stillFailsMatch) {
            afterRetryAction = stillFailsMatch[1]
            i++
            continue
        }

        // "either way" / "regardless" / "no matter what" / "always"
        const finallyMatch = trimmed.match(FINALLY_PATTERN)
        if (finallyMatch) {
            const action = finallyMatch[1]
            finallyBody = action ? [action] : collectIndentedBody(lines, i + 1)
            i = action ? i + 1 : skipIndentedBlock(lines, i + 1)
            continue
        }

        // Not part of this block — stop
        break
    }

    return {
        type: 'TryCatchStatement',
        tryBody,
        catchBlocks,
        finallyBody,
        retryConfig,
        afterRetryAction,
        endIdx: i,
    }
}

/**
 * Collect indented body lines
 */
function collectIndentedBody(lines, startIdx) {
    const body = []
    let i = startIdx
    while (i < lines.length) {
        const line = lines[i]
        if (!line.trim()) { i++; continue }
        if (!line.startsWith('  ') && !line.startsWith('\t')) break
        body.push(line.trim())
        i++
    }
    return body
}

/**
 * Skip past indented block, return next non-indented line index
 */
function skipIndentedBlock(lines, startIdx) {
    let i = startIdx
    while (i < lines.length) {
        const line = lines[i]
        if (!line.trim()) { i++; continue }
        if (!line.startsWith('  ') && !line.startsWith('\t')) break
        i++
    }
    return i
}

/**
 * Compile TryCatchStatement to JavaScript
 */
export function compileTryCatch(node) {
    const lines = []

    if (node.retryConfig) {
        // Wrap in retry loop
        const { maxAttempts, delayMs, exponentialBackoff } = node.retryConfig
        lines.push(`async function __retryBlock() {`)
        lines.push(`  let __lastError;`)
        lines.push(`  for (let __attempt = 1; __attempt <= ${maxAttempts}; __attempt++) {`)
        lines.push(`    try {`)
        for (const action of node.tryBody) {
            lines.push(`      // ${action}`)
        }
        lines.push(`      return;`)
        lines.push(`    } catch (__error) {`)
        lines.push(`      __lastError = __error;`)
        if (exponentialBackoff) {
            lines.push(`      if (__attempt < ${maxAttempts}) await new Promise(r => setTimeout(r, ${delayMs} * Math.pow(2, __attempt - 1)));`)
        } else {
            lines.push(`      if (__attempt < ${maxAttempts}) await new Promise(r => setTimeout(r, ${delayMs}));`)
        }
        lines.push(`    }`)
        lines.push(`  }`)
        if (node.afterRetryAction) {
            lines.push(`  // ${node.afterRetryAction}`)
        }
        lines.push(`}`)
        lines.push(`await __retryBlock();`)
    } else {
        // Standard try/catch/finally
        lines.push(`try {`)
        for (const action of node.tryBody) {
            lines.push(`  // ${action}`)
        }
        lines.push(`}`)

        if (node.catchBlocks.length > 0) {
            lines.push(` catch (__error) {`)
            let first = true
            for (const cb of node.catchBlocks) {
                if (cb.reason) {
                    const condition = mapReasonToCondition(cb.reason)
                    const prefix = first ? 'if' : '} else if'
                    lines.push(`  ${prefix} (${condition}) {`)
                    for (const action of (cb.body || [])) {
                        lines.push(`    // ${action}`)
                    }
                    first = false
                } else {
                    if (!first) {
                        lines.push(`  } else {`)
                    }
                    for (const action of (cb.body || [])) {
                        lines.push(`    // ${action}`)
                    }
                    if (!first) lines.push(`  }`)
                }
            }
            if (!first && node.catchBlocks[node.catchBlocks.length - 1].reason) {
                lines.push(`  }`)
            }
            lines.push(`}`)
        }

        if (node.finallyBody) {
            lines.push(` finally {`)
            for (const action of node.finallyBody) {
                lines.push(`  // ${action}`)
            }
            lines.push(`}`)
        }
    }

    return lines.join('\n')
}

/**
 * Map an English error reason to a JavaScript condition
 */
function mapReasonToCondition(reason) {
    const lower = reason.toLowerCase()
    if (lower.includes('disk is full') || lower.includes('no space')) return "__error.code === 'ENOSPC'"
    if (lower.includes('permission') || lower.includes('access denied')) return "__error.code === 'EACCES'"
    if (lower.includes('not found') || lower.includes('does not exist')) return "__error.code === 'ENOENT'"
    if (lower.includes('timeout') || lower.includes('timed out')) return "__error.code === 'ETIMEDOUT'"
    if (lower.includes('network') || lower.includes('connection')) return "__error.code === 'ECONNREFUSED' || __error.code === 'ECONNRESET'"
    // Generic — use message match
    return `__error.message.toLowerCase().includes('${lower.replace(/'/g, "\\'")}')`
}

// ── Error Handling Pattern Phrases ──
export const ERROR_PATTERNS = {
    'show the error message': 'console.log(__error.message);',
    'show what went wrong': 'console.log(__error.message + "\\n" + __error.stack);',
    'ignore the error': '/* swallow */',
    'log the error and continue': 'console.error(__error);',
    'log the error': 'console.error(__error);',
}

/**
 * Map an English error action to JavaScript
 */
export function mapErrorAction(action) {
    const lower = action.toLowerCase().trim()
    // Direct match
    if (ERROR_PATTERNS[lower]) return ERROR_PATTERNS[lower]
    // "show [message]"
    const showMatch = action.match(/^show\s+["'](.+?)["']$/i)
    if (showMatch) return `console.log(${JSON.stringify(showMatch[1])});`
    // Default: comment
    return `// ${action}`
}
