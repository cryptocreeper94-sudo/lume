/**
 * ── Lume Compile API ──
 * Exposes the Lume compiler pipeline as REST endpoints.
 * POST /api/compile/compile  — Compile source to JS + AST
 * POST /api/compile/run      — Compile + execute in sandboxed VM
 * POST /api/compile/explain  — Get human-readable explanation of code
 */

import { Router } from 'express'
import vm from 'node:vm'
import { tokenize } from '../../src/lexer.js'
import { parse } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'
import { detectMode, resolveEnglishFile, matchPattern } from '../../src/intent-resolver/index.js'
import { explainFile as explainFileFull } from '../../src/intent-resolver/explainer.js'

const router = Router()

// ── POST /compile — Compile source to AST + JavaScript ──
router.post('/compile', async (req, res) => {
    try {
        const { source, filename = 'playground.lume' } = req.body
        if (!source || typeof source !== 'string') {
            return res.status(400).json({ error: 'Source code required' })
        }
        if (source.length > 50000) {
            return res.status(400).json({ error: 'Source code too large (max 50KB)' })
        }

        const mode = detectMode(source)
        let result

        if (mode === 'english' || mode === 'natural') {
            // English Mode: Intent Resolver → AST → Transpiler
            const resolved = await resolveEnglishFile(source, {
                filename,
                lockCache: null,
                securityConfig: { level: 'standard' },
                strict: false,
            })

            const ast = { type: 'Program', body: resolved.ast, mode }
            let js = ''
            try { js = transpile(ast, filename) } catch (e) { js = `// Transpile error: ${e.message}` }

            result = {
                mode,
                ast: resolved.ast,
                js,
                diagnostics: resolved.diagnostics || [],
                stats: resolved.stats || {},
            }
        } else {
            // Standard Mode: Lexer → Parser → Transpiler
            const tokens = tokenize(source, filename)
            const ast = parse(tokens, filename)
            const js = transpile(ast, filename)

            result = {
                mode: 'standard',
                ast: ast.body || ast,
                js,
                tokens: tokens.map(t => ({ type: t.type, value: t.value, line: t.line })),
                diagnostics: [],
                stats: { resolvedLines: (source.match(/\n/g) || []).length + 1 },
            }
        }

        res.json(result)
    } catch (err) {
        console.error('Compile error:', err)
        res.status(500).json({
            error: err.message || 'Compilation failed',
            line: err.line || null,
        })
    }
})

// ── POST /run — Compile + Execute in sandboxed VM ──
router.post('/run', async (req, res) => {
    try {
        const { source, filename = 'playground.lume' } = req.body
        if (!source || typeof source !== 'string') {
            return res.status(400).json({ error: 'Source code required' })
        }
        if (source.length > 50000) {
            return res.status(400).json({ error: 'Source code too large (max 50KB)' })
        }

        // First, compile
        const mode = detectMode(source)
        let js, ast, diagnostics = [], stats = {}

        if (mode === 'english' || mode === 'natural') {
            const resolved = await resolveEnglishFile(source, {
                filename,
                lockCache: null,
                securityConfig: { level: 'standard' },
                strict: false,
            })
            ast = { type: 'Program', body: resolved.ast, mode }
            try { js = transpile(ast, filename) } catch (e) { js = `console.log("Transpile error: ${e.message}")` }
            diagnostics = resolved.diagnostics || []
            stats = resolved.stats || {}
        } else {
            const tokens = tokenize(source, filename)
            const parsed = parse(tokens, filename)
            js = transpile(parsed, filename)
            ast = parsed.body || parsed
            stats = { resolvedLines: (source.match(/\n/g) || []).length + 1 }
        }

        // Execute in sandboxed VM
        const output = []
        const errors = []
        const startTime = Date.now()

        const sandbox = {
            console: {
                log: (...args) => output.push({ type: 'log', text: args.map(String).join(' ') }),
                error: (...args) => output.push({ type: 'error', text: args.map(String).join(' ') }),
                warn: (...args) => output.push({ type: 'warn', text: args.map(String).join(' ') }),
                info: (...args) => output.push({ type: 'info', text: args.map(String).join(' ') }),
            },
            setTimeout: (fn, ms) => { if (ms < 3000) setTimeout(fn, ms) },
            Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
            Array, Object, String, Number, Boolean, Map, Set, RegExp,
            Promise,
            // Lume runtime stubs for AI calls
            __lume_ask: async (prompt) => ({ text: `[AI Response to: "${prompt}"]`, model: 'sandbox' }),
            __lume_think: async (prompt) => ({ text: `[Analysis of: "${prompt}"]`, model: 'sandbox' }),
            __lume_generate: async (prompt) => ({ text: `[Generated: "${prompt}"]`, model: 'sandbox' }),
            __lume_loadConfig: () => ({ apiKey: 'sandbox', model: 'sandbox' }),
            Result: class { constructor(v) { this.value = v; this.ok = true } },
        }

        try {
            // Strip import/export statements for VM execution
            const executableJS = js
                .replace(/^\/\/ Generated by Lume Compiler.*$/m, '')
                .replace(/^import\s+.*$/gm, '')
                .replace(/^export\s+.*$/gm, '')
                .replace(/from\s+"lume-runtime";\s*/g, '')

            const context = vm.createContext(sandbox)
            const script = new vm.Script(executableJS, { filename, timeout: 3000 })
            const result = script.runInContext(context, { timeout: 3000 })

            if (result !== undefined && output.length === 0) {
                output.push({ type: 'result', text: String(result) })
            }
        } catch (err) {
            errors.push({
                message: err.message,
                line: err.lineNumber || null,
                stack: err.stack?.split('\n').slice(0, 3).join('\n'),
            })
        }

        const executionTime = Date.now() - startTime

        res.json({
            mode,
            js,
            ast: Array.isArray(ast) ? ast : (ast?.body || ast),
            output,
            errors,
            diagnostics,
            stats,
            executionTime,
        })
    } catch (err) {
        console.error('Run error:', err)
        res.status(500).json({
            error: err.message || 'Execution failed',
            output: [],
            errors: [{ message: err.message }],
        })
    }
})

// ── POST /explain — Get human-readable explanation ──
router.post('/explain', async (req, res) => {
    try {
        const { source, filename = 'playground.lume', mode: explainMode = 'annotate' } = req.body
        if (!source || typeof source !== 'string') {
            return res.status(400).json({ error: 'Source code required' })
        }

        const result = explainFileFull(source, filename, { mode: explainMode })

        res.json({
            summary: result.summary || '',
            annotations: result.annotations || [],
            nodeCount: result.annotations?.length || 0,
        })
    } catch (err) {
        console.error('Explain error:', err)
        res.status(500).json({ error: err.message || 'Explain failed' })
    }
})

export default router
