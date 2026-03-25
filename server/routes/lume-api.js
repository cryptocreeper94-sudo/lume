/**
 * ═══════════════════════════════════════════════════════
 *  LUME API — DarkWave Studios Integration Endpoints
 *
 *  9 endpoints for playground connectivity:
 *    GET  /api/lume/handshake   — Connection verification
 *    GET  /api/lume/health      — Runtime status
 *    POST /api/lume/execute     — Compile + execute
 *    POST /api/lume/transpile   — Compile to JS
 *    POST /api/lume/tokenize    — Token stream
 *    POST /api/lume/ast         — Abstract Syntax Tree
 *    POST /api/lume/format      — Auto-format source
 *    GET  /api/lume/examples    — Loadable code examples
 *    GET  /api/lume/docs        — Language reference
 *    GET  /api/lume/intent-info — Intent Resolver info
 * ═══════════════════════════════════════════════════════
 */

import { Router } from 'express'
import vm from 'node:vm'
import { tokenize } from '../../src/lexer.js'
import { parse } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'
import { detectMode, resolveEnglishFile, matchPattern } from '../../src/intent-resolver/index.js'

const router = Router()

const LUME_VERSION = '0.9.0'
const PATTERN_COUNT = 87

// ── Allowed CORS origins ──
const ALLOWED_ORIGINS = [
    'https://darkwavestudios.io',
    'https://www.darkwavestudios.io',
    'https://academy.tlid.io',
    'https://lume-lang.org',
    'https://www.lume-lang.org',
    'https://lume-lang.com',
    'https://www.lume-lang.com',
    'http://localhost:5173',
    'http://localhost:3000',
]

// ── CORS Middleware ──
function corsHeaders(req, res) {
    const origin = req.get('Origin')
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin)
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Lume-Platform')
}

// Handle OPTIONS preflight for all endpoints
router.options('*', (req, res) => {
    corsHeaders(req, res)
    res.sendStatus(204)
})

// Apply CORS to all requests
router.use((req, res, next) => {
    corsHeaders(req, res)
    next()
})


// ═══════════════════════════════════════════
// 1. GET /handshake — Connection Verification
// ═══════════════════════════════════════════
router.get('/handshake', (req, res) => {
    res.json({
        success: true,
        handshake: {
            platform: 'lume-lang',
            version: LUME_VERSION,
            capabilities: [
                'execute', 'transpile', 'ast', 'repl', 'format',
                'lint', 'english-mode', 'natural-mode'
            ],
            timestamp: Date.now(),
            status: 'connected',
        },
        endpoints: {
            execute: '/api/lume/execute',
            transpile: '/api/lume/transpile',
            tokenize: '/api/lume/tokenize',
            ast: '/api/lume/ast',
            format: '/api/lume/format',
            health: '/api/lume/health',
            examples: '/api/lume/examples',
            docs: '/api/lume/docs',
            intentInfo: '/api/lume/intent-info',
        },
    })
})


// ═══════════════════════════════════════════
// 2. GET /health — Runtime Health Check
// ═══════════════════════════════════════════
router.get('/health', (req, res) => {
    res.json({
        status: 'operational',
        runtime: `lume-compiler-v${LUME_VERSION}`,
        capabilities: ['execute', 'transpile', 'ast', 'english-mode', 'natural-mode'],
        milestones: {
            completed: [1, 2, 3, 4, 5, 6, 7],
            active: [8],
            planned: [9, 10, 11, 12, 13],
        },
    })
})


// ═══════════════════════════════════════════
// 3. POST /execute — Compile + Execute
// ═══════════════════════════════════════════
router.post('/execute', async (req, res) => {
    const start = Date.now()
    try {
        const { code, timeout = 5000 } = req.body
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, errors: ['Code is required'] })
        }
        if (code.length > 50000) {
            return res.status(400).json({ success: false, errors: ['Code too large (max 50KB)'] })
        }

        const mode = detectMode(code)
        let js, resolvedLume = null, variables = {}

        if (mode === 'english' || mode === 'natural') {
            const resolved = await resolveEnglishFile(code, {
                filename: 'playground.lume',
                lockCache: null,
                securityConfig: { level: 'standard' },
                strict: false,
            })
            const ast = { type: 'Program', body: resolved.ast, mode }
            try {
                js = transpile(ast, 'playground.lume')
            } catch (e) {
                js = `console.log("Transpile error: ${e.message.replace(/"/g, '\\"')}")`
            }
            // Build resolvedLume from AST
            resolvedLume = buildResolvedLume(resolved.ast)
        } else {
            const tokens = tokenize(code, 'playground.lume')
            const parsed = parse(tokens, 'playground.lume')
            js = transpile(parsed, 'playground.lume')
        }

        // Execute in sandboxed VM
        const output = []
        const errors = []
        const sandbox = createSandbox(output)

        try {
            const executableJS = stripRuntimeImports(js)
            const context = vm.createContext(sandbox)
            const execTimeout = Math.min(timeout, 5000)
            const script = new vm.Script(executableJS, { filename: 'playground.lume', timeout: execTimeout })
            const result = script.runInContext(context, { timeout: execTimeout })
            if (result !== undefined && output.length === 0) {
                output.push(String(result))
            }
        } catch (err) {
            errors.push(err.message || String(err))
        }

        const executionTime = Date.now() - start

        res.json({
            success: errors.length === 0,
            output: output.join('\n'),
            result: null,
            variables,
            executionTime,
            mode,
            resolvedLume,
            errors,
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            output: '',
            executionTime: Date.now() - start,
            mode: 'standard',
            errors: [err.message || 'Execution failed'],
        })
    }
})


// ═══════════════════════════════════════════
// 4. POST /transpile — Compile to JavaScript
// ═══════════════════════════════════════════
router.post('/transpile', async (req, res) => {
    try {
        const { code } = req.body
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, errors: ['Code is required'] })
        }

        const mode = detectMode(code)
        let js, resolvedLume = null

        if (mode === 'english' || mode === 'natural') {
            const resolved = await resolveEnglishFile(code, {
                filename: 'playground.lume',
                lockCache: null,
                securityConfig: { level: 'standard' },
                strict: false,
            })
            const ast = { type: 'Program', body: resolved.ast, mode }
            try { js = transpile(ast, 'playground.lume') } catch (e) { js = `// Transpile error: ${e.message}` }
            resolvedLume = buildResolvedLume(resolved.ast)
        } else {
            const tokens = tokenize(code, 'playground.lume')
            const parsed = parse(tokens, 'playground.lume')
            js = transpile(parsed, 'playground.lume')
        }

        res.json({
            success: true,
            transpiled: js,
            sourceLanguage: 'lume',
            targetLanguage: 'javascript',
            mode,
            resolvedLume,
        })
    } catch (err) {
        res.status(500).json({ success: false, errors: [err.message] })
    }
})


// ═══════════════════════════════════════════
// 5. POST /tokenize — Token Stream
// ═══════════════════════════════════════════
router.post('/tokenize', async (req, res) => {
    try {
        const { code } = req.body
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, errors: ['Code is required'] })
        }

        const mode = detectMode(code)
        let tokenSource = code
        let resolvedLume = null

        if (mode === 'english' || mode === 'natural') {
            const resolved = await resolveEnglishFile(code, {
                filename: 'playground.lume',
                lockCache: null,
                securityConfig: { level: 'standard' },
                strict: false,
            })
            resolvedLume = buildResolvedLume(resolved.ast)
            // Tokenize the resolved Lume, not the English
            tokenSource = resolvedLume || code
        }

        const tokens = tokenize(tokenSource, 'playground.lume')
        const tokenData = tokens.map(t => ({
            type: t.type,
            value: t.value,
            line: t.line,
        }))

        res.json({
            success: true,
            tokens: tokenData,
            count: tokenData.length,
            mode,
            resolvedLume,
        })
    } catch (err) {
        res.status(500).json({ success: false, errors: [err.message] })
    }
})


// ═══════════════════════════════════════════
// 6. POST /ast — Abstract Syntax Tree
// ═══════════════════════════════════════════
router.post('/ast', async (req, res) => {
    try {
        const { code } = req.body
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, errors: ['Code is required'] })
        }

        const mode = detectMode(code)
        let ast, resolvedLume = null

        if (mode === 'english' || mode === 'natural') {
            const resolved = await resolveEnglishFile(code, {
                filename: 'playground.lume',
                lockCache: null,
                securityConfig: { level: 'standard' },
                strict: false,
            })
            ast = { type: 'Program', body: resolved.ast }
            resolvedLume = buildResolvedLume(resolved.ast)
        } else {
            const tokens = tokenize(code, 'playground.lume')
            ast = parse(tokens, 'playground.lume')
        }

        res.json({ success: true, ast, mode, resolvedLume })
    } catch (err) {
        res.status(500).json({ success: false, errors: [err.message] })
    }
})


// ═══════════════════════════════════════════
// 7. POST /format — Auto-format Lume Code
// ═══════════════════════════════════════════
router.post('/format', (req, res) => {
    try {
        const { code } = req.body
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, errors: ['Code is required'] })
        }

        const formatted = formatLumeCode(code)
        res.json({ success: true, formatted })
    } catch (err) {
        res.status(500).json({ success: false, errors: [err.message] })
    }
})


// ═══════════════════════════════════════════
// 8. GET /examples — Loadable Code Examples
// ═══════════════════════════════════════════
router.get('/examples', (req, res) => {
    res.json({
        success: true,
        examples: EXAMPLES,
    })
})


// ═══════════════════════════════════════════
// 9. GET /docs — Language Reference
// ═══════════════════════════════════════════
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        language: 'Lume',
        version: LUME_VERSION,
        website: 'https://lume-lang.org',
        sections: {
            keywords: {
                ai: ['ask', 'think', 'generate'],
                control: ['if', 'else', 'for', 'while', 'in', 'match', 'break', 'continue'],
                declarations: ['fn', 'let', 'return', 'struct', 'import', 'export'],
                literals: ['true', 'false', 'null'],
                io: ['print'],
                selfsustaining: ['monitor', 'heal', 'optimize', 'evolve', 'mutate'],
            },
            types: ['string', 'number', 'boolean', 'array', 'object', 'null'],
            builtins: ['print', 'len', 'type', 'str', 'num', 'keys', 'values', 'push', 'join', 'map', 'filter'],
            modes: {
                standard: 'Default Lume syntax',
                english: 'Plain English input (mode: english header)',
                natural: 'Any human language input (mode: natural header)',
            },
        },
    })
})


// ═══════════════════════════════════════════
// 10. GET /intent-info — Intent Resolver Info
// ═══════════════════════════════════════════
router.get('/intent-info', (req, res) => {
    res.json({
        success: true,
        intentResolver: {
            patternCount: PATTERN_COUNT,
            categories: [
                'output', 'variable', 'math', 'conditional', 'loop', 'function',
                'list', 'object', 'ai', 'data', 'time', 'string', 'comparison',
                'monitor', 'heal', 'optimize', 'evolve', 'debug',
            ],
            supportedModes: ['standard', 'english', 'natural'],
            layerA: { name: 'Pattern Library', status: 'active' },
            layerB: { name: 'AI-Powered Resolution', status: 'active' },
            contextEngine: { name: 'Context Engine', status: 'active' },
        },
        roadmap: {
            m7: { name: 'English Mode', status: 'active' },
            m8: { name: 'Multilingual Mode', status: 'active' },
            m9: { name: 'Voice-to-Code', status: 'planned' },
            m10: { name: 'Visual Context Awareness', status: 'planned' },
            m11: { name: 'Reverse Mode', status: 'planned' },
            m12: { name: 'Collaborative Intent', status: 'planned' },
            m13: { name: 'Zero-Dependency Runtime', status: 'planned' },
        },
    })
})


// ═══════════════════════════════════════════ //
//  HELPER FUNCTIONS                          //
// ═══════════════════════════════════════════ //

/**
 * Build readable "resolved Lume" from English Mode AST
 */
function buildResolvedLume(astNodes) {
    if (!Array.isArray(astNodes)) return null
    const lines = []
    for (const node of astNodes) {
        switch (node.type) {
            case 'VariableDeclaration':
                lines.push(`let ${node.name} = ${JSON.stringify(node.value)}`)
                break
            case 'ShowStatement':
                lines.push(`print(${node.value})`)
                break
            case 'VariableAccess':
                lines.push(`let __result = ${node.target}${node.source ? ` // from ${node.source}` : ''}`)
                break
            case 'StoreOperation':
                lines.push(`// store ${node.value} to ${node.target}`)
                break
            case 'CreateOperation':
                lines.push(`let ${node.target} = {}`)
                break
            case 'IfStatement':
                lines.push(`if (${node.condition}) {${node.body ? ` ${node.body}` : ''}}`)
                break
            case 'ForEachLoop':
                lines.push(`for (let ${node.item} of ${node.collection || '[]'}) {}`)
                break
            case 'FetchExpression':
                lines.push(`let __data = await fetch("${node.url}")`)
                break
            default:
                lines.push(`// ${node.type}: ${JSON.stringify(node).slice(0, 80)}`)
        }
    }
    return lines.join('\n')
}

/**
 * Create sandboxed VM context
 */
function createSandbox(output) {
    return {
        console: {
            log: (...args) => output.push(args.map(String).join(' ')),
            error: (...args) => output.push('[ERROR] ' + args.map(String).join(' ')),
            warn: (...args) => output.push('[WARN] ' + args.map(String).join(' ')),
            info: (...args) => output.push(args.map(String).join(' ')),
        },
        setTimeout: (fn, ms) => { if (ms < 3000) setTimeout(fn, ms) },
        Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
        Array, Object, String, Number, Boolean, Map, Set, RegExp,
        Promise,
        __lume_ask: async (prompt) => ({ text: `[AI Response to: "${prompt}"]`, model: 'sandbox' }),
        __lume_think: async (prompt) => ({ text: `[Analysis of: "${prompt}"]`, model: 'sandbox' }),
        __lume_generate: async (prompt) => ({ text: `[Generated: "${prompt}"]`, model: 'sandbox' }),
        __lume_loadConfig: () => ({ apiKey: 'sandbox', model: 'sandbox' }),
        Result: class { constructor(v) { this.value = v; this.ok = true } },
    }
}

/**
 * Strip import/export for VM execution
 */
function stripRuntimeImports(js) {
    return js
        .replace(/^\/\/ Generated by Lume Compiler.*$/m, '')
        .replace(/^import\s+.*$/gm, '')
        .replace(/^export\s+.*$/gm, '')
        .replace(/from\s+"lume-runtime";\s*/g, '')
}

/**
 * Simple Lume auto-formatter
 */
function formatLumeCode(code) {
    const lines = code.split('\n')
    const formatted = []
    let indentLevel = 0

    for (let line of lines) {
        let trimmed = line.trim()
        if (!trimmed) { formatted.push(''); continue }

        // Decrease indent for closing braces
        if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1)
        }

        // Normalize spacing around operators
        trimmed = trimmed
            .replace(/\s*=\s*/g, ' = ')
            .replace(/\s*>\s*/g, ' > ')
            .replace(/\s*<\s*/g, ' < ')
            .replace(/\s*\+\s*/g, ' + ')
            .replace(/\s*-\s*/g, ' - ')
            .replace(/([^=!<>])=([^=])/g, '$1 = $2') // but not ==, !=, <=, >=

        // Fix double spacing
        trimmed = trimmed.replace(/  +/g, ' ')

        // Add indentation
        formatted.push('  '.repeat(indentLevel) + trimmed)

        // Increase indent for opening braces
        if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
            indentLevel++
        }
    }

    return formatted.join('\n')
}


// ═══════════════════════════════════════════ //
//  CODE EXAMPLES                              //
// ═══════════════════════════════════════════ //

const EXAMPLES = [
    // ── Basics ──
    {
        id: 'hello-world',
        title: 'Hello World',
        description: 'Your first Lume program',
        code: 'print("Hello from Lume!")\n\nlet name = "World"\nprint("Hello, {name}!")',
        category: 'basics',
    },
    {
        id: 'variables',
        title: 'Variables & Types',
        description: 'Declare and use variables',
        code: 'let name = "Alice"\nlet age = 30\nlet active = true\nlet scores = [95, 87, 92]\n\nprint("Name: {name}")\nprint("Age: {age}")\nprint("Active: {active}")\nprint("Top score: {scores[0]}")',
        category: 'basics',
    },
    {
        id: 'conditionals',
        title: 'If / Else',
        description: 'Conditional logic',
        code: 'let temp = 72\n\nif temp > 80 {\n  print("It\'s hot!")\n} else if temp > 60 {\n  print("It\'s nice out")\n} else {\n  print("It\'s cold!")\n}',
        category: 'basics',
    },
    {
        id: 'loops',
        title: 'Loops',
        description: 'For and while loops',
        code: 'let fruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits {\n  print("I like {fruit}")\n}\n\nlet count = 0\nwhile count < 5 {\n  print("Count: {count}")\n  count = count + 1\n}',
        category: 'basics',
    },
    {
        id: 'functions',
        title: 'Functions',
        description: 'Define and call functions',
        code: 'fn greet(name) {\n  return "Hello, {name}!"\n}\n\nfn add(a, b) {\n  return a + b\n}\n\nprint(greet("Alice"))\nprint(add(3, 7))',
        category: 'basics',
    },
    // ── AI ──
    {
        id: 'ai-ask',
        title: 'AI: Ask',
        description: 'Use AI to generate responses',
        code: 'let response = ask("What is the capital of France?")\nprint(response)',
        category: 'ai',
    },
    {
        id: 'ai-think',
        title: 'AI: Think & Analyze',
        description: 'Let AI reason about data',
        code: 'let analysis = think("Is 17 a prime number? Explain why.")\nprint(analysis)\n\nlet summary = generate("A haiku about coding")\nprint(summary)',
        category: 'ai',
    },
    // ── Data ──
    {
        id: 'objects',
        title: 'Objects & Structs',
        description: 'Work with structured data',
        code: 'let user = {\n  name: "Alice",\n  age: 30,\n  email: "alice@example.com"\n}\n\nprint("User: {user.name}")\nprint("Email: {user.email}")\n\nlet users = [user, { name: "Bob", age: 25 }]\nfor u in users {\n  print("{u.name} is {u.age}")\n}',
        category: 'data',
    },
    {
        id: 'arrays',
        title: 'Array Operations',
        description: 'Filter, map, and transform arrays',
        code: 'let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n\nlet evens = filter(numbers, fn(n) { return n % 2 == 0 })\nprint("Evens: {evens}")\n\nlet doubled = map(numbers, fn(n) { return n * 2 })\nprint("Doubled: {doubled}")',
        category: 'data',
    },
    // ── English Mode ──
    {
        id: 'english-hello',
        title: 'English Mode: Hello World',
        description: 'Write code in plain English',
        code: 'mode: english\n\nset greeting to "Hello from English Mode!"\nshow greeting',
        category: 'english-mode',
    },
    {
        id: 'english-logic',
        title: 'English Mode: Logic',
        description: 'Conditionals and loops in English',
        code: 'mode: english\n\nset temperature to 75\nif temperature is greater than 80, show "It\'s hot!"\nif temperature is less than 60, show "It\'s cold!"\nshow "Current temp: " and temperature',
        category: 'english-mode',
    },
    {
        id: 'english-data',
        title: 'English Mode: Data Operations',
        description: 'Work with data in natural English',
        code: 'mode: english\n\ncreate a list of users\nadd "Alice" to the list of users\nadd "Bob" to the list of users\nshow the list of users\nget the length of users',
        category: 'english-mode',
    },
    {
        id: 'english-api',
        title: 'English Mode: API Calls',
        description: 'Fetch data using natural language',
        code: 'mode: english\n\nfetch data from "https://api.example.com/users" as json\nshow the data\nfilter the users where age is greater than 25\nshow the filtered users',
        category: 'english-mode',
    },
    // ── Natural Mode ──
    {
        id: 'natural-hello',
        title: 'Natural Mode: Hello World',
        description: 'Write code in any human language',
        code: 'mode: natural\n\nprint a greeting that says "Hello from Natural Mode!"\nthen show the current date and time',
        category: 'natural-mode',
    },
    // ── Advanced ──
    {
        id: 'advanced-selfsustaining',
        title: 'Self-Sustaining Code',
        description: 'Monitor, heal, and optimize',
        code: 'monitor this function\nheal 3 times\noptimize for speed\n\nfn fetchData() {\n  let data = ask("Get me some data")\n  return data\n}\n\nprint(fetchData())',
        category: 'advanced',
    },
    {
        id: 'advanced-match',
        title: 'Pattern Matching',
        description: 'Match expressions',
        code: 'let status = "active"\n\nmatch status {\n  "active" => print("User is active")\n  "inactive" => print("User is inactive")\n  "banned" => print("User is banned")\n  _ => print("Unknown status")\n}',
        category: 'advanced',
    },
]


export default router
