/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Context Engine
 *  Tracks project state: data models, variables, scope,
 *  UI elements, and short-term memory for pronoun resolution
 * ═══════════════════════════════════════════════════════════
 */

import fs from 'fs'
import path from 'path'

/* ── Context State ───────────────────────────────────── */
let context = createFreshContext()

function createFreshContext() {
    return {
        // Project-level (persistent)
        dataModels: {},          // { users: { fields: ['name', 'email', 'signupDate'] } }
        tables: [],              // ['users', 'posts', 'comments']
        functions: [],           // ['calculate_total', 'send_email']
        variables: [],           // Accumulated across files
        uiElements: [],          // UI registry (M10)
        apiEndpoints: [],        // REST endpoints
        domain: null,            // auto-detected project domain

        // File-level (resets per file)
        fileScope: {
            variables: [],       // Variables in current file
            lastValue: null,     // Last retrieved/created value (for "it" resolution)
            references: [],      // { line, name, type } — for pronoun graph
            imports: [],         // Imported modules
            exports: [],         // Exported names
        },

        // Short-term memory (for pronoun resolution)
        memory: {
            lastSubject: null,   // Most recent noun/entity
            lastAction: null,    // Most recent verb
            lastResult: null,    // Most recent operation result
            history: [],         // Stack of { line, subject, type }
        },

        // Session memory (persisted to .lume/context-memory.json)
        session: {
            developerStyle: null,  // 'formal' | 'casual' | 'mixed'
            frequentOps: {},       // { 'database_query': 45, 'ui_update': 12 }
            pastResolutions: [],   // Learned resolutions
        },
    }
}

/* ── Context API ─────────────────────────────────────── */

/**
 * Reset file-level scope (called at start of each new file)
 */
export function resetFileScope() {
    context.fileScope = {
        variables: [],
        lastValue: null,
        references: [],
        imports: [],
        exports: [],
    }
    context.memory = {
        lastSubject: null,
        lastAction: null,
        lastResult: null,
        history: [],
    }
}

/**
 * Register a variable in the current scope
 */
export function registerVariable(name, type = 'any', line = 0) {
    context.fileScope.variables.push({ name, type, line })
    if (!context.variables.includes(name)) context.variables.push(name)
}

/**
 * Register a data model (e.g., from schema detection)
 */
export function registerDataModel(name, fields = []) {
    context.dataModels[name] = { fields }
    if (!context.tables.includes(name)) context.tables.push(name)
}

/**
 * Register a function
 */
export function registerFunction(name, params = []) {
    if (!context.functions.includes(name)) context.functions.push(name)
}

/**
 * Update short-term memory after resolving a line
 */
export function updateMemory(line, subject, action, result) {
    context.memory.lastSubject = subject
    context.memory.lastAction = action
    context.memory.lastResult = result
    context.memory.history.push({ line, subject, action, type: result?.type })

    // Track in file references for dependency graph
    context.fileScope.references.push({ line, name: subject, type: result?.type })
    context.fileScope.lastValue = result
}

/**
 * Resolve a pronoun ("it", "they", "their", "this", "that")
 * Returns the most likely referent from short-term memory
 */
export function resolvePronoun(pronoun, currentLine = 0) {
    const p = pronoun.toLowerCase()

    // "it" / "this" / "that" → last subject
    if (['it', 'this', 'that'].includes(p)) {
        if (!context.memory.lastSubject) return { resolved: false, warning: `LUME-W003: No referent found for "${pronoun}"` }
        const distance = currentLine - (context.memory.history[context.memory.history.length - 1]?.line || 0)
        if (distance > 20) return { resolved: true, value: context.memory.lastSubject, warning: `LUME-W002: "${pronoun}" refers to "${context.memory.lastSubject}" from ${distance} lines ago. Consider using the name explicitly.` }
        return { resolved: true, value: context.memory.lastSubject }
    }

    // "they" / "them" / "their" → last subject (collection or entity)
    if (['they', 'them', 'their', 'those'].includes(p)) {
        if (!context.memory.lastSubject) return { resolved: false, warning: `LUME-W003: No referent found for "${pronoun}"` }
        return { resolved: true, value: context.memory.lastSubject }
    }

    return { resolved: false }
}

/**
 * Build dependency graph for cross-line resolution
 * Returns references that depend on a given line
 */
export function getDependents(line) {
    return context.fileScope.references.filter(r => {
        const dep = context.memory.history.find(h => h.line === line)
        return dep && r.name === dep.subject && r.line > line
    })
}

/**
 * Get the full context for AI resolution (Layer B)
 */
export function getAIContext() {
    return {
        dataModels: context.dataModels,
        tables: context.tables,
        functions: context.functions,
        currentVariables: context.fileScope.variables,
        lastSubject: context.memory.lastSubject,
        lastAction: context.memory.lastAction,
        recentHistory: context.memory.history.slice(-10),
        domain: context.domain,
    }
}

/**
 * Get context for auto-correct (project-aware dictionary)
 */
export function getAutocorrectContext() {
    return {
        variables: context.variables,
        tables: context.tables,
        functions: context.functions,
    }
}

/* ── Project Scanner ─────────────────────────────────── */

/**
 * Scan a project directory for data models, schemas, etc.
 * Populates the context with project-level information.
 */
export function scanProject(projectRoot) {
    try {
        // Look for common schema/model files
        const schemaFiles = [
            'schema.prisma', 'schema.sql',
            'models/index.js', 'db/schema.js', 'db/init.js',
            'package.json',
        ]

        for (const file of schemaFiles) {
            const fullPath = path.join(projectRoot, file)
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf-8')
                extractModels(content, file)
            }
        }

        // Auto-detect domain from package.json
        const pkgPath = path.join(projectRoot, 'package.json')
        if (fs.existsSync(pkgPath)) {
            detectDomain(JSON.parse(fs.readFileSync(pkgPath, 'utf-8')))
        }

        // Load session memory if it exists
        const memPath = path.join(projectRoot, '.lume', 'context-memory.json')
        if (fs.existsSync(memPath)) {
            context.session = JSON.parse(fs.readFileSync(memPath, 'utf-8'))
        }
    } catch {
        // Silent fail — context starts empty and grows
    }
}

/**
 * Extract data models from a schema file
 */
function extractModels(content, filename) {
    // SQL CREATE TABLE detection
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\)/gi
    let m
    while ((m = tableRegex.exec(content)) !== null) {
        const name = m[1]
        const fields = m[2].match(/["`]?(\w+)["`]?\s+(?:TEXT|INTEGER|SERIAL|VARCHAR|BOOLEAN|TIMESTAMP|UUID|JSONB?)/gi)
            ?.map(f => f.split(/\s+/)[0].replace(/["`]/g, '')) || []
        registerDataModel(name, fields)
    }

    // Prisma model detection
    const prismaRegex = /model\s+(\w+)\s*{([\s\S]*?)}/g
    while ((m = prismaRegex.exec(content)) !== null) {
        const name = m[1]
        const fields = m[2].match(/(\w+)\s+(?:String|Int|Boolean|DateTime|Float|Json)/g)
            ?.map(f => f.split(/\s+/)[0]) || []
        registerDataModel(name, fields)
    }
}

/**
 * Auto-detect project domain from package.json
 */
function detectDomain(pkg) {
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    const name = (pkg.name || '').toLowerCase()
    const desc = (pkg.description || '').toLowerCase()

    if (deps.includes('stripe') || desc.includes('shop') || desc.includes('commerce')) context.domain = 'e-commerce'
    else if (deps.includes('express') || deps.includes('fastify') || deps.includes('koa')) context.domain = 'web-api'
    else if (deps.includes('react') || deps.includes('vue') || deps.includes('angular')) context.domain = 'web-app'
    else if (desc.includes('health') || desc.includes('medical') || desc.includes('patient')) context.domain = 'healthcare'
    else if (deps.includes('three') || desc.includes('game') || desc.includes('3d')) context.domain = 'gaming'
    else context.domain = 'general'
}

/**
 * Persist session memory to disk
 */
export function saveSession(projectRoot) {
    try {
        const lumeDir = path.join(projectRoot, '.lume')
        if (!fs.existsSync(lumeDir)) fs.mkdirSync(lumeDir, { recursive: true })
        fs.writeFileSync(path.join(lumeDir, 'context-memory.json'), JSON.stringify(context.session, null, 2))
    } catch {
        // Silent fail
    }
}

export { context }
