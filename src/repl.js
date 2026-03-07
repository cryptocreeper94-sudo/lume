/**
 * ====== Lume REPL ======
 * Interactive Read-Eval-Print Loop for Lume.
 * 
 * Features:
 *   - Multi-line input (automatic block detection)
 *   - Color output
 *   - History
 *   - Special commands (.help, .clear, .ast, .tokens, .exit)
 *   - Persistent scope across lines
 */

import { createInterface } from 'node:readline'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { transpile } from './transpiler.js'

const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
}

function color(c, text) { return `${COLORS[c]}${text}${COLORS.reset}` }

export class REPL {
    constructor() {
        this.history = []
        this.scope = {}  // Persistent scope
        this.multiLine = ''
        this.inBlock = false
        this.blockDepth = 0
    }

    start() {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: color('cyan', 'lume> '),
        })

        console.log(color('magenta', '\n  ✦ Lume REPL v0.2.0'))
        console.log(color('dim', '  Type .help for commands, .exit to quit\n'))

        rl.prompt()

        rl.on('line', (line) => {
            const trimmed = line.trim()

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
                this._evaluate(trimmed)
            }
            rl.prompt()
        })

        rl.on('close', () => {
            console.log(color('dim', '\nGoodbye! ✦\n'))
            process.exit(0)
        })
    }

    _handleCommand(cmd, rl) {
        switch (cmd) {
            case '.help':
                console.log(color('cyan', '\n  REPL Commands:'))
                console.log('  .help     Show this help')
                console.log('  .clear    Clear the screen')
                console.log('  .ast      Show AST for last input')
                console.log('  .tokens   Show tokens for last input')
                console.log('  .history  Show history')
                console.log('  .exit     Exit REPL\n')
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
                this.history.forEach((h, i) => console.log(color('dim', `  ${i + 1}: `) + h.split('\n')[0]))
                break
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
}

export function startREPL() {
    new REPL().start()
}
