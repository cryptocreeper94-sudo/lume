/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Lexer — Comprehensive Test Suite
 *  Tests tokenization of all Lume source code elements.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Lexer, Token, TokenType, tokenize } from '../../src/lexer.js'

/* ═══ Convenience Helper ═══════════════════════════════ */

function tokTypes(src) {
    return tokenize(src).map(t => t.type).filter(t => t !== 'NEWLINE' && t !== 'EOF')
}

function tokValues(src) {
    return tokenize(src).map(t => ({ type: t.type, value: t.value })).filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF')
}

/* ═══ Token Class ═════════════════════════════════════════ */

describe('Lexer: Token Class', () => {
    it('creates a token with type, value, line, column', () => {
        const t = new Token(TokenType.NUMBER, 42, 1, 5)
        assert.equal(t.type, 'NUMBER')
        assert.equal(t.value, 42)
        assert.equal(t.line, 1)
        assert.equal(t.column, 5)
    })

    it('toString() returns readable representation', () => {
        const t = new Token(TokenType.STRING, 'hello', 3, 10)
        const s = t.toString()
        assert.ok(s.includes('STRING'))
        assert.ok(s.includes('hello'))
        assert.ok(s.includes('3'))
    })
})

/* ═══ Number Tokens ═══════════════════════════════════════ */

describe('Lexer: Numbers', () => {
    it('tokenizes integer literals', () => {
        const toks = tokValues('42')
        assert.equal(toks[0].type, 'NUMBER')
        assert.equal(toks[0].value, 42)
    })

    it('tokenizes zero', () => {
        const toks = tokValues('0')
        assert.equal(toks[0].value, 0)
    })

    it('tokenizes float literals', () => {
        const toks = tokValues('3.14')
        assert.equal(toks[0].type, 'NUMBER')
        assert.equal(toks[0].value, 3.14)
    })

    it('tokenizes large integers', () => {
        const toks = tokValues('999999999')
        assert.equal(toks[0].value, 999999999)
    })

    it('stops at second dot (method call on number)', () => {
        const toks = tokTypes('42.toString')
        assert.equal(toks[0], 'NUMBER')
        assert.equal(toks[1], 'DOT')
    })

    it('correctly tokenizes decimal without trailing digit as just number', () => {
        const toks = tokValues('5')
        assert.equal(toks.length, 1)
        assert.equal(toks[0].value, 5)
    })

    it('tokenizes multiple numbers', () => {
        const toks = tokValues('1 2 3')
        assert.equal(toks.length, 3)
        assert.deepEqual(toks.map(t => t.value), [1, 2, 3])
    })
})

/* ═══ String Tokens ═══════════════════════════════════════ */

describe('Lexer: Strings', () => {
    it('tokenizes simple strings', () => {
        const toks = tokValues('"hello world"')
        assert.equal(toks[0].type, 'STRING')
        assert.equal(toks[0].value, 'hello world')
    })

    it('tokenizes empty strings', () => {
        const toks = tokValues('""')
        assert.equal(toks[0].type, 'STRING')
        assert.equal(toks[0].value, '')
    })

    it('handles escape sequences: \\n', () => {
        const toks = tokValues('"line1\\nline2"')
        assert.ok(toks[0].value.includes('\n'))
    })

    it('handles escape sequences: \\t', () => {
        const toks = tokValues('"col1\\tcol2"')
        assert.ok(toks[0].value.includes('\t'))
    })

    it('handles escape sequences: \\\\"', () => {
        const toks = tokValues('"say \\"hello\\""')
        assert.ok(toks[0].value.includes('"'))
    })

    it('handles escape sequences: \\\\', () => {
        const toks = tokValues('"path\\\\to\\\\file"')
        assert.ok(toks[0].value.includes('\\'))
    })

    it('tokenizes interpolated strings', () => {
        const toks = tokTypes('"hello {name}"')
        assert.ok(toks.includes('INTERP_START'))
        assert.ok(toks.includes('INTERP_EXPR'))
        assert.ok(toks.includes('INTERP_END'))
    })

    it('preserves interpolation expression text', () => {
        const toks = tokValues('"cost: {price * 1.1}"')
        const expr = toks.find(t => t.type === 'INTERP_EXPR')
        assert.ok(expr)
        assert.ok(expr.value.includes('price'))
    })

    it('escaped brace is not interpolation', () => {
        const toks = tokTypes('"use \\{braces\\}"')
        assert.ok(!toks.includes('INTERP_START'))
    })

    it('tokenizes triple-quoted strings', () => {
        const toks = tokValues('"""multi\nline\nstring"""')
        assert.equal(toks[0].type, 'STRING')
        assert.ok(toks[0].value.includes('\n'))
    })

    it('throws on unterminated string', () => {
        assert.throws(() => tokenize('"unterminated'), /Unterminated/)
    })

    it('throws on unterminated triple-quoted string', () => {
        assert.throws(() => tokenize('"""unterminated'), /Unterminated/)
    })

    it('throws on newline in regular string', () => {
        assert.throws(() => tokenize('"line1\nline2"'), /Unterminated|triple/)
    })
})

/* ═══ Boolean and Null Tokens ═════════════════════════════ */

describe('Lexer: Booleans and Null', () => {
    it('tokenizes true as BOOLEAN', () => {
        const toks = tokValues('true')
        assert.equal(toks[0].type, 'BOOLEAN')
        assert.equal(toks[0].value, true)
    })

    it('tokenizes false as BOOLEAN', () => {
        const toks = tokValues('false')
        assert.equal(toks[0].type, 'BOOLEAN')
        assert.equal(toks[0].value, false)
    })

    it('tokenizes null as NULL', () => {
        const toks = tokValues('null')
        assert.equal(toks[0].type, 'NULL')
        assert.equal(toks[0].value, null)
    })
})

/* ═══ Keywords ════════════════════════════════════════════ */

describe('Lexer: Keywords', () => {
    const keywords = [
        'let', 'define', 'set', 'to', 'return', 'if', 'else', 'when',
        'for', 'each', 'in', 'while', 'break', 'continue', 'show', 'log',
        'then', 'by', 'ask', 'think', 'generate', 'as', 'use', 'export',
        'from', 'all', 'fetch', 'read', 'write', 'await', 'pipe',
        'monitor', 'heal', 'healable', 'optimize', 'evolve', 'rollback',
        'suggest', 'daemon', 'type', 'text', 'number', 'boolean', 'list',
        'map', 'of', 'any', 'nothing', 'maybe', 'ok', 'error', 'fail',
        'with', 'try', 'test', 'expect', 'equal', 'intent', 'given',
        'expects', 'default',
    ]

    for (const kw of keywords) {
        it(`recognizes "${kw}" as KEYWORD`, () => {
            const toks = tokValues(kw)
            assert.equal(toks[0].type, 'KEYWORD')
            assert.equal(toks[0].value, kw)
        })
    }

    it('does not tokenize identifiers as keywords', () => {
        const toks = tokValues('myVariable')
        assert.equal(toks[0].type, 'IDENTIFIER')
    })

    it('treats keywords case-sensitively (Let ≠ let)', () => {
        const toks = tokValues('Let')
        assert.equal(toks[0].type, 'IDENTIFIER')
    })
})

/* ═══ Identifiers ═════════════════════════════════════════ */

describe('Lexer: Identifiers', () => {
    it('tokenizes simple identifiers', () => {
        const toks = tokValues('myVar')
        assert.equal(toks[0].type, 'IDENTIFIER')
        assert.equal(toks[0].value, 'myVar')
    })

    it('tokenizes underscore-prefixed identifiers', () => {
        const toks = tokValues('_private')
        assert.equal(toks[0].type, 'IDENTIFIER')
    })

    it('tokenizes snake_case identifiers', () => {
        const toks = tokValues('user_name')
        assert.equal(toks[0].type, 'IDENTIFIER')
    })

    it('tokenizes identifiers with numbers', () => {
        const toks = tokValues('item2')
        assert.equal(toks[0].type, 'IDENTIFIER')
    })
})

/* ═══ Operators ═══════════════════════════════════════════ */

describe('Lexer: Operators', () => {
    const singleOps = [
        ['+', 'PLUS'], ['-', 'MINUS'], ['*', 'STAR'], ['/', 'SLASH'],
        ['%', 'PERCENT'], ['=', 'EQUALS'], ['>', 'GREATER'], ['<', 'LESS'],
        ['!', 'NOT'],
    ]

    for (const [op, type] of singleOps) {
        it(`tokenizes single-char "${op}" as ${type}`, () => {
            // Surround with spaces to avoid multi-char parse
            const toks = tokValues(`x ${op} y`)
            const opTok = toks.find(t => t.type === type)
            assert.ok(opTok, `Expected ${type} token for "${op}"`)
        })
    }

    const doubleOps = [
        ['==', 'DOUBLE_EQUALS'], ['!=', 'NOT_EQUALS'], ['>=', 'GREATER_EQ'],
        ['<=', 'LESS_EQ'], ['+=', 'PLUS_EQ'], ['-=', 'MINUS_EQ'],
        ['*=', 'STAR_EQ'], ['/=', 'SLASH_EQ'], ['->', 'ARROW'],
        ['&&', 'AND'], ['||', 'OR'], ['|>', 'PIPE'],
    ]

    for (const [op, type] of doubleOps) {
        it(`tokenizes two-char "${op}" as ${type}`, () => {
            const toks = tokValues(`x ${op} y`)
            const opTok = toks.find(t => t.type === type)
            assert.ok(opTok, `Expected ${type} token for "${op}"`)
        })
    }

    it('tokenizes spread operator "..."', () => {
        const toks = tokTypes('...args')
        assert.ok(toks.includes('SPREAD'))
    })

    it('tokenizes @ decorator', () => {
        const toks = tokValues('@healable')
        assert.equal(toks[0].type, 'AT')
        assert.equal(toks[0].value, '@healable')
    })
})

/* ═══ Natural Language Operators ══════════════════════════ */

describe('Lexer: Natural Language Operators', () => {
    it('"is" before value → DOUBLE_EQUALS', () => {
        const toks = tokTypes('x is 5')
        assert.ok(toks.includes('DOUBLE_EQUALS'))
    })

    it('"is not" → NOT_EQUALS', () => {
        const toks = tokTypes('x is not 5')
        assert.ok(toks.includes('NOT_EQUALS'))
    })

    it('"is greater than" → GREATER', () => {
        const toks = tokTypes('x is greater than y')
        assert.ok(toks.includes('GREATER'))
    })

    it('"is less than" → LESS', () => {
        const toks = tokTypes('x is less than y')
        assert.ok(toks.includes('LESS'))
    })

    it('"is at least" → GREATER_EQ', () => {
        const toks = tokTypes('x is at least 10')
        assert.ok(toks.includes('GREATER_EQ'))
    })

    it('"is at most" → LESS_EQ', () => {
        const toks = tokTypes('x is at most 100')
        assert.ok(toks.includes('LESS_EQ'))
    })

    it('"and" → AND', () => {
        const toks = tokTypes('x and y')
        assert.ok(toks.includes('AND'))
    })

    it('"or" → OR', () => {
        const toks = tokTypes('x or y')
        assert.ok(toks.includes('OR'))
    })

    it('"not" → NOT', () => {
        const toks = tokTypes('not x')
        assert.ok(toks.includes('NOT'))
    })
})

/* ═══ Punctuation ═════════════════════════════════════════ */

describe('Lexer: Punctuation', () => {
    const puncs = [
        [':', 'COLON'], ['.', 'DOT'], [',', 'COMMA'],
        ['(', 'LPAREN'], [')', 'RPAREN'],
        ['[', 'LBRACKET'], [']', 'RBRACKET'],
        ['{', 'LBRACE'], ['}', 'RBRACE'],
    ]

    for (const [ch, type] of puncs) {
        it(`tokenizes "${ch}" as ${type}`, () => {
            const toks = tokTypes(`x${ch}y`)
            assert.ok(toks.includes(type), `Expected ${type} for "${ch}"`)
        })
    }
})

/* ═══ Comments ════════════════════════════════════════════ */

describe('Lexer: Comments', () => {
    it('tokenizes single-line comments', () => {
        const toks = tokValues('// this is a comment')
        assert.equal(toks[0].type, 'COMMENT')
        assert.equal(toks[0].value, 'this is a comment')
    })

    it('tokenizes doc comments (///)', () => {
        const toks = tokValues('/// doc comment here')
        assert.equal(toks[0].type, 'DOC_COMMENT')
        assert.ok(toks[0].value.includes('doc comment'))
    })

    it('tokenizes block comments /* */', () => {
        const toks = tokValues('/* block comment */')
        assert.equal(toks[0].type, 'COMMENT')
        assert.ok(toks[0].value.includes('block comment'))
    })

    it('handles multi-line block comments', () => {
        const toks = tokValues('/* line1\nline2 */')
        assert.equal(toks[0].type, 'COMMENT')
    })

    it('throws on unterminated block comment', () => {
        assert.throws(() => tokenize('/* unterminated'), /Unterminated/)
    })
})

/* ═══ Indentation ═════════════════════════════════════════ */

describe('Lexer: Indentation', () => {
    it('emits INDENT for increased indentation', () => {
        const toks = tokTypes('if x:\n    show y')
        assert.ok(toks.includes('INDENT'))
    })

    it('emits DEDENT for decreased indentation', () => {
        const toks = tokTypes('if x:\n    show y\nshow z')
        assert.ok(toks.includes('DEDENT'))
    })

    it('emits multiple DEDENTs at EOF', () => {
        const toks = tokenize('if x:\n    if y:\n        show z')
        const dedents = toks.filter(t => t.type === 'DEDENT')
        assert.equal(dedents.length, 2)
    })

    it('throws on tab characters', () => {
        assert.throws(() => tokenize('\tshow x'), /Tab/)
    })

    it('throws on inconsistent indentation', () => {
        assert.throws(() => tokenize('if x:\n    show y\n  show z'), /[Ii]nconsistent/)
    })
})

/* ═══ Position Tracking ══════════════════════════════════ */

describe('Lexer: Position Tracking', () => {
    it('tracks line numbers correctly', () => {
        const toks = tokenize('x\ny\nz')
        const xTok = toks.find(t => t.value === 'x')
        const zTok = toks.find(t => t.value === 'z')
        assert.equal(xTok.line, 1)
        assert.equal(zTok.line, 3)
    })

    it('tracks column numbers correctly', () => {
        const toks = tokenize('let x = 5')
        const xTok = toks.find(t => t.value === 'x')
        assert.ok(xTok.column > 1)
    })
})

/* ═══ Edge Cases ══════════════════════════════════════════ */

describe('Lexer: Edge Cases', () => {
    it('handles empty input', () => {
        const toks = tokenize('')
        assert.equal(toks[toks.length - 1].type, 'EOF')
    })

    it('handles whitespace-only input', () => {
        // Whitespace-only with no content should tokenize without crashing
        const toks = tokenize('   \n')
        const last = toks[toks.length - 1]
        assert.equal(last.type, 'EOF')
    })

    it('handles Windows line endings (\\r\\n)', () => {
        const toks = tokenize('x\r\ny')
        const ids = toks.filter(t => t.type === 'IDENTIFIER')
        assert.equal(ids.length, 2)
    })

    it('throws on unexpected characters', () => {
        assert.throws(() => tokenize('`backtick`'), /Unexpected/)
    })

    it('Lexer constructor sets defaults', () => {
        const lex = new Lexer('42')
        assert.equal(lex.filename, '<stdin>')
        assert.equal(lex.pos, 0)
        assert.equal(lex.line, 1)
    })

    it('convenience tokenize() function works', () => {
        const toks = tokenize('let x = 5', 'test.lume')
        assert.ok(toks.length > 0)
    })

    it('complex real-world program tokenizes without error', () => {
        const program = `
let name = "World"
define greet(person):
    show "Hello, {person}!"
    return ok

if name is not null:
    greet(name)
else:
    show "No name"
`
        const toks = tokenize(program)
        assert.ok(toks.length > 10)
        assert.equal(toks[toks.length - 1].type, 'EOF')
    })
})
