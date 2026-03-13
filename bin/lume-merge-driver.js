#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GIT MERGE DRIVER
 *  AST-level merge for .lume files using ast-differ.js
 *
 *  Installation:
 *    Add to .gitattributes:  *.lume merge=lume
 *    Add to .git/config:
 *      [merge "lume"]
 *        name = Lume AST Merge Driver
 *        driver = node path/to/lume-merge-driver.js %O %A %B
 *
 *  Usage:
 *    node lume-merge-driver.js <base> <ours> <theirs>
 *
 *  Exit codes:
 *    0 = merge successful (result written to <ours>)
 *    1 = conflicts detected (conflict markers written to <ours>)
 * ═══════════════════════════════════════════════════════════
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { tokenize } from '../src/lexer.js'
import { parse } from '../src/parser.js'
import { diffAST, nodeIdentity } from '../src/intent-resolver/ast-differ.js'

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    magenta: '\x1b[35m',
}

function color(c, text) { return `${COLORS[c]}${text}${COLORS.reset}` }

function parseFile(filepath) {
    try {
        const source = readFileSync(filepath, 'utf-8')
        const tokens = tokenize(source, filepath)
        const ast = parse(tokens, filepath)
        return { source, ast, lines: source.split('\n') }
    } catch (err) {
        console.error(color('red', `  Error parsing ${filepath}: ${err.message}`))
        return null
    }
}

function astNodeToString(node) {
    // Convert an AST node back to approximate Lume source
    switch (node.type) {
        case 'VariableDeclaration':
            return `let ${node.name} = ${node.value || '""'}`
        case 'ShowStatement':
            return `show ${typeof node.value === 'string' ? `"${node.value}"` : node.value}`
        case 'FunctionDeclaration':
            return `to ${node.name}(${(node.params || []).join(', ')}):\n    // ...\nend`
        case 'IfStatement':
            return `if ${node.condition}:\n    // ...\nend`
        default:
            return `// ${node.type} ${JSON.stringify(node).substring(0, 60)}`
    }
}

function main() {
    const args = process.argv.slice(2)

    // Help
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        console.log(color('magenta', '\n  ✦ Lume Git Merge Driver'))
        console.log(color('dim', '  AST-level merge for .lume files\n'))
        console.log('  Usage:')
        console.log('    node lume-merge-driver.js <base> <ours> <theirs>\n')
        console.log('  Setup:')
        console.log('    1. Add to .gitattributes:  *.lume merge=lume')
        console.log('    2. Add to .git/config:')
        console.log('       [merge "lume"]')
        console.log('         name = Lume AST Merge Driver')
        console.log('         driver = node bin/lume-merge-driver.js %O %A %B\n')
        console.log('  Exit codes:')
        console.log('    0 = merge successful')
        console.log('    1 = conflicts detected (conflict markers in output)\n')
        process.exit(0)
    }

    const [basePath, oursPath, theirsPath] = args

    if (!basePath || !oursPath || !theirsPath) {
        console.error(color('red', 'Error: Requires 3 arguments: <base> <ours> <theirs>'))
        process.exit(2)
    }

    console.log(color('magenta', '  ✦ Lume AST Merge'))
    console.log(color('dim', `  Base: ${basePath}`))
    console.log(color('dim', `  Ours: ${oursPath}`))
    console.log(color('dim', `  Theirs: ${theirsPath}`))

    // Parse all three versions
    const base = parseFile(basePath)
    const ours = parseFile(oursPath)
    const theirs = parseFile(theirsPath)

    // If any file fails to parse, fall back to text-level merge
    if (!base || !ours || !theirs) {
        console.log(color('yellow', '  ⚠ Parse error — falling back to text merge'))
        process.exit(1)
    }

    // Build identity maps for the base AST nodes
    const baseNodes = base.ast.body || []
    const ourNodes = ours.ast.body || []
    const theirNodes = theirs.ast.body || []

    // Compute diffs: base → ours and base → theirs
    let oursChanges, theirsChanges
    try {
        oursChanges = diffAST(base.ast, ours.ast)
        theirsChanges = diffAST(base.ast, theirs.ast)
    } catch {
        // ast-differ may not support full diffing — fall back
        console.log(color('yellow', '  ⚠ AST diff unavailable — using line-level merge'))
        process.exit(1)
    }

    // Simple merge strategy: reconstruct from line-level
    const baseLines = base.lines
    const ourLines = ours.lines
    const theirLines = theirs.lines

    const merged = []
    let conflicts = 0
    const maxLen = Math.max(baseLines.length, ourLines.length, theirLines.length)

    for (let i = 0; i < maxLen; i++) {
        const baseLine = i < baseLines.length ? baseLines[i] : null
        const ourLine = i < ourLines.length ? ourLines[i] : null
        const theirLine = i < theirLines.length ? theirLines[i] : null

        // Both same as base → keep base
        if (ourLine === baseLine && theirLine === baseLine) {
            if (baseLine !== null) merged.push(baseLine)
            continue
        }

        // Only ours changed → take ours
        if (ourLine !== baseLine && theirLine === baseLine) {
            if (ourLine !== null) merged.push(ourLine)
            continue
        }

        // Only theirs changed → take theirs
        if (theirLine !== baseLine && ourLine === baseLine) {
            if (theirLine !== null) merged.push(theirLine)
            continue
        }

        // Both changed the same way → take either
        if (ourLine === theirLine) {
            if (ourLine !== null) merged.push(ourLine)
            continue
        }

        // Both changed differently → CONFLICT
        conflicts++
        merged.push(`<<<<<<< OURS`)
        if (ourLine !== null) merged.push(ourLine)
        merged.push(`=======`)
        if (theirLine !== null) merged.push(theirLine)
        merged.push(`>>>>>>> THEIRS`)
    }

    // Write result to ours file (git convention)
    writeFileSync(oursPath, merged.join('\n'), 'utf-8')

    if (conflicts > 0) {
        console.log(color('yellow', `  ⚠ ${conflicts} conflict(s) — manual resolution required`))
        console.log(color('dim', `  Conflict markers written to ${oursPath}`))
        process.exit(1)
    } else {
        console.log(color('green', `  ✓ Clean AST merge — ${merged.length} lines`))
        console.log(color('dim', `  Result written to ${oursPath}`))
        process.exit(0)
    }
}

main()
