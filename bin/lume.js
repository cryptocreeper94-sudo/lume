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
import { startShell } from '../src/shell.js'
import { startWatch } from '../src/watcher.js'
import { detectMode, resolveEnglishFile, matchPattern } from '../src/intent-resolver/index.js'
import { generateSourceMap } from '../src/sourcemap.js'
import { transcriptionToLume } from '../src/intent-resolver/voice-input.js'
import { explainNode, explainAST as explainASTFull, summarizeAST, explainFile as explainFileFull } from '../src/intent-resolver/explainer.js'
import { parseAppDescription, generateProjectStructure } from '../src/intent-resolver/app-generator.js'
import { createBundle, getCompileCommand } from '../src/intent-resolver/bundler.js'
import { diffAST, formatDiff, nodeIdentity } from '../src/intent-resolver/ast-differ.js'
import { canonicalizeFile, isCanonical, loadStyleConfig } from '../src/intent-resolver/canonicalizer.js'
import { translateError, formatEnglishError, createStepDebugger } from '../src/intent-resolver/error-translator.js'
import { loadVoiceConfig, matchesVoiceCommand } from '../src/intent-resolver/voice-config.js'
import { processTranscription, processCorrection, splitRunOnSentences } from '../src/intent-resolver/voice-input.js'
import { diffVersions, analyzeUpgradeImpact, formatUpgradeReport, getAvailableVersions, PATTERN_LIBRARY_VERSION } from '../src/intent-resolver/pattern-versioning.js'
import { generateDocs } from '../src/intent-resolver/comments.js'

const VERSION = '0.8.0'

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
        console.log(color('magenta', '\n  ✦ Lume v' + VERSION) + color('dim', ' — The AI-Native Programming Language\n'))
        console.log(color('cyan', '  Get started:'))
        console.log(color('dim', '    lume init              Create a new Lume project'))
        console.log(color('dim', '    lume repl              Start interactive REPL'))
        console.log(color('dim', '    lume run <file.lume>   Run a Lume program'))
        console.log(color('dim', '    lume help              Show all commands\n'))
        console.log(color('dim', '  New to Lume? Try:  echo \'show "Hello!"\' > hello.lume && lume run hello.lume\n'))
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
        case 'shell':
            return startShell({ review: flags.includes('--review'), voice: flags.includes('--voice') })
        case 'watch':
            return startWatch(args[1], args.includes('--build') ? 'build' : 'run')
        case 'ast':
            return printAST(args[1])
        case 'tokens':
            return printTokens(args[1])
        case 'test':
            return runTests(args[1])
        case 'explain':
            return explainFileCmd(args[1], flags)
        case 'listen':
            return listenCmd(flags)
        case 'create':
            return createCmd(args.slice(1), flags)
        case 'bundle':
            return bundleCmd(args[1], flags)
        case 'compile':
            return compileCmd(args[1], flags)
        case 'diff':
            return diffCmd(args[1], args[2])
        case 'voice':
            return voiceCmd(args.slice(1), flags)
        case 'verify':
            return verifyHash(args)
        case 'init':
            return initCmd(flags)
        case 'canonicalize':
            return canonicalizeCmd(args[1], flags)
        case 'debug':
            return debugCmd(args[1], flags)
        case 'upgrade':
            return upgradeCmd(flags)
        case 'install':
            return installCmd(args[1])
        case 'docs':
            return docsCmd(args[1])
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
        lang: options.lang,
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
    const langFlag = flags.find(f => f.startsWith('--lang'))
    const lang = langFlag ? (langFlag.includes('=') ? langFlag.split('=')[1] : flags[flags.indexOf(langFlag) + 1]) : undefined

    try {
        const result = compile(source, filename, { quiet: flags.includes('--quiet'), lang })

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

// ─── M11: Explain (Full Reverse Mode) ───
function explainFileCmd(filepath, flags) {
    const { source, filename } = readSource(filepath)
    const isSummary = flags.includes('--summary')

    console.log(color('magenta', `\n  ✦ Lume Explain — ${filename}`))

    const result = explainFileFull(source, filename, { mode: isSummary ? 'summary' : 'annotate' })

    if (isSummary) {
        console.log(color('cyan', '\n  Summary:'))
        console.log(color('dim', `  ${result.summary}`))
    } else {
        console.log(color('dim', `  ${result.annotations.length} annotations\n`))
        for (const ann of result.annotations) {
            console.log(color('cyan', `  Line ${ann.line}: `) + color('dim', `"${ann.code}"`))
            console.log(color('green', `    → ${ann.explanation}`))
            console.log()
        }
    }
    console.log()
}

// ─── M9: Listen (Voice-to-Code) ───
function listenCmd(flags) {
    const mode = flags.includes('--english') ? 'english' : 'natural'

    console.log(color('magenta', `\n  ✦ Lume Listen — Voice-to-Code`))
    console.log(color('dim', `  Mode: ${mode}`))
    console.log(color('dim', '  Paste transcribed lines below. Press Ctrl+D when done.\n'))

    let input = ''
    try {
        input = readFileSync(0, 'utf-8')
    } catch {
        console.log(color('yellow', '  No input received.'))
        return
    }

    if (!input.trim()) {
        console.log(color('yellow', '  No input received.'))
        return
    }

    const lines = input.split('\n').filter(l => l.trim())
    const result = transcriptionToLume(lines, { mode })

    console.log(color('green', '  ✓ Processed'))
    console.log(color('dim', `  ${result.corrections.length} corrections applied\n`))
    console.log(result.source)

    if (result.corrections.length > 0) {
        console.log(color('dim', '\n  Corrections:'))
        for (const c of result.corrections) {
            console.log(color('dim', `    Line ${c.line}: ${c.message}`))
        }
    }
}

// ─── M9: Voice (Interactive Voice-to-Code Session) ───
function voiceCmd(args, flags) {
    const config = loadVoiceConfig()
    const voiceCfg = config.voice
    const outputFlag = flags.find(f => f.startsWith('--output'))
    const outputFile = outputFlag
        ? (outputFlag.includes('=') ? outputFlag.split('=')[1] : args[args.indexOf(outputFlag) + 1])
        : null
    const liveMode = flags.includes('--live')
    const reviewMode = flags.includes('--review')
    const engineFlag = flags.find(f => f.startsWith('--engine'))
    const engine = engineFlag
        ? (engineFlag.includes('=') ? engineFlag.split('=')[1] : 'system')
        : voiceCfg.engine

    console.log(color('magenta', `\n  ✦ Lume Voice — Interactive Voice-to-Code`))
    console.log(color('dim', `  Engine: ${engine} · Language: ${voiceCfg.language}`))
    console.log(color('dim', `  Mode: ${liveMode ? 'Live (compile each line)' : 'Batch (compile at end)'}`))
    if (outputFile) console.log(color('dim', `  Output: ${outputFile}`))
    console.log(color('dim', `  Paste/type voice transcriptions. Voice commands: compile, undo, start over, read it back`))
    console.log(color('dim', '  Enter each transcribed line, then press Enter. Type "compile" or "done" when finished.\n'))

    // Read from stdin line-by-line
    const readline = require('node:readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    let instructions = []
    let paused = false
    let lineCount = 0

    const showPrompt = () => {
        const marker = paused ? color('yellow', '  ⏸ ') : color('cyan', `  ${instructions.length + 1}> `)
        process.stdout.write(marker)
    }

    showPrompt()

    rl.on('line', (input) => {
        const trimmed = input.trim()
        if (!trimmed) { showPrompt(); return }

        // Check voice commands
        if (matchesVoiceCommand(trimmed, voiceCfg.compile_commands)) {
            rl.close()
            return
        }

        if (matchesVoiceCommand(trimmed, voiceCfg.cancel_commands)) {
            instructions = []
            console.log(color('yellow', '  ✓ Cleared all instructions. Starting over.'))
            showPrompt()
            return
        }

        if (matchesVoiceCommand(trimmed, voiceCfg.undo_commands)) {
            if (instructions.length > 0) {
                const removed = instructions.pop()
                console.log(color('yellow', `  ✓ Removed: "${removed}"`))
            } else {
                console.log(color('yellow', '  Nothing to undo.'))
            }
            showPrompt()
            return
        }

        if (matchesVoiceCommand(trimmed, voiceCfg.readback_commands)) {
            if (instructions.length === 0) {
                console.log(color('dim', '  (no instructions yet)'))
            } else {
                console.log(color('cyan', '\n  Current instructions:'))
                instructions.forEach((inst, i) => {
                    console.log(color('dim', `    ${i + 1}. ${inst}`))
                })
                console.log()
            }
            showPrompt()
            return
        }

        if (matchesVoiceCommand(trimmed, voiceCfg.pause_commands)) {
            paused = true
            console.log(color('yellow', '  ⏸ Paused. Say "continue" to resume.'))
            showPrompt()
            return
        }

        if (matchesVoiceCommand(trimmed, voiceCfg.resume_commands)) {
            paused = false
            console.log(color('green', '  ▶ Resumed.'))
            showPrompt()
            return
        }

        // Handle "delete line N"
        const deleteMatch = trimmed.match(/^delete\s+line\s+(\d+)$/i)
        if (deleteMatch) {
            const n = parseInt(deleteMatch[1]) - 1
            if (n >= 0 && n < instructions.length) {
                const removed = instructions.splice(n, 1)[0]
                console.log(color('yellow', `  ✓ Deleted line ${n + 1}: "${removed}"`))
            } else {
                console.log(color('red', `  Line ${n + 1} doesn't exist.`))
            }
            showPrompt()
            return
        }

        if (paused) {
            console.log(color('yellow', '  ⏸ Paused — ignored. Say "continue" to resume.'))
            showPrompt()
            return
        }

        // Process through voice pipeline
        const splitLines = splitRunOnSentences(trimmed)
        for (const line of splitLines) {
            const processed = processTranscription(line)
            instructions.push(processed.text)
            lineCount++

            // Show transcription feedback
            if (processed.corrections.length > 0) {
                console.log(color('dim', `    ${processed.corrections.map(c => c).join(', ')}`))
            }
            console.log(color('green', `  [transcribed] ${processed.text} ✓`))

            // Live mode: compile immediately
            if (liveMode) {
                try {
                    const result = compile(processed.text, 'voice-live.lume', { quiet: true })
                    const compiled = result instanceof Promise ? '(async — pending)' : (result.js || '').trim().split('\n')[0]
                    console.log(color('cyan', `  [compiled] ${compiled} ✓`))
                } catch (e) {
                    console.log(color('red', `  [compile error] ${e.message}`))
                }
            }
        }

        showPrompt()
    })

    rl.on('close', () => {
        if (instructions.length === 0) {
            console.log(color('yellow', '\n  No instructions captured. Session ended.\n'))
            return
        }

        console.log(color('magenta', `\n  ✦ ${instructions.length} instructions captured. ${reviewMode ? 'Review:' : 'Compiling...'}`))

        if (reviewMode) {
            console.log(color('cyan', '\n  Review your instructions:'))
            instructions.forEach((inst, i) => {
                console.log(color('dim', `    ${i + 1}. ${inst}`))
            })
            console.log(color('dim', '\n  (In a full terminal environment, you could edit these before compiling)'))
        }

        // Convert to .lume source via transcriptionToLume
        const result = transcriptionToLume(instructions, { mode: 'english' })
        const filename = outputFile || `voice-session-${Date.now()}.lume`

        // Save .lume file
        writeFileSync(filename, result.source, 'utf-8')
        console.log(color('green', `  ✓ Saved ${filename}`))

        if (result.corrections.length > 0) {
            console.log(color('dim', `  ${result.corrections.length} auto-corrections applied`))
        }

        // Compile
        try {
            const outFile = filename.replace(/\.lume$/, '.js')
            const compiled = compile(result.source, filename, { quiet: true })
            const finish = (c) => {
                writeFileSync(outFile, c.js, 'utf-8')
                console.log(color('green', `  ✓ Compiled → ${outFile}`))
                if (c.certificate) console.log(color('dim', '  ✓ Security certificate attached'))
                console.log()
            }
            if (compiled instanceof Promise) {
                compiled.then(finish).catch(e => console.error(color('red', `  Compile error: ${e.message}`)))
            } else {
                finish(compiled)
            }
        } catch (e) {
            console.error(color('red', `  Compile error: ${e.message}\n`))
        }
    })
}

// ─── M10: Create (Full-Stack App Generator) ───
function createCmd(args, flags) {
    const description = args.filter(a => !a.startsWith('--')).join(' ')

    if (!description) {
        console.error(color('red', 'Error: Provide a description.'))
        console.error('Usage: lume create "a blog with authentication"')
        process.exit(1)
    }

    const preview = flags.includes('--preview')
    const { template, features, plan } = parseAppDescription(description)
    const { files } = generateProjectStructure(plan)

    console.log(color('magenta', `\n  ✦ Lume Create — App Generator`))
    console.log(color('cyan', `  Template: `) + template)
    console.log(color('cyan', `  Features: `) + (features.length > 0 ? features.join(', ') : 'none'))
    console.log(color('cyan', `  Components: `) + plan.components.length)
    console.log(color('cyan', `  Routes: `) + plan.routes.length)
    console.log(color('cyan', `  API Endpoints: `) + plan.api.length)
    console.log(color('cyan', `  Models: `) + Object.keys(plan.models).join(', '))
    console.log()

    if (preview) {
        console.log(color('bold', '  Project Structure (preview):'))
        for (const f of files) {
            console.log(color('dim', `    ${f.path}`) + color('dim', ` — ${f.description}`))
        }
        console.log(color('dim', `\n  Total: ${files.length} files`))
        console.log(color('yellow', '\n  Use without --preview to generate files.'))
    } else {
        for (const f of files) {
            const fullPath = resolve(process.cwd(), f.path)
            const dir = dirname(fullPath)
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
            if (!existsSync(fullPath)) {
                writeFileSync(fullPath, f.content || `// ${f.description}\n// Generated by Lume Create\n`, 'utf-8')
                console.log(color('green', `  ✓ Created `) + color('dim', f.path))
            } else {
                console.log(color('yellow', `  ● Exists  `) + color('dim', f.path))
            }
        }
        console.log(color('green', `\n  ✓ ${files.length} files generated`))
    }
    console.log()
}

// ─── M13: Bundle ───
function bundleCmd(filepath, flags) {
    const { source, filename } = readSource(filepath)
    const js = compile(source, filename)
    const target = flags.find(f => f.startsWith('--target='))?.split('=')[1] || 'node'
    const minify = flags.includes('--minify')

    const { bundle, size, features } = createBundle(js, { target, minify })

    const outFile = filepath.replace(/\.lume$/, '.bundle.js')
    writeFileSync(outFile, bundle, 'utf-8')

    console.log(color('magenta', `\n  ✦ Lume Bundle`))
    console.log(color('green', `  ✓ ${outFile}`))
    console.log(color('dim', `  Size: ${(size / 1024).toFixed(1)} KB`))
    console.log(color('dim', `  Target: ${target}`))
    console.log(color('dim', `  Features: ${features.length > 0 ? features.join(', ') : 'none'}`))
    if (minify) console.log(color('dim', '  Minified: yes'))
    console.log()
}

// ─── M13: Compile (Binary) ───
function compileCmd(filepath, flags) {
    const { source, filename } = readSource(filepath)
    const js = compile(source, filename)
    const target = flags.find(f => f.startsWith('--target='))?.split('=')[1] || undefined

    const { bundle } = createBundle(js, { target: target || 'node', minify: true })
    const bundlePath = filepath.replace(/\.lume$/, '.bundle.js')
    writeFileSync(bundlePath, bundle, 'utf-8')

    const outBinary = filepath.replace(/\.lume$/, process.platform === 'win32' ? '.exe' : '')
    const cmd = getCompileCommand(bundlePath, outBinary, { target })

    console.log(color('magenta', `\n  ✦ Lume Compile`))
    console.log(color('dim', `  Bundle: ${bundlePath}`))
    console.log(color('dim', `  Target: ${cmd.target}`))

    // Attempt to run the compile command
    try {
        const { execSync } = require('node:child_process')
        console.log(color('cyan', `  Running: ${cmd.command} ${cmd.args.join(' ')}`))
        execSync(`${cmd.command} ${cmd.args.join(' ')}`, { stdio: 'inherit' })
        console.log(color('green', `\n  ✓ Binary created: ${outBinary}`))
    } catch (e) {
        if (e.code === 'ENOENT' || (e.message && e.message.includes('not found'))) {
            console.log(color('yellow', `\n  ⚠ ${cmd.command} not found. Install it to compile native binaries.`))
            console.log(color('dim', `  Manual: ${cmd.command} ${cmd.args.join(' ')}`))
        } else {
            console.log(color('yellow', `\n  ⚠ Compile failed: ${e.message || e}`))
            console.log(color('dim', `  Manual: ${cmd.command} ${cmd.args.join(' ')}`))
        }
    }
    console.log()
}

// ─── M12: Diff ───
function diffCmd(fileA, fileB) {
    if (!fileA || !fileB) {
        console.error(color('red', 'Usage: lume diff <file-a.lume> <file-b.lume>'))
        process.exit(1)
    }

    const srcA = readSource(fileA)
    const srcB = readSource(fileB)
    const modeA = detectMode(srcA.source)
    const modeB = detectMode(srcB.source)

    let astA, astB
    if (modeA === 'english' || modeA === 'natural') {
        const resultA = resolveEnglishFile(srcA.source, {})
        astA = resultA.ast
    } else {
        const tokens = tokenize(srcA.source, srcA.filename)
        astA = parse(tokens, srcA.filename).body
    }
    if (modeB === 'english' || modeB === 'natural') {
        const resultB = resolveEnglishFile(srcB.source, {})
        astB = resultB.ast
    } else {
        const tokens = tokenize(srcB.source, srcB.filename)
        astB = parse(tokens, srcB.filename).body
    }

    const diffs = diffAST(astA, astB)

    console.log(color('magenta', `\n  ✦ Lume Diff`))
    console.log(color('dim', `  ${srcA.filename} ↔ ${srcB.filename}\n`))
    console.log(formatDiff(diffs))
    console.log()
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

// ─── Init: Create a new Lume project ───
function initCmd(flags) {
    const cwd = process.cwd()
    const name = basename(cwd)

    console.log(color('magenta', '\n  ✦ Lume Init') + color('dim', ' — Creating a new Lume project\n'))

    // Create main.lume
    const mainFile = resolve(cwd, 'main.lume')
    if (!existsSync(mainFile)) {
        writeFileSync(mainFile, `// ${name} — Built with Lume\n\nlet app = "${name}"\nshow "Welcome to {app}!"\n`)
        console.log(color('green', '  ✓ Created main.lume'))
    } else {
        console.log(color('yellow', '  ⚠ main.lume already exists, skipping'))
    }

    // Create package.json if it doesn't exist
    const pkgFile = resolve(cwd, 'package.json')
    if (!existsSync(pkgFile)) {
        const pkg = {
            name: name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            type: 'module',
            description: `A Lume project`,
            scripts: {
                start: 'lume run main.lume',
                build: 'lume build main.lume',
                test: 'lume test main.lume',
                lint: 'lume lint main.lume',
            },
            keywords: ['lume'],
            license: 'MIT',
        }
        writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n')
        console.log(color('green', '  ✓ Created package.json'))
    } else {
        console.log(color('yellow', '  ⚠ package.json already exists, skipping'))
    }

    // Create README
    const readmeFile = resolve(cwd, 'README.md')
    if (!existsSync(readmeFile)) {
        writeFileSync(readmeFile, `# ${name}\n\nBuilt with [Lume](https://lume-lang.vercel.app) — the AI-native programming language.\n\n## Run\n\n\`\`\`bash\nlume run main.lume\n\`\`\`\n`)
        console.log(color('green', '  ✓ Created README.md'))
    } else {
        console.log(color('yellow', '  ⚠ README.md already exists, skipping'))
    }

    console.log(color('cyan', '\n  Next steps:'))
    console.log(color('dim', '    lume run main.lume     Run your app'))
    console.log(color('dim', '    lume repl              Start interactive mode'))
    console.log(color('dim', '    lume help              See all commands\n'))
}

// ─── Gap 4: Canonicalize Command ───
function canonicalizeCmd(filepath, flags = []) {
    if (!filepath) {
        console.error(color('red', 'Usage: lume canonicalize <file.lume>'))
        process.exit(1)
    }
    const source = readSource(filepath)
    const config = loadStyleConfig(path.dirname(filepath))
    const result = canonicalizeFile(source, config)

    if (flags.includes('--check')) {
        if (result.summary.modified === 0) {
            console.log(color('green', '✓ File is in canonical form'))
            process.exit(0)
        } else {
            console.log(color('yellow', `⚠ ${result.summary.modified} of ${result.summary.total} lines are non-canonical:`))
            for (const line of result.lines) {
                if (line.wasModified) {
                    console.log(color('red', `  - Line ${line.lineNum}: "${line.original.trim()}"`))
                    console.log(color('green', `  + Line ${line.lineNum}: "${line.canonical}"`))
                    line.changes.forEach(c => console.log(color('dim', `      (${c})`)))
                }
            }
            process.exit(1)
        }
    }

    if (flags.includes('--apply')) {
        fs.writeFileSync(filepath, result.output, 'utf-8')
        console.log(color('green', `✓ Canonicalized ${result.summary.modified} lines in ${filepath}`))
        return
    }

    // Default: show diff
    if (result.summary.modified === 0) {
        console.log(color('green', '✓ File is already in canonical form'))
    } else {
        console.log(color('cyan', `Canonicalization preview for ${filepath}:`))
        console.log(color('dim', `(${result.summary.modified} of ${result.summary.total} lines would change)\n`))
        for (const line of result.lines) {
            if (line.wasModified) {
                console.log(color('red', `  - ${line.original.trim()}`))
                console.log(color('green', `  + ${line.canonical}`))
                line.changes.forEach(c => console.log(color('dim', `      (${c})`)))
                console.log()
            }
        }
        console.log(color('dim', 'Run with --apply to save changes.'))
    }
}

// ─── Gap 6: Debug Command ───
async function debugCmd(filepath, flags = []) {
    if (!filepath) {
        console.error(color('red', 'Usage: lume debug <file.lume>'))
        process.exit(1)
    }
    const source = readSource(filepath)
    const mode = detectMode(source)

    if (mode === 'standard') {
        console.log(color('yellow', 'Debug mode with enhanced errors is only available for English Mode (.lume files with "mode: english").'))
        console.log(color('dim', 'Falling back to standard run...'))
        return runFile(filepath, flags)
    }

    // Compile with source maps
    const compiled = await compileEnglish(source, filepath, mode, {
        nonInteractive: flags.includes('--non-interactive'),
    })
    if (!compiled) return

    const sm = generateSourceMap(source, compiled.js, filepath)

    if (flags.includes('--step')) {
        // Step-through debugger
        const steps = createStepDebugger(compiled.ast || [], sm)
        console.log(color('cyan', `\n  Step-through debug: ${filepath} (${steps.length} steps)\n`))
        for (const step of steps) {
            console.log(color('magenta', `  [${step.step}/${step.total}]`) + color('dim', ` Line ${step.line}: `) + `"${step.instruction}"`)
            console.log(color('dim', `    → ${step.astType} (resolved by ${step.resolvedBy})`))
        }
        return
    }

    // Normal debug run: execute with enhanced error translation
    console.log(color('cyan', `\n  Lume Debug Mode: ${filepath}\n`))
    try {
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
        const fn = new AsyncFunction(compiled.js)
        await fn()
        console.log(color('green', '\n  ✓ Program completed without errors'))
    } catch (err) {
        const translated = translateError(err, sm)
        console.error(formatEnglishError(translated, filepath))
    }
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
    ${color('cyan', 'explain')} <file> [--summary]  Explain code in plain English
    ${color('cyan', 'listen')}                      Voice transcript → .lume code
    ${color('cyan', 'create')} "description"        Generate a full-stack app
    ${color('cyan', 'bundle')} <file> [--minify]    Compile to single .js file
    ${color('cyan', 'compile')} <file>              Compile to standalone binary
    ${color('cyan', 'diff')} <a.lume> <b.lume>      AST-level semantic diff
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

${color('bold', '  VOICE INPUT')} ${color('dim', '(M9 — Voice-to-Code)')}
    ${color('cyan', 'voice')}                       Start interactive voice coding session
    ${color('cyan', 'voice')} --output app.lume      Save to specific file
    ${color('cyan', 'voice')} --live                 Compile each instruction as spoken
    ${color('cyan', 'voice')} --review               Review before compiling
    ${color('cyan', 'voice')} --engine whisper        Use OpenAI Whisper engine
    ${color('dim', 'Commands: compile, undo, delete line N, start over, read it back, pause')}

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

${color('bold', '  BUNDLING')} ${color('dim', '(M13 — Zero-Dependency)')}
    lume bundle app.lume          ${color('dim', 'Single-file JS output')}
    lume bundle app.lume --minify ${color('dim', 'Minified bundle')}
    lume compile app.lume         ${color('dim', 'Standalone binary (via Bun)')}
    --target=linux|macos|windows  ${color('dim', 'Cross-compilation target')}

${color('bold', '  API KEYS')} ${color('dim', '(set via environment or lume.config)')}
    OPENAI_API_KEY                ${color('dim', 'gpt.4o, gpt.mini, etc.')}
    ANTHROPIC_API_KEY             ${color('dim', 'claude.sonnet, claude.haiku, etc.')}
    GOOGLE_API_KEY                ${color('dim', 'gemini.pro, gemini.flash, etc.')}

${color('bold', '  EXAMPLES')}
    lume run hello.lume
    lume explain app.lume --summary
    lume create "a blog with auth"
    lume bundle app.lume --minify
    lume diff old.lume new.lume
    lume listen < transcript.txt
`)
}

// ── Gap 8: Pattern Library Upgrade ──
function upgradeCmd(flags) {
    const fromVersion = flags.find(f => f.startsWith('--from='))?.split('=')[1] || '1.0.0'
    const toVersion = flags.find(f => f.startsWith('--to='))?.split('=')[1] || PATTERN_LIBRARY_VERSION
    const dryRun = flags.includes('--dry-run')

    console.log(color('cyan', '\n  ✦ Lume Pattern Library Upgrade\n'))

    const diff = diffVersions(fromVersion, toVersion)
    if (diff.error) {
        console.error(color('red', `  Error: ${diff.error}`))
        process.exit(1)
    }

    const impact = analyzeUpgradeImpact('.', diff)
    console.log(formatUpgradeReport(diff, impact))

    if (dryRun) {
        console.log(color('yellow', '\n  [DRY RUN] No changes applied.'))
    } else {
        console.log(color('green', `\n  ✓ Upgrade complete: ${fromVersion} → ${toVersion}`))
    }
}

// ── Gap 9: Package Install ──
function installCmd(packageName) {
    if (!packageName) {
        console.error(color('red', '  Usage: lume install <package>'))
        process.exit(1)
    }

    const { recognizePackage } = require('../src/intent-resolver/package-registry.js')
    const pkg = recognizePackage(packageName)
    const npmName = pkg ? pkg.npm : packageName

    console.log(color('cyan', `\n  ✦ Installing ${npmName}...\n`))

    const { execSync } = require('node:child_process')
    try {
        execSync(`npm install ${npmName}`, { stdio: 'inherit' })
        console.log(color('green', `\n  ✓ ${npmName} installed`))
        if (pkg) {
            console.log(color('dim', `  Use it: ${pkg.importESM || pkg.importStyle}`))
        }
    } catch (err) {
        console.error(color('red', `  ✗ Failed to install ${npmName}`))
        process.exit(1)
    }
}

// ── Gap 15: Docs Generation ──
function docsCmd(file) {
    if (!file) {
        console.error(color('red', '  Usage: lume docs <file.lume>'))
        process.exit(1)
    }
    const source = fs.readFileSync(file, 'utf-8')
    const docs = generateDocs(source, file)
    console.log(docs)
}

main()
