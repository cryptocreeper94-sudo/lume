/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Formatter — Comprehensive Test Suite
 *  Tests code formatting: indentation normalization,
 *  whitespace trimming, blank line management, and
 *  operator spacing.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { format, Formatter } from '../../src/formatter.js'

// ══════════════════════════════════════
//  API Surface
// ══════════════════════════════════════

describe('Formatter: API', () => {
    it('exports format function', () => {
        assert.equal(typeof format, 'function')
    })
    it('exports Formatter class', () => {
        assert.ok(Formatter)
        assert.equal(typeof Formatter, 'function')
    })
    it('Formatter has format method', () => {
        const f = new Formatter('')
        assert.equal(typeof f.format, 'function')
    })
    it('format returns a string', () => {
        const result = format('let x = 1')
        assert.equal(typeof result, 'string')
    })
})

// ══════════════════════════════════════
//  Trailing Whitespace
// ══════════════════════════════════════

describe('Formatter: Trailing Whitespace', () => {
    it('removes trailing spaces', () => {
        const result = format('let x = 1   ')
        assert.ok(!result.match(/  +$/m))
    })
    it('removes trailing tabs', () => {
        const result = format('let x = 1\t\t')
        assert.ok(!result.includes('\t'))
    })
    it('removes trailing whitespace on multiple lines', () => {
        const result = format('let x = 1   \nlet y = 2   ')
        const lines = result.split('\n')
        for (const line of lines) {
            assert.equal(line, line.trimEnd())
        }
    })
})

// ══════════════════════════════════════
//  Indentation Normalization
// ══════════════════════════════════════

describe('Formatter: Indentation', () => {
    it('converts tabs to 4 spaces', () => {
        const result = format('\tlet x = 1')
        assert.ok(result.includes('    let x = 1'))
        assert.ok(!result.includes('\t'))
    })
    it('converts nested tabs', () => {
        const result = format('\t\tshow "hello"')
        assert.ok(result.includes('        show "hello"'))
    })
    it('preserves 4-space indentation', () => {
        const result = format('    let x = 1')
        assert.ok(result.includes('    let x = 1'))
    })
    it('handles mixed tabs and spaces', () => {
        const result = format('\t    let x = 1')
        assert.ok(!result.includes('\t'))
    })
})

// ══════════════════════════════════════
//  Blank Line Management
// ══════════════════════════════════════

describe('Formatter: Blank Lines', () => {
    it('collapses multiple blank lines to one', () => {
        const result = format('let x = 1\n\n\n\nlet y = 2')
        assert.ok(!result.includes('\n\n\n'))
    })
    it('preserves single blank line', () => {
        const result = format('let x = 1\n\nlet y = 2')
        const lines = result.split('\n')
        // Should have a blank line (empty string) between declarations
        assert.ok(lines.some(l => l === ''))
    })
    it('adds blank line before top-level to declaration', () => {
        const result = format('let x = 1\nto greet():\n    show "hi"')
        // Between let and to, should insert blank line
        assert.ok(result.includes('\n\n'))
    })
    it('adds blank line before top-level type declaration', () => {
        const result = format('let x = 1\ntype User:\n    name: text')
        assert.ok(result.includes('\n\n'))
    })
})

// ══════════════════════════════════════
//  Trailing Newlines
// ══════════════════════════════════════

describe('Formatter: Trailing Newlines', () => {
    it('ends with exactly one newline', () => {
        const result = format('let x = 1')
        assert.ok(result.endsWith('\n'))
        assert.ok(!result.endsWith('\n\n'))
    })
    it('trims excess trailing newlines', () => {
        const result = format('let x = 1\n\n\n\n')
        assert.ok(result.endsWith('\n'))
        assert.ok(!result.endsWith('\n\n'))
    })
    it('adds newline if missing', () => {
        const result = format('let x = 1')
        assert.ok(result.endsWith('\n'))
    })
})

// ══════════════════════════════════════
//  Comment Preservation
// ══════════════════════════════════════

describe('Formatter: Comments', () => {
    it('preserves single-line comments', () => {
        const result = format('// this is a comment')
        assert.ok(result.includes('// this is a comment'))
    })
    it('preserves indented comments', () => {
        const result = format('    // indented comment')
        assert.ok(result.includes('    // indented comment'))
    })
    it('does not modify comment content', () => {
        const result = format('// x=1 y=2 z=3')
        assert.ok(result.includes('// x=1 y=2 z=3'))
    })
})

// ══════════════════════════════════════
//  Declaration Detection
// ══════════════════════════════════════

describe('Formatter: Declaration Start Detection', () => {
    it('detects to function', () => {
        const f = new Formatter('')
        assert.ok(f._isDeclarationStart('to greet():'))
    })
    it('detects type', () => {
        const f = new Formatter('')
        assert.ok(f._isDeclarationStart('type User:'))
    })
    it('detects test', () => {
        const f = new Formatter('')
        assert.ok(f._isDeclarationStart('test "name":'))
    })
    it('detects define', () => {
        const f = new Formatter('')
        assert.ok(f._isDeclarationStart('define MAX = 100'))
    })
    it('detects export', () => {
        const f = new Formatter('')
        assert.ok(f._isDeclarationStart('export to func():'))
    })
    it('detects comments', () => {
        const f = new Formatter('')
        assert.ok(f._isDeclarationStart('// comment'))
    })
    it('does not flag show as declaration', () => {
        const f = new Formatter('')
        assert.equal(f._isDeclarationStart('show "hello"'), false)
    })
    it('does not flag let as declaration', () => {
        const f = new Formatter('')
        assert.equal(f._isDeclarationStart('let x = 1'), false)
    })
})

// ══════════════════════════════════════
//  Edge Cases
// ══════════════════════════════════════

describe('Formatter: Edge Cases', () => {
    it('handles empty input', () => {
        const result = format('')
        assert.equal(typeof result, 'string')
    })
    it('handles single newline', () => {
        const result = format('\n')
        assert.equal(typeof result, 'string')
    })
    it('handles carriage returns', () => {
        const result = format('let x = 1\r\nlet y = 2\r\n')
        assert.ok(!result.includes('\r'))
    })
    it('handles whitespace-only lines', () => {
        const result = format('let x = 1\n   \nlet y = 2')
        assert.equal(typeof result, 'string')
    })
    it('handles very deep indentation', () => {
        const result = format('\t\t\t\tdetails = true')
        assert.ok(!result.includes('\t'))
    })
    it('is idempotent (format twice yields same result)', () => {
        const input = 'let x = 1\nlet y = 2\n'
        const once = format(input)
        const twice = format(once)
        assert.equal(once, twice)
    })
})

// ══════════════════════════════════════
//  Integration: Full Format
// ══════════════════════════════════════

describe('Formatter: Full Format Integration', () => {
    it('formats a complete Lume program', () => {
        const messy = `\tlet x = 1   \n\n\n\n\tlet y = 2\t\n\n\tto greet():\n\t\t    show "hi"   \n`
        const result = format(messy)
        // Should normalize indentation
        assert.ok(!result.includes('\t'))
        // Should not have 3+ blank lines
        assert.ok(!result.includes('\n\n\n'))
        // Should end with single newline
        assert.ok(result.endsWith('\n'))
        assert.ok(!result.endsWith('\n\n'))
    })
})
