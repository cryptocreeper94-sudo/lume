/**
 * ====== Lume Linter ======
 * Analyzes Lume source code for potential issues and style violations.
 * 
 * Categories:
 *   error   — Will likely cause runtime failures
 *   warning — Suspicious code, potential bugs
 *   style   — Style inconsistencies
 *   perf    — Performance suggestions
 * 
 * Each finding includes a suggested fix when possible.
 */

import { tokenize, TokenType } from './lexer.js'

export class Linter {
    constructor(source, filename = '<stdin>') {
        this.source = source
        this.filename = filename
        this.findings = []
        this.lines = source.split('\n')
    }

    lint() {
        this._checkIndentation()
        this._checkNamingConventions()
        this._checkUnusedVariables()
        this._checkAIBestPractices()
        this._checkStyleIssues()
        this._checkCommonErrors()
        return this.findings
    }

    _addFinding(severity, line, column, code, message, suggestion = null) {
        this.findings.push({
            severity,    // 'error' | 'warning' | 'style' | 'perf'
            file: this.filename,
            line,
            column,
            code,        // e.g., 'L001'
            message,
            suggestion,  // optional fix
        })
    }

    // ── Indentation checks ──
    _checkIndentation() {
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i]
            const content = line.trimStart()
            if (content.length === 0) continue

            const indent = line.length - content.length

            // Check for tab characters
            if (line.includes('\t')) {
                this._addFinding('error', i + 1, 1, 'L001',
                    'Tab character found. Lume uses 4 spaces for indentation.',
                    'Replace tabs with 4 spaces')
            }

            // Check for odd indentation levels
            if (indent > 0 && indent % 4 !== 0) {
                this._addFinding('warning', i + 1, 1, 'L002',
                    `Indentation is ${indent} spaces. Expected a multiple of 4.`,
                    `Adjust to ${Math.round(indent / 4) * 4} spaces`)
            }

            // Trailing whitespace
            if (line !== line.trimEnd()) {
                this._addFinding('style', i + 1, line.trimEnd().length + 1, 'L003',
                    'Trailing whitespace',
                    'Remove trailing spaces')
            }
        }
    }

    // ── Naming conventions ──
    _checkNamingConventions() {
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i].trim()

            // Function names should be snake_case
            const funcMatch = line.match(/^to\s+([a-zA-Z_]\w*)\s*\(/)
            if (funcMatch) {
                const name = funcMatch[1]
                if (name !== name.toLowerCase() && !name.includes('_')) {
                    this._addFinding('style', i + 1, line.indexOf(name) + 1, 'L010',
                        `Function name '${name}' should be snake_case.`,
                        `Rename to '${this._toSnakeCase(name)}'`)
                }
            }

            // Variable names should be snake_case
            const letMatch = line.match(/^(?:let|define)\s+([a-zA-Z_]\w*)/)
            if (letMatch) {
                const name = letMatch[1]
                if (name !== name.toLowerCase() && !name.includes('_')) {
                    this._addFinding('style', i + 1, line.indexOf(name) + 1, 'L011',
                        `Variable name '${name}' should be snake_case.`,
                        `Rename to '${this._toSnakeCase(name)}'`)
                }
            }

            // Type names should be PascalCase
            const typeMatch = line.match(/^type\s+([a-zA-Z_]\w*)/)
            if (typeMatch) {
                const name = typeMatch[1]
                if (name[0] !== name[0].toUpperCase()) {
                    this._addFinding('style', i + 1, line.indexOf(name) + 1, 'L012',
                        `Type name '${name}' should be PascalCase.`,
                        `Rename to '${name[0].toUpperCase() + name.slice(1)}'`)
                }
            }
        }
    }

    // ── Unused variable detection ──
    _checkUnusedVariables() {
        const declarations = new Map()  // name → line
        const usages = new Set()

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i].trim()

            // Track declarations
            const declMatch = line.match(/^(?:let|define)\s+([a-zA-Z_]\w*)/)
            if (declMatch) {
                declarations.set(declMatch[1], i + 1)
            }

            // Track usages (rough — check all identifiers in the line)
            const words = line.split(/[^a-zA-Z_\w]+/).filter(Boolean)
            for (const word of words) {
                usages.add(word)
            }
        }

        // Check for declared-but-unused
        for (const [name, line] of declarations) {
            // Count occurrences — if only 1 (the declaration), it's unused
            let count = 0
            for (let i = 0; i < this.lines.length; i++) {
                const regex = new RegExp(`\\b${name}\\b`, 'g')
                const matches = this.lines[i].match(regex)
                if (matches) count += matches.length
            }
            if (count <= 1) {
                this._addFinding('warning', line, 1, 'L020',
                    `Variable '${name}' is declared but never used.`,
                    `Remove the declaration or use the variable`)
            }
        }
    }

    // ── AI best practices ──
    _checkAIBestPractices() {
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i].trim()

            // AI calls without error handling
            if (/\b(?:ask|think|generate)\s+"/.test(line) && !line.startsWith('let ') && !line.startsWith('define ')) {
                this._addFinding('warning', i + 1, 1, 'L030',
                    'AI call result is not stored in a variable.',
                    'Assign to a variable: let result = ' + line.trim())
            }

            // AI calls with very short prompts
            const promptMatch = line.match(/\b(?:ask|think|generate)\s+"([^"]*)"/)
            if (promptMatch && promptMatch[1].length < 10) {
                this._addFinding('perf', i + 1, 1, 'L031',
                    'AI prompt is very short. Short prompts may produce low-quality results.',
                    'Add more context to the prompt for better results')
            }
        }
    }

    // ── Style issues ──
    _checkStyleIssues() {
        let emptyLineCount = 0

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i]

            // Line length
            if (line.length > 120) {
                this._addFinding('style', i + 1, 121, 'L040',
                    `Line is ${line.length} characters long. Max recommended is 120.`,
                    'Break into multiple lines')
            }

            // Consecutive blank lines
            if (line.trim() === '') {
                emptyLineCount++
                if (emptyLineCount > 2) {
                    this._addFinding('style', i + 1, 1, 'L041',
                        'More than 2 consecutive blank lines.',
                        'Reduce to a single blank line')
                }
            } else {
                emptyLineCount = 0
            }
        }
    }

    // ── Common errors ──
    _checkCommonErrors() {
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i].trim()

            // Missing colon after if/else/for/while/when
            if (/^(?:if|else|for|while|when)\s+.+[^:]$/.test(line) && !line.includes('->') && !line.endsWith(':')) {
                // Check for if/else if patterns that don't end with colon
                if (/^(?:if|while|for|when)\b/.test(line)) {
                    this._addFinding('error', i + 1, line.length, 'L050',
                        'Block statement is missing a colon at the end.',
                        'Add `:` at the end of the line')
                }
            }

            // = instead of == in conditions
            if (/^if\s+.*[^=!<>]=[^=]/.test(line)) {
                this._addFinding('warning', i + 1, 1, 'L051',
                    'Single `=` in condition. Did you mean `==` or `is`?',
                    'Use `==` for comparison or `is` for natural language')
            }
        }
    }

    // ── Helpers ──
    _toSnakeCase(name) {
        return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
    }

    // ══════════════════════════════════════════
    //  GAP 7: English Mode Lint Rules
    // ══════════════════════════════════════════

    lintEnglish(config = {}) {
        const rules = {
            'LUME-L001': config.rules?.['LUME-L001'] || 'suggestion',
            'LUME-L002': config.rules?.['LUME-L002'] || 'warning',
            'LUME-L003': config.rules?.['LUME-L003'] || 'warning',
            'LUME-L004': config.rules?.['LUME-L004'] || 'error',
            'LUME-L005': config.rules?.['LUME-L005'] || 'warning',
            'LUME-L006': config.rules?.['LUME-L006'] || 'suggestion',
            'LUME-L007': config.rules?.['LUME-L007'] || 'warning',
            'LUME-L008': config.rules?.['LUME-L008'] || 'suggestion',
            'LUME-L009': config.rules?.['LUME-L009'] || 'warning',
            'LUME-L010': config.rules?.['LUME-L010'] || 'error',
        }

        const strictness = config.strictness || 'standard'
        const NON_CANONICAL = { grab: 'get', fetch: 'get', pull: 'get', retrieve: 'get', display: 'show', render: 'show', store: 'save', persist: 'save', remove: 'delete', destroy: 'delete', make: 'create', build: 'create' }

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i].trim()
            const lineNum = i + 1
            if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('mode:') || line.startsWith('using:') || line.startsWith('raw:')) continue

            // LUME-L001: Non-canonical verb usage
            if (rules['LUME-L001'] !== 'off') {
                for (const [informal, canonical] of Object.entries(NON_CANONICAL)) {
                    const regex = new RegExp(`\\b${informal}\\b`, 'i')
                    if (regex.test(line)) {
                        this._addFinding(rules['LUME-L001'] === 'suggestion' ? 'style' : 'warning', lineNum, 1, 'LUME-L001',
                            `Non-canonical verb "${informal}" → use "${canonical}" instead`,
                            `Replace "${informal}" with "${canonical}"`)
                    }
                }
            }

            // LUME-L002: Vague pronouns without clear antecedent
            if (rules['LUME-L002'] !== 'off') {
                if (/\b(?:do something with|do stuff to|work on)\s+(?:it|them|this|that)\b/i.test(line)) {
                    this._addFinding('warning', lineNum, 1, 'LUME-L002',
                        'Vague pronoun without clear antecedent — what is "it"/"them"?',
                        'Replace the pronoun with the specific name of the variable or data')
                }
            }

            // LUME-L003: Unbounded operations
            if (rules['LUME-L003'] !== 'off') {
                if (/\b(?:process|delete|send to|update)\s+(?:everything|all|everyone|every)\b/i.test(line) && !/limit/i.test(line)) {
                    this._addFinding('warning', lineNum, 1, 'LUME-L003',
                        'Unbounded operation — "everything/all/everyone" with no limit',
                        'Add a limit: "limit to 100 results" or specify what to process')
                }
            }

            // LUME-L004: Non-compilable instructions
            if (rules['LUME-L004'] !== 'off') {
                if (/^(?:make it work|fix the bug|handle (?:the )?edge cases|do the right thing|figure it out|make it happen)\s*$/i.test(line)) {
                    this._addFinding('error', lineNum, 1, 'LUME-L004',
                        'Non-compilable instruction — too vague for the compiler to resolve',
                        'Describe specifically what should happen')
                }
            }

            // LUME-L005: Inconsistent naming (same concept, different names)
            // Tracked across file
            if (rules['LUME-L005'] !== 'off') {
                // Simple check: "user" vs "person" vs "account" in related contexts
                const nameRefs = line.match(/\b(?:the )?(\w+ (?:list|data|info|table|array|object))\b/gi) || []
                // Store for cross-line comparison (lightweight)
            }

            // LUME-L006: Overly verbose instruction
            if (rules['LUME-L006'] !== 'off' && strictness !== 'relaxed') {
                if (line.split(/\s+/).length > 15) {
                    this._addFinding('style', lineNum, 1, 'LUME-L006',
                        'Instruction is overly verbose (15+ words) — consider simplifying',
                        'Break into multiple shorter instructions')
                }
            }

            // LUME-L007: Missing error handling for network calls
            if (rules['LUME-L007'] !== 'off') {
                if (/\b(?:fetch|get .+ from (?:the )?(?:api|server|endpoint|url)|send .+ to)\b/i.test(line)) {
                    // Check if next few lines have error handling
                    const nextLines = this.lines.slice(i + 1, i + 4).join(' ')
                    if (!/\b(?:if .+ fails|otherwise|catch|error|retry)\b/i.test(nextLines)) {
                        this._addFinding('warning', lineNum, 1, 'LUME-L007',
                            'Network call without error handling',
                            'Add "if it fails, show an error" or "retry 3 times"')
                    }
                }
            }

            // LUME-L008: Instruction could benefit from a hint
            if (rules['LUME-L008'] !== 'off' && strictness !== 'relaxed') {
                if (/\b(?:sort|query|fetch|load|process)\b/i.test(line) && !/\b(?:limit|cache|using|timeout|retry)\b/i.test(line)) {
                    if (/\ball\b/i.test(line) || line.split(/\s+/).length > 5) {
                        this._addFinding('style', lineNum, 1, 'LUME-L008',
                            'Consider adding a performance hint (limit, cache, timeout)',
                            'e.g., "limit to 100 results" or "cache for 5 minutes"')
                    }
                }
            }

            // LUME-L009: Ambiguous "or"
            if (rules['LUME-L009'] !== 'off') {
                const orMatch = line.match(/\b(\w+)\s+or\s+(\w+)\b/i)
                if (orMatch && /\bif\b/i.test(line) && !/\bany\b/i.test(line)) {
                    this._addFinding('warning', lineNum, 1, 'LUME-L009',
                        `Ambiguous "or" — inclusive or exclusive? "${orMatch[1]} or ${orMatch[2]}"`,
                        'Use "either...or" for exclusive, "any of these" for inclusive')
                }
            }

            // LUME-L010: Contradictory instructions (simple check)
            if (rules['LUME-L010'] !== 'off') {
                if (/\bcreate\b/i.test(line)) {
                    const target = line.match(/\bcreate\s+(?:a\s+)?(?:new\s+)?(\w+)/i)?.[1]
                    if (target) {
                        for (let j = i + 1; j < Math.min(i + 5, this.lines.length); j++) {
                            const nextLine = this.lines[j].trim()
                            if (new RegExp(`\\b${target}\\b.*\\b(?:doesn't exist|not found|is missing)\\b`, 'i').test(nextLine)) {
                                this._addFinding('error', j + 1, 1, 'LUME-L010',
                                    `Contradiction: "${target}" was created on line ${lineNum} but line ${j + 1} says it doesn't exist`,
                                    'Remove the contradictory instruction')
                            }
                        }
                    }
                }
            }
        }

        return this.findings
    }
}

// ── Format output ──
export function formatFindings(findings, format = 'text') {
    if (format === 'json') {
        return JSON.stringify(findings, null, 2)
    }

    if (format === 'sarif') {
        return JSON.stringify({
            $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
            version: '2.1.0',
            runs: [{
                tool: { driver: { name: 'lume-lint', version: '0.8.0' } },
                results: findings.map(f => ({
                    ruleId: f.code,
                    level: f.severity === 'error' ? 'error' : f.severity === 'warning' ? 'warning' : 'note',
                    message: { text: f.message },
                    locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line, startColumn: f.column || 1 } } }],
                })),
            }],
        }, null, 2)
    }

    // Default: text format
    if (findings.length === 0) return '✓ No issues found'

    const lines = []
    const counts = { error: 0, warning: 0, style: 0, perf: 0, suggestion: 0 }

    for (const f of findings) {
        counts[f.severity] = (counts[f.severity] || 0) + 1
        const icon = { error: '✗', warning: '⚠', style: '○', perf: '△', suggestion: '→' }[f.severity] || '○'
        lines.push(`  ${icon} ${f.file}:${f.line}:${f.column} [${f.code}] ${f.message}`)
        if (f.suggestion) {
            lines.push(`    💡 ${f.suggestion}`)
        }
    }

    lines.push('')
    lines.push(`Found: ${counts.error || 0} errors, ${counts.warning || 0} warnings, ${counts.style || 0} style, ${counts.perf || 0} performance`)

    return lines.join('\n')
}

/**
 * Load lint config from .lume/lint-config.json
 */
export function loadLintConfig(projectRoot = '.') {
    try {
        const fs = require('node:fs')
        const path = require('node:path')
        const configPath = path.join(projectRoot, '.lume', 'lint-config.json')
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8')).lint || {}
        }
    } catch { /* ignore */ }
    return {}
}

export function lint(source, filename) {
    return new Linter(source, filename).lint()
}

