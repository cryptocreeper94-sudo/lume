/**
 * ====== Lume REPL v1.0.0 ======
 * Interactive Read-Eval-Print Loop for Lume.
 * 
 * Features:
 *   - Multi-line input (automatic block detection)
 *   - Tab autocomplete (keywords, dot-commands, scope variables)
 *   - Persistent history (~/.lume_history)
 *   - Color output
 *   - Special commands (.help, .clear, .ast, .tokens, .scope, .run, .exit)
 *   - Persistent scope across lines
 *   - English Mode toggle
 */

import { createInterface } from 'node:readline'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir } from 'node:os'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { transpile } from './transpiler.js'
import { matchPattern } from './intent-resolver/pattern-library.js'

const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
}

function color(c, text) { return `${COLORS[c]}${text}${COLORS.reset}` }

/* ── Autocomplete Data ── */
const LUME_KEYWORDS = [
    'let', 'set', 'define', 'show', 'log', 'if', 'else', 'when', 'is',
    'for', 'each', 'in', 'while', 'break', 'continue', 'return', 'then',
    'to', 'type', 'export', 'use', 'from', 'as', 'test', 'expect', 'equal',
    'with', 'all', 'default', 'ask', 'think', 'generate', 'fetch', 'read',
    'write', 'await', 'pipe', 'ok', 'error', 'fail', 'try', 'true', 'false',
    'null', 'text', 'number', 'boolean', 'list', 'map', 'any', 'nothing',
    'maybe', 'of', 'and', 'or', 'not', 'by', 'repeat', 'times',
    'mode: english', 'mode: natural', 'raw:', 'end',
]

const DOT_COMMANDS = [
    '.help', '.mode', '.clear', '.ast', '.tokens', '.history',
    '.scope', '.run', '.exit',
]

const HISTORY_FILE = resolve(homedir(), '.lume_history')
const MAX_HISTORY = 200

function loadHistory() {
    try {
        if (existsSync(HISTORY_FILE)) {
            return readFileSync(HISTORY_FILE, 'utf-8')
                .split('\n')
                .filter(l => l.trim())
                .slice(-MAX_HISTORY)
        }
    } catch { /* ignore */ }
    return []
}

function saveHistoryLine(line) {
    try {
        appendFileSync(HISTORY_FILE, line + '\n', 'utf-8')
    } catch { /* ignore */ }
}

export class REPL {
    constructor() {
        this.history = []
        this.scope = {}  // Persistent scope
        this.multiLine = ''
        this.inBlock = false
        this.blockDepth = 0
        this.mode = 'lume' // 'lume' or 'english'
    }

    _completer(line) {
        const trimmed = line.trim()

        // Dot-command completion
        if (trimmed.startsWith('.')) {
            const hits = DOT_COMMANDS.filter(c => c.startsWith(trimmed))
            return [hits.length ? hits : DOT_COMMANDS, trimmed]
        }

        // Keyword + scope variable completion
        const lastWord = trimmed.split(/\s+/).pop() || ''
        const scopeVars = Object.keys(this.scope)
        const all = [...LUME_KEYWORDS, ...scopeVars]
        const hits = all.filter(k => k.startsWith(lastWord))

        if (hits.length === 0) return [[], lastWord]
        return [hits, lastWord]
    }

    start() {
        const fileHistory = loadHistory()

        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: color('cyan', 'lume> '),
            completer: (line) => this._completer(line),
            historySize: MAX_HISTORY,
            terminal: true,
        })

        // Load persistent history into readline
        for (const entry of fileHistory) {
            rl.history = rl.history || []
            rl.history.push(entry)
        }

        console.log(color('magenta', '\n  ✦ Lume REPL v1.0.0'))
        console.log(color('dim', '  Type .help for commands, .mode to toggle English Mode, .exit to quit'))
        console.log(color('dim', '  Tab-complete keywords and variables. History saves to ~/.lume_history\n'))

        rl.prompt()

        rl.on('line', (line) => {
            const trimmed = line.trim()

            // Save to persistent history
            if (trimmed.length > 0) {
                saveHistoryLine(trimmed)
            }

            // Handle special dot-commands
            if (!this.inBlock && trimmed.startsWith('.')) {
                this._handleCommand(trimmed, rl)
                if (trimmed !== '.exit') rl.prompt()
                return
            }

            // Multi-line block handling
            if (this.inBlock) {
                if (trimmed === '' && this.blockDepth === 0) {
                    // Empty line ends the block
                    this._evaluate(this.multiLine)
                    this.multiLine = ''
                    this.inBlock = false
                    rl.setPrompt(color('cyan', 'lume> '))
                    rl.prompt()
                    return
                }
                this.multiLine += line + '\n'
                if (trimmed.endsWith(':')) this.blockDepth++
                if (line.match(/^\S/) && this.blockDepth > 0) this.blockDepth--
                rl.setPrompt(color('dim', '...   '))
                rl.prompt()
                return
            }

            // Detect block start
            if (trimmed.endsWith(':') && (
                trimmed.startsWith('if ') || trimmed.startsWith('for ') ||
                trimmed.startsWith('while ') || trimmed.startsWith('when ') ||
                trimmed.startsWith('to ') || trimmed.startsWith('type ') ||
                trimmed.startsWith('test ') || trimmed.startsWith('else')
            )) {
                this.inBlock = true
                this.blockDepth = 1
                this.multiLine = line + '\n'
                rl.setPrompt(color('dim', '...   '))
                rl.prompt()
                return
            }

            // Single line evaluation
            if (trimmed.length > 0) {
                if (this.mode === 'english') {
                    this._evaluateEnglish(trimmed)
                } else {
                    this._evaluate(trimmed)
                }
            }
            rl.prompt()
        })

        rl.on('close', () => {
            console.log(color('dim', '\nGoodbye! ✦\n'))
            process.exit(0)
        })
    }

    _handleCommand(cmd, rl) {
        const parts = cmd.split(/\s+/)
        const base = parts[0]

        switch (base) {
            case '.help':
                console.log(color('cyan', '\n  REPL Commands:'))
                console.log('  .help       Show this help')
                console.log('  .clear      Clear the screen')
                console.log('  .mode       Toggle English Mode')
                console.log('  .ast        Show AST for last input')
                console.log('  .tokens     Show tokens for last input')
                console.log('  .history    Show input history')
                console.log('  .scope      Show persistent variables')
                console.log('  .run <file> Run a .lume file in this session')
                console.log('  .exit       Exit REPL\n')
                console.log(color('dim', '  Tab to autocomplete · ↑↓ for history · History saved to ~/.lume_history\n'))
                break
            case '.mode':
                this.mode = this.mode === 'lume' ? 'english' : 'lume'
                rl.setPrompt(this.mode === 'english' ? color('green', 'english> ') : color('cyan', 'lume> '))
                console.log(color('cyan', `  Mode: ${this.mode}`))
                if (this.mode === 'english') {
                    console.log(color('dim', '  Type natural English. Pattern matching active. 102 patterns loaded.'))
                }
                break
            case '.clear':
                console.clear()
                break
            case '.ast':
                if (this.history.length > 0) {
                    try {
                        const tokens = tokenize(this.history[this.history.length - 1], '<repl>')
                        const ast = parse(tokens, '<repl>')
                        console.log(JSON.stringify(ast, null, 2))
                    } catch (e) {
                        console.log(color('red', e.message))
                    }
                }
                break
            case '.tokens':
                if (this.history.length > 0) {
                    try {
                        const tokens = tokenize(this.history[this.history.length - 1], '<repl>')
                        for (const tok of tokens) console.log(tok.toString())
                    } catch (e) {
                        console.log(color('red', e.message))
                    }
                }
                break
            case '.history':
                if (this.history.length === 0) {
                    console.log(color('dim', '  (no history yet)'))
                } else {
                    this.history.forEach((h, i) => console.log(color('dim', `  ${i + 1}: `) + h.split('\n')[0]))
                }
                break
            case '.scope':
                if (Object.keys(this.scope).length === 0) {
                    console.log(color('dim', '  (no variables in scope)'))
                } else {
                    console.log(color('cyan', '\n  Persistent Scope:'))
                    for (const [key, val] of Object.entries(this.scope)) {
                        const type = typeof val
                        const display = typeof val === 'string' ? `"${val}"` : JSON.stringify(val)
                        console.log(
                            color('dim', '  ') +
                            color('magenta', key) +
                            color('dim', `: ${type} = `) +
                            color('green', display)
                        )
                    }
                    console.log()
                }
                break
            case '.run': {
                const filepath = parts.slice(1).join(' ')
                if (!filepath) {
                    console.log(color('yellow', '  Usage: .run <file.lume>'))
                    break
                }
                try {
                    const resolved = resolve(filepath)
                    const source = readFileSync(resolved, 'utf-8')
                    console.log(color('cyan', `  Running ${filepath}...`))
                    this._evaluate(source)
                } catch (e) {
                    console.log(color('red', `  Error: ${e.message}`))
                }
                break
            }
            case '.exit':
                console.log(color('dim', '\nGoodbye! ✦\n'))
                process.exit(0)
            default:
                console.log(color('yellow', `Unknown command: ${cmd}`))
        }
    }

    _evaluate(source) {
        this.history.push(source)
        try {
            const tokens = tokenize(source, '<repl>')
            const ast = parse(tokens, '<repl>')
            const js = transpile(ast, '<repl>')

            // Remove the compiler header
            const code = js.replace(/^\/\/ Generated by Lume Compiler\n\n?/, '')

            // Capture output
            const output = []
            const origLog = console.log
            console.log = (...args) => output.push(args.join(' '))

            try {
                // Use Function constructor with persistent scope
                const scopeKeys = Object.keys(this.scope)
                const scopeValues = Object.values(this.scope)
                const fn = new Function(...scopeKeys, code)
                const result = fn(...scopeValues)

                // Capture any new variables
                const declMatch = code.matchAll(/(?:let|const)\s+(\w+)\s*=/g)
                for (const m of declMatch) {
                    try {
                        const evalFn = new Function(...scopeKeys, `${code}\nreturn ${m[1]};`)
                        this.scope[m[1]] = evalFn(...scopeValues)
                    } catch { }
                }

                console.log = origLog

                // Print captured output
                for (const line of output) {
                    console.log(color('green', '→ ') + line)
                }

                // Print return value if there is one and no explicit output
                if (result !== undefined && output.length === 0) {
                    console.log(color('green', '→ ') + String(result))
                }
            } catch (e) {
                console.log = origLog
                // Print captured output even on error
                for (const line of output) {
                    console.log(color('green', '→ ') + line)
                }
                console.log(color('red', `Runtime Error: ${e.message}`))
            }
        } catch (e) {
            console.log(color('red', e.message))
        }
    }

    _evaluateEnglish(source) {
        this.history.push(source)
        const result = matchPattern(source)
        if (result.matched) {
            console.log(color('green', '✓ ') + color('cyan', result.ast.type))
            const entries = Object.entries(result.ast).filter(([k]) => k !== 'type')
            for (const [key, value] of entries) {
                console.log(color('dim', `  ${key}: `) + color('green', JSON.stringify(value)))
            }
        } else {
            console.log(color('yellow', '⚠ Unresolved: ') + color('dim', `"${source}"`))
            console.log(color('dim', '  Would use Layer B (AI) in full compiler'))
        }
    }
}

export function startREPL() {
    new REPL().start()
}
