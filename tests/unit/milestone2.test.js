/**
 * ====== Lume Unit Tests — Milestone 2 ======
 * Tests for core language features: control flow, functions, loops, types, etc.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, TokenType } from '../../src/lexer.js'
import { parse, NodeType } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'

// ── Helpers ──
function compileToJS(source) {
    const tokens = tokenize(source, 'test.lume')
    const ast = parse(tokens, 'test.lume')
    return transpile(ast, 'test.lume')
}

function runLume(source) {
    const js = compileToJS(source)
    const output = []
    const origLog = console.log
    const origErr = console.error
    console.log = (...args) => output.push(args.join(' '))
    console.error = (...args) => { } // suppress test error output
    try {
        new Function(js)()
    } finally {
        console.log = origLog
        console.error = origErr
    }
    return output
}

// ════════════════════════════════════════
// IF / ELSE
// ════════════════════════════════════════
describe('If/Else', () => {
    it('if true executes body', () => {
        const output = runLume(`
let x = 10
if x is greater than 5:
    show "big"
`)
        assert.equal(output[0], 'big')
    })

    it('if false skips body', () => {
        const output = runLume(`
let x = 3
if x is greater than 5:
    show "big"
show "done"
`)
        assert.equal(output.length, 1)
        assert.equal(output[0], 'done')
    })

    it('if/else works', () => {
        const output = runLume(`
let x = 3
if x is greater than 5:
    show "big"
else:
    show "small"
`)
        assert.equal(output[0], 'small')
    })

    it('if with traditional operators', () => {
        const output = runLume(`
let age = 20
if age >= 18:
    show "adult"
`)
        assert.equal(output[0], 'adult')
    })

    it('if with and/or', () => {
        const output = runLume(`
let a = true
let b = true
if a and b:
    show "both"
`)
        assert.equal(output[0], 'both')
    })
})

// ════════════════════════════════════════
// FUNCTIONS
// ════════════════════════════════════════
describe('Functions', () => {
    it('basic function definition and call', () => {
        const output = runLume(`
to greet(name: text) -> text:
    return "Hello, " + name
show greet("Ada")
`)
        assert.equal(output[0], 'Hello, Ada')
    })

    it('short form function', () => {
        const output = runLume(`
to double(n: number) -> n * 2
show double(21)
`)
        assert.equal(output[0], '42')
    })

    it('function with no return type', () => {
        const output = runLume(`
to say_hello():
    show "hello"
say_hello()
`)
        assert.equal(output[0], 'hello')
    })

    it('function with multiple params', () => {
        const output = runLume(`
to add(a: number, b: number) -> a + b
show add(3, 4)
`)
        assert.equal(output[0], '7')
    })

    it('nested function calls', () => {
        const output = runLume(`
to double(n: number) -> n * 2
to inc(n: number) -> n + 1
show double(inc(5))
`)
        assert.equal(output[0], '12')
    })
})

// ════════════════════════════════════════
// LOOPS
// ════════════════════════════════════════
describe('Loops', () => {
    it('for each iterates over list', () => {
        const output = runLume(`
let colors = ["red", "green", "blue"]
for each color in colors:
    show color
`)
        assert.deepEqual(output, ['red', 'green', 'blue'])
    })

    it('for range loop', () => {
        const output = runLume(`
for i in 0 to 5:
    show i
`)
        assert.deepEqual(output, ['0', '1', '2', '3', '4'])
    })

    it('for range with step', () => {
        const output = runLume(`
for i in 0 to 10 by 3:
    show i
`)
        assert.deepEqual(output, ['0', '3', '6', '9'])
    })

    it('while loop', () => {
        const output = runLume(`
let count = 0
while count is less than 3:
    show count
    set count to count + 1
`)
        assert.deepEqual(output, ['0', '1', '2'])
    })

    it('break exits loop', () => {
        const output = runLume(`
for i in 0 to 10:
    if i == 3:
        break
    show i
`)
        assert.deepEqual(output, ['0', '1', '2'])
    })

    it('continue skips iteration', () => {
        const output = runLume(`
for i in 0 to 5:
    if i == 2:
        continue
    show i
`)
        assert.deepEqual(output, ['0', '1', '3', '4'])
    })
})

// ════════════════════════════════════════
// WHEN / PATTERN MATCHING
// ════════════════════════════════════════
describe('When/Is', () => {
    it('when with string patterns', () => {
        const output = runLume(`
let tier = "gold"
when tier is:
    "gold" -> show "80% price"
    "silver" -> show "90% price"
    default -> show "full price"
`)
        assert.equal(output[0], '80% price')
    })

    it('when default case', () => {
        const output = runLume(`
let tier = "bronze"
when tier is:
    "gold" -> show "80%"
    "silver" -> show "90%"
    default -> show "100%"
`)
        assert.equal(output[0], '100%')
    })
})

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
describe('Types', () => {
    it('custom type creates a class', () => {
        const js = compileToJS(`
type User:
    name: text
    age: number
`)
        assert.ok(js.includes('class User'))
        assert.ok(js.includes('constructor'))
    })

    it('type with default value', () => {
        const js = compileToJS(`
type Config:
    debug: boolean = false
    port: number = 3000
`)
        assert.ok(js.includes('class Config'))
        assert.ok(js.includes('false'))
    })
})

// ════════════════════════════════════════
// COMPOUND ASSIGNMENT
// ════════════════════════════════════════
describe('Compound Assignment', () => {
    it('+= works', () => {
        const output = runLume(`
let x = 10
x += 5
show x
`)
        assert.equal(output[0], '15')
    })

    it('-= works', () => {
        const output = runLume(`
let x = 10
x -= 3
show x
`)
        assert.equal(output[0], '7')
    })
})

// ════════════════════════════════════════
// SET (outer scope mutation)
// ════════════════════════════════════════
describe('Set Statement', () => {
    it('set mutates outer scope', () => {
        const output = runLume(`
let x = 1
set x to 42
show x
`)
        assert.equal(output[0], '42')
    })
})

// ════════════════════════════════════════
// INLINE TESTS
// ════════════════════════════════════════
describe('Test Blocks', () => {
    it('inline test runs and passes', () => {
        const output = runLume(`
test "addition works":
    expect 2 + 2 to equal 4
`)
        assert.ok(output[0].includes('✓'), 'Should show passing test')
    })

    it('compiles expect with to equal', () => {
        const js = compileToJS(`
test "math":
    expect 5 to equal 5
`)
        assert.ok(js.includes('!=='))
    })
})

// ════════════════════════════════════════
// MODULES
// ════════════════════════════════════════
describe('Modules', () => {
    it('use generates import statement', () => {
        const js = compileToJS(`use "lodash" as _`)
        assert.ok(js.includes('import * as _'))
    })

    it('use with destructured imports', () => {
        const js = compileToJS(`use { sortBy, groupBy } from "lodash"`)
        assert.ok(js.includes('import { sortBy, groupBy }'))
    })

    it('export function', () => {
        const js = compileToJS(`
export to add(a: number, b: number) -> a + b
`)
        assert.ok(js.includes('export function add'))
    })
})

// ════════════════════════════════════════
// COMPLEX PROGRAMS
// ════════════════════════════════════════
describe('Complex Programs', () => {
    it('FizzBuzz', () => {
        const output = runLume(`
for i in 1 to 16:
    if i % 15 == 0:
        show "FizzBuzz"
    else if i % 3 == 0:
        show "Fizz"
    else if i % 5 == 0:
        show "Buzz"
    else:
        show i
`)
        assert.equal(output[0], '1')
        assert.equal(output[2], 'Fizz')
        assert.equal(output[4], 'Buzz')
        assert.equal(output[14], 'FizzBuzz')
    })

    it('function with conditional logic', () => {
        const output = runLume(`
to classify(n: number) -> text:
    if n is greater than 0:
        return "positive"
    else if n is less than 0:
        return "negative"
    else:
        return "zero"
show classify(42)
show classify(-5)
show classify(0)
`)
        assert.deepEqual(output, ['positive', 'negative', 'zero'])
    })

    it('calculate_discount with when', () => {
        const output = runLume(`
to calculate_discount(price: number, tier: text) -> number:
    when tier is:
        "gold" -> return price * 0.80
        "silver" -> return price * 0.90
        default -> return price
show calculate_discount(100, "gold")
show calculate_discount(100, "silver")
show calculate_discount(100, "none")
`)
        assert.equal(output[0], '80')
        assert.equal(output[1], '90')
        assert.equal(output[2], '100')
    })

    it('nested loops', () => {
        const output = runLume(`
for i in 0 to 3:
    for j in 0 to 2:
        show i * 10 + j
`)
        assert.deepEqual(output, ['0', '1', '10', '11', '20', '21'])
    })
})
