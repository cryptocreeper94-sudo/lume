/**
 * ====== Lume Watcher ======
 * Watches Lume files for changes and auto-recompiles/reruns.
 * 
 * Features:
 *   - File system watcher with debouncing
 *   - Auto-run on change
 *   - Auto-build on change
 *   - Clear error display
 *   - Colored output
 */

import { watch } from 'node:fs'
import { readFileSync } from 'node:fs'
import { resolve, basename, dirname, extname } from 'node:path'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { transpile } from './transpiler.js'

const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
}

function color(c, text) { return `${COLORS[c]}${text}${COLORS.reset}` }

export class Watcher {
    constructor(filepath, mode = 'run') {
        this.filepath = resolve(filepath)
        this.filename = basename(filepath)
        this.mode = mode  // 'run' or 'build'
        this.debounceTimer = null
        this.lastContent = null
    }

    start() {
        console.log(color('magenta', '\n  ✦ Lume Watch Mode'))
        console.log(color('dim', `  Watching ${this.filename} (${this.mode} on change)`))
        console.log(color('dim', '  Press Ctrl+C to stop\n'))

        // Initial run
        this._execute()

        // Watch for changes
        const dir = dirname(this.filepath)
        watch(dir, { recursive: false }, (eventType, changedFile) => {
            if (changedFile && basename(changedFile) === this.filename) {
                // Debounce — wait 200ms for multiple rapid changes
                clearTimeout(this.debounceTimer)
                this.debounceTimer = setTimeout(() => {
                    // Check if content actually changed
                    try {
                        const content = readFileSync(this.filepath, 'utf-8')
                        if (content !== this.lastContent) {
                            this.lastContent = content
                            console.log(color('cyan', `\n  ↻ ${this.filename} changed at ${new Date().toLocaleTimeString()}`))
                            this._execute()
                        }
                    } catch { }
                }, 200)
            }
        })
    }

    _execute() {
        try {
            const source = readFileSync(this.filepath, 'utf-8')
            this.lastContent = source
            const tokens = tokenize(source, this.filename)
            const ast = parse(tokens, this.filename)
            const js = transpile(ast, this.filename)

            if (this.mode === 'build') {
                const outPath = this.filepath.replace(/\.lume$/, '.js')
                const { writeFileSync } = require('node:fs')
                writeFileSync(outPath, js, 'utf-8')
                console.log(color('green', `  ✓ Built ${basename(outPath)}`))
            } else {
                // Run mode
                console.log(color('dim', '  ─────────────────────'))
                try {
                    new Function(js)()
                } catch (e) {
                    console.log(color('red', `  Runtime Error: ${e.message}`))
                }
                console.log(color('dim', '  ─────────────────────'))
            }
        } catch (e) {
            console.log(color('red', `\n${e.message}\n`))
        }
    }
}

export function startWatch(filepath, mode) {
    new Watcher(filepath, mode).start()
}
