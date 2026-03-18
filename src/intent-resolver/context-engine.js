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
        // CHI Paper §5.5 — Bounded sliding window with RFT scoring
        memory: {
            lastSubject: null,       // Most recent singular entity
            lastCollection: null,    // Most recent plural entity/collection
            lastAction: null,        // Most recent verb
            lastResult: null,        // Most recent operation result
            history: [],             // Stack of { line, subject, action, type, isCollection }
        },

        // Session memory (persisted to .lume/context-memory.json)
        session: {
            developerStyle: null,  // 'formal' | 'casual' | 'mixed'
            frequentOps: {},       // { 'database_query': 45, 'ui_update': 12 }
            pastResolutions: [],   // Learned resolutions
        },
    }
}

/* ── RFT Configuration (CHI Paper §5.5) ─────────────── */
const RFT_WEIGHTS = { recency: 0.5, frequency: 0.3, typeMatch: 0.2 }
const DISAMBIGUATION_THRESHOLD = 0.15 // If top-2 candidates within this gap → ask
const CONTEXT_WINDOW = 5              // Sliding window for pronoun resolution

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
        lastCollection: null,
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
 * Update short-term memory after resolving a line.
 * Classifies the subject as singular or collection for pronoun routing.
 */
export function updateMemory(line, subject, action, result) {
    const isCollection = detectCollection(subject, result)

    if (isCollection) {
        context.memory.lastCollection = subject
    } else {
        context.memory.lastSubject = subject
    }
    context.memory.lastAction = action
    context.memory.lastResult = result
    context.memory.history.push({ line, subject, action, type: result?.type, isCollection })

    // Track in file references for dependency graph
    context.fileScope.references.push({ line, name: subject, type: result?.type })
    context.fileScope.lastValue = result
}

/**
 * Detect whether a subject refers to a collection or a singular entity
 */
function detectCollection(subject, result) {
    if (!subject) return false
    const s = subject.toLowerCase()
    // Plural heuristics: ends in 's' (but not 'ss'), or known collection types
    const pluralEndings = s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('us')
    const collectionKeywords = ['all', 'every', 'each', 'list', 'array', 'set', 'group', 'results']
    const isCollectionType = result?.type && ['ForEachLoop', 'QueryOperation', 'FilterOperation', 'SortOperation'].includes(result.type)
    return pluralEndings || collectionKeywords.some(k => s.includes(k)) || isCollectionType
}

/**
 * ═══════════════════════════════════════════════════════════
 *  PRONOUN RESOLUTION with RFT SCORING & DisambiguationRequired
 *  CHI Paper §5.5 — Anaphora Resolution: The Context Stack
 *
 *  Uses a Recency-Frequency-Type (RFT) model:
 *    Score(entity) = α·Recency + β·Frequency + γ·TypeMatch(entity, verb)
 *  where α=0.5, β=0.3, γ=0.2
 *
 *  When the top-2 candidates are within DISAMBIGUATION_THRESHOLD,
 *  returns a DisambiguationRequired result instead of guessing.
 * ═══════════════════════════════════════════════════════════
 */
export function resolvePronoun(pronoun, currentLine = 0, verb = null) {
    const p = pronoun.toLowerCase()

    // ── Singular pronouns: "it" / "this" / "that" ──
    if (['it', 'this', 'that'].includes(p)) {
        return resolveWithRFT(p, currentLine, verb, false)
    }

    // ── Plural pronouns: "they" / "them" / "their" / "those" ──
    if (['they', 'them', 'their', 'those'].includes(p)) {
        return resolveWithRFT(p, currentLine, verb, true)
    }

    return { resolved: false }
}

/**
 * RFT-based resolution with disambiguation detection
 */
function resolveWithRFT(pronoun, currentLine, verb, preferCollection) {
    // Get the sliding window of recent history
    const window = context.memory.history.slice(-CONTEXT_WINDOW)
    if (window.length === 0) {
        return { resolved: false, warning: `LUME-W003: No referent found for "${pronoun}"` }
    }

    // Build candidate list — unique subjects in the window
    const candidateMap = new Map()
    for (const entry of window) {
        if (!entry.subject) continue
        const key = entry.subject.toLowerCase()
        if (!candidateMap.has(key)) {
            candidateMap.set(key, { subject: entry.subject, entries: [], isCollection: entry.isCollection })
        }
        candidateMap.get(key).entries.push(entry)
    }

    if (candidateMap.size === 0) {
        return { resolved: false, warning: `LUME-W003: No referent found for "${pronoun}"` }
    }

    // If only one candidate, use it directly (no ambiguity possible)
    if (candidateMap.size === 1) {
        const [, candidate] = [...candidateMap.entries()][0]
        const distance = currentLine - candidate.entries[candidate.entries.length - 1].line
        if (distance > 20) {
            return {
                resolved: true,
                value: candidate.subject,
                warning: `LUME-W002: "${pronoun}" refers to "${candidate.subject}" from ${distance} lines ago. Consider using the name explicitly.`
            }
        }
        return { resolved: true, value: candidate.subject }
    }

    // Score each candidate using RFT model
    const scored = []
    const maxLine = Math.max(...window.map(e => e.line), 1)
    const minLine = Math.min(...window.map(e => e.line), 0)
    const lineRange = maxLine - minLine || 1

    for (const [key, candidate] of candidateMap) {
        // Recency: most recent occurrence normalized to [0, 1]
        const lastLine = Math.max(...candidate.entries.map(e => e.line))
        const recency = (lastLine - minLine) / lineRange

        // Frequency: count of occurrences normalized by window size
        const frequency = candidate.entries.length / window.length

        // TypeMatch: does the entity type match what the verb expects?
        let typeMatch = 0.5 // neutral default
        if (preferCollection && candidate.isCollection) typeMatch = 1.0
        else if (!preferCollection && !candidate.isCollection) typeMatch = 1.0
        else if (preferCollection && !candidate.isCollection) typeMatch = 0.1
        else if (!preferCollection && candidate.isCollection) typeMatch = 0.1

        // If verb is provided, boost matching types
        if (verb) {
            const collectionVerbs = ['sort', 'filter', 'count', 'group', 'iterate', 'list', 'each']
            const singularVerbs = ['show', 'display', 'update', 'edit', 'save', 'print']
            if (collectionVerbs.includes(verb) && candidate.isCollection) typeMatch = 1.0
            if (singularVerbs.includes(verb) && !candidate.isCollection) typeMatch = 1.0
        }

        const score = RFT_WEIGHTS.recency * recency +
                       RFT_WEIGHTS.frequency * frequency +
                       RFT_WEIGHTS.typeMatch * typeMatch

        scored.push({ subject: candidate.subject, score, recency, frequency, typeMatch, line: lastLine, isCollection: candidate.isCollection })
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]
    const runnerUp = scored[1]

    // ── DisambiguationRequired check ──
    // If top-2 are within threshold → ambiguous, ask the developer
    const gap = best.score - runnerUp.score
    if (gap < DISAMBIGUATION_THRESHOLD) {
        return {
            resolved: false,
            disambiguationRequired: true,
            pronoun,
            candidates: scored.slice(0, Math.min(scored.length, 4)).map((c, i) => ({
                label: String.fromCharCode(97 + i), // a, b, c, d
                subject: c.subject,
                score: Math.round(c.score * 100),
                line: c.line,
                isCollection: c.isCollection,
            })),
            message: `DisambiguationRequired at line ${currentLine}:\n` +
                `  "${pronoun}" — ambiguous reference.\n` +
                `  Did you mean:\n` +
                scored.slice(0, 4).map((c, i) =>
                    `    (${String.fromCharCode(97 + i)}) ${c.subject}    [${c.isCollection ? 'LastCollection' : 'LastSubject'}, set at line ${c.line}]`
                ).join('\n') + '\n' +
                `  Clarify with: "the ${scored[0].subject}" or "the ${scored[1].subject}"`,
            warning: `LUME-W004: "${pronoun}" is ambiguous — multiple referents scored within ${(DISAMBIGUATION_THRESHOLD * 100).toFixed(0)}% of each other.`,
        }
    }

    // Clear winner — resolve directly
    const distance = currentLine - best.line
    if (distance > 20) {
        return {
            resolved: true,
            value: best.subject,
            confidence: best.score,
            warning: `LUME-W002: "${pronoun}" refers to "${best.subject}" from ${distance} lines ago. Consider using the name explicitly.`
        }
    }

    return { resolved: true, value: best.subject, confidence: best.score }
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
