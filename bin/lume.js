#!/usr/bin/env node

/**
 * ====== Lume CLI ======
 * Command-line interface for the Lume programming language.
 * 
 * Commands:
 *   lume run <file>      Run a Lume program
 *   lume build <file>    Compile to JavaScript
 *   lume fmt <file>      Format Lume source code
 *   lume lint <file>     Lint Lume source code
 *   lume repl            Start interactive REPL
 *   lume watch <file>    Watch and auto-run on changes
 *   lume ast <file>      Print the AST
 *   lume tokens <file>   Print the token stream
 *   lume test [file]     Run test blocks
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs'
import { resolve, basename, extname, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { tokenize } from '../src/lexer.js'
import { parse } from '../src/parser.js'
import { transpile } from '../src/transpiler.js'
import { Result, __lume_ask, __lume_think, __lume_generate, __lume_loadConfig } from '../src/runtime.js'
import { format } from '../src/formatter.js'
import { lint, formatFindings } from '../src/linter.js'
import { startREPL } from '../src/repl.js'
import { startWatch } from '../src/watcher.js'
import { detectMode, resolveEnglishFile, matchPattern } from '../src/intent-resolver/index.js'
import { generateSourceMap } from '../src/sourcemap.js'

const VERSION = '0.7.0'

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
}

function color(c, text) { return `${COLORS[c]}${text}${COLORS.reset}` }

function main() {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        printHelp()
        process.exit(0)
    }

    const command = args[0]
    const flags = args.filter(a => a.startsWith('--'))

    switch (command) {
        case 'run':
            return runFile(args[1], flags)
        case 'build':
            return buildFile(args[1], flags)
        case 'fmt':
        case 'format':
            return formatFile(args[1], flags)
        case 'lint':
            return lintFile(args[1])
        case 'repl':
            return startREPL()
        case 'watch':
            return startWatch(args[1], args.includes('--build') ? 'build' : 'run')
        case 'ast':
            return printAST(args[1])
        case 'tokens':
            return printTokens(args[1])
        case 'test':
            return runTests(args[1])
        case 'explain':
            return explainFile(args[1])
        case 'verify':
            return verifyHash(args)
        case 'version':
        case '--version':
        case '-v':
            console.log(`Lume v${VERSION}`)
            return
        case 'help':
        case '--help':
        case '-h':
            printHelp()
            return
        default:
            if (command.endsWith('.lume')) {
                return runFile(command, flags)
            }
            console.error(color('red', `Unknown command: ${command}`))
            console.error('Run "lume help" for usage information.')
            process.exit(1)
    }
}

function readSource(filepath) {
    if (!filepath) {
        console.error(color('red', 'Error: No file specified.'))
        console.error('Usage: lume run <file.lume>')
        process.exit(1)
    }
    const resolved = resolve(filepath)
    try {
        return { source: readFileSync(resolved, 'utf-8'), filename: basename(resolved) }
    } catch (err) {
        console.error(color('red', `Error: Could not read file '${filepath}'`))
        console.error(color('dim', `  ${err.message}`))
        process.exit(1)
    }
}

function compile(source, filename, options = {}) {
    const mode = detectMode(source)

    if (mode === 'english' || mode === 'natural') {
        // ═══ ENGLISH MODE: Intent Resolver → AST → Transpiler ═══
        // Bypasses Lexer and Parser entirely
        return compileEnglish(source, filename, mode, options)
    }

    // ═══ STANDARD MODE: Lexer → Parser → Transpiler ═══
    const tokens = tokenize(source, filename)
    const ast = parse(tokens, filename)
    const js = transpile(ast, filename)
    return { tokens, ast, js, mode: 'standard' }
}

async function compileEnglish(source, filename, mode, options = {}) {
    const lockPath = resolve(dirname(resolve(filename)), '.lume', 'compile-lock.json')
    let lockCache = null

    // Load compile lock cache if it exists
    if (existsSync(lockPath)) {
        try {
            const lockData = JSON.parse(readFileSync(lockPath, 'utf-8'))
            lockCache = lockData.cache || {}
        } catch { /* ignore corrupt lock */ }
    }

    const result = await resolveEnglishFile(source, {
        filename,
        lockCache,
        model: options.model || process.env.LUME_AI_MODEL || 'gpt-4o-mini',
        projectRoot: process.cwd(),
        securityConfig: loadSecurityConfig(),
        strict: options.strict,
    })

    // Print diagnostics
    const blocked = result.diagnostics.filter(d => d.type === 'error')
    const warnings = result.diagnostics.filter(d => d.type === 'warning' || d.type === 'confirm')
    const infos = result.diagnostics.filter(d => d.type === 'info')

    if (infos.length > 0 && !options.quiet) {
        for (const d of infos) {
            console.log(color('dim', `  ${d.message}`))
        }
    }
    if (warnings.length > 0) {
        console.log(color('yellow', `\n  ⚠ ${warnings.length} warning(s)`))
        for (const d of warnings) {
            console.log(color('yellow', `    Line ${d.line}: ${d.message}`))
        }
    }
    if (blocked.length > 0) {
        console.error(color('red', `\n  ✖ ${blocked.length} error(s) — compilation blocked`))
        for (const d of blocked) {
            console.error(color('red', `    Line ${d.line}: ${d.message}`))
        }
        process.exit(1)
    }

    // Build AST wrapper (same shape as Parser output)
    const ast = {
        type: 'Program',
        body: result.ast,
        mode,
    }

    // Transpile
    const js = transpile(ast, filename)

    // Generate source map
    const sourceMap = generateSourceMap(source, js, filename)

    // Print stats
    if (!options.quiet) {
        console.log(color('cyan', `\n  ✦ English Mode — ${result.stats.resolvedLines} lines resolved`))
        console.log(color('dim', `    Layer A (patterns): ${result.stats.patternMatches} · Layer B (AI): ${result.stats.aiResolutions} · Auto-corrections: ${result.stats.autoCorrections}`))
    }

    return { ast, js, mode, diagnostics: result.diagnostics, stats: result.stats, certificate: result.certificate, sourceMap }
}

function loadSecurityConfig() {
    const configPath = resolve(process.cwd(), '.lume', 'security-config.json')
    if (existsSync(configPath)) {
        try { return JSON.parse(readFileSync(configPath, 'utf-8')) } catch { /* default */ }
    }
    return { level: 'standard' }
}

function runFile(filepath, flags = []) {
    const { source, filename } = readSource(filepath)

    try {
        const { js } = compile(source, filename)
        const hasAICalls = js.includes('__lume_ask') || js.includes('__lume_think') || js.includes('__lume_generate')

        if (hasAICalls) {
            const asyncWrapper = `
const { __lume_ask, __lume_think, __lume_generate, __lume_loadConfig, Result } = __runtime;
const __lume_config = __lume_loadConfig();
${js.replace(/^\/\/ Generated by Lume Compiler\n/, '').replace(/import.*from.*"lume-runtime";\n/, '').replace(/const __lume_config.*;\n/, '')}
`
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
            const fn = new AsyncFunction('__runtime', asyncWrapper)
            fn({ __lume_ask, __lume_think, __lume_generate, __lume_loadConfig, Result })
                .catch(err => {
                    console.error(color('red', `Runtime Error: ${err.message}`))
                    process.exit(1)
                })
        } else {
            const wrappedCode = `(function() {\n${js}\n})()`
            const fn = new Function(wrappedCode)
            fn()
        }
    } catch (err) {
        console.error(color('red', err.message))
        process.exit(1)
    }
}

function buildFile(filepath, flags = []) {
    const { source, filename } = readSource(filepath)

    try {
        const result = compile(source, filename, { quiet: flags.includes('--quiet') })

        // Handle async (English Mode returns a Promise)
        const finish = (compiled) => {
            const outPath = filepath.replace(/\.lume$/, '.js')
            let output = compiled.js

            // Prepend security certificate if present
            if (compiled.certificate) {
                output = compiled.certificate + '\n\n' + output
            }

            // Append source map if present
            if (compiled.sourceMap) {
                output += '\n' + compiled.sourceMap.toComment()
            }

            writeFileSync(outPath, output, 'utf-8')
            console.log(color('green', `✓ Compiled ${filename} → ${basename(outPath)}`))

            // Generate compile lock (English Mode)
            if (compiled.mode === 'english' || compiled.mode === 'natural') {
                const lumeDir = resolve(dirname(resolve(filepath)), '.lume')
                if (!existsSync(lumeDir)) mkdirSync(lumeDir, { recursive: true })

                const inputHash = createHash('sha256').update(source).digest('hex')
                const outputHash = createHash('sha256').update(output).digest('hex')

                const lock = {
                    version: VERSION,
                    mode: compiled.mode,
                    source: filename,
                    compiled: new Date().toISOString(),
                    inputHash,
                    outputHash,
                    stats: compiled.stats,
                    certificate: compiled.certificate ? true : false,
                    cache: {},
                }

                // Cache resolved lines for deterministic recompilation
                if (compiled.ast?.body) {
                    for (const node of compiled.ast.body) {
                        if (node.resolvedBy) {
                            lock.cache[node.line] = { ast: node, confidence: node.confidence || 1.0 }
                        }
                    }
                }

                writeFileSync(resolve(lumeDir, 'compile-lock.json'), JSON.stringify(lock, null, 2), 'utf-8')
                console.log(color('dim', `  ✓ Compile lock written to .lume/compile-lock.json`))
                console.log(color('dim', `  ✓ Input hash:  ${inputHash.substring(0, 16)}...`))
                console.log(color('dim', `  ✓ Output hash: ${outputHash.substring(0, 16)}...`))
            }
        }

        if (result instanceof Promise) {
            result.then(finish).catch(err => {
                console.error(color('red', err.message))
                process.exit(1)
            })
        } else {
            finish(result)
        }
    } catch (err) {
        console.error(color('red', err.message))
        process.exit(1)
    }
}

function formatFile(filepath, flags = []) {
    const { source, filename } = readSource(filepath)

    try {
        const formatted = format(source)
        const check = flags.includes('--check')
        const diff = flags.includes('--diff')

        if (check) {
            if (formatted === source) {
                console.log(color('green', `✓ ${filename} is correctly formatted`))
            } else {
                console.log(color('yellow', `⚠ ${filename} needs formatting`))
                process.exit(1)
            }
        } else if (diff) {
            // Show diff
            const sourceLines = source.split('\n')
            const fmtLines = formatted.split('\n')
            let hasDiff = false
            for (let i = 0; i < Math.max(sourceLines.length, fmtLines.length); i++) {
                const orig = sourceLines[i] || ''
                const fmt = fmtLines[i] || ''
                if (orig !== fmt) {
                    hasDiff = true
                    console.log(color('red', `- ${orig}`))
                    console.log(color('green', `+ ${fmt}`))
                }
            }
            if (!hasDiff) console.log(color('green', '✓ No changes needed'))
        } else {
            // Write formatted output
            const resolved = resolve(filepath)
            writeFileSync(resolved, formatted, 'utf-8')
            console.log(color('green', `✓ Formatted ${filename}`))
        }
    } catch (err) {
        console.error(color('red', err.message))
        process.exit(1)
    }
}

function lintFile(filepath) {
    const { source, filename } = readSource(filepath)

    try {
        const findings = lint(source, filename)
        console.log(formatFindings(findings))
        const errors = findings.filter(f => f.severity === 'error')
        if (errors.length > 0) process.exit(1)
    } catch (err) {
        console.error(color('red', err.message))
        process.exit(1)
    }
}

function runTests(filepath) {
    if (filepath) {
        // Run a specific test file
        runFile(filepath)
    } else {
        // Discovery: find all .lume files with test blocks
        const cwd = process.cwd()
        console.log(color('magenta', '\n  ✦ Lume Test Runner'))
        console.log(color('dim', `  Scanning for tests in ${cwd}\n`))

        let found = 0
        const dir = resolve(cwd, 'tests')
        if (existsSync(dir)) {
            const files = readdirSync(dir).filter(f => f.endsWith('.lume'))
            for (const file of files) {
                found++
                console.log(color('cyan', `  Running ${file}...`))
                try {
                    const { source } = readSource(resolve(dir, file))
                    const { js } = compile(source, file)
                    new Function(js)()
                    console.log(color('green', `  ✓ ${file}`))
                } catch (e) {
                    console.log(color('red', `  ✗ ${file}: ${e.message}`))
                }
            }
        }

        // Also check examples
        const examples = resolve(cwd, 'examples')
        if (existsSync(examples)) {
            const files = readdirSync(examples).filter(f => f.endsWith('.lume'))
            for (const file of files) {
                const source = readFileSync(resolve(examples, file), 'utf-8')
                if (source.includes('test ') || source.includes('expect ')) {
                    found++
                    console.log(color('cyan', `  Running ${file}...`))
                    try {
                        const { js } = compile(source, file)
                        new Function(js)()
                        console.log(color('green', `  ✓ ${file}`))
                    } catch (e) {
                        console.log(color('red', `  ✗ ${file}: ${e.message}`))
                    }
                }
            }
        }

        if (found === 0) {
            console.log(color('dim', '  No test files found'))
        }
        console.log()
    }
}

function printAST(filepath) {
    const { source, filename } = readSource(filepath)
    try {
        const tokens = tokenize(source, filename)
        const ast = parse(tokens, filename)
        console.log(JSON.stringify(ast, null, 2))
    } catch (err) {
        console.error(color('red', err.message))
        process.exit(1)
    }
}

function printTokens(filepath) {
    const { source, filename } = readSource(filepath)
    try {
        const tokens = tokenize(source, filename)
        for (const tok of tokens) console.log(tok.toString())
    } catch (err) {
        console.error(color('red', err.message))
        process.exit(1)
    }
}

// ─── M11 Preview: Explain ───
function explainFile(filepath) {
    const { source, filename } = readSource(filepath)
    const lines = source.split('\n')
    const mode = detectMode(source)

    console.log(color('magenta', `\n  ✦ Lume Explain — ${filename}`))
    console.log(color('dim', `  Mode: ${mode} · ${lines.length} lines\n`))

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('mode:')) continue

        // Try pattern matching to explain
        const result = matchPattern(line)
        if (result.matched) {
            console.log(color('cyan', `  Line ${i + 1}: `) + color('dim', `"${line}"`))
            console.log(color('green', `    → ${result.ast.type}: `) + JSON.stringify(result.ast, null, 2).split('\n').map((l, j) => j === 0 ? l : '      ' + l).join('\n'))
            console.log()
        } else {
            console.log(color('cyan', `  Line ${i + 1}: `) + color('dim', `"${line}"`))
            console.log(color('yellow', `    → Could not resolve (would use AI in compile mode)`))
            console.log()
        }
    }
}

// ─── Verify ───
function verifyHash(args) {
    const hashFlag = args.find(a => a.startsWith('--hash'))
    if (!hashFlag) {
        console.error(color('red', 'Usage: lume verify --hash <hash>'))
        process.exit(1)
    }
    const hash = args[args.indexOf(hashFlag) + 1] || hashFlag.split('=')[1]
    if (!hash) {
        console.error(color('red', 'Error: No hash provided'))
        process.exit(1)
    }
    console.log(color('magenta', `\n  ✦ Lume Security Verify`))
    console.log(color('dim', `  Hash: ${hash}`))
    console.log(color('dim', `  Checking compile lock files...\n`))

    // Search for compile locks matching this hash
    const lumeDir = resolve(process.cwd(), '.lume')
    if (existsSync(resolve(lumeDir, 'compile-lock.json'))) {
        const lock = JSON.parse(readFileSync(resolve(lumeDir, 'compile-lock.json'), 'utf-8'))
        if (lock.outputHash?.startsWith(hash) || lock.inputHash?.startsWith(hash)) {
            console.log(color('green', '  ✓ VERIFIED — hash matches compile lock'))
            console.log(color('dim', `    Source: ${lock.source}`))
            console.log(color('dim', `    Compiled: ${lock.compiled}`))
            console.log(color('dim', `    Mode: ${lock.mode}`))
            return
        }
    }
    console.log(color('red', '  ✖ NOT VERIFIED — no matching compile lock found'))
    process.exit(1)
}

function printHelp() {
    console.log(`
${color('magenta', `  ✦ Lume v${VERSION}`)} ${color('dim', '— The AI-Native Programming Language')}

${color('bold', '  USAGE')}
    lume <command> [options]
    lume <file.lume>              ${color('dim', 'Shorthand for "lume run"')}

${color('bold', '  COMMANDS')}
    ${color('cyan', 'run')} <file>                  Run a Lume program
    ${color('cyan', 'build')} <file>                Compile to JavaScript
    ${color('cyan', 'explain')} <file>              Explain code in plain English (M11)
    ${color('cyan', 'verify')} --hash <hash>        Verify security certificate
    ${color('cyan', 'fmt')} <file> [--check|--diff]  Format source code
    ${color('cyan', 'lint')} <file>                 Analyze for issues
    ${color('cyan', 'repl')}                        Start interactive REPL
    ${color('cyan', 'watch')} <file> [--build]      Auto-run/build on changes
    ${color('cyan', 'test')} [file]                 Run test blocks
    ${color('cyan', 'ast')} <file>                  Print the AST
    ${color('cyan', 'tokens')} <file>               Print the token stream
    ${color('cyan', 'version')}                     Show version
    ${color('cyan', 'help')}                        Show this help

${color('bold', '  ENGLISH MODE')} ${color('dim', '(M7 — Natural Language)')}
    mode: english                 ${color('dim', 'First line of .lume file enables English Mode')}
    mode: natural                 ${color('dim', 'Same as english, also enables multilingual (M8)')}
    "get the user name"           ${color('dim', 'Pattern-matched to AST node')}
    "show it on screen"           ${color('dim', 'Pronoun resolution + context')}
    raw:                          ${color('dim', 'Escape hatch for raw JavaScript')}
    .lume/compile-lock.json       ${color('dim', 'Deterministic build cache')}
    .lume/security-config.json    ${color('dim', 'Security scan level config')}

${color('bold', '  AI FEATURES')}
    ask "prompt"                  ${color('dim', 'Standard AI call (temp 0.7)')}
    think "prompt"                ${color('dim', 'Analytical AI (temp 0.3)')}
    generate "prompt"             ${color('dim', 'Creative AI (temp 1.0)')}
    ask claude.sonnet "..."       ${color('dim', 'Use specific model')}
    ask "..." as json             ${color('dim', 'Parse output as JSON')}

${color('bold', '  INTEROP')}
    fetch "url" as json           ${color('dim', 'HTTP GET with JSON parsing')}
    fetch.post "url" with { }     ${color('dim', 'POST with body')}
    value |> function             ${color('dim', 'Pipe operator')}
    read "file.txt"               ${color('dim', 'Read file contents')}
    write "data" to "file.txt"    ${color('dim', 'Write to file')}

${color('bold', '  API KEYS')} ${color('dim', '(set via environment or lume.config)')}
    OPENAI_API_KEY                ${color('dim', 'gpt.4o, gpt.mini, etc.')}
    ANTHROPIC_API_KEY             ${color('dim', 'claude.sonnet, claude.haiku, etc.')}
    GOOGLE_API_KEY                ${color('dim', 'gemini.pro, gemini.flash, etc.')}

${color('bold', '  EXAMPLES')}
    lume run hello.lume
    lume fmt src/ --check
    lume lint my_program.lume
    lume repl
    lume watch main.lume
`)
}

main()
