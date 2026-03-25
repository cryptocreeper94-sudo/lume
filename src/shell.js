/**
 * ====== Lume Shell v1.0.0 ======
 * A conversational AI/OS shell powered by the Lume intent-resolving compiler.
 * 
 * The Lume Shell extends the standard REPL into a full system interaction layer:
 *   - Natural language commands routed to system domain modules
 *   - File system operations ("show me the files in this folder")
 *   - Process management ("what's running?", "kill that process")
 *   - Network operations ("fetch the weather API")
 *   - Multi-turn conversational memory (context carries forward)
 *   - Adaptive Voice Profile integration
 *   - Review Mode for dangerous operations
 *   - All commands are intent-resolved through the Tolerance Chain
 * 
 * Usage:
 *   lume shell                     Start interactive shell
 *   lume shell --voice             Start with voice input enabled
 *   lume shell --domain=fs         Restrict to file system domain
 *   lume shell --review            Enable Review Mode for all system ops
 */

import { createInterface } from 'node:readline'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync, mkdirSync, renameSync, appendFileSync } from 'node:fs'
import { resolve, basename, dirname, extname, join, relative } from 'node:path'
import { homedir, hostname, platform, cpus, totalmem, freemem, uptime } from 'node:os'
import { execSync, spawn } from 'node:child_process'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { transpile } from './transpiler.js'
import { matchPattern } from './intent-resolver/pattern-library.js'

/* ── Colors ── */
const C = {
    reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
    green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    cyan: '\x1b[36m', red: '\x1b[31m', magenta: '\x1b[35m',
    white: '\x1b[37m', bg_cyan: '\x1b[46m',
}
function c(color, text) { return `${C[color]}${text}${C.reset}` }

/* ── Domain Module: File System ── */
const fsDomain = {
    name: 'File System',
    icon: '📁',
    patterns: [
        { regex: /^(?:show|list|ls|dir|what(?:'s| is) in)\s+(?:me\s+)?(?:the\s+)?(?:files?\s+(?:in|at|from)\s+)?(.+)/i, action: 'list' },
        { regex: /^(?:read|open|cat|show|display)\s+(?:the\s+)?(?:file\s+)?(.+)/i, action: 'read' },
        { regex: /^(?:create|make|touch|new)\s+(?:a\s+)?(?:file\s+)?(?:called\s+)?(.+)/i, action: 'create' },
        { regex: /^(?:delete|remove|rm)\s+(?:the\s+)?(?:file\s+)?(.+)/i, action: 'delete' },
        { regex: /^(?:rename|move|mv)\s+(?:the\s+)?(?:file\s+)?(.+?)\s+(?:to|as)\s+(.+)/i, action: 'rename' },
        { regex: /^(?:write|append|add)\s+(?:to\s+)?(?:the\s+)?(?:file\s+)?(.+?)\s*:\s*(.+)/i, action: 'write' },
        { regex: /^(?:search|find|grep|look for)\s+(.+?)\s+(?:in|inside|within)\s+(.+)/i, action: 'search' },
        { regex: /^(?:how (?:big|large) is|size of|file size)\s+(.+)/i, action: 'size' },
        { regex: /^(?:mkdir|create directory|make folder|new folder)\s+(.+)/i, action: 'mkdir' },
        { regex: /^(?:where am i|pwd|current directory|cwd)/i, action: 'cwd' },
        { regex: /^(?:go to|cd|change (?:to|directory))\s+(.+)/i, action: 'cd' },
    ],

    execute(action, matches, context) {
        try {
            switch (action) {
                case 'list': {
                    const dir = resolve(context.cwd, matches[1]?.trim() || '.')
                    if (!existsSync(dir)) return { ok: false, msg: `Directory not found: ${dir}` }
                    const entries = readdirSync(dir)
                    const details = entries.map(e => {
                        try {
                            const s = statSync(join(dir, e))
                            const type = s.isDirectory() ? '📁' : '📄'
                            const size = s.isDirectory() ? `${readdirSync(join(dir, e)).length} items` : formatBytes(s.size)
                            return `  ${type} ${e.padEnd(30)} ${size}`
                        } catch { return `  ❓ ${e}` }
                    })
                    context.lastCollection = entries
                    context.lastPath = dir
                    return { ok: true, msg: `${c('cyan', dir)} — ${entries.length} items\n${details.join('\n')}` }
                }

                case 'read': {
                    const file = resolve(context.cwd, matches[1].trim())
                    if (!existsSync(file)) return { ok: false, msg: `File not found: ${file}` }
                    const content = readFileSync(file, 'utf-8')
                    const lines = content.split('\n')
                    const preview = lines.length > 50 ? lines.slice(0, 50).join('\n') + `\n${c('dim', `... (${lines.length - 50} more lines)`)}` : content
                    context.lastSubject = file
                    context.lastContent = content
                    return { ok: true, msg: `${c('cyan', basename(file))} — ${lines.length} lines\n${preview}` }
                }

                case 'create': {
                    const file = resolve(context.cwd, matches[1].trim())
                    if (existsSync(file)) return { ok: false, msg: `File already exists: ${file}` }
                    writeFileSync(file, '', 'utf-8')
                    context.lastSubject = file
                    return { ok: true, msg: `Created ${c('green', basename(file))}` }
                }

                case 'delete': {
                    const file = resolve(context.cwd, matches[1].trim())
                    if (!existsSync(file)) return { ok: false, msg: `File not found: ${file}` }
                    return { ok: true, msg: `Delete ${c('yellow', basename(file))}?`, confirm: () => { unlinkSync(file); return `Deleted ${basename(file)}` } }
                }

                case 'rename': {
                    const from = resolve(context.cwd, matches[1].trim())
                    const to = resolve(context.cwd, matches[2].trim())
                    if (!existsSync(from)) return { ok: false, msg: `File not found: ${from}` }
                    renameSync(from, to)
                    context.lastSubject = to
                    return { ok: true, msg: `Renamed ${c('yellow', basename(from))} → ${c('green', basename(to))}` }
                }

                case 'write': {
                    const file = resolve(context.cwd, matches[1].trim())
                    const content = matches[2].trim()
                    appendFileSync(file, content + '\n', 'utf-8')
                    return { ok: true, msg: `Wrote to ${c('green', basename(file))}` }
                }

                case 'search': {
                    const query = matches[1].trim()
                    const dir = resolve(context.cwd, matches[2].trim())
                    if (!existsSync(dir)) return { ok: false, msg: `Directory not found: ${dir}` }
                    const results = []
                    const files = readdirSync(dir).filter(f => { try { return statSync(join(dir, f)).isFile() } catch { return false } })
                    for (const f of files) {
                        try {
                            const content = readFileSync(join(dir, f), 'utf-8')
                            const lines = content.split('\n')
                            lines.forEach((line, i) => {
                                if (line.toLowerCase().includes(query.toLowerCase())) {
                                    results.push(`  ${c('cyan', f)}:${c('yellow', String(i + 1))} ${line.trim().substring(0, 80)}`)
                                }
                            })
                        } catch { /* skip binary */ }
                    }
                    return { ok: true, msg: results.length > 0 ? `Found ${results.length} matches:\n${results.slice(0, 20).join('\n')}` : `No matches for "${query}" in ${dir}` }
                }

                case 'size': {
                    const file = resolve(context.cwd, matches[1].trim())
                    if (!existsSync(file)) return { ok: false, msg: `File not found: ${file}` }
                    const s = statSync(file)
                    return { ok: true, msg: `${c('cyan', basename(file))} — ${formatBytes(s.size)}` }
                }

                case 'mkdir': {
                    const dir = resolve(context.cwd, matches[1].trim())
                    mkdirSync(dir, { recursive: true })
                    return { ok: true, msg: `Created directory ${c('green', basename(dir))}` }
                }

                case 'cwd': {
                    return { ok: true, msg: `${c('cyan', context.cwd)}` }
                }

                case 'cd': {
                    const dir = resolve(context.cwd, matches[1].trim())
                    if (!existsSync(dir)) return { ok: false, msg: `Directory not found: ${dir}` }
                    context.cwd = dir
                    return { ok: true, msg: `Changed to ${c('cyan', dir)}` }
                }

                default:
                    return { ok: false, msg: 'Unknown file system action' }
            }
        } catch (err) {
            return { ok: false, msg: `Error: ${err.message}` }
        }
    }
}

/* ── Domain Module: Process ── */
const processDomain = {
    name: 'Process',
    icon: '⚙️',
    patterns: [
        { regex: /^(?:run|execute|exec|start)\s+(.+)/i, action: 'run' },
        { regex: /^(?:what(?:'s| is) running|list processes|ps|processes)/i, action: 'list' },
        { regex: /^(?:kill|stop|end)\s+(?:process\s+)?(\d+)/i, action: 'kill' },
        { regex: /^(?:system info|sysinfo|about this (?:computer|machine|system))/i, action: 'sysinfo' },
        { regex: /^(?:memory|ram|how much memory)/i, action: 'memory' },
        { regex: /^(?:uptime|how long|system uptime)/i, action: 'uptime' },
    ],

    execute(action, matches, context) {
        try {
            switch (action) {
                case 'run': {
                    const cmd = matches[1].trim()
                    // Dangerous command check
                    const dangerous = /\b(rm\s+-rf|del\s+\/s|format\s+|shutdown|reboot)\b/i
                    if (dangerous.test(cmd)) {
                        return { ok: true, msg: `${c('yellow', '⚠ Dangerous command detected:')} ${cmd}`, confirm: () => {
                            const output = execSync(cmd, { cwd: context.cwd, timeout: 30000, encoding: 'utf-8' })
                            return output || '(no output)'
                        }}
                    }
                    const output = execSync(cmd, { cwd: context.cwd, timeout: 30000, encoding: 'utf-8' })
                    context.lastOutput = output
                    return { ok: true, msg: output.trim() || '(completed — no output)' }
                }

                case 'list': {
                    const cmd = platform() === 'win32' ? 'tasklist /fo csv /nh' : 'ps aux --sort=-pcpu | head -20'
                    const output = execSync(cmd, { timeout: 10000, encoding: 'utf-8' })
                    return { ok: true, msg: output.trim().split('\n').slice(0, 15).join('\n') }
                }

                case 'kill': {
                    const pid = matches[1]
                    return { ok: true, msg: `Kill process ${pid}?`, confirm: () => {
                        const cmd = platform() === 'win32' ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`
                        execSync(cmd, { timeout: 5000, encoding: 'utf-8' })
                        return `Process ${pid} terminated`
                    }}
                }

                case 'sysinfo': {
                    const info = [
                        `  ${c('cyan', 'Hostname:')}  ${hostname()}`,
                        `  ${c('cyan', 'Platform:')}  ${platform()}`,
                        `  ${c('cyan', 'CPUs:')}      ${cpus().length}x ${cpus()[0]?.model || 'unknown'}`,
                        `  ${c('cyan', 'Memory:')}    ${formatBytes(totalmem())} total, ${formatBytes(freemem())} free`,
                        `  ${c('cyan', 'Uptime:')}    ${formatUptime(uptime())}`,
                        `  ${c('cyan', 'Node:')}      ${process.version}`,
                        `  ${c('cyan', 'Lume:')}      v0.9.0`,
                    ]
                    return { ok: true, msg: info.join('\n') }
                }

                case 'memory': {
                    const used = totalmem() - freemem()
                    const pct = ((used / totalmem()) * 100).toFixed(1)
                    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5))
                    return { ok: true, msg: `  ${c('cyan', 'Memory:')} ${formatBytes(used)} / ${formatBytes(totalmem())} (${pct}%)\n  [${c('green', bar)}]` }
                }

                case 'uptime': {
                    return { ok: true, msg: `  System uptime: ${c('cyan', formatUptime(uptime()))}` }
                }

                default:
                    return { ok: false, msg: 'Unknown process action' }
            }
        } catch (err) {
            return { ok: false, msg: `Error: ${err.message}` }
        }
    }
}

/* ── Domain Module: Network ── */
const networkDomain = {
    name: 'Network',
    icon: '🌐',
    patterns: [
        { regex: /^(?:fetch|get|download|request|curl|hit)\s+(.+)/i, action: 'fetch' },
        { regex: /^(?:ping|check|is .+ (?:up|alive|online))\s*(.+)?/i, action: 'ping' },
        { regex: /^(?:what(?:'s| is) my ip|my ip|ip address)/i, action: 'ip' },
    ],

    async execute(action, matches, context) {
        try {
            switch (action) {
                case 'fetch': {
                    let url = matches[1].trim()
                    if (!url.startsWith('http')) url = 'https://' + url
                    const res = await fetch(url)
                    const text = await res.text()
                    const preview = text.substring(0, 500)
                    context.lastOutput = text
                    return { ok: true, msg: `  ${c('cyan', 'Status:')} ${res.status} ${res.statusText}\n  ${c('cyan', 'Size:')}   ${formatBytes(text.length)}\n  ${c('cyan', 'Preview:')}\n${preview}${text.length > 500 ? '\n' + c('dim', `... (${text.length - 500} more chars)`) : ''}` }
                }

                case 'ping': {
                    let host = (matches[1] || '').trim()
                    if (!host) return { ok: false, msg: 'Specify a host to ping' }
                    host = host.replace(/^https?:\/\//, '').split('/')[0]
                    const cmd = platform() === 'win32' ? `ping -n 3 ${host}` : `ping -c 3 ${host}`
                    const output = execSync(cmd, { timeout: 15000, encoding: 'utf-8' })
                    return { ok: true, msg: output.trim() }
                }

                case 'ip': {
                    try {
                        const res = await fetch('https://api.ipify.org?format=json')
                        const data = await res.json()
                        return { ok: true, msg: `  Your IP: ${c('cyan', data.ip)}` }
                    } catch {
                        return { ok: false, msg: 'Could not determine IP address' }
                    }
                }

                default:
                    return { ok: false, msg: 'Unknown network action' }
            }
        } catch (err) {
            return { ok: false, msg: `Error: ${err.message}` }
        }
    }
}

/* ── Domain Module: Lume (Compilation) ── */
const lumeDomain = {
    name: 'Lume',
    icon: '✦',
    patterns: [
        { regex: /^(?:compile|build)\s+(.+\.lume)/i, action: 'compile' },
        { regex: /^(?:run)\s+(.+\.lume)/i, action: 'run' },
        { regex: /^(?:explain|what does)\s+(.+)/i, action: 'explain' },
        { regex: /^(?:define|let|set|show|create a?)\s+/i, action: 'eval' },
    ],

    execute(action, matches, context) {
        try {
            switch (action) {
                case 'compile': {
                    const file = resolve(context.cwd, matches[1].trim())
                    if (!existsSync(file)) return { ok: false, msg: `File not found: ${file}` }
                    const source = readFileSync(file, 'utf-8')
                    const tokens = tokenize(source, basename(file))
                    const ast = parse(tokens, basename(file))
                    const js = transpile(ast, basename(file))
                    const outFile = file.replace(/\.lume$/, '.js')
                    writeFileSync(outFile, js, 'utf-8')
                    return { ok: true, msg: `${c('green', '✓')} Compiled ${basename(file)} → ${basename(outFile)}` }
                }

                case 'run': {
                    const file = resolve(context.cwd, matches[1].trim())
                    if (!existsSync(file)) return { ok: false, msg: `File not found: ${file}` }
                    const source = readFileSync(file, 'utf-8')
                    const tokens = tokenize(source, basename(file))
                    const ast = parse(tokens, basename(file))
                    const js = transpile(ast, basename(file))
                    const fn = new Function(js)
                    fn()
                    return { ok: true, msg: `${c('green', '✓')} Executed ${basename(file)}` }
                }

                case 'explain': {
                    const input = matches[1]?.trim()
                    const match = matchPattern(input)
                    if (match) {
                        return { ok: true, msg: `  ${c('cyan', 'Intent:')} ${match.type}\n  ${c('cyan', 'Pattern:')} ${match.patternName}\n  ${c('cyan', 'Confidence:')} ${(match.confidence * 100).toFixed(0)}%` }
                    }
                    return { ok: true, msg: `  Could not resolve intent for: "${input}"` }
                }

                case 'eval': {
                    const input = matches.input || matches[0]
                    const match = matchPattern(input)
                    if (match) {
                        return { ok: true, msg: `  ${c('cyan', '→')} ${match.type}: ${JSON.stringify(match.args || {})}` }
                    }
                    return { ok: false, msg: `  Could not resolve: "${input}"` }
                }

                default:
                    return { ok: false, msg: 'Unknown Lume action' }
            }
        } catch (err) {
            return { ok: false, msg: `Error: ${err.message}` }
        }
    }
}

/* ── Conversational Context ── */
class ShellContext {
    constructor() {
        this.cwd = process.cwd()
        this.lastSubject = null      // Last singular entity
        this.lastCollection = null   // Last plural entity
        this.lastOutput = null       // Last command output
        this.lastPath = null         // Last directory viewed
        this.lastContent = null      // Last file content read
        this.history = []            // Command history
        this.turnCount = 0
        this.pendingConfirm = null   // Pending dangerous operation
    }

    addTurn(input, domain, result) {
        this.history.push({
            turn: ++this.turnCount,
            input,
            domain: domain?.name || 'shell',
            success: result?.ok ?? true,
            timestamp: Date.now()
        })
        // Keep last 50 turns
        if (this.history.length > 50) this.history.shift()
    }

    resolvePronouns(input) {
        // Resolve "it", "them", "that", "those", "this"
        let resolved = input
        if (/\b(it|that|this)\b/i.test(input) && this.lastSubject) {
            resolved = resolved.replace(/\b(it|that|this)\b/i, this.lastSubject)
        }
        if (/\b(them|those)\b/i.test(input) && this.lastCollection) {
            resolved = resolved.replace(/\b(them|those)\b/i, this.lastCollection.join(', '))
        }
        if (/\bhere\b/i.test(input)) {
            resolved = resolved.replace(/\bhere\b/i, this.cwd)
        }
        return resolved
    }
}

/* ── Intent Router ── */
const domains = [fsDomain, processDomain, networkDomain, lumeDomain]

function routeIntent(input, context) {
    // Resolve pronouns first
    const resolved = context.resolvePronouns(input)

    for (const domain of domains) {
        for (const pattern of domain.patterns) {
            const match = resolved.match(pattern.regex)
            if (match) {
                return { domain, action: pattern.action, matches: match }
            }
        }
    }
    return null
}

/* ── Shell Built-in Commands ── */
const builtins = {
    '.help': () => {
        return [
            c('bold', '\n  Lume Shell Commands'),
            '',
            c('cyan', '  File System'),
            c('dim', '    "show me the files here"        List current directory'),
            c('dim', '    "read package.json"              Show file contents'),
            c('dim', '    "create a file called notes.md"  Create a new file'),
            c('dim', '    "search TODO in src"             Find text in files'),
            c('dim', '    "where am i"                     Print working directory'),
            c('dim', '    "go to D:\\projects"               Change directory'),
            '',
            c('cyan', '  Process'),
            c('dim', '    "system info"                    Show machine information'),
            c('dim', '    "memory"                         Show RAM usage'),
            c('dim', '    "run npm test"                   Execute a command'),
            c('dim', '    "what\'s running"                  List processes'),
            '',
            c('cyan', '  Network'),
            c('dim', '    "fetch api.github.com"           HTTP GET request'),
            c('dim', '    "ping google.com"                Check if host is alive'),
            c('dim', '    "what\'s my ip"                    Show public IP'),
            '',
            c('cyan', '  Lume'),
            c('dim', '    "compile app.lume"               Compile a Lume file'),
            c('dim', '    "run app.lume"                   Execute a Lume file'),
            c('dim', '    "explain get all users"           Show intent resolution'),
            '',
            c('cyan', '  Shell'),
            c('dim', '    .help                            This help'),
            c('dim', '    .history                         Command history'),
            c('dim', '    .clear                           Clear screen'),
            c('dim', '    .domains                         List active domains'),
            c('dim', '    .context                         Show current context'),
            c('dim', '    .exit                            Exit shell'),
            '',
        ].join('\n')
    },

    '.history': (ctx) => {
        if (ctx.history.length === 0) return c('dim', '  No history yet')
        return ctx.history.map(h =>
            `  ${c('dim', '#' + h.turn)} ${h.ok ? c('green', '✓') : c('red', '✗')} [${c('cyan', h.domain)}] ${h.input}`
        ).join('\n')
    },

    '.clear': () => { process.stdout.write('\x1b[2J\x1b[H'); return '' },

    '.domains': () => {
        return domains.map(d =>
            `  ${d.icon} ${c('cyan', d.name.padEnd(15))} ${d.patterns.length} patterns`
        ).join('\n')
    },

    '.context': (ctx) => {
        return [
            `  ${c('cyan', 'CWD:')}             ${ctx.cwd}`,
            `  ${c('cyan', 'Last Subject:')}     ${ctx.lastSubject || '(none)'}`,
            `  ${c('cyan', 'Last Collection:')}  ${ctx.lastCollection ? ctx.lastCollection.length + ' items' : '(none)'}`,
            `  ${c('cyan', 'Last Path:')}        ${ctx.lastPath || '(none)'}`,
            `  ${c('cyan', 'Turn Count:')}       ${ctx.turnCount}`,
            `  ${c('cyan', 'Pending Confirm:')}  ${ctx.pendingConfirm ? 'yes' : 'no'}`,
        ].join('\n')
    },
}

/* ── Utilities ── */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

/* ── Shell Entry Point ── */
export function startShell(options = {}) {
    const context = new ShellContext()
    const reviewMode = options.review || false
    const historyFile = resolve(homedir(), '.lume_shell_history')

    // Load history
    let savedHistory = []
    if (existsSync(historyFile)) {
        try { savedHistory = readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean) } catch {}
    }

    // Banner
    console.log(c('magenta', '\n  ✦ Lume Shell v1.0.0') + c('dim', ' — Intent-Resolving System Shell'))
    console.log(c('dim', `  ${domains.length} domain modules · ${domains.reduce((n, d) => n + d.patterns.length, 0)} patterns · Conversational context enabled`))
    console.log(c('dim', `  CWD: ${context.cwd}`))
    if (reviewMode) console.log(c('yellow', '  ⚠ Review Mode: all system operations require confirmation'))
    console.log(c('dim', '  Type .help for commands. Speak naturally.\n'))

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: c('cyan', '  ✦ ') + c('dim', '› '),
        historySize: 200,
        history: savedHistory.slice(-200),
        completer: (line) => {
            const completions = [
                ...Object.keys(builtins),
                'show me the files', 'read ', 'create a file called ', 'delete ',
                'run ', 'system info', 'memory', 'what\'s running',
                'fetch ', 'ping ', 'what\'s my ip',
                'compile ', 'explain ', 'where am i', 'go to ',
            ]
            const hits = completions.filter(c => c.startsWith(line.trim().toLowerCase()))
            return [hits.length ? hits : completions, line]
        }
    })

    rl.prompt()

    rl.on('line', async (input) => {
        const trimmed = input.trim()
        if (!trimmed) { rl.prompt(); return }

        // Save to history file
        try { appendFileSync(historyFile, trimmed + '\n') } catch {}

        // Handle confirmation for pending dangerous ops
        if (context.pendingConfirm) {
            const answer = trimmed.toLowerCase()
            if (answer === 'y' || answer === 'yes' || answer === 'do it' || answer === 'confirm') {
                try {
                    const result = context.pendingConfirm()
                    console.log(c('green', `  ✓ ${result}`))
                } catch (err) {
                    console.log(c('red', `  ✗ ${err.message}`))
                }
            } else {
                console.log(c('yellow', '  Cancelled.'))
            }
            context.pendingConfirm = null
            rl.prompt()
            return
        }

        // Built-in dot commands
        const dotCmd = trimmed.split(' ')[0].toLowerCase()
        if (builtins[dotCmd]) {
            console.log(builtins[dotCmd](context))
            rl.prompt()
            return
        }
        if (dotCmd === '.exit' || dotCmd === '.quit' || trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
            console.log(c('dim', '\n  Goodbye. ✦\n'))
            rl.close()
            return
        }

        // Route intent to domain module
        const route = routeIntent(trimmed, context)

        if (!route) {
            // Try as a direct shell command
            try {
                const output = execSync(trimmed, { cwd: context.cwd, timeout: 15000, encoding: 'utf-8' })
                console.log(output.trim())
                context.lastOutput = output
                context.addTurn(trimmed, { name: 'passthrough' }, { ok: true })
            } catch {
                console.log(c('dim', `  I didn't understand: "${trimmed}"`))
                console.log(c('dim', '  Try .help to see what I can do, or just type a system command.'))
                context.addTurn(trimmed, null, { ok: false })
            }
            rl.prompt()
            return
        }

        // Execute via domain module
        const { domain, action, matches } = route
        const displayAction = `${domain.icon} ${c('dim', domain.name)} → ${c('cyan', action)}`

        try {
            const result = await domain.execute(action, matches, context)
            context.addTurn(trimmed, domain, result)

            if (result.confirm && (reviewMode || result.msg.includes('⚠'))) {
                console.log(`  ${displayAction}`)
                console.log(`  ${result.msg}`)
                console.log(c('yellow', '  Confirm? [y/n]: '))
                context.pendingConfirm = result.confirm
            } else if (result.confirm) {
                // Auto-confirm non-dangerous ops outside review mode
                console.log(`  ${displayAction}`)
                const confirmResult = result.confirm()
                console.log(c('green', `  ✓ ${confirmResult}`))
            } else if (result.ok) {
                console.log(`  ${displayAction}`)
                console.log(result.msg)
            } else {
                console.log(`  ${displayAction}`)
                console.log(c('red', `  ✗ ${result.msg}`))
            }
        } catch (err) {
            console.log(c('red', `  ✗ Error: ${err.message}`))
            context.addTurn(trimmed, domain, { ok: false })
        }

        rl.prompt()
    })

    rl.on('close', () => {
        process.exit(0)
    })
}
