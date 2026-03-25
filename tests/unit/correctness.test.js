/**
 * ====== Lume Correctness Tests ======
 * 10 critical behavior assertions that verify the compiler
 * produces CORRECT output, not just "doesn't crash."
 *
 * Each test compiles a known Lume input and asserts the
 * exact JavaScript output or AST structure.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize } from '../../src/lexer.js'
import { Parser, NodeType } from '../../src/parser.js'
import { Transpiler } from '../../src/transpiler.js'
import { CircuitBreaker } from '../../src/runtime/healer.js'

function parse(source) {
    const tokens = tokenize(source)
    return new Parser(tokens).parse()
}

function compile(source) {
    const tokens = tokenize(source)
    const ast = new Parser(tokens).parse()
    return new Transpiler(ast).transpile()
}

// ═══════════════════════════════════
// 1.  LEXER: "is not" tokenises as NOT_EQUALS
// ═══════════════════════════════════
describe('Correctness: Lexer', () => {
    it('"is not" produces a NOT_EQUALS token, not two separate tokens', () => {
        const tokens = tokenize('x is not y')
        const notEq = tokens.find(t => t.type === 'NOT_EQUALS')
        assert.ok(notEq, 'Expected a NOT_EQUALS token')
        assert.equal(notEq.value, 'is not')
    })

    it('"is greater than" produces a GREATER token', () => {
        const tokens = tokenize('x is greater than 5')
        const gt = tokens.find(t => t.type === 'GREATER')
        assert.ok(gt, 'Expected a GREATER token')
        assert.equal(gt.value, 'is greater than')
    })
})

// ═══════════════════════════════════
// 2.  PARSER: "show" produces a ShowStatement
// ═══════════════════════════════════
describe('Correctness: Parser – show statement', () => {
    it('show "hello" parses to ShowStatement with StringLiteral "hello"', () => {
        const ast = parse('show "hello"')
        assert.equal(ast.body.length, 1)
        const node = ast.body[0]
        assert.equal(node.type, NodeType.ShowStatement)
        assert.equal(node.value.type, NodeType.StringLiteral)
        assert.equal(node.value.value, 'hello')
    })
})

// ═══════════════════════════════════
// 3.  PARSER: "let x = 42" produces correct AST
// ═══════════════════════════════════
describe('Correctness: Parser – let declaration', () => {
    it('let x = 42 produces LetDeclaration with NumberLiteral value 42', () => {
        const ast = parse('let x = 42')
        const node = ast.body[0]
        assert.equal(node.type, NodeType.LetDeclaration)
        assert.equal(node.name, 'x')
        assert.equal(node.value.type, NodeType.NumberLiteral)
        assert.equal(node.value.value, 42)
    })
})

// ═══════════════════════════════════
// 4.  PARSER: Function declaration produces correct AST
// ═══════════════════════════════════
describe('Correctness: Parser – function declaration', () => {
    it('to greet(name: text) -> text: produces FunctionDeclaration with typed param and return type', () => {
        const source = [
            'to greet(name: text) -> text:',
            '    return "hello"',
        ].join('\n')
        const ast = parse(source)
        const fn = ast.body[0]
        assert.equal(fn.type, NodeType.FunctionDeclaration)
        assert.equal(fn.name, 'greet')
        assert.equal(fn.params.length, 1)
        assert.equal(fn.params[0].name, 'name')
        assert.equal(fn.params[0].typeAnnotation.name, 'text')
        assert.equal(fn.returnType.name, 'text')
        assert.equal(fn.body.length, 1)
        assert.equal(fn.body[0].type, NodeType.ReturnStatement)
    })
})

// ═══════════════════════════════════
// 5.  TRANSPILER: "show" compiles to console.log
// ═══════════════════════════════════
describe('Correctness: Transpiler – show → console.log', () => {
    it('show "hello" compiles to console.log("hello")', () => {
        const js = compile('show "hello"')
        assert.ok(js.includes('console.log("hello");'), `Expected console.log("hello") in output:\n${js}`)
    })
})

// ═══════════════════════════════════
// 6.  TRANSPILER: "let"/"define" compiles to let/const
// ═══════════════════════════════════
describe('Correctness: Transpiler – declarations', () => {
    it('let x = 10 compiles to "let x = 10;"', () => {
        const js = compile('let x = 10')
        assert.ok(js.includes('let x = 10;'), `Expected "let x = 10;" in output:\n${js}`)
    })

    it('define PI = 3.14 compiles to "const PI = 3.14;"', () => {
        const js = compile('define PI = 3.14')
        assert.ok(js.includes('const PI = 3.14;'), `Expected "const PI = 3.14;" in output:\n${js}`)
    })
})

// ═══════════════════════════════════
// 7.  TRANSPILER: for-range compiles to correct JS for loop
// ═══════════════════════════════════
describe('Correctness: Transpiler – for range loop', () => {
    it('for i in 1 to 10: compiles to for (let i = 1; i < 10; i += 1)', () => {
        const source = [
            'for i in 1 to 10:',
            '    show i',
        ].join('\n')
        const js = compile(source)
        assert.ok(
            js.includes('for (let i = 1; i < 10; i += 1)'),
            `Expected correct for loop header in output:\n${js}`
        )
        assert.ok(js.includes('console.log(i);'), `Expected console.log(i) inside loop:\n${js}`)
    })
})

// ═══════════════════════════════════
// 8.  TRANSPILER: verify statement compiles to runtime assertion
// ═══════════════════════════════════
describe('Correctness: Transpiler – verify assertion', () => {
    it('verify count is 10 compiles to a throw-on-failure assertion', () => {
        const source = [
            'let count = 10',
            'verify count is 10',
        ].join('\n')
        const js = compile(source)
        assert.ok(js.includes('let count = 10;'), `Expected let count in output:\n${js}`)
        // The verify should compile to an if/throw that checks count !== 10
        assert.ok(
            js.includes('throw new Error') && js.includes('count'),
            `Expected verify assertion with throw in output:\n${js}`
        )
    })
})

// ═══════════════════════════════════
// 9.  RUNTIME: Circuit breaker opens after N failures
// ═══════════════════════════════════
describe('Correctness: Circuit Breaker state machine', () => {
    it('opens after threshold failures and serves fallback', async () => {
        const cb = new CircuitBreaker('test-service', { threshold: 3, cooldown: 60000 })
        assert.equal(cb.state, 'CLOSED')

        // Fail 3 times
        for (let i = 0; i < 3; i++) {
            try {
                await cb.execute(() => { throw new Error('fail') })
            } catch { /* expected */ }
        }

        assert.equal(cb.state, 'OPEN', 'Circuit should be OPEN after 3 failures')
        assert.equal(cb.failures, 3)

        // While open, fallback is served immediately
        const result = await cb.execute(
            () => { throw new Error('should not be called') },
            () => 'fallback-value'
        )
        assert.equal(result, 'fallback-value', 'Fallback should be returned when circuit is OPEN')
    })

    it('transitions from OPEN → HALF-OPEN after cooldown', async () => {
        const cb = new CircuitBreaker('test-cooldown', { threshold: 1, cooldown: 1 })

        // Fail once to open
        try {
            await cb.execute(() => { throw new Error('fail') })
        } catch { /* expected */ }
        assert.equal(cb.state, 'OPEN')

        // Wait for cooldown (1ms)
        await new Promise(r => setTimeout(r, 10))

        // Next call should put it in HALF-OPEN, then succeed → CLOSED
        const result = await cb.execute(() => 'recovered')
        assert.equal(result, 'recovered')
        assert.equal(cb.state, 'CLOSED', 'Circuit should return to CLOSED after successful HALF-OPEN call')
        assert.equal(cb.failures, 0)
    })
})

// ═══════════════════════════════════
// 10.  END-TO-END: Full program compiles correctly
// ═══════════════════════════════════
describe('Correctness: End-to-end compilation', () => {
    it('a multi-statement program with function, loop, and conditional compiles to valid JS', () => {
        const source = [
            'to double(n: number) -> n * 2',
            '',
            'let result = double(5)',
            '',
            'if result is greater than 5:',
            '    show "big"',
            'else:',
            '    show "small"',
        ].join('\n')

        const js = compile(source)

        // Function declaration
        assert.ok(js.includes('function double(n)'), `Expected function double(n) in output:\n${js}`)
        assert.ok(js.includes('return (n * 2);'), `Expected return (n * 2) in output:\n${js}`)

        // Variable assignment
        assert.ok(js.includes('let result = double(5);'), `Expected let result = double(5) in output:\n${js}`)

        // Conditional with natural language operator
        assert.ok(js.includes('if ((result > 5))'), `Expected if ((result > 5)) in output:\n${js}`)
        assert.ok(js.includes('console.log("big")'), `Expected console.log("big") in output:\n${js}`)
        assert.ok(js.includes('console.log("small")'), `Expected console.log("small") in output:\n${js}`)
    })
})
