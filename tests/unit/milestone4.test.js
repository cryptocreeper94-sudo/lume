/**
 * ====== Lume Unit Tests — Milestone 4: Interoperability ======
 * Tests fetch, pipe, read/write, stdlib, and expression chaining.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, TokenType } from '../../src/lexer.js'
import { parse, NodeType } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'
import { text, math, list, time, convert } from '../../src/stdlib.js'

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

function runLume(source) {
    const js = compileToJS(source)
    const output = []
    const origLog = console.log
    console.log = (...args) => output.push(args.join(' '))
    try {
        new Function(js)()
    } finally {
        console.log = origLog
    }
    return output
}

// ════════════════════════════════════════
// LEXER: pipe operator
// ════════════════════════════════════════
describe('Lexer: Pipe Operator', () => {
    it('tokenizes |> as PIPE', () => {
        const tokens = tokenize('x |> y', 'test.lume')
        assert.equal(tokens[1].type, TokenType.PIPE)
    })

    it('tokenizes fetch as keyword', () => {
        const tokens = tokenize('fetch "url"', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'fetch')
    })
})

// ════════════════════════════════════════
// PARSER: Fetch, Pipe, Read, Write
// ════════════════════════════════════════
describe('Parser: Fetch Expression', () => {
    it('parses basic fetch', () => {
        const ast = parseAST('let data = fetch "https://api.example.com"')
        const value = ast.body[0].value
        assert.equal(value.type, NodeType.FetchExpression)
        assert.equal(value.method, 'get')
    })

    it('parses fetch.post with body', () => {
        const ast = parseAST('let r = fetch.post "https://api.example.com" with { name: "test" }')
        const value = ast.body[0].value
        assert.equal(value.type, NodeType.FetchExpression)
        assert.equal(value.method, 'post')
        assert.ok(value.body)
    })

    it('parses fetch with as json', () => {
        const ast = parseAST('let data = fetch "url" as json')
        const value = ast.body[0].value
        assert.equal(value.outputFormat, 'json')
    })
})

describe('Parser: Pipe Expression', () => {
    it('parses simple pipe', () => {
        const ast = parseAST('let x = 42 |> double')
        const value = ast.body[0].value
        assert.equal(value.type, NodeType.PipeExpression)
    })

    it('parses chained pipes', () => {
        const ast = parseAST('let x = 42 |> double |> add(1)')
        const outer = ast.body[0].value
        assert.equal(outer.type, NodeType.PipeExpression)
        assert.equal(outer.left.type, NodeType.PipeExpression) // nested
    })
})

describe('Parser: Read/Write', () => {
    it('parses read expression', () => {
        const ast = parseAST('let content = read "data.txt"')
        assert.equal(ast.body[0].value.type, NodeType.ReadExpression)
    })

    it('parses write statement', () => {
        const ast = parseAST('write "hello" to "output.txt"')
        assert.equal(ast.body[0].type, NodeType.WriteExpression)
    })
})

describe('Parser: Await Expression', () => {
    it('parses await expression', () => {
        const ast = parseAST('let x = await some_async()')
        assert.equal(ast.body[0].value.type, NodeType.AwaitExpression)
    })
})

// ════════════════════════════════════════
// TRANSPILER: M4 Code Generation
// ════════════════════════════════════════
describe('Transpiler: Fetch', () => {
    it('emits fetch() for basic GET', () => {
        const js = compileToJS('let data = fetch "https://api.example.com"')
        assert.ok(js.includes('await fetch('))
        assert.ok(js.includes('.json()'))
    })

    it('emits fetch with POST method', () => {
        const js = compileToJS('let r = fetch.post "url" with { name: "test" }')
        assert.ok(js.includes('"POST"'))
        assert.ok(js.includes('JSON.stringify'))
    })

    it('emits text response when as text', () => {
        const js = compileToJS('let data = fetch "url" as text')
        assert.ok(js.includes('.text()'))
    })
})

describe('Transpiler: Pipe', () => {
    it('emits function call for pipe', () => {
        const js = compileToJS('let x = 42 |> double')
        assert.ok(js.includes('double(42)'))
    })

    it('emits with extra args for pipe to call', () => {
        const js = compileToJS('let x = 42 |> add(1)')
        assert.ok(js.includes('add(42, 1)'))
    })
})

describe('Transpiler: Read/Write', () => {
    it('emits readFileSync for read', () => {
        const js = compileToJS('let content = read "data.txt"')
        assert.ok(js.includes('readFileSync'))
        assert.ok(js.includes('import'))
        assert.ok(js.includes('node:fs'))
    })

    it('emits writeFileSync for write', () => {
        const js = compileToJS('write "hello" to "output.txt"')
        assert.ok(js.includes('writeFileSync'))
    })
})

describe('Transpiler: Await', () => {
    it('emits await', () => {
        const js = compileToJS('let x = await some_async()')
        assert.ok(js.includes('await some_async()'))
    })
})

// ════════════════════════════════════════
// STANDARD LIBRARY
// ════════════════════════════════════════
describe('Stdlib: Text', () => {
    it('upper/lower', () => {
        assert.equal(text.upper('hello'), 'HELLO')
        assert.equal(text.lower('HELLO'), 'hello')
    })

    it('trim', () => {
        assert.equal(text.trim('  hi  '), 'hi')
    })

    it('split/join', () => {
        assert.deepEqual(text.split('a,b,c', ','), ['a', 'b', 'c'])
        assert.equal(text.join(['a', 'b'], '-'), 'a-b')
    })

    it('contains/starts_with/ends_with', () => {
        assert.equal(text.contains('hello world', 'world'), true)
        assert.equal(text.starts_with('hello', 'hel'), true)
        assert.equal(text.ends_with('hello', 'llo'), true)
    })

    it('reverse/repeat', () => {
        assert.equal(text.reverse('abc'), 'cba')
        assert.equal(text.repeat('ha', 3), 'hahaha')
    })
})

describe('Stdlib: Math', () => {
    it('abs/ceil/floor/round', () => {
        assert.equal(math.abs(-5), 5)
        assert.equal(math.ceil(1.2), 2)
        assert.equal(math.floor(1.8), 1)
        assert.equal(math.round(1.5), 2)
    })

    it('min/max', () => {
        assert.equal(math.min(1, 2, 3), 1)
        assert.equal(math.max(1, 2, 3), 3)
    })

    it('clamp', () => {
        assert.equal(math.clamp(15, 0, 10), 10)
        assert.equal(math.clamp(-5, 0, 10), 0)
        assert.equal(math.clamp(5, 0, 10), 5)
    })

    it('sum/average', () => {
        assert.equal(math.sum([1, 2, 3, 4]), 10)
        assert.equal(math.average([1, 2, 3, 4]), 2.5)
    })

    it('random_int', () => {
        const r = math.random_int(1, 10)
        assert.ok(r >= 1 && r <= 10)
    })
})

describe('Stdlib: List', () => {
    it('first/last/rest', () => {
        assert.equal(list.first([1, 2, 3]), 1)
        assert.equal(list.last([1, 2, 3]), 3)
        assert.deepEqual(list.rest([1, 2, 3]), [2, 3])
    })

    it('map/filter', () => {
        assert.deepEqual(list.map([1, 2, 3], x => x * 2), [2, 4, 6])
        assert.deepEqual(list.filter([1, 2, 3, 4], x => x % 2 === 0), [2, 4])
    })

    it('unique', () => {
        assert.deepEqual(list.unique([1, 2, 2, 3, 3]), [1, 2, 3])
    })

    it('range', () => {
        assert.deepEqual(list.range(0, 5), [0, 1, 2, 3, 4])
        assert.deepEqual(list.range(0, 10, 3), [0, 3, 6, 9])
    })

    it('chunk', () => {
        assert.deepEqual(list.chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
    })

    it('zip', () => {
        assert.deepEqual(list.zip([1, 2], ['a', 'b']), [[1, 'a'], [2, 'b']])
    })

    it('count/empty', () => {
        assert.equal(list.count([1, 2, 3]), 3)
        assert.equal(list.empty([]), true)
        assert.equal(list.empty([1]), false)
    })
})

describe('Stdlib: Convert', () => {
    it('to_number/to_text', () => {
        assert.equal(convert.to_number('42'), 42)
        assert.equal(convert.to_text(42), '42')
    })

    it('to_json/from_json', () => {
        const obj = { name: 'Lume' }
        const json = convert.to_json(obj)
        assert.ok(json.includes('Lume'))
        assert.deepEqual(convert.from_json('{"a":1}'), { a: 1 })
    })
})

// ════════════════════════════════════════
// PIPE: End-to-End with Functions
// ════════════════════════════════════════
describe('Pipe: End-to-End', () => {
    it('pipe with user-defined functions', () => {
        const output = runLume(`
to double(n: number) -> n * 2
to add_one(n: number) -> n + 1
show 5 |> double |> add_one
`)
        assert.equal(output[0], '11')
    })

    it('pipe with function call args', () => {
        const output = runLume(`
to multiply(a: number, b: number) -> a * b
show 5 |> multiply(3)
`)
        assert.equal(output[0], '15')
    })
})

// ════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ════════════════════════════════════════
describe('M4: No Regression', () => {
    it('hello.lume still works', () => {
        const output = runLume('let language = "Lume"\nlet version = 1\nshow "Hello from {language} v{version}"')
        assert.equal(output[0], 'Hello from Lume v1')
    })

    it('FizzBuzz still works', () => {
        const output = runLume(`
for i in 1 to 6:
    if i % 3 == 0:
        show "Fizz"
    else:
        show i
`)
        assert.deepEqual(output, ['1', '2', 'Fizz', '4', '5'])
    })
})
