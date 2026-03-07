/**
 * ====== Lume Unit Tests — Milestone 1 ======
 * Tests for the lexer, parser, and transpiler.
 * Uses Node.js built-in test runner (node:test).
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, TokenType } from '../../src/lexer.js'
import { parse, NodeType } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'

// ── Helper: compile Lume source to JS string ──
function compileToJS(source) {
    const tokens = tokenize(source, 'test.lume')
    const ast = parse(tokens, 'test.lume')
    return transpile(ast, 'test.lume')
}

// ── Helper: run Lume source and capture console output ──
function runLume(source) {
    const js = compileToJS(source)
    const output = []
    const origLog = console.log
    console.log = (...args) => output.push(args.join(' '))
    try {
        const fn = new Function(js)
        fn()
    } finally {
        console.log = origLog
    }
    return output
}

// ════════════════════════════════════════
// LEXER TESTS
// ════════════════════════════════════════
describe('Lexer', () => {
    it('tokenizes a simple let declaration', () => {
        const tokens = tokenize('let name = "Lume"', 'test.lume')
        const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type)
        assert.deepEqual(types, [
            TokenType.KEYWORD,    // let
            TokenType.IDENTIFIER, // name
            TokenType.EQUALS,     // =
            TokenType.STRING,     // "Lume"
        ])
    })

    it('tokenizes numbers (integer and float)', () => {
        const tokens = tokenize('let x = 42\nlet y = 3.14', 'test.lume')
        const numbers = tokens.filter(t => t.type === TokenType.NUMBER)
        assert.equal(numbers[0].value, 42)
        assert.equal(numbers[1].value, 3.14)
    })

    it('tokenizes string interpolation', () => {
        const tokens = tokenize('let msg = "Hello, {name}!"', 'test.lume')
        const hasInterpStart = tokens.some(t => t.type === TokenType.INTERP_START)
        const hasInterpExpr = tokens.some(t => t.type === TokenType.INTERP_EXPR)
        const hasInterpEnd = tokens.some(t => t.type === TokenType.INTERP_END)
        assert.ok(hasInterpStart, 'Should have INTERP_START')
        assert.ok(hasInterpExpr, 'Should have INTERP_EXPR')
        assert.ok(hasInterpEnd, 'Should have INTERP_END')
    })

    it('tokenizes the show keyword', () => {
        const tokens = tokenize('show "hello"', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'show')
    })

    it('tokenizes comments', () => {
        const tokens = tokenize('// this is a comment', 'test.lume')
        assert.ok(tokens.some(t => t.type === TokenType.COMMENT))
    })

    it('tokenizes boolean literals', () => {
        const tokens = tokenize('let x = true', 'test.lume')
        const boolTok = tokens.find(t => t.type === TokenType.BOOLEAN)
        assert.ok(boolTok)
        assert.equal(boolTok.value, true)
    })

    it('rejects tab characters', () => {
        assert.throws(() => tokenize('\tlet x = 5', 'test.lume'), /Tabs are not allowed/)
    })

    it('tokenizes operators', () => {
        const tokens = tokenize('let x = 1 + 2 * 3', 'test.lume')
        assert.ok(tokens.some(t => t.type === TokenType.PLUS))
        assert.ok(tokens.some(t => t.type === TokenType.STAR))
    })

    it('tokenizes natural language operator "is"', () => {
        const tokens = tokenize('x is 5', 'test.lume')
        const eqTok = tokens.find(t => t.type === TokenType.DOUBLE_EQUALS)
        assert.ok(eqTok, 'is should map to DOUBLE_EQUALS')
    })

    it('tokenizes "is greater than"', () => {
        const tokens = tokenize('x is greater than 5', 'test.lume')
        const gtTok = tokens.find(t => t.type === TokenType.GREATER)
        assert.ok(gtTok, 'is greater than should map to GREATER')
    })

    it('tokenizes "is at least"', () => {
        const tokens = tokenize('x is at least 18', 'test.lume')
        const geTok = tokens.find(t => t.type === TokenType.GREATER_EQ)
        assert.ok(geTok, 'is at least should map to GREATER_EQ')
    })
})

// ════════════════════════════════════════
// PARSER TESTS
// ════════════════════════════════════════
describe('Parser', () => {
    it('parses a let declaration', () => {
        const tokens = tokenize('let x = 42', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        assert.equal(ast.type, 'Program')
        assert.equal(ast.body.length, 1)
        assert.equal(ast.body[0].type, NodeType.LetDeclaration)
        assert.equal(ast.body[0].name, 'x')
        assert.equal(ast.body[0].value.type, NodeType.NumberLiteral)
        assert.equal(ast.body[0].value.value, 42)
    })

    it('parses a show statement', () => {
        const tokens = tokenize('show "hello"', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        assert.equal(ast.body[0].type, NodeType.ShowStatement)
        assert.equal(ast.body[0].value.type, NodeType.StringLiteral)
        assert.equal(ast.body[0].value.value, 'hello')
    })

    it('parses string interpolation', () => {
        const tokens = tokenize('show "Hello, {name}"', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        const show = ast.body[0]
        assert.equal(show.value.type, NodeType.InterpolatedString)
        assert.equal(show.value.parts.length, 2) // "Hello, " + name
    })

    it('parses binary expressions with precedence', () => {
        const tokens = tokenize('let x = 2 + 3 * 4', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        const value = ast.body[0].value
        // Should be: (2 + (3 * 4))
        assert.equal(value.type, NodeType.BinaryExpression)
        assert.equal(value.operator, '+')
        assert.equal(value.right.type, NodeType.BinaryExpression)
        assert.equal(value.right.operator, '*')
    })

    it('parses define declarations', () => {
        const tokens = tokenize('define MAX = 100', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        assert.equal(ast.body[0].type, NodeType.DefineDeclaration)
        assert.equal(ast.body[0].name, 'MAX')
    })

    it('parses list literals', () => {
        const tokens = tokenize('let items = [1, 2, 3]', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        assert.equal(ast.body[0].value.type, NodeType.ListLiteral)
        assert.equal(ast.body[0].value.elements.length, 3)
    })

    it('parses string concatenation', () => {
        const tokens = tokenize('let msg = "Hello" + " " + "world"', 'test.lume')
        const ast = parse(tokens, 'test.lume')
        assert.equal(ast.body[0].value.type, NodeType.BinaryExpression)
        assert.equal(ast.body[0].value.operator, '+')
    })
})

// ════════════════════════════════════════
// TRANSPILER TESTS
// ════════════════════════════════════════
describe('Transpiler', () => {
    it('transpiles let declaration', () => {
        const js = compileToJS('let x = 42')
        assert.ok(js.includes('let x = 42;'))
    })

    it('transpiles define to const', () => {
        const js = compileToJS('define PI = 3.14')
        assert.ok(js.includes('const PI = 3.14;'))
    })

    it('transpiles show to console.log', () => {
        const js = compileToJS('show "hello"')
        assert.ok(js.includes('console.log("hello");'))
    })

    it('transpiles string interpolation to template literal', () => {
        const js = compileToJS('let name = "world"\nshow "Hello, {name}"')
        assert.ok(js.includes('`Hello, ${name}`'), `Expected template literal in: ${js}`)
    })

    it('transpiles binary expressions', () => {
        const js = compileToJS('let x = 2 + 3')
        assert.ok(js.includes('(2 + 3)'))
    })
})

// ════════════════════════════════════════
// END-TO-END TESTS
// ════════════════════════════════════════
describe('End-to-End', () => {
    it('hello.lume: prints "Hello from Lume v1"', () => {
        const source = `let language = "Lume"\nlet version = 1\nshow "Hello from {language} v{version}"`
        const output = runLume(source)
        assert.equal(output[0], 'Hello from Lume v1')
    })

    it('simple arithmetic', () => {
        const output = runLume('show 2 + 3')
        assert.equal(output[0], '5')
    })

    it('string concatenation', () => {
        const output = runLume('show "Hello" + " " + "World"')
        assert.equal(output[0], 'Hello World')
    })

    it('define constant', () => {
        const output = runLume('define PI = 3.14\nshow PI')
        assert.equal(output[0], '3.14')
    })

    it('multiple show statements', () => {
        const output = runLume('show "one"\nshow "two"\nshow "three"')
        assert.deepEqual(output, ['one', 'two', 'three'])
    })

    it('comments are ignored', () => {
        const output = runLume('// this is a comment\nshow "hello"')
        assert.equal(output[0], 'hello')
    })

    it('boolean values', () => {
        const output = runLume('let x = true\nshow x')
        assert.equal(output[0], 'true')
    })

    it('null value', () => {
        const output = runLume('let x = null\nshow x')
        // console.log(null) outputs "null"
        assert.ok(output.length > 0, 'Should have output')
    })

    it('complex interpolation', () => {
        const source = `let name = "Ada"\nlet age = 28\nshow "My name is {name} and I am {age}"`
        const output = runLume(source)
        assert.equal(output[0], 'My name is Ada and I am 28')
    })
})
