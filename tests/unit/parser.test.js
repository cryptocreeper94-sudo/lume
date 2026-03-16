/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Parser — Comprehensive Test Suite
 *  Tests AST generation for all 35+ node types including:
 *    declarations, control flow, functions, loops, types,
 *    modules, expressions, English Mode nodes, and more.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize } from '../../src/lexer.js'
import { Parser, NodeType } from '../../src/parser.js'

// Helper — takes code, returns AST body
function parse(code) {
    const tokens = tokenize(code)
    const parser = new Parser(tokens, '<test>')
    return parser.parse()
}
function body(code) {
    return parse(code).body
}
function first(code) {
    return body(code)[0]
}

// ══════════════════════════════════════
//  Program Structure
// ══════════════════════════════════════

describe('Parser: Program', () => {
    it('parses empty program', () => {
        const ast = parse('')
        assert.equal(ast.type, NodeType.Program)
        assert.ok(Array.isArray(ast.body))
    })
    it('has line and column on root', () => {
        const ast = parse('let x = 1')
        assert.equal(ast.line, 1)
        assert.equal(ast.column, 1)
    })
    it('parses multiple statements', () => {
        const stmts = body('let x = 1\nlet y = 2\nlet z = 3')
        assert.equal(stmts.length, 3)
    })
})

// ══════════════════════════════════════
//  Declarations
// ══════════════════════════════════════

describe('Parser: LetDeclaration', () => {
    it('parses let with number', () => {
        const node = first('let x = 42')
        assert.equal(node.type, NodeType.LetDeclaration)
        assert.equal(node.name, 'x')
        assert.equal(node.value.type, NodeType.NumberLiteral)
        assert.equal(node.value.value, 42)
    })
    it('parses let with string', () => {
        const node = first('let name = "Alice"')
        assert.equal(node.name, 'name')
        assert.equal(node.value.type, NodeType.StringLiteral)
        assert.equal(node.value.value, 'Alice')
    })
    it('parses let with boolean', () => {
        const node = first('let active = true')
        assert.equal(node.value.type, NodeType.BooleanLiteral)
        assert.equal(node.value.value, true)
    })
    it('parses let with null', () => {
        const node = first('let empty = null')
        assert.equal(node.value.type, NodeType.NullLiteral)
    })
    it('parses let with list', () => {
        const node = first('let items = [1, 2, 3]')
        assert.equal(node.value.type, NodeType.ListLiteral)
        assert.equal(node.value.elements.length, 3)
    })
    it('parses let with map', () => {
        const node = first('let obj = { name: "Alice", age: 30 }')
        assert.equal(node.value.type, NodeType.MapLiteral)
        assert.ok(node.value.entries.length >= 2)
    })
    it('parses let with type annotation', () => {
        const node = first('let x: number = 42')
        assert.equal(node.name, 'x')
        assert.ok(node.typeAnnotation)
    })
    it('preserves line and column', () => {
        const node = first('let x = 1')
        assert.equal(node.line, 1)
    })
})

describe('Parser: DefineDeclaration', () => {
    it('parses define with value', () => {
        const node = first('define count = 0')
        assert.equal(node.type, NodeType.DefineDeclaration)
        assert.equal(node.name, 'count')
    })
    it('parses define with expression', () => {
        const node = first('define total = 10 + 20')
        assert.equal(node.type, NodeType.DefineDeclaration)
        assert.equal(node.value.type, NodeType.BinaryExpression)
    })
})

// ══════════════════════════════════════
//  Simple Statements
// ══════════════════════════════════════

describe('Parser: ShowStatement', () => {
    it('parses show with string', () => {
        const node = first('show "hello"')
        assert.equal(node.type, NodeType.ShowStatement)
        assert.equal(node.value.type, NodeType.StringLiteral)
    })
    it('parses show with expression', () => {
        const node = first('show 1 + 2')
        assert.equal(node.type, NodeType.ShowStatement)
        assert.equal(node.value.type, NodeType.BinaryExpression)
    })
})

describe('Parser: LogStatement', () => {
    it('parses log statement', () => {
        const node = first('log "debug info"')
        assert.equal(node.type, NodeType.LogStatement)
    })
})

describe('Parser: SetStatement', () => {
    it('parses set to', () => {
        const node = first('set count to 10')
        assert.equal(node.type, NodeType.SetStatement)
        assert.equal(node.name, 'count')
    })
})

describe('Parser: ReturnStatement', () => {
    it('parses return with value', () => {
        const node = first('return 42')
        assert.equal(node.type, NodeType.ReturnStatement)
        assert.ok(node.value)
    })
    it('parses empty return', () => {
        const node = first('return\n')
        assert.equal(node.type, NodeType.ReturnStatement)
        assert.equal(node.value, null)
    })
})

describe('Parser: BreakStatement', () => {
    it('parses break', () => {
        const node = first('break')
        assert.equal(node.type, NodeType.BreakStatement)
    })
})

describe('Parser: ContinueStatement', () => {
    it('parses continue', () => {
        const node = first('continue')
        assert.equal(node.type, NodeType.ContinueStatement)
    })
})

// ══════════════════════════════════════
//  Control Flow
// ══════════════════════════════════════

describe('Parser: IfStatement', () => {
    it('parses simple if', () => {
        const node = first('if x is 1:\n    show "yes"')
        assert.equal(node.type, NodeType.IfStatement)
        assert.ok(node.condition)
        assert.ok(node.body.length >= 1)
    })
    it('parses if/else', () => {
        const node = first('if true:\n    show "a"\nelse:\n    show "b"')
        assert.equal(node.type, NodeType.IfStatement)
        assert.ok(node.elseBody)
    })
    it('parses if/else-if chain', () => {
        const code = 'if x is 1:\n    show "a"\nelse if x is 2:\n    show "b"\nelse:\n    show "c"'
        const node = first(code)
        assert.equal(node.type, NodeType.IfStatement)
        assert.ok(node.elseBody)
        assert.equal(node.elseBody[0].type, NodeType.IfStatement)
    })
    it('parses natural language operators: is at least', () => {
        const node = first('if x is at least 10:\n    show "big"')
        assert.equal(node.condition.operator, '>=')
    })
    it('parses natural language operators: is greater than', () => {
        const node = first('if x is greater than 5:\n    show "high"')
        assert.equal(node.condition.operator, '>')
    })
    it('parses natural language operators: is less than', () => {
        const node = first('if x is less than 0:\n    show "neg"')
        assert.equal(node.condition.operator, '<')
    })
    it('parses natural language operators: is at most', () => {
        const node = first('if x is at most 100:\n    show "ok"')
        assert.equal(node.condition.operator, '<=')
    })
    it('parses natural language operators: is not', () => {
        const node = first('if x is not null:\n    show "exists"')
        assert.equal(node.condition.operator, '!=')
    })
})

describe('Parser: WhileStatement', () => {
    it('parses while loop', () => {
        const node = first('while true:\n    show "loop"')
        assert.equal(node.type, NodeType.WhileStatement)
        assert.ok(node.condition)
        assert.ok(node.body.length >= 1)
    })
})

// ══════════════════════════════════════
//  Loops
// ══════════════════════════════════════

describe('Parser: ForEachStatement', () => {
    it('parses for each', () => {
        const node = first('for each item in items:\n    show item')
        assert.equal(node.type, NodeType.ForEachStatement)
        assert.equal(node.item, 'item')
    })
    it('parses for each with index', () => {
        const node = first('for each item, idx in items:\n    show idx')
        assert.equal(node.type, NodeType.ForEachIndexStatement)
        assert.equal(node.item, 'item')
        assert.equal(node.index, 'idx')
    })
})

describe('Parser: ForRangeStatement', () => {
    it('parses for range', () => {
        const node = first('for i in 0 to 10:\n    show i')
        assert.equal(node.type, NodeType.ForRangeStatement)
        assert.equal(node.variable, 'i')
    })
    it('parses for range with step', () => {
        const node = first('for i in 0 to 100 by 5:\n    show i')
        assert.equal(node.type, NodeType.ForRangeStatement)
        assert.ok(node.step)
    })
})

// ══════════════════════════════════════
//  Functions
// ══════════════════════════════════════

describe('Parser: FunctionDeclaration', () => {
    it('parses simple function', () => {
        const node = first('to greet(name):\n    show name')
        assert.equal(node.type, NodeType.FunctionDeclaration)
        assert.equal(node.name, 'greet')
        assert.equal(node.params.length, 1)
        assert.equal(node.params[0].name, 'name')
    })
    it('parses function with typed params', () => {
        const node = first('to add(a: number, b: number):\n    return a')
        assert.equal(node.params.length, 2)
        assert.ok(node.params[0].typeAnnotation)
    })
    it('parses short form function', () => {
        const node = first('to double(n) -> n')
        assert.equal(node.type, NodeType.FunctionDeclaration)
        assert.equal(node.isShortForm, true)
    })
    it('parses function with no params', () => {
        const node = first('to hello():\n    show "hi"')
        assert.equal(node.params.length, 0)
    })
    it('parses function with multiple params', () => {
        const node = first('to calc(a, b, c):\n    return a')
        assert.equal(node.params.length, 3)
    })
})

// ══════════════════════════════════════
//  Types
// ══════════════════════════════════════

describe('Parser: TypeDeclaration', () => {
    it('parses type with fields', () => {
        const node = first('type User:\n    name: text\n    age: number')
        assert.equal(node.type, NodeType.TypeDeclaration)
        assert.equal(node.name, 'User')
        assert.equal(node.isAlias, false)
        assert.ok(node.fields.length >= 2)
    })
    it('parses type alias', () => {
        const node = first('type Score = number')
        assert.equal(node.isAlias, true)
    })
    it('parses type field default value', () => {
        const node = first('type Config:\n    timeout: number = 5000')
        assert.ok(node.fields[0].defaultValue)
    })
})

// ══════════════════════════════════════
//  Modules
// ══════════════════════════════════════

describe('Parser: UseStatement', () => {
    it('parses use module', () => {
        const node = first('use "stdlib"')
        assert.equal(node.type, NodeType.UseStatement)
        assert.equal(node.source, 'stdlib')
    })
    it('parses use with alias', () => {
        const node = first('use "math" as m')
        assert.equal(node.alias, 'm')
    })
    it('parses destructured use', () => {
        const node = first('use { sin, cos } from "math"')
        assert.deepEqual(node.imports, ['sin', 'cos'])
    })
})

describe('Parser: ExportStatement', () => {
    it('parses export let', () => {
        const node = first('export let x = 1')
        assert.equal(node.type, NodeType.ExportStatement)
        assert.equal(node.declaration.type, NodeType.LetDeclaration)
    })
})

// ══════════════════════════════════════
//  Testing Blocks
// ══════════════════════════════════════

describe('Parser: TestBlock', () => {
    it('parses test block', () => {
        const node = first('test "addition":\n    show 1 + 1')
        assert.equal(node.type, NodeType.TestBlock)
        assert.equal(node.name, 'addition')
        assert.ok(node.body.length >= 1)
    })
})

// ══════════════════════════════════════
//  Expressions
// ══════════════════════════════════════

describe('Parser: Expressions', () => {
    it('parses binary expressions', () => {
        const node = first('let x = 1 + 2')
        assert.equal(node.value.type, NodeType.BinaryExpression)
    })
    it('parses nested binary', () => {
        const node = first('let x = 1 + 2 * 3')
        assert.equal(node.value.type, NodeType.BinaryExpression)
    })
    it('parses unary expression', () => {
        const node = first('let x = -5')
        assert.equal(node.value.type, NodeType.UnaryExpression)
    })
    it('parses member access', () => {
        const node = first('let x = obj.name')
        assert.equal(node.value.type, NodeType.MemberExpression)
        assert.equal(node.value.property, 'name')
    })
    it('parses index access', () => {
        const node = first('let x = items[0]')
        assert.equal(node.value.type, NodeType.IndexExpression)
    })
    it('parses function call', () => {
        const node = first('let x = foo(1, 2)')
        assert.equal(node.value.type, NodeType.CallExpression)
        assert.equal(node.value.arguments.length, 2)
    })
    it('parses nested function call', () => {
        const node = first('let x = math.round(3.14)')
        assert.equal(node.value.type, NodeType.CallExpression)
    })
    it('parses interpolated string', () => {
        const node = first('let x = "hello {name}"')
        assert.equal(node.value.type, NodeType.InterpolatedString)
    })
    it('parses empty list', () => {
        const node = first('let x = []')
        assert.equal(node.value.type, NodeType.ListLiteral)
        assert.equal(node.value.elements.length, 0)
    })
    it('parses empty map', () => {
        const node = first('let x = {}')
        assert.equal(node.value.type, NodeType.MapLiteral)
    })
    it('parses chained member access', () => {
        const node = first('let x = a.b.c')
        assert.equal(node.value.type, NodeType.MemberExpression)
    })
    it('parses compound assignment +=', () => {
        const node = first('x += 1')
        assert.equal(node.type, NodeType.AssignmentExpression)
        assert.equal(node.operator, '+=')
    })
    it('parses compound assignment -=', () => {
        const node = first('x -= 5')
        assert.equal(node.operator, '-=')
    })
    it('parses compound assignment *=', () => {
        const node = first('x *= 2')
        assert.equal(node.operator, '*=')
    })
    it('parses compound assignment /=', () => {
        const node = first('x /= 3')
        assert.equal(node.operator, '/=')
    })
})

// ══════════════════════════════════════
//  AI Expressions
// ══════════════════════════════════════

describe('Parser: AI Expressions', () => {
    it('parses ask expression', () => {
        const node = first('let x = ask "question"')
        assert.equal(node.value.type, NodeType.AskExpression)
    })
    it('parses think expression', () => {
        const node = first('let x = think "analyze this"')
        assert.equal(node.value.type, NodeType.ThinkExpression)
    })
    it('parses generate expression', () => {
        const node = first('let x = generate "a poem"')
        assert.equal(node.value.type, NodeType.GenerateExpression)
    })
})

// ══════════════════════════════════════
//  Pipe Expression
// ══════════════════════════════════════

describe('Parser: PipeExpression', () => {
    it('parses single pipe', () => {
        const node = first('let x = data |> process')
        assert.equal(node.value.type, NodeType.PipeExpression)
    })
})

// ══════════════════════════════════════
//  Comments
// ══════════════════════════════════════

describe('Parser: Comments', () => {
    it('parses single-line comment', () => {
        const node = first('// this is a comment')
        assert.equal(node.type, NodeType.CommentNode)
    })
    it('preserves comment text', () => {
        const node = first('// hello world')
        assert.ok(node.value.includes('hello'))
    })
})

// ══════════════════════════════════════
//  Config Blocks (Runtime)
// ══════════════════════════════════════

describe('Parser: Config Blocks', () => {
    it('parses monitor block', () => {
        const node = first('monitor:\n    interval: 5000')
        assert.equal(node.type, NodeType.MonitorBlock)
    })
})

// ══════════════════════════════════════
//  Error Cases
// ══════════════════════════════════════

describe('Parser: Error Handling', () => {
    it('throws on invalid token sequence', () => {
        assert.throws(() => parse('let = 1'), /Parse Error/)
    })
    it('includes filename in error', () => {
        const tokens = tokenize('let = 1')
        const parser = new Parser(tokens, 'test.lume')
        assert.throws(() => parser.parse(), /test\.lume/)
    })
    it('includes line number in error', () => {
        assert.throws(() => parse('let = 1'), /line/)
    })
})

// ══════════════════════════════════════
//  NodeType Completeness
// ══════════════════════════════════════

describe('Parser: NodeType Enum', () => {
    it('has Program', () => assert.ok(NodeType.Program))
    it('has LetDeclaration', () => assert.ok(NodeType.LetDeclaration))
    it('has DefineDeclaration', () => assert.ok(NodeType.DefineDeclaration))
    it('has ShowStatement', () => assert.ok(NodeType.ShowStatement))
    it('has LogStatement', () => assert.ok(NodeType.LogStatement))
    it('has SetStatement', () => assert.ok(NodeType.SetStatement))
    it('has ReturnStatement', () => assert.ok(NodeType.ReturnStatement))
    it('has IfStatement', () => assert.ok(NodeType.IfStatement))
    it('has WhenStatement', () => assert.ok(NodeType.WhenStatement))
    it('has ForEachStatement', () => assert.ok(NodeType.ForEachStatement))
    it('has ForEachIndexStatement', () => assert.ok(NodeType.ForEachIndexStatement))
    it('has ForRangeStatement', () => assert.ok(NodeType.ForRangeStatement))
    it('has WhileStatement', () => assert.ok(NodeType.WhileStatement))
    it('has BreakStatement', () => assert.ok(NodeType.BreakStatement))
    it('has ContinueStatement', () => assert.ok(NodeType.ContinueStatement))
    it('has FunctionDeclaration', () => assert.ok(NodeType.FunctionDeclaration))
    it('has AskExpression', () => assert.ok(NodeType.AskExpression))
    it('has ThinkExpression', () => assert.ok(NodeType.ThinkExpression))
    it('has GenerateExpression', () => assert.ok(NodeType.GenerateExpression))
    it('has FetchExpression', () => assert.ok(NodeType.FetchExpression))
    it('has PipeExpression', () => assert.ok(NodeType.PipeExpression))
    it('has BinaryExpression', () => assert.ok(NodeType.BinaryExpression))
    it('has UnaryExpression', () => assert.ok(NodeType.UnaryExpression))
    it('has CallExpression', () => assert.ok(NodeType.CallExpression))
    it('has MemberExpression', () => assert.ok(NodeType.MemberExpression))
    it('has IndexExpression', () => assert.ok(NodeType.IndexExpression))
    it('has StringLiteral', () => assert.ok(NodeType.StringLiteral))
    it('has InterpolatedString', () => assert.ok(NodeType.InterpolatedString))
    it('has NumberLiteral', () => assert.ok(NodeType.NumberLiteral))
    it('has BooleanLiteral', () => assert.ok(NodeType.BooleanLiteral))
    it('has NullLiteral', () => assert.ok(NodeType.NullLiteral))
    it('has ListLiteral', () => assert.ok(NodeType.ListLiteral))
    it('has MapLiteral', () => assert.ok(NodeType.MapLiteral))
    it('has Identifier', () => assert.ok(NodeType.Identifier))
    it('has TypeDeclaration', () => assert.ok(NodeType.TypeDeclaration))
    it('has TestBlock', () => assert.ok(NodeType.TestBlock))
    it('has UseStatement', () => assert.ok(NodeType.UseStatement))
    it('has ExportStatement', () => assert.ok(NodeType.ExportStatement))
    it('has CommentNode', () => assert.ok(NodeType.CommentNode))
    it('has MonitorBlock', () => assert.ok(NodeType.MonitorBlock))
    it('has HealBlock', () => assert.ok(NodeType.HealBlock))
    it('has AssignmentExpression', () => assert.ok(NodeType.AssignmentExpression))
})
