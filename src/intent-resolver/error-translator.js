/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GAP 6 — Enhanced Error Translator
 *  Maps JavaScript runtime errors back to original English
 *  instructions with plain-English explanations.
 * ═══════════════════════════════════════════════════════════
 */

/* ── Error Translation Rules ── */
const ERROR_TRANSLATIONS = [
    {
        jsPattern: /Cannot read propert(?:y|ies) (?:of |'(\w+)' of )(?:undefined|null)/i,
        translate: (match, ctx) => ({
            title: `The ${ctx.subject || 'object'} was empty`,
            explanation: `Your instruction asked to ${ctx.verb || 'access'} ${ctx.detail || 'a value'}, but the ${ctx.subject || 'source'} returned nothing or doesn't exist.`,
            suggestions: [
                `Add a check before this line: "if the ${ctx.subject || 'value'} exists"`,
                `Make sure the data is available before using it`,
            ],
        }),
    },
    {
        jsPattern: /(\w+) is not a function/i,
        translate: (match, ctx) => ({
            title: `"${match[1]}" isn't something you can call`,
            explanation: `You tried to call "${match[1]}" as an action, but it's a value (like a number or text), not a function.`,
            suggestions: [
                `Check if "${match[1]}" should be a value instead of a function call`,
                `If it should be callable, make sure it was defined with "to ${match[1]}:"`,
            ],
        }),
    },
    {
        jsPattern: /(\w+) is not defined/i,
        translate: (match, ctx) => ({
            title: `"${match[1]}" hasn't been created yet`,
            explanation: `You referenced "${match[1]}" but it was never created. You need to create it before using it.`,
            suggestions: [
                `Add a line before this one: "create ${match[1]}"`,
                `Or use a \`using:\` directive to import it from another file`,
            ],
        }),
    },
    {
        jsPattern: /Maximum call stack size exceeded/i,
        translate: (match, ctx) => ({
            title: `Infinite loop detected`,
            explanation: `This instruction calls itself in a loop that never ends. It keeps running the same thing over and over until the system runs out of memory.`,
            suggestions: [
                `Add a stopping condition: "if X, stop"`,
                `Check for a base case in your logic`,
            ],
        }),
    },
    {
        jsPattern: /(?:fetch|network|ECONNREFUSED|ENOTFOUND|ERR_NETWORK)/i,
        translate: (match, ctx) => ({
            title: `Couldn't reach the network`,
            explanation: `The instruction tried to connect to an external service or URL, but the connection failed. This could be a network issue or an incorrect address.`,
            suggestions: [
                `Check the URL or address`,
                `Add a check: "if the connection fails, show an error"`,
                `Consider adding \`retry 3 times with exponential backoff\``,
            ],
        }),
    },
    {
        jsPattern: /ENOENT.*no such file.*?['"](.+?)['"]/i,
        translate: (match, ctx) => ({
            title: `File "${match[1]}" doesn't exist`,
            explanation: `The instruction tried to read or access a file, but it wasn't found at that location.`,
            suggestions: [
                `Check the filename and path`,
                `Add a check: "if the file exists"`,
            ],
        }),
    },
    {
        jsPattern: /SyntaxError/i,
        translate: (match, ctx) => ({
            title: `Syntax error in raw JavaScript block`,
            explanation: `There's a syntax error in a raw: JavaScript block. The JavaScript code inside the block has incorrect syntax.`,
            suggestions: [
                `Check the raw: block for missing brackets, quotes, or semicolons`,
                `Run the JavaScript code separately to find the exact error`,
            ],
        }),
    },
    {
        jsPattern: /JSON\.parse/i,
        translate: (match, ctx) => ({
            title: `Invalid data format`,
            explanation: `The instruction expected structured data (JSON) but received something that couldn't be parsed — possibly plain text, HTML, or corrupted data.`,
            suggestions: [
                `Check that the data source is returning JSON`,
                `Add \`as json\` to your fetch instruction if not already there`,
            ],
        }),
    },
]

/**
 * Translate a JavaScript error into an English-context error message.
 *
 * @param {Error} jsError - The JavaScript error
 * @param {object} sourceMap - Source map with line mappings
 * @returns {object} English-context error message
 */
export function translateError(jsError, sourceMap = {}) {
    const errorMessage = jsError.message || String(jsError)
    const stack = jsError.stack || ''

    // Extract JS line number from stack
    const lineMatch = stack.match(/:(\d+):\d+/)
    const jsLine = lineMatch ? parseInt(lineMatch[1]) : null

    // Find the source mapping
    const mapping = jsLine && sourceMap.mappings
        ? sourceMap.mappings.find(m => m.js_line === jsLine)
        : null

    // Find matching translation rule
    let translation = null
    const context = {
        subject: mapping?.lume_instruction ? extractSubject(mapping.lume_instruction) : null,
        verb: mapping?.lume_instruction ? extractVerb(mapping.lume_instruction) : null,
        detail: mapping?.lume_instruction || null,
    }

    for (const rule of ERROR_TRANSLATIONS) {
        const match = errorMessage.match(rule.jsPattern)
        if (match) {
            translation = rule.translate(match, context)
            break
        }
    }

    // Fallback translation
    if (!translation) {
        translation = {
            title: `Runtime error`,
            explanation: `An unexpected error occurred: ${errorMessage}`,
            suggestions: [`Try rephrasing the instruction or adding error handling`],
        }
    }

    return {
        // Primary: English context
        instruction: mapping?.lume_instruction || '(unknown instruction)',
        line: mapping?.lume_line || null,
        resolvedBy: mapping?.resolved_by || null,
        confidence: mapping?.confidence || null,
        title: translation.title,
        explanation: translation.explanation,
        suggestions: translation.suggestions,
        // Secondary: Technical details
        technical: {
            jsError: errorMessage,
            jsLine,
            stack: stack.split('\n').slice(0, 5).join('\n'),
            astNode: mapping?.ast_node || null,
        },
    }
}

/**
 * Format an English-context error for terminal display.
 */
export function formatEnglishError(translated, filename = 'unknown.lume') {
    const lines = []
    lines.push(``)
    lines.push(`Runtime Error in ${filename}:`)

    if (translated.line) {
        lines.push(`  Line ${translated.line}: "${translated.instruction}"`)
    }

    lines.push(`  Error: ${translated.title}`)
    lines.push(``)
    lines.push(`  What happened:`)
    lines.push(`    ${translated.explanation}`)
    lines.push(``)

    if (translated.suggestions.length > 0) {
        lines.push(`  Suggestions:`)
        translated.suggestions.forEach(s => lines.push(`    - ${s}`))
        lines.push(``)
    }

    lines.push(`  Technical details (for advanced users):`)
    lines.push(`    ${translated.technical.jsError}`)
    if (translated.technical.jsLine) {
        lines.push(`    at ${filename.replace('.lume', '.js')}:${translated.technical.jsLine}`)
    }
    if (translated.resolvedBy) {
        lines.push(`    Resolved by: ${translated.resolvedBy}${translated.confidence ? ` (confidence: ${(translated.confidence * 100).toFixed(0)}%)` : ''}`)
    }

    return lines.join('\n')
}

/**
 * Step-through debugger data for lume debug --step.
 */
export function createStepDebugger(ast, sourceMap) {
    return ast.map((node, i) => ({
        step: i + 1,
        total: ast.length,
        line: node.line,
        instruction: sourceMap?.mappings?.find(m => m.lume_line === node.line)?.lume_instruction || `(node: ${node.type})`,
        astType: node.type,
        resolvedBy: node.resolvedBy,
    }))
}

/* ── Helpers ── */
function extractSubject(text) {
    const words = text.toLowerCase().split(/\s+/)
    const skip = new Set(['get', 'show', 'save', 'delete', 'create', 'update', 'the', 'a', 'an', 'from', 'to'])
    return words.find(w => !skip.has(w) && w.length > 2) || 'value'
}

function extractVerb(text) {
    return text.toLowerCase().split(/\s+/)[0] || 'process'
}
