/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GAP 2 — Natural Language Logic Blocks
 *  Supports compound boolean expressions via bullet-point
 *  checklist syntax: "if all/any of these are true:"
 * ═══════════════════════════════════════════════════════════
 */

const COMPOUND_STARTERS = [
    { pattern: /^(?:if|when|check if)\s+all\s+(?:of\s+)?these\s+are\s+true\s*:?\s*$/i, mode: 'all' },
    { pattern: /^(?:if|when|check if)\s+any\s+(?:of\s+)?these\s+are\s+true\s*:?\s*$/i, mode: 'any' },
    { pattern: /^do\s+this\s+(?:only\s+)?(?:when|if)\s*:?\s*$/i, mode: 'all' },
    { pattern: /^do\s+this\s+if\s+all\s+(?:of\s+)?these\s*:?\s*$/i, mode: 'all' },
    { pattern: /^do\s+this\s+if\s+any\s+(?:of\s+)?these\s*:?\s*$/i, mode: 'any' },
    { pattern: /^skip\s+this\s+(?:step\s+)?if\s+any\s+(?:of\s+)?these\s+are\s+true\s*:?\s*$/i, mode: 'any', negated: true },
    { pattern: /^(?:show|display|do|run|execute)\s+.+\s+if\s+all\s+(?:of\s+)?these\s+are\s+true\s*:?\s*$/i, mode: 'all', extractAction: true },
    { pattern: /^(?:show|display|do|run|execute)\s+.+\s+if\s+any\s+(?:of\s+)?these\s+are\s+true\s*:?\s*$/i, mode: 'any', extractAction: true },
]

const NEGATION_WORDS = /\b(?:not|isn't|aren't|hasn't|haven't|doesn't|doesn't|won't|wouldn't|can't|cannot|never|no longer|anymore)\b/i

const ELSE_IF_PATTERN = /^(?:otherwise\s+if|else\s+if|or\s+if)\s+(.+)$/i
const ELSE_PATTERN = /^(?:otherwise|else|if\s+none\s+of\s+these)$/i

/**
 * Detect if a line starts a compound conditional block.
 * @param {string} line - Trimmed line text
 * @returns {{ mode: 'all'|'any', negated?: boolean, action?: string } | null}
 */
export function detectCompoundStart(line) {
    for (const starter of COMPOUND_STARTERS) {
        const m = line.match(starter.pattern)
        if (m) {
            let action = null
            if (starter.extractAction) {
                // Extract the action part before "if all/any..."
                const actionMatch = line.match(/^((?:show|display|do|run|execute)\s+.+?)\s+if\s+/i)
                action = actionMatch ? actionMatch[1].trim() : null
            }
            return { mode: starter.mode, negated: !!starter.negated, action }
        }
    }
    return null
}

/**
 * Parse a single condition bullet (- prefixed line).
 * Handles OR/AND within a single bullet and negation detection.
 * @param {string} text - The condition text (without leading dash)
 * @returns {object} Condition AST node
 */
export function parseConditionBullet(text) {
    const trimmed = text.trim()

    // Check for inline OR
    if (/\b\s+or\s+\b/i.test(trimmed)) {
        const parts = trimmed.split(/\s+or\s+/i).map(p => p.trim()).filter(Boolean)
        if (parts.length > 1) {
            return {
                type: 'CompoundCondition',
                mode: 'any',
                conditions: parts.map(p => parseSingleCondition(p)),
            }
        }
    }

    // Check for inline AND
    if (/\b\s+and\s+\b/i.test(trimmed) && !NEGATION_WORDS.test(trimmed.split(/\s+and\s+/i)[0])) {
        const parts = trimmed.split(/\s+and\s+/i).map(p => p.trim()).filter(Boolean)
        if (parts.length > 1) {
            return {
                type: 'CompoundCondition',
                mode: 'all',
                conditions: parts.map(p => parseSingleCondition(p)),
            }
        }
    }

    return parseSingleCondition(trimmed)
}

/**
 * Parse a single condition expression.
 */
function parseSingleCondition(text) {
    const negated = NEGATION_WORDS.test(text)
    // Clean negation words for the expression
    const cleanText = text
        .replace(/\b(?:isn't|aren't|hasn't|haven't|doesn't|doesn't|won't|wouldn't|can't|cannot)\b/gi, 'is')
        .replace(/\b(?:not|never|no longer|anymore)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()

    return {
        type: 'Condition',
        expression: cleanText || text,
        originalText: text,
        negated,
    }
}

/**
 * Parse a compound conditional block starting from a given line index.
 * Consumes the starter line, all bulleted conditions, and any else-if/else.
 *
 * @param {string[]} lines - All lines of the file
 * @param {number} startIdx - Index of the compound starter line (0-based)
 * @param {number} baseLineNum - 1-based line number of the starter
 * @returns {{ node: object, endIdx: number }}
 */
export function parseCompoundConditional(lines, startIdx, baseLineNum) {
    const starterLine = lines[startIdx].trim()
    const compoundStart = detectCompoundStart(starterLine)
    if (!compoundStart) return null

    const { mode, negated, action } = compoundStart
    const conditions = []
    let bodyLines = []
    let elseIfBlocks = []
    let elseBlock = null
    let i = startIdx + 1

    // Phase 1: Collect bulleted conditions
    while (i < lines.length) {
        const line = lines[i].trim()
        if (!line) { i++; continue }

        // Bullet condition
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
            const condText = line.replace(/^[-•*]\s*/, '').trim()
            conditions.push(parseConditionBullet(condText))
            i++
            continue
        }

        // If it's not a bullet, check for else-if, else, or body
        break
    }

    // Phase 2: Collect body (indented lines after conditions, or action from starter)
    if (action) {
        bodyLines = [action]
    }
    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed) { i++; continue }

        // Check for else-if
        const elseIfMatch = trimmed.match(ELSE_IF_PATTERN)
        if (elseIfMatch) {
            const elseIfCondition = parseSingleCondition(elseIfMatch[1])
            const elseIfBody = []
            i++
            // Collect else-if body (indented lines)
            while (i < lines.length) {
                const bLine = lines[i].trim()
                if (!bLine) { i++; continue }
                if (ELSE_IF_PATTERN.test(bLine) || ELSE_PATTERN.test(bLine)) break
                if (bLine.startsWith('-') || /^(?:if|when|do|show|otherwise|else)/i.test(bLine)) break
                elseIfBody.push(bLine)
                i++
            }
            elseIfBlocks.push({ condition: elseIfCondition, body: elseIfBody })
            continue
        }

        // Check for else
        if (ELSE_PATTERN.test(trimmed)) {
            const elseBody = []
            i++
            while (i < lines.length) {
                const bLine = lines[i].trim()
                if (!bLine) { i++; continue }
                if (/^(?:if|when|do|show|otherwise|else)/i.test(bLine) && !bLine.startsWith('show')) break
                elseBody.push(bLine)
                i++
            }
            elseBlock = { body: elseBody }
            break
        }

        // Not else-if or else — must be body or next instruction
        if (!action && bodyLines.length === 0) {
            bodyLines.push(trimmed)
            i++
            continue
        }
        break
    }

    const node = {
        type: 'CompoundIfStatement',
        mode, // 'all' (AND) or 'any' (OR)
        negated: !!negated,
        conditions,
        body: bodyLines,
        elseIf: elseIfBlocks.length > 0 ? elseIfBlocks : null,
        else: elseBlock,
        line: baseLineNum,
        resolvedBy: 'logic_block_parser',
    }

    return { node, endIdx: i - 1 }
}

/**
 * Compile a CompoundIfStatement to its condition expression string.
 * Used by the transpiler.
 */
export function compileConditionExpression(conditions, mode) {
    const operator = mode === 'all' ? ' && ' : ' || '
    return conditions.map(c => {
        if (c.type === 'CompoundCondition') {
            const inner = compileConditionExpression(c.conditions, c.mode)
            return `(${inner})`
        }
        const expr = conditionToJS(c.expression)
        return c.negated ? `!(${expr})` : expr
    }).join(operator)
}

/**
 * Convert a natural language condition to a JS expression.
 */
function conditionToJS(expression) {
    const text = expression.toLowerCase().trim()

    // "X is Y" patterns
    const isMatch = text.match(/^(?:the\s+)?(.+?)\s+is\s+(.+)$/)
    if (isMatch) {
        const [, subject, value] = isMatch
        const subj = toVarName(subject)
        if (/^(true|false|null|undefined|empty|zero|blank)$/i.test(value.trim())) {
            const val = value.trim().toLowerCase()
            if (val === 'empty' || val === 'blank') return `!${subj} || ${subj}.length === 0`
            if (val === 'zero') return `${subj} === 0`
            return `${subj} === ${val}`
        }
        if (/^(active|logged in|valid|enabled|subscribed|available|ready|open|closed|complete|done|finished)$/i.test(value.trim())) {
            return `${subj}.${toCamelCase('is ' + value.trim())}`
        }
        return `${subj} === "${value.trim()}"`
    }

    // "X has Y" patterns
    const hasMatch = text.match(/^(?:the\s+)?(.+?)\s+(?:has|have)\s+(?:a\s+)?(.+)$/)
    if (hasMatch) {
        const [, subject, obj] = hasMatch
        return `${toVarName(subject)}.${toCamelCase('has ' + obj)}`
    }

    // "X exists" patterns
    if (/exists?$/i.test(text)) {
        const subject = text.replace(/\s*exists?$/i, '').trim()
        return `${toVarName(subject)} != null`
    }

    // Fallback: convert to a variable/property check
    return toVarName(text)
}

function toVarName(text) {
    return text.replace(/^(?:the|a|an)\s+/i, '')
        .replace(/['']/g, '')
        .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
        .replace(/[^a-zA-Z0-9_.]/g, '')
}

function toCamelCase(text) {
    return text.replace(/\s+(\w)/g, (_, c) => c.toUpperCase()).replace(/^(\w)/, c => c.toLowerCase())
}
