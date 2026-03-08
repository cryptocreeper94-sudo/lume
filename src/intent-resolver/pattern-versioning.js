/**
 * ═══════════════════════════════════════════════════════
 *  GAP 8: Pattern Library Versioning & Migration
 *
 *  - Semantic versioning for the pattern library
 *  - `patterns: X.Y` declaration in .lume files
 *  - `.lume/config.json` project-wide version pinning
 *  - Compatibility mode guarantees identical compilation
 *  - `lume upgrade` migration tooling
 * ═══════════════════════════════════════════════════════
 */

// ── Current Pattern Library Version ──
export const PATTERN_LIBRARY_VERSION = '1.0.0'

// ── Version History (resolution snapshots) ──
const VERSION_HISTORY = {
    '1.0.0': {
        released: '2026-03-01',
        patternCount: 34,
        resolutions: {
            'save the data': { type: 'StoreOperation', target: 'disk' },
            'remove the item': { type: 'DeleteOperation', hard: true },
            'grab the value': { type: 'VariableAccess', verb: 'grab' },
        },
    },
    '1.1.0': {
        released: '2026-03-15',
        patternCount: 44,
        newPatterns: [
            { pattern: 'try ... if it fails ...', node: 'TryCatchStatement' },
            { pattern: 'wait for all of ...', node: 'PromiseAllBlock' },
            { pattern: 'at the same time ...', node: 'ParallelBlock' },
            { pattern: 'use whichever finishes first ...', node: 'RaceBlock' },
            { pattern: 'in production: ...', node: 'EnvironmentBlock' },
            { pattern: 'a [entity] has: ...', node: 'StructureDefinition' },
            { pattern: 'test "name": ...', node: 'TestBlock' },
            { pattern: 'note: ...', node: 'CommentNode' },
            { pattern: 'get X from the environment', node: 'EnvVariable' },
            { pattern: 'do X every N seconds', node: 'TimerStatement' },
        ],
        changedResolutions: {
            'save the data': { type: 'StoreOperation', target: 'default_store', reason: 'Generalized from disk-only to configurable store' },
            'remove the item': { type: 'DeleteOperation', hard: false, soft: true, reason: 'Default changed to soft delete for safety' },
        },
        deprecatedPatterns: [
            { pattern: 'grab', replacement: 'get', reason: 'Non-canonical verb' },
        ],
    },
}

/**
 * Parse `patterns: X.Y` declaration from a .lume file header
 */
export function parseVersionDeclaration(source) {
    const lines = source.split('\n')
    for (const line of lines.slice(0, 10)) {
        const match = line.trim().match(/^patterns:\s*(\d+\.\d+(?:\.\d+)?)$/i)
        if (match) return match[1]
    }
    return null // No declaration — use latest
}

/**
 * Load project config from .lume/config.json
 */
export function loadProjectConfig(projectRoot = '.') {
    try {
        const fs = require('node:fs')
        const path = require('node:path')
        const configPath = path.join(projectRoot, '.lume', 'config.json')
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        }
    } catch { /* ignore */ }
    return {
        pattern_library_version: PATTERN_LIBRARY_VERSION,
        auto_upgrade: false,
        compatibility_mode: false,
    }
}

/**
 * Semantic version comparison
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function semverCompare(a, b) {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
        const va = pa[i] || 0
        const vb = pb[i] || 0
        if (va < vb) return -1
        if (va > vb) return 1
    }
    return 0
}

/**
 * Classify a version change: 'patch', 'minor', or 'major'
 */
export function classifyChange(from, to) {
    const pf = from.split('.').map(Number)
    const pt = to.split('.').map(Number)
    if (pt[0] !== pf[0]) return 'major'
    if (pt[1] !== pf[1]) return 'minor'
    return 'patch'
}

/**
 * Diff two versions — returns new, changed, deprecated patterns
 */
export function diffVersions(fromVersion, toVersion) {
    const fromSnap = VERSION_HISTORY[fromVersion]
    const toSnap = VERSION_HISTORY[toVersion]

    if (!fromSnap || !toSnap) {
        return { error: `Unknown version: ${fromSnap ? toVersion : fromVersion}` }
    }

    return {
        from: fromVersion,
        to: toVersion,
        changeType: classifyChange(fromVersion, toVersion),
        newPatterns: toSnap.newPatterns || [],
        changedResolutions: toSnap.changedResolutions || {},
        deprecatedPatterns: toSnap.deprecatedPatterns || [],
        safeToAutoUpdate: classifyChange(fromVersion, toVersion) !== 'major',
    }
}

/**
 * Scan project files for impact of a version upgrade
 */
export function analyzeUpgradeImpact(projectRoot, diff) {
    const fs = require('node:fs')
    const path = require('node:path')
    const affectedFiles = []

    // Find all .lume files
    function findLumeFiles(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.name === 'node_modules' || entry.name === '.lume') continue
                const fullPath = path.join(dir, entry.name)
                if (entry.isDirectory()) findLumeFiles(fullPath)
                else if (entry.name.endsWith('.lume')) affectedFiles.push(fullPath)
            }
        } catch { /* skip */ }
    }

    findLumeFiles(projectRoot)

    const impacts = []
    for (const file of affectedFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')
        const fileImpacts = []

        for (const [pattern, change] of Object.entries(diff.changedResolutions || {})) {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(pattern.toLowerCase())) {
                    fileImpacts.push({
                        line: i + 1,
                        instruction: lines[i].trim(),
                        change: change.reason || 'Resolution changed',
                    })
                }
            }
        }

        for (const dep of (diff.deprecatedPatterns || [])) {
            for (let i = 0; i < lines.length; i++) {
                const regex = new RegExp(`\\b${dep.pattern}\\b`, 'i')
                if (regex.test(lines[i])) {
                    fileImpacts.push({
                        line: i + 1,
                        instruction: lines[i].trim(),
                        deprecated: dep.pattern,
                        replacement: dep.replacement,
                    })
                }
            }
        }

        if (fileImpacts.length > 0) {
            impacts.push({ file, impacts: fileImpacts })
        }
    }

    return { affectedFiles: impacts, totalFiles: affectedFiles.length }
}

/**
 * Apply upgrade to a single file — rewrite deprecated patterns
 */
export function migrateFile(source, diff) {
    let output = source
    for (const dep of (diff.deprecatedPatterns || [])) {
        const regex = new RegExp(`\\b${dep.pattern}\\b`, 'gi')
        output = output.replace(regex, dep.replacement)
    }
    return output
}

/**
 * Format upgrade report for terminal output
 */
export function formatUpgradeReport(diff, impact) {
    const lines = []
    lines.push(`Pattern Library Upgrade: ${diff.from} → ${diff.to}`)
    lines.push(`Change type: ${diff.changeType}\n`)

    if (diff.newPatterns.length > 0) {
        lines.push(`  NEW PATTERNS (${diff.newPatterns.length}):`)
        for (const p of diff.newPatterns) {
            lines.push(`    - "${p.pattern}" → ${p.node}`)
        }
    }

    const changed = Object.entries(diff.changedResolutions)
    if (changed.length > 0) {
        lines.push(`  CHANGED RESOLUTIONS (${changed.length}):`)
        for (const [pattern, info] of changed) {
            lines.push(`    - "${pattern}" resolution changed`)
            lines.push(`      Reason: ${info.reason}`)
        }
    }

    if (diff.deprecatedPatterns.length > 0) {
        lines.push(`  DEPRECATED PATTERNS (${diff.deprecatedPatterns.length}):`)
        for (const d of diff.deprecatedPatterns) {
            lines.push(`    - "${d.pattern}" → use "${d.replacement}" instead`)
        }
    }

    lines.push('')
    if (impact) {
        lines.push(`Files affected: ${impact.affectedFiles.length} of ${impact.totalFiles}`)
        for (const f of impact.affectedFiles) {
            for (const i of f.impacts) {
                lines.push(`  ${f.file}:${i.line} — ${i.instruction}`)
            }
        }
    }

    return lines.join('\n')
}

/**
 * Get list of available versions
 */
export function getAvailableVersions() {
    return Object.keys(VERSION_HISTORY).sort(semverCompare)
}
