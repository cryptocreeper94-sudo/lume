/**
 * ====== Lume Unit Tests — Milestone 3: AI Integration ======
 * Tests AI keyword parsing, compilation, and runtime behavior.
 * 
 * Note: These tests validate the COMPILATION of AI code.
 * Actual API calls require API keys and are tested separately.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, TokenType } from '../../src/lexer.js'
import { parse, NodeType } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'
import { Result } from '../../src/runtime.js'

// ── Helpers ──
function compileToJS(source) {
    const tokens = tokenize(source, 'test.lume')
    const ast = parse(tokens, 'test.lume')
    return transpile(ast, 'test.lume')
}

function parseAST(source) {
    const tokens = tokenize(source, 'test.lume')
    return parse(tokens, 'test.lume')
}

// ════════════════════════════════════════
// LEXER: AI keywords
// ════════════════════════════════════════
describe('Lexer: AI Keywords', () => {
    it('tokenizes "ask" as keyword', () => {
        const tokens = tokenize('ask "hello"', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'ask')
    })

    it('tokenizes "think" as keyword', () => {
        const tokens = tokenize('think "analyze this"', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'think')
    })

    it('tokenizes "generate" as keyword', () => {
        const tokens = tokenize('generate "a poem"', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'generate')
    })

    it('tokenizes model selector', () => {
        const tokens = tokenize('ask claude.sonnet "hello"', 'test.lume')
        assert.equal(tokens[0].value, 'ask')
        assert.equal(tokens[1].type, TokenType.IDENTIFIER) // claude
        assert.equal(tokens[2].type, TokenType.DOT)
        // sonnet could be identifier
    })
})

// ════════════════════════════════════════
// PARSER: AI expressions
// ════════════════════════════════════════
describe('Parser: AI Expressions', () => {
    it('parses simple ask expression', () => {
        const ast = parseAST('let x = ask "hello"')
        const value = ast.body[0].value
        assert.equal(value.type, NodeType.AskExpression)
        assert.equal(value.prompt.type, NodeType.StringLiteral)
        assert.equal(value.prompt.value, 'hello')
        assert.equal(value.model, null)
    })

    it('parses think expression', () => {
        const ast = parseAST('let x = think "analyze"')
        assert.equal(ast.body[0].value.type, NodeType.ThinkExpression)
    })

    it('parses generate expression', () => {
        const ast = parseAST('let x = generate "create a poem"')
        assert.equal(ast.body[0].value.type, NodeType.GenerateExpression)
    })

    it('parses ask with model selector', () => {
        const ast = parseAST('let x = ask claude "hello"')
        const value = ast.body[0].value
        assert.equal(value.type, NodeType.AskExpression)
        assert.equal(value.model, 'claude')
    })

    it('parses ask with dotted model selector', () => {
        const ast = parseAST('let x = ask claude.sonnet "hello"')
        const value = ast.body[0].value
        assert.equal(value.model, 'claude.sonnet')
        assert.equal(value.prompt.value, 'hello')
    })

    it('parses ask with output format', () => {
        const ast = parseAST('let x = ask "give me data" as json')
        const value = ast.body[0].value
        assert.equal(value.type, NodeType.AskExpression)
        assert.equal(value.outputFormat, 'json')
    })

    it('parses ask with model + format', () => {
        const ast = parseAST('let x = ask gpt.4o "list capitals" as list')
        const value = ast.body[0].value
        assert.equal(value.model, 'gpt.4o')
        assert.equal(value.outputFormat, 'list')
    })

    it('parses ask with interpolated prompt', () => {
        const ast = parseAST('let topic = "AI"\nlet x = ask "Tell me about {topic}"')
        const askNode = ast.body[1].value
        assert.equal(askNode.type, NodeType.AskExpression)
        assert.equal(askNode.prompt.type, NodeType.InterpolatedString)
    })
})

// ════════════════════════════════════════
// TRANSPILER: AI code generation
// ════════════════════════════════════════
describe('Transpiler: AI Code Generation', () => {
    it('emits runtime import when AI calls present', () => {
        const js = compileToJS('let x = ask "hello"')
        assert.ok(js.includes('__lume_ask'), 'Should import __lume_ask')
        assert.ok(js.includes('__lume_loadConfig'), 'Should import config loader')
    })

    it('does NOT emit runtime import when no AI calls', () => {
        const js = compileToJS('let x = 42')
        assert.ok(!js.includes('__lume_ask'), 'Should not import runtime')
    })

    it('emits await for ask calls', () => {
        const js = compileToJS('let x = ask "hello"')
        assert.ok(js.includes('await __lume_ask'), 'Should emit await')
    })

    it('emits model parameter when specified', () => {
        const js = compileToJS('let x = ask claude.sonnet "hello"')
        assert.ok(js.includes('"claude.sonnet"'), 'Should include model name')
    })

    it('emits format parameter when specified', () => {
        const js = compileToJS('let x = ask "hello" as json')
        assert.ok(js.includes('"json"'), 'Should include format')
    })

    it('emits null model when not specified', () => {
        const js = compileToJS('let x = ask "hello"')
        assert.ok(js.includes('model: null'), 'Should emit null model')
    })

    it('emits think call correctly', () => {
        const js = compileToJS('let x = think "analyze this"')
        assert.ok(js.includes('__lume_think'), 'Should emit __lume_think')
    })

    it('emits generate call correctly', () => {
        const js = compileToJS('let x = generate "create a poem"')
        assert.ok(js.includes('__lume_generate'), 'Should emit __lume_generate')
    })

    it('makes functions with AI calls async', () => {
        const js = compileToJS(`
to get_answer():
    let x = ask "hello"
    return x
`)
        assert.ok(js.includes('async function get_answer'), 'Function should be async')
    })

    it('keeps functions without AI calls synchronous', () => {
        const js = compileToJS(`
to add(a: number, b: number) -> a + b
`)
        assert.ok(js.includes('function add('), 'Function should NOT be async')
        assert.ok(!js.includes('async function add'), 'Function should NOT be async')
    })
})

// ════════════════════════════════════════
// RUNTIME: Result type
// ════════════════════════════════════════
describe('Runtime: Result Type', () => {
    it('Result.ok wraps a value', () => {
        const r = Result.ok(42)
        assert.equal(r.isOk, true)
        assert.equal(r.unwrap(), 42)
    })

    it('Result.error wraps an error', () => {
        const r = Result.error('something went wrong')
        assert.equal(r.isError, true)
        assert.throws(() => r.unwrap(), /something went wrong/)
    })

    it('unwrapOr returns fallback on error', () => {
        const r = Result.error('oops')
        assert.equal(r.unwrapOr('default'), 'default')
    })

    it('unwrapOr returns value on ok', () => {
        const r = Result.ok('hello')
        assert.equal(r.unwrapOr('default'), 'hello')
    })

    it('match calls ok handler', () => {
        const r = Result.ok(42)
        const result = r.match({
            ok: v => v * 2,
            error: e => -1,
        })
        assert.equal(result, 84)
    })

    it('match calls error handler', () => {
        const r = Result.error('fail')
        const result = r.match({
            ok: v => v,
            error: e => 'handled: ' + e,
        })
        assert.equal(result, 'handled: fail')
    })
})

// ════════════════════════════════════════
// BACKWARDS COMPATIBILITY
// ════════════════════════════════════════
describe('AI: No Regression', () => {
    it('hello.lume still compiles correctly', () => {
        const js = compileToJS('let language = "Lume"\nlet version = 1\nshow "Hello from {language} v{version}"')
        assert.ok(!js.includes('__lume_'), 'Should not inject runtime for non-AI code')
        assert.ok(js.includes('console.log'))
    })

    it('functions without AI still work', () => {
        const js = compileToJS('to add(a: number, b: number) -> a + b\nshow add(3, 4)')
        assert.ok(js.includes('function add'))
        assert.ok(!js.includes('async'))
    })
})
