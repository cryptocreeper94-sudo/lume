/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GAP 3 — Implicit Module Resolution
 *  Three-tier cross-file state management:
 *    Tier 1: Local scope (automatic)
 *    Tier 2: using: directives
 *    Tier 3: Automatic cross-file search
 * ═══════════════════════════════════════════════════════════
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { createInterface } from 'node:readline'

/**
 * Parse a using: directive line.
 * Supports:
 *   using: the user module        → user.lume or user-module.lume
 *   using: helpers.lume           → explicit file
 *   using: everything from models → all .lume files in ./models/
 */
export function parseUsingDirective(line) {
    const m = line.match(/^using:\s*(.+)$/i)
    if (!m) return null

    const spec = m[1].trim()

    // Explicit .lume file
    if (spec.endsWith('.lume')) {
        return { type: 'file', path: spec }
    }

    // "everything from X folder/directory"
    const folderMatch = spec.match(/^everything\s+from\s+(?:the\s+)?(.+?)(?:\s+(?:folder|directory))?$/i)
    if (folderMatch) {
        return { type: 'folder', path: folderMatch[1].trim() }
    }

    // "the X module"
    const moduleMatch = spec.match(/^(?:the\s+)?(.+?)(?:\s+module)?$/i)
    if (moduleMatch) {
        const name = moduleMatch[1].trim().toLowerCase().replace(/\s+/g, '-')
        return { type: 'module', name, candidates: [`${name}.lume`, `${name.replace(/-/g, '_')}.lume`] }
    }

    return { type: 'module', name: spec, candidates: [`${spec}.lume`] }
}

/**
 * Build a module index by scanning all .lume files in a project.
 * Returns definitions map + writes to .lume/module-index.json
 */
export function buildModuleIndex(projectRoot) {
    const index = { definitions: {}, files: {} }
    const lumeFiles = findLumeFiles(projectRoot)

    for (const filePath of lumeFiles) {
        const relPath = relative(projectRoot, filePath).replace(/\\/g, '/')
        try {
            const source = readFileSync(filePath, 'utf-8')
            const defs = extractDefinitions(source, relPath)
            index.files[relPath] = { definitions: defs.map(d => d.name), lineCount: source.split('\n').length }
            for (const def of defs) {
                if (!index.definitions[def.name]) {
                    index.definitions[def.name] = []
                }
                index.definitions[def.name].push({
                    file: relPath,
                    line: def.line,
                    type: def.type,
                    created_by: def.instruction,
                })
            }
        } catch { /* skip unreadable files */ }
    }

    // Write module index
    const indexDir = join(projectRoot, '.lume')
    if (!existsSync(indexDir)) mkdirSync(indexDir, { recursive: true })
    writeFileSync(join(indexDir, 'module-index.json'), JSON.stringify(index, null, 2), 'utf-8')

    return index
}

/**
 * Find all .lume files in a project directory (recursive).
 */
function findLumeFiles(dir, results = []) {
    try {
        const entries = readdirSync(dir)
        for (const entry of entries) {
            if (entry.startsWith('.') || entry === 'node_modules') continue
            const fullPath = join(dir, entry)
            try {
                const stat = statSync(fullPath)
                if (stat.isDirectory()) findLumeFiles(fullPath, results)
                else if (entry.endsWith('.lume')) results.push(fullPath)
            } catch { /* skip */ }
        }
    } catch { /* skip */ }
    return results
}

/**
 * Extract variable/function definitions from a .lume file.
 */
function extractDefinitions(source, filePath) {
    const lines = source.split('\n')
    const defs = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const lineNum = i + 1

        // "create a list/variable/X called Y"
        const createMatch = line.match(/^(?:create|make|build|set up)\s+(?:a\s+)?(?:new\s+)?(?:list|variable|array|object|map)?\s*(?:called|named)\s+(.+)$/i)
        if (createMatch) {
            defs.push({ name: normalize(createMatch[1]), line: lineNum, type: 'variable', instruction: line })
            continue
        }

        // "let X = ..." / "define X"
        const letMatch = line.match(/^(?:let|define|set)\s+(\w[\w\s]*?)(?:\s*=|\s+to\s+|\s+as\s+)/i)
        if (letMatch) {
            defs.push({ name: normalize(letMatch[1]), line: lineNum, type: 'variable', instruction: line })
            continue
        }

        // "to X" (function definition)
        const fnMatch = line.match(/^to\s+(\w[\w\s]*?)(?:\s*\(|\s*,|\s*:|\s*$)/i)
        if (fnMatch) {
            defs.push({ name: normalize(fnMatch[1]), line: lineNum, type: 'function', instruction: line })
            continue
        }

        // "get X from Y" (implicit variable)
        const getMatch = line.match(/^(?:get|fetch|retrieve)\s+(?:the\s+)?(.+?)\s+from\s+/i)
        if (getMatch) {
            defs.push({ name: normalize(getMatch[1]), line: lineNum, type: 'variable', instruction: line })
        }
    }

    return defs
}

function normalize(name) {
    return name.trim().toLowerCase()
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
}

/**
 * Resolve a cross-file reference.
 * Tier 1: Check local scope (caller handles)
 * Tier 2: Check using directives
 * Tier 3: Search module index
 */
export function resolveReference(name, usingFiles, moduleIndex, options = {}) {
    const normalizedName = normalize(name)

    // Tier 2: Check using files
    const candidates = moduleIndex.definitions[normalizedName] || []
    const fromUsing = candidates.filter(c => usingFiles.includes(c.file))
    if (fromUsing.length === 1) {
        return { resolved: true, source: 'using', definition: fromUsing[0] }
    }

    // Tier 3: Search all project files
    if (candidates.length === 1) {
        return { resolved: true, source: 'auto', definition: candidates[0], suggestUsing: candidates[0].file }
    }

    if (candidates.length > 1) {
        return { resolved: false, source: 'ambiguous', candidates, needsChoice: true }
    }

    return { resolved: false, source: 'not_found', candidates: [] }
}

/**
 * Interactive cross-file resolution (terminal).
 */
export async function interactiveResolve(name, candidates, lineNum, filePath) {
    console.log()
    console.log(`  Line ${lineNum}: "${name}"`)
    console.log(`  [lume] "${name}" isn't defined in this file.`)
    console.log(`  Found matches in other files:`)
    candidates.forEach((c, i) => console.log(`    ${i + 1}. ${c.file}:${c.line} (${c.type}: ${c.created_by})`))
    console.log(`    ${candidates.length + 1}. It's a new variable (create it here)`)

    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve => {
        rl.question('  Which one? > ', ans => { rl.close(); resolve(ans.trim()) })
    })

    const choice = parseInt(answer)
    if (choice >= 1 && choice <= candidates.length) {
        const chosen = candidates[choice - 1]
        console.log(`  [lume] Using ${normalize(name)} from ${chosen.file}.`)
        console.log(`  Adding \`using: ${chosen.file}\` to this file automatically.`)
        return { resolved: true, definition: chosen, addUsing: chosen.file }
    }

    return { resolved: false, createNew: true }
}

/**
 * Format LUME-E050 error for non-interactive mode.
 */
export function formatModuleError(name, lineNum, filePath, candidates) {
    const candidateList = candidates.map(c => `    - ${c.file}:${c.line} (${normalize(name)})`).join('\n')
    return {
        type: 'error',
        code: 'LUME-E050',
        line: lineNum,
        message: `Line ${lineNum} in ${filePath}: "${name}" not found.\n  Not defined in this file and no \`using:\` directive provided.\n${candidates.length > 0 ? `  Candidates found:\n${candidateList}\n  Add a \`using:\` directive to resolve.` : '  No matches found in any project file.'}`,
    }
}

/**
 * Detect circular dependencies between files.
 */
export function detectCircularDeps(usingMap) {
    const visited = new Set()
    const inStack = new Set()
    const cycles = []

    function dfs(file, path) {
        if (inStack.has(file)) {
            cycles.push([...path, file])
            return
        }
        if (visited.has(file)) return
        visited.add(file)
        inStack.add(file)
        const deps = usingMap[file] || []
        for (const dep of deps) dfs(dep, [...path, file])
        inStack.delete(file)
    }

    for (const file of Object.keys(usingMap)) dfs(file, [])
    return cycles
}
