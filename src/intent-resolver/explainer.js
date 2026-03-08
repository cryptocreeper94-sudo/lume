/**
 * ═══════════════════════════════════════════════════════════
 *  LUME REVERSE MODE — Code-to-Language Explainer (M11)
 *
 *  Flips the Intent Resolver pipeline:
 *    Source Code → AST → Plain Language Explanation
 *
 *  Supports:
 *    - Lume source files (.lume)
 *    - JavaScript files (.js)
 *    - TypeScript files (.ts)
 *
 *  Modes:
 *    A — Line-by-line annotation
 *    B — Summary paragraph
 * ═══════════════════════════════════════════════════════════
 */

/* ── AST Node Explainers ─────────────────────────────── */

/**
 * Maps AST node types to plain English explanations.
 * Returns a function: (node) → description string
 */
const NODE_EXPLAINERS = {
    // ── Standard Lume Nodes ──
    LetDeclaration: (n) => `Create a variable called "${n.name}" and set it to ${explainValue(n.value)}`,
    DefineDeclaration: (n) => `Define a constant called "${n.name}" with the value ${explainValue(n.value)}`,
    ShowStatement: (n) => `Display ${explainValue(n.value)} to the user`,
    LogStatement: (n) => `Log ${explainValue(n.value)} for debugging`,
    SetStatement: (n) => `Change "${n.name}" to ${explainValue(n.value)}`,
    ReturnStatement: (n) => n.value ? `Return ${explainValue(n.value)}` : 'Return (no value)',
    IfStatement: (n) => `If ${explainCondition(n.condition)}, then do the following${n.elseBody ? ' (with an alternative path)' : ''}`,
    WhenStatement: (n) => `Check ${explainValue(n.subject)} against ${n.cases?.length || 0} possible patterns`,
    FunctionDeclaration: (n) => `Define a function called "${n.name}" that takes ${n.params?.length || 0} parameter${n.params?.length !== 1 ? 's' : ''}${n.params?.length > 0 ? ': ' + n.params.map(p => p.name).join(', ') : ''}`,
    ForEachStatement: (n) => `For each "${n.item}" in ${explainValue(n.iterable)}, do the following`,
    ForEachIndexStatement: (n) => `For each "${n.item}" (with index "${n.index}") in ${explainValue(n.iterable)}, do the following`,
    ForRangeStatement: (n) => `Count from ${explainValue(n.start)} to ${explainValue(n.end)}${n.step ? ` by ${explainValue(n.step)}` : ''} using "${n.variable}"`,
    WhileStatement: (n) => `Keep repeating while ${explainCondition(n.condition)}`,
    BreakStatement: () => 'Stop the loop immediately',
    ContinueStatement: () => 'Skip to the next iteration of the loop',
    AssignmentExpression: (n) => `Update "${n.name}" using ${n.operator} with ${explainValue(n.value)}`,
    TypeDeclaration: (n) => n.isAlias
        ? `Create a type alias "${n.name}"`
        : `Define a data type "${n.name}" with fields: ${n.fields?.map(f => f.name).join(', ') || 'none'}`,
    TestBlock: (n) => `Test: "${n.name}"`,
    ExpectStatement: (n) => `Assert that ${explainValue(n.value)} is true`,
    UseStatement: (n) => `Import ${n.imports?.length > 0 ? n.imports.join(', ') : `"${n.source}"`} from "${n.source}"`,
    ExportStatement: (n) => `Export ${n.declaration?.name || 'this declaration'} for other modules to use`,

    // ── AI Integration (M3) ──
    AskExpression: (n) => `Ask the AI: ${explainValue(n.value || n)}`,
    ThinkExpression: (n) => `Have the AI analyze: ${explainValue(n.value || n)}`,
    GenerateExpression: (n) => `Generate content using AI: ${explainValue(n.value || n)}`,

    // ── Interop (M4) ──
    FetchExpression: (n) => `Fetch data from ${n.url || 'a URL'}${n.method ? ` using ${n.method}` : ''}`,
    PipeExpression: (n) => `Chain operations: pipe the result through a series of transformations`,
    ReadExpression: (n) => `Read from a file: ${n.path || explainValue(n)}`,
    WriteExpression: (n) => `Write to a file: ${n.path || explainValue(n)}`,

    // ── Self-Sustaining Runtime (M5-M6) ──
    MonitorBlock: (n) => 'Set up monitoring: continuously watch for performance or health issues',
    HealBlock: (n) => 'Set up self-healing: automatically recover from errors',
    OptimizeBlock: (n) => 'Set up optimization: automatically tune performance',
    EvolveBlock: (n) => 'Set up evolution: suggest improvements over time',

    // ── English Mode (M7) ──
    VariableAccess: (n) => `Get the value of "${n.source}" ${n.field ? `(specifically the "${n.field}" field)` : ''}`,
    StoreOperation: (n) => `Save ${n.what || 'data'} ${n.destination ? `to "${n.destination}"` : ''}`,
    DeleteOperation: (n) => `Delete ${n.target || 'the specified item'}`,
    CreateOperation: (n) => `Create a new ${n.entity || 'item'}${n.fields ? ` with properties: ${Object.keys(n.fields).join(', ')}` : ''}`,
    UpdateOperation: (n) => `Update ${n.target || 'the specified item'}${n.changes ? ` with changes: ${Object.keys(n.changes).join(', ')}` : ''}`,
    SendOperation: (n) => `Send ${n.what || 'a message'} to ${n.destination || 'the recipient'}`,
    FilterOperation: (n) => `Filter ${n.source || 'the data'} ${n.condition ? `where ${n.condition}` : ''}`,
    SortOperation: (n) => `Sort ${n.source || 'the data'} ${n.direction ? `in ${n.direction} order` : ''}`,
    ConnectionSetup: (n) => `Connect to ${n.target || 'a service'}`,
    EventListener: (n) => `When ${n.event || 'an event occurs'}, do the following`,
    NavigateOperation: (n) => `Navigate to ${n.destination || 'a page'}`,
    DelayStatement: (n) => `Wait for ${n.duration || 'a period'}`,
    RawBlock: (n) => 'Execute raw JavaScript code directly (escape hatch)',
}

/* ── Value Explainers ─────────────────────────────────── */

function explainValue(node) {
    if (!node) return 'nothing'
    if (typeof node === 'string') return `"${node}"`
    if (typeof node === 'number') return String(node)
    if (typeof node === 'boolean') return String(node)

    switch (node.type) {
        case 'StringLiteral':
        case 'InterpolatedString':
            return `"${node.value}"`
        case 'NumberLiteral':
            return String(node.value)
        case 'BooleanLiteral':
            return node.value ? 'true' : 'false'
        case 'NullLiteral':
            return 'nothing (null)'
        case 'Identifier':
            return `the variable "${node.name || node.value}"`
        case 'ListLiteral':
            return `a list with ${node.elements?.length || 0} items`
        case 'MapLiteral':
            return 'a key-value map'
        case 'BinaryExpression':
            return `${explainValue(node.left)} ${explainOperator(node.operator)} ${explainValue(node.right)}`
        case 'UnaryExpression':
            return `${node.operator === 'not' ? 'not ' : node.operator}${explainValue(node.operand || node.argument)}`
        case 'CallExpression':
            return `the result of calling ${node.callee?.name || node.name || 'a function'}()`
        case 'MemberExpression':
            return `${explainValue(node.object)}.${node.property?.name || node.property}`
        case 'IndexExpression':
            return `${explainValue(node.object)}[${explainValue(node.index)}]`
        case 'AskExpression':
            return `the AI's response to a question`
        case 'ThinkExpression':
            return `the AI's analysis`
        case 'GenerateExpression':
            return `AI-generated content`
        case 'FetchExpression':
            return `data fetched from a URL`
        case 'PipeExpression':
            return `a piped result`
        default:
            return node.value !== undefined ? String(node.value) : `(${node.type || 'expression'})`
    }
}

function explainCondition(node) {
    if (!node) return 'a condition'
    if (typeof node === 'string') return node

    if (node.type === 'BinaryExpression') {
        const left = explainValue(node.left)
        const right = explainValue(node.right)
        const op = explainOperator(node.operator)
        return `${left} ${op} ${right}`
    }

    return explainValue(node)
}

function explainOperator(op) {
    const ops = {
        '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by',
        '%': 'modulo', '==': 'equals', '!=': 'does not equal',
        '<': 'is less than', '>': 'is greater than',
        '<=': 'is at most', '>=': 'is at least',
        'and': 'and', 'or': 'or', 'not': 'not',
        'is': 'equals', 'is not': 'does not equal',
    }
    return ops[op] || op
}

/* ── Main Explain Functions ──────────────────────────── */

/**
 * Explain an AST node in plain English.
 *
 * @param {object} node - An AST node
 * @returns {string} Plain English explanation
 */
export function explainNode(node) {
    if (!node || !node.type) return 'Unknown operation'
    const explainer = NODE_EXPLAINERS[node.type]
    if (explainer) return explainer(node)
    return `Perform a "${node.type}" operation`
}

/**
 * Explain an entire AST in Mode A (line-by-line annotations).
 *
 * @param {object[]} ast - Array of AST nodes
 * @param {object} [options] - { lang }
 * @returns {Array<{ line: number, type: string, code: string, explanation: string }>}
 */
export function explainAST(ast, options = {}) {
    const nodes = ast.body || ast
    const annotations = []

    for (const node of nodes) {
        const explanation = explainNode(node)
        annotations.push({
            line: node.line || 0,
            type: node.type,
            code: reconstructCode(node),
            explanation,
        })

        // Recursively explain children (block bodies)
        if (node.body && Array.isArray(node.body)) {
            const childAnnotations = explainAST(node.body, options)
            annotations.push(...childAnnotations.map(a => ({
                ...a,
                explanation: '  └─ ' + a.explanation,
            })))
        }
        if (node.elseBody && Array.isArray(node.elseBody)) {
            annotations.push({ line: node.line, type: 'else', code: 'else:', explanation: 'Otherwise:' })
            const elseAnnotations = explainAST(node.elseBody, options)
            annotations.push(...elseAnnotations.map(a => ({
                ...a,
                explanation: '  └─ ' + a.explanation,
            })))
        }
    }

    return annotations
}

/**
 * Explain an entire AST in Mode B (summary paragraph).
 *
 * @param {object[]} ast - Array of AST nodes
 * @param {object} [options] - { lang }
 * @returns {string} A coherent paragraph summarizing the code
 */
export function summarizeAST(ast, options = {}) {
    const nodes = ast.body || ast
    if (!nodes || nodes.length === 0) return 'This file is empty.'

    const parts = []

    // Count node types for high-level summary
    const typeCounts = {}
    for (const node of nodes) {
        typeCounts[node.type] = (typeCounts[node.type] || 0) + 1
    }

    // Opening line
    parts.push(`This code contains ${nodes.length} statement${nodes.length !== 1 ? 's' : ''}.`)

    // Describe structure
    const hasFunctions = typeCounts.FunctionDeclaration > 0
    const hasTypes = typeCounts.TypeDeclaration > 0
    const hasTests = typeCounts.TestBlock > 0
    const hasImports = typeCounts.UseStatement > 0
    const hasExports = typeCounts.ExportStatement > 0
    const hasLoops = (typeCounts.ForEachStatement || 0) + (typeCounts.ForRangeStatement || 0) + (typeCounts.WhileStatement || 0) > 0
    const hasConditionals = typeCounts.IfStatement > 0 || typeCounts.WhenStatement > 0
    const hasAI = typeCounts.AskExpression > 0 || typeCounts.ThinkExpression > 0 || typeCounts.GenerateExpression > 0
    const hasRuntime = typeCounts.MonitorBlock > 0 || typeCounts.HealBlock > 0

    if (hasImports) parts.push(`It imports from ${typeCounts.UseStatement} module${typeCounts.UseStatement > 1 ? 's' : ''}.`)
    if (hasTypes) parts.push(`It defines ${typeCounts.TypeDeclaration} custom data type${typeCounts.TypeDeclaration > 1 ? 's' : ''}.`)
    if (hasFunctions) parts.push(`It declares ${typeCounts.FunctionDeclaration} function${typeCounts.FunctionDeclaration > 1 ? 's' : ''}: ${nodes.filter(n => n.type === 'FunctionDeclaration').map(n => n.name).join(', ')}.`)
    if (hasLoops) parts.push('It uses loops to process data iteratively.')
    if (hasConditionals) parts.push('It uses conditional logic to handle different cases.')
    if (hasAI) parts.push('It integrates AI capabilities for intelligent processing.')
    if (hasRuntime) parts.push('It uses self-sustaining runtime features for reliability.')
    if (hasTests) parts.push(`It includes ${typeCounts.TestBlock} test${typeCounts.TestBlock > 1 ? 's' : ''}.`)
    if (hasExports) parts.push('It exports functionality for use by other modules.')

    // Describe the main flow
    const mainFlow = nodes.filter(n => !['UseStatement', 'ExportStatement', 'TypeDeclaration', 'CommentNode'].includes(n.type))
    if (mainFlow.length > 0 && mainFlow.length <= 5) {
        parts.push('Steps: ' + mainFlow.map(n => explainNode(n)).join('. Then, ') + '.')
    }

    return parts.join(' ')
}

/**
 * Explain a source file. Handles .lume, .js, and .ts files.
 *
 * @param {string} source - The source code
 * @param {string} filename - The filename
 * @param {object} [options] - { mode: 'annotate'|'summary', lang }
 * @returns {{ annotations: Array, summary: string, mode: string }}
 */
export function explainFile(source, filename, options = {}) {
    const ext = filename.split('.').pop().toLowerCase()
    const mode = options.mode || 'annotate'

    if (ext === 'lume') {
        return explainLumeFile(source, filename, options)
    }

    if (ext === 'js' || ext === 'ts') {
        return explainJSFile(source, filename, options)
    }

    return {
        annotations: [],
        summary: `Unsupported file type: .${ext}`,
        mode,
    }
}

/* ── Lume File Explanation ────────────────────────────── */

function explainLumeFile(source, filename, options) {
    const mode = options.mode || 'annotate'

    // Check if this is English Mode
    const firstLine = source.split('\n')[0].trim()
    const isEnglish = firstLine === 'mode: english' || firstLine === 'mode: natural'

    if (isEnglish) {
        // For English Mode, the source IS the explanation — just annotate line by line
        const lines = source.split('\n')
        const annotations = []
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('mode:')) continue
            annotations.push({
                line: i + 1,
                type: 'EnglishMode',
                code: line,
                explanation: `This line says: "${line}" — the compiler will interpret this as a programming instruction.`,
            })
        }
        return {
            annotations,
            summary: `This is a Lume English Mode file with ${annotations.length} natural language instructions.`,
            mode,
        }
    }

    // Standard Lume: parse via Lexer → Parser → AST, then explain
    // Dynamically import to avoid circular deps
    let ast
    try {
        // Import at usage time to avoid circular dependencies
        const { tokenize } = await_import_sync('../lexer.js')
        const { parse } = await_import_sync('../parser.js')
        const tokens = tokenize(source, filename)
        ast = parse(tokens, filename)
    } catch (e) {
        // If parser fails, do line-by-line heuristic explanation
        return explainRawLines(source, filename, options)
    }

    const annotations = mode === 'annotate' ? explainAST(ast) : []
    const summary = summarizeAST(ast)

    return { annotations, summary, mode }
}

/* ── JS/TS File Explanation ───────────────────────────── */

function explainJSFile(source, filename, options) {
    const mode = options.mode || 'annotate'
    const lines = source.split('\n')
    const annotations = []

    // Simple line-by-line heuristic for JS/TS (no external parser needed)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const explanation = explainJSLine(line)
        if (explanation) {
            annotations.push({
                line: i + 1,
                type: 'JavaScript',
                code: line,
                explanation,
            })
        }
    }

    const summary = `This ${filename.endsWith('.ts') ? 'TypeScript' : 'JavaScript'} file has ${lines.length} lines. ` +
        `It contains ${annotations.length} significant statements.`

    return { annotations, summary, mode }
}

/**
 * Heuristic explanation for a single JS/TS line.
 */
function explainJSLine(line) {
    // Variable declarations
    if (/^\s*(const|let|var)\s+(\w+)\s*=/.test(line)) {
        const match = line.match(/^\s*(const|let|var)\s+(\w+)\s*=\s*(.*)/)
        const kind = match[1] === 'const' ? 'constant' : 'variable'
        return `Declare a ${kind} called "${match[2]}"`
    }

    // Function declarations
    if (/^\s*(async\s+)?function\s+(\w+)/.test(line)) {
        const match = line.match(/^\s*(async\s+)?function\s+(\w+)/)
        return `Define ${match[1] ? 'an async ' : 'a '}function called "${match[2]}"`
    }

    // Arrow functions
    if (/^\s*(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(/.test(line) && line.includes('=>')) {
        const match = line.match(/^\s*(const|let|var)\s+(\w+)/)
        return `Define an arrow function called "${match[2]}"`
    }

    // Imports
    if (/^\s*import\s/.test(line)) {
        const fromMatch = line.match(/from\s+['"](.+?)['"]/)
        return `Import from "${fromMatch ? fromMatch[1] : 'a module'}"`
    }

    // Exports
    if (/^\s*export\s/.test(line)) return 'Export for use by other modules'

    // Conditionals
    if (/^\s*if\s*\(/.test(line)) return 'Check a condition'
    if (/^\s*else\s*if/.test(line)) return 'Check an alternative condition'
    if (/^\s*else\s*\{?/.test(line)) return 'Otherwise (fallback)'

    // Loops
    if (/^\s*for\s*\(/.test(line)) return 'Loop through items'
    if (/^\s*while\s*\(/.test(line)) return 'Keep repeating while a condition is true'

    // Return
    if (/^\s*return\s/.test(line)) return 'Return a value'

    // Console
    if (/console\.\w+\(/.test(line)) return 'Log output for debugging'

    // Try/catch
    if (/^\s*try\s*\{?/.test(line)) return 'Begin a block that might throw an error'
    if (/^\s*catch\s*\(/.test(line)) return 'Handle an error if one occurred'

    // Await
    if (/\bawait\b/.test(line)) return 'Wait for an asynchronous operation to complete'

    // Class
    if (/^\s*class\s+(\w+)/.test(line)) {
        const match = line.match(/^\s*class\s+(\w+)/)
        return `Define a class called "${match[1]}"`
    }

    // Comments
    if (/^\s*\/\//.test(line)) return null // Skip single-line comments
    if (/^\s*\/\*/.test(line)) return null // Skip block comments
    if (/^\s*\*/.test(line)) return null // Skip block comment continuation

    // Closing braces
    if (/^\s*[}\])]/.test(line)) return null // Skip closing brackets

    return null
}

/* ── Fallback: Raw Line Explanation ───────────────────── */

function explainRawLines(source, filename, options) {
    const lines = source.split('\n')
    const annotations = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line || line.startsWith('#') || line.startsWith('//')) continue

        annotations.push({
            line: i + 1,
            type: 'raw',
            code: line,
            explanation: `Code: "${line}"`,
        })
    }

    return {
        annotations,
        summary: `File "${filename}" with ${annotations.length} lines of code.`,
        mode: options.mode || 'annotate',
    }
}

/* ── Code Reconstruction ──────────────────────────────── */

/**
 * Reconstruct a readable code representation from an AST node.
 * Used for annotations.
 */
function reconstructCode(node) {
    if (!node) return ''
    switch (node.type) {
        case 'LetDeclaration': return `let ${node.name} = ...`
        case 'DefineDeclaration': return `define ${node.name} = ...`
        case 'ShowStatement': return `show ...`
        case 'LogStatement': return `log ...`
        case 'SetStatement': return `set ${node.name} to ...`
        case 'ReturnStatement': return `return ...`
        case 'FunctionDeclaration': return `to ${node.name}(${node.params?.map(p => p.name).join(', ')})`
        case 'IfStatement': return `if ...: ...`
        case 'ForEachStatement': return `for each ${node.item} in ...`
        case 'WhileStatement': return `while ...: ...`
        case 'TestBlock': return `test "${node.name}": ...`
        case 'UseStatement': return `use "${node.source}"`
        case 'ExportStatement': return `export ...`
        case 'VariableAccess': return `get ${node.source || '...'}`
        case 'StoreOperation': return `save ${node.what || '...'}`
        case 'DeleteOperation': return `delete ${node.target || '...'}`
        case 'CreateOperation': return `create ${node.entity || '...'}`
        case 'RawBlock': return `raw: ...`
        default: return node.type || ''
    }
}

/* ── Utility: Sync dynamic import stub ────────────────── */

function await_import_sync(path) {
    // In a real implementation, this would be a dynamic import
    // For now, return null — the Lume CLI handles parsing externally
    throw new Error('Dynamic import not available in sync context')
}
