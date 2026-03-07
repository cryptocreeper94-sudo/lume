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
}

// ── Format output ──
export function formatFindings(findings) {
    if (findings.length === 0) return '✓ No issues found'

    const lines = []
    const counts = { error: 0, warning: 0, style: 0, perf: 0 }

    for (const f of findings) {
        counts[f.severity]++
        const icon = { error: '✗', warning: '⚠', style: '○', perf: '△' }[f.severity]
        lines.push(`  ${icon} ${f.file}:${f.line}:${f.column} [${f.code}] ${f.message}`)
        if (f.suggestion) {
            lines.push(`    💡 ${f.suggestion}`)
        }
    }

    lines.push('')
    lines.push(`Found: ${counts.error} errors, ${counts.warning} warnings, ${counts.style} style, ${counts.perf} performance`)

    return lines.join('\n')
}

export function lint(source, filename) {
    return new Linter(source, filename).lint()
}
