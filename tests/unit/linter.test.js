/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Linter — Comprehensive Test Suite
 *  Tests all lint rules: L001-L051 + English Mode LUME-L001-L011
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Linter, lint, formatFindings, loadLintConfig } from '../../src/linter.js'

/* ═══ Helper ══════════════════════════════════════════════ */

function lintCode(code) {
    return new Linter(code, 'test.lume').lint()
}

function lintEnglish(code, config = {}) {
    const l = new Linter(code, 'test.eng.lume')
    return l.lintEnglish(config)
}

function hasCode(findings, code) {
    return findings.some(f => f.code === code)
}

/* ═══ L001: Tab Characters ═══════════════════════════════ */

describe('Linter: L001 — Tab Detection', () => {
    it('flags tab characters', () => {
        assert.ok(hasCode(lintCode('\tshow x'), 'L001'))
    })

    it('passes with spaces', () => {
        assert.ok(!hasCode(lintCode('    show x'), 'L001'))
    })
})

/* ═══ L002: Indentation ══════════════════════════════════ */

describe('Linter: L002 — Indentation Multiples', () => {
    it('flags non-4-space indentation', () => {
        assert.ok(hasCode(lintCode('  show x'), 'L002'))
    })

    it('passes with 4-space indentation', () => {
        assert.ok(!hasCode(lintCode('    show x'), 'L002'))
    })

    it('passes with 8-space (2 levels)', () => {
        assert.ok(!hasCode(lintCode('        show x'), 'L002'))
    })
})

/* ═══ L003: Trailing Whitespace ══════════════════════════ */

describe('Linter: L003 — Trailing Whitespace', () => {
    it('flags trailing spaces', () => {
        assert.ok(hasCode(lintCode('show x   '), 'L003'))
    })

    it('passes with clean lines', () => {
        assert.ok(!hasCode(lintCode('show x'), 'L003'))
    })
})

/* ═══ L010-L012: Naming Conventions ══════════════════════ */

describe('Linter: L010 — Function Naming', () => {
    it('flags camelCase function names', () => {
        assert.ok(hasCode(lintCode('to myFunction(x)'), 'L010'))
    })

    it('passes snake_case function names', () => {
        assert.ok(!hasCode(lintCode('to my_function(x)'), 'L010'))
    })
})

describe('Linter: L011 — Variable Naming', () => {
    it('flags camelCase variable names', () => {
        assert.ok(hasCode(lintCode('let myVar = 5'), 'L011'))
    })

    it('passes snake_case variable names', () => {
        assert.ok(!hasCode(lintCode('let my_var = 5'), 'L011'))
    })

    it('flags define with camelCase', () => {
        assert.ok(hasCode(lintCode('define userName = "test"'), 'L011'))
    })
})

describe('Linter: L012 — Type Naming', () => {
    it('flags lowercase type names', () => {
        assert.ok(hasCode(lintCode('type person'), 'L012'))
    })

    it('passes PascalCase type names', () => {
        assert.ok(!hasCode(lintCode('type Person'), 'L012'))
    })
})

/* ═══ L020: Unused Variables ═════════════════════════════ */

describe('Linter: L020 — Unused Variables', () => {
    it('flags declared-but-unused variable', () => {
        assert.ok(hasCode(lintCode('let unused_var = 5'), 'L020'))
    })

    it('passes when variable is used', () => {
        assert.ok(!hasCode(lintCode('let x = 5\nshow x'), 'L020'))
    })
})

/* ═══ L030-L031: AI Best Practices ═══════════════════════ */

describe('Linter: L030 — AI Result Not Stored', () => {
    it('flags unassigned AI call', () => {
        assert.ok(hasCode(lintCode('ask "what is 2+2"'), 'L030'))
    })

    it('passes when AI call is assigned', () => {
        assert.ok(!hasCode(lintCode('let result = ask "what is 2+2"'), 'L030'))
    })
})

describe('Linter: L031 — Short AI Prompts', () => {
    it('flags very short prompts', () => {
        assert.ok(hasCode(lintCode('let x = ask "hi"'), 'L031'))
    })

    it('passes descriptive prompts', () => {
        assert.ok(!hasCode(lintCode('let x = ask "What is the capital of France and its population?"'), 'L031'))
    })
})

/* ═══ L040-L041: Style Issues ════════════════════════════ */

describe('Linter: L040 — Line Length', () => {
    it('flags lines over 120 characters', () => {
        const longLine = 'let x = "' + 'a'.repeat(120) + '"'
        assert.ok(hasCode(lintCode(longLine), 'L040'))
    })

    it('passes normal-length lines', () => {
        assert.ok(!hasCode(lintCode('let x = 5'), 'L040'))
    })
})

describe('Linter: L041 — Consecutive Blank Lines', () => {
    it('flags 3+ consecutive blank lines', () => {
        assert.ok(hasCode(lintCode('show x\n\n\n\nshow y'), 'L041'))
    })

    it('passes with 2 blank lines', () => {
        assert.ok(!hasCode(lintCode('show x\n\n\nshow y'), 'L041'))
    })
})

/* ═══ L050-L051: Common Errors ═══════════════════════════ */

describe('Linter: L050 — Missing Colon', () => {
    it('flags if without colon', () => {
        assert.ok(hasCode(lintCode('if x > 5'), 'L050'))
    })

    it('passes if with colon', () => {
        assert.ok(!hasCode(lintCode('if x > 5:'), 'L050'))
    })
})

describe('Linter: L051 — Assignment in Condition', () => {
    it('flags single = in if condition', () => {
        assert.ok(hasCode(lintCode('if x = 5'), 'L051'))
    })

    it('passes == in if condition', () => {
        assert.ok(!hasCode(lintCode('if x == 5:'), 'L051'))
    })
})

/* ═══ English Mode Rules ═════════════════════════════════ */

describe('Linter: LUME-L001 — Non-canonical Verbs', () => {
    it('flags "grab" → suggest "get"', () => {
        assert.ok(hasCode(lintEnglish('grab the user data'), 'LUME-L001'))
    })

    it('flags "display" → suggest "show"', () => {
        assert.ok(hasCode(lintEnglish('display the results'), 'LUME-L001'))
    })

    it('flags "store" → suggest "save"', () => {
        assert.ok(hasCode(lintEnglish('store the data in database'), 'LUME-L001'))
    })

    it('flags "remove" → suggest "delete"', () => {
        assert.ok(hasCode(lintEnglish('remove the old records'), 'LUME-L001'))
    })

    it('flags "make" → suggest "create"', () => {
        assert.ok(hasCode(lintEnglish('make a new user account'), 'LUME-L001'))
    })

    it('does not flag canonical verbs', () => {
        assert.ok(!hasCode(lintEnglish('get the user data'), 'LUME-L001'))
    })

    it('can be turned off via config', () => {
        const findings = lintEnglish('grab the data', { rules: { 'LUME-L001': 'off' } })
        assert.ok(!hasCode(findings, 'LUME-L001'))
    })
})

describe('Linter: LUME-L002 — Vague Pronouns', () => {
    it('flags "do something with it"', () => {
        assert.ok(hasCode(lintEnglish('do something with it'), 'LUME-L002'))
    })

    it('does not flag specific references', () => {
        assert.ok(!hasCode(lintEnglish('process the user list'), 'LUME-L002'))
    })
})

describe('Linter: LUME-L003 — Unbounded Operations', () => {
    it('flags "delete everything"', () => {
        assert.ok(hasCode(lintEnglish('delete everything'), 'LUME-L003'))
    })

    it('flags "process all"', () => {
        assert.ok(hasCode(lintEnglish('process all'), 'LUME-L003'))
    })

    it('passes with limit', () => {
        assert.ok(!hasCode(lintEnglish('process all limit to 100'), 'LUME-L003'))
    })
})

describe('Linter: LUME-L004 — Non-compilable Instructions', () => {
    it('flags "make it work"', () => {
        assert.ok(hasCode(lintEnglish('make it work'), 'LUME-L004'))
    })

    it('flags "fix the bug"', () => {
        assert.ok(hasCode(lintEnglish('fix the bug'), 'LUME-L004'))
    })

    it('flags "handle the edge cases"', () => {
        assert.ok(hasCode(lintEnglish('handle the edge cases'), 'LUME-L004'))
    })

    it('does not flag specific instructions', () => {
        assert.ok(!hasCode(lintEnglish('validate the email field is not empty'), 'LUME-L004'))
    })
})

describe('Linter: LUME-L006 — Overly Verbose', () => {
    it('flags instructions over 15 words', () => {
        const long = 'please take the user data from the database and then process it through the validation and return the result'
        assert.ok(hasCode(lintEnglish(long), 'LUME-L006'))
    })

    it('passes concise instructions', () => {
        assert.ok(!hasCode(lintEnglish('get user by id'), 'LUME-L006'))
    })
})

describe('Linter: LUME-L007 — Network Error Handling', () => {
    it('flags fetch without error handling', () => {
        assert.ok(hasCode(lintEnglish('fetch data from the api'), 'LUME-L007'))
    })

    it('passes with error handling nearby', () => {
        assert.ok(!hasCode(lintEnglish('fetch data from the api\nif it fails show error'), 'LUME-L007'))
    })
})

/* ═══ Format Output ══════════════════════════════════════ */

describe('Linter: formatFindings', () => {
    it('returns success message when no findings', () => {
        assert.ok(formatFindings([]).includes('No issues'))
    })

    it('formats text output with icons', () => {
        const findings = [{ severity: 'error', file: 'test.lume', line: 1, column: 1, code: 'L001', message: 'test' }]
        const output = formatFindings(findings, 'text')
        assert.ok(output.includes('✗'))
        assert.ok(output.includes('L001'))
    })

    it('formats JSON output', () => {
        const findings = [{ severity: 'warning', file: 'test.lume', line: 1, column: 1, code: 'L002', message: 'test' }]
        const output = formatFindings(findings, 'json')
        const parsed = JSON.parse(output)
        assert.ok(Array.isArray(parsed))
    })

    it('formats SARIF output', () => {
        const findings = [{ severity: 'error', file: 'test.lume', line: 1, column: 1, code: 'L050', message: 'test' }]
        const output = formatFindings(findings, 'sarif')
        const parsed = JSON.parse(output)
        assert.ok(parsed.version === '2.1.0')
        assert.ok(parsed.runs[0].results.length === 1)
    })

    it('includes suggestion when available', () => {
        const findings = [{ severity: 'style', file: 'test.lume', line: 1, column: 1, code: 'L003', message: 'test', suggestion: 'fix it' }]
        const output = formatFindings(findings, 'text')
        assert.ok(output.includes('💡'))
    })
})

/* ═══ Convenience Function ═══════════════════════════════ */

describe('Linter: lint() convenience', () => {
    it('lint() returns array of findings', () => {
        const findings = lint('let x = 5')
        assert.ok(Array.isArray(findings))
    })

    it('clean code returns few or no findings', () => {
        const findings = lint('let x = 5\nshow x')
        const errors = findings.filter(f => f.severity === 'error')
        assert.equal(errors.length, 0)
    })
})
