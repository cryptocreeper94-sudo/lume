/**
 * ═══════════════════════════════════════════════════════════
 *  Milestone 11: Reverse Mode (Code-to-Language) — Test Suite
 *  Tests the explainer engine for line-by-line annotations,
 *  summary mode, JS/TS support, and AST explanation accuracy.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    explainNode,
    explainAST,
    summarizeAST,
    explainFile,
} from '../../src/intent-resolver/explainer.js'

/* ═══ Individual Node Explanation ══════════════════════ */

describe('M11: Node Explanation', () => {
    it('explains LetDeclaration', () => {
        const explanation = explainNode({
            type: 'LetDeclaration',
            name: 'count',
            value: { type: 'NumberLiteral', value: 42 },
        })
        assert.ok(explanation.includes('count'))
        assert.ok(explanation.includes('variable'))
    })

    it('explains ShowStatement', () => {
        const explanation = explainNode({
            type: 'ShowStatement',
            value: { type: 'StringLiteral', value: 'Hello World' },
        })
        assert.ok(explanation.includes('Display'))
    })

    it('explains FunctionDeclaration', () => {
        const explanation = explainNode({
            type: 'FunctionDeclaration',
            name: 'greet',
            params: [{ name: 'name' }, { name: 'age' }],
        })
        assert.ok(explanation.includes('greet'))
        assert.ok(explanation.includes('2 parameter'))
        assert.ok(explanation.includes('name'))
    })

    it('explains IfStatement', () => {
        const explanation = explainNode({
            type: 'IfStatement',
            condition: { type: 'BinaryExpression', left: { type: 'Identifier', name: 'x' }, operator: '>', right: { type: 'NumberLiteral', value: 10 } },
            body: [],
        })
        assert.ok(explanation.includes('If'))
    })

    it('explains ForEachStatement', () => {
        const explanation = explainNode({
            type: 'ForEachStatement',
            item: 'user',
            iterable: { type: 'Identifier', name: 'users' },
        })
        assert.ok(explanation.includes('user'))
        assert.ok(explanation.includes('each'))
    })

    it('explains WhileStatement', () => {
        const explanation = explainNode({
            type: 'WhileStatement',
            condition: { type: 'BooleanLiteral', value: true },
        })
        assert.ok(explanation.includes('repeating'))
    })

    it('explains ReturnStatement', () => {
        const explanation = explainNode({
            type: 'ReturnStatement',
            value: { type: 'Identifier', name: 'result' },
        })
        assert.ok(explanation.includes('Return'))
    })

    it('explains VariableAccess (English Mode)', () => {
        const explanation = explainNode({
            type: 'VariableAccess',
            source: 'users',
            field: 'name',
        })
        assert.ok(explanation.includes('users'))
        assert.ok(explanation.includes('name'))
    })

    it('explains StoreOperation (English Mode)', () => {
        const explanation = explainNode({
            type: 'StoreOperation',
            what: 'user data',
            destination: 'database',
        })
        assert.ok(explanation.includes('Save'))
    })

    it('explains DeleteOperation (English Mode)', () => {
        const explanation = explainNode({
            type: 'DeleteOperation',
            target: 'old records',
        })
        assert.ok(explanation.includes('Delete'))
    })

    it('explains CreateOperation (English Mode)', () => {
        const explanation = explainNode({
            type: 'CreateOperation',
            entity: 'user',
            fields: { name: 'John', email: 'john@example.com' },
        })
        assert.ok(explanation.includes('Create'))
        assert.ok(explanation.includes('user'))
    })

    it('explains RawBlock', () => {
        const explanation = explainNode({ type: 'RawBlock', code: 'console.log("test")' })
        assert.ok(explanation.includes('raw'))
    })

    it('explains MonitorBlock', () => {
        const explanation = explainNode({ type: 'MonitorBlock' })
        assert.ok(explanation.includes('monitor'))
    })

    it('explains HealBlock', () => {
        const explanation = explainNode({ type: 'HealBlock' })
        assert.ok(explanation.includes('heal'))
    })

    it('explains unknown node types', () => {
        const explanation = explainNode({ type: 'FutureNode' })
        assert.ok(explanation.includes('FutureNode'))
    })

    it('handles null/undefined nodes', () => {
        const explanation = explainNode(null)
        assert.ok(explanation.includes('Unknown'))
    })
})

/* ═══ Mode A: Line-by-Line Annotation ══════════════════ */

describe('M11: Mode A (Line-by-Line)', () => {
    it('annotates a simple program', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'x', value: { type: 'NumberLiteral', value: 5 }, line: 1 },
            { type: 'ShowStatement', value: { type: 'Identifier', name: 'x' }, line: 2 },
        ]
        const annotations = explainAST(ast)
        assert.equal(annotations.length, 2)
        assert.ok(annotations[0].explanation.includes('x'))
        assert.ok(annotations[1].explanation.includes('Display'))
    })

    it('includes line numbers', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'y', value: { type: 'NumberLiteral', value: 10 }, line: 3 },
        ]
        const annotations = explainAST(ast)
        assert.equal(annotations[0].line, 3)
    })

    it('includes AST type', () => {
        const ast = [
            { type: 'ShowStatement', value: { type: 'StringLiteral', value: 'hello' }, line: 1 },
        ]
        const annotations = explainAST(ast)
        assert.equal(annotations[0].type, 'ShowStatement')
    })

    it('recursively explains nested blocks', () => {
        const ast = [
            {
                type: 'IfStatement',
                condition: { type: 'BooleanLiteral', value: true },
                body: [
                    { type: 'ShowStatement', value: { type: 'StringLiteral', value: 'yes' }, line: 2 },
                ],
                line: 1,
            },
        ]
        const annotations = explainAST(ast)
        assert.ok(annotations.length > 1, 'Should include nested block annotations')
    })

    it('includes code reconstruction', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'count', value: { type: 'NumberLiteral', value: 0 }, line: 1 },
        ]
        const annotations = explainAST(ast)
        assert.ok(annotations[0].code.includes('let count'))
    })
})

/* ═══ Mode B: Summary ══════════════════════════════════ */

describe('M11: Mode B (Summary)', () => {
    it('summarizes a simple program', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'x', value: { type: 'NumberLiteral', value: 5 }, line: 1 },
            { type: 'ShowStatement', value: { type: 'Identifier', name: 'x' }, line: 2 },
        ]
        const summary = summarizeAST(ast)
        assert.ok(summary.includes('2 statement'))
    })

    it('describes functions', () => {
        const ast = [
            { type: 'FunctionDeclaration', name: 'greet', params: [{ name: 'name' }], body: [], line: 1 },
            { type: 'FunctionDeclaration', name: 'farewell', params: [], body: [], line: 5 },
        ]
        const summary = summarizeAST(ast)
        assert.ok(summary.includes('2 function'))
        assert.ok(summary.includes('greet'))
    })

    it('describes imports and exports', () => {
        const ast = [
            { type: 'UseStatement', source: 'math', imports: ['sqrt'], line: 1 },
            { type: 'ExportStatement', declaration: { name: 'calculate' }, line: 10 },
        ]
        const summary = summarizeAST(ast)
        assert.ok(summary.includes('import'))
        assert.ok(summary.includes('export'))
    })

    it('handles empty AST', () => {
        const summary = summarizeAST([])
        assert.ok(summary.includes('empty'))
    })

    it('describes AI usage', () => {
        const ast = [
            { type: 'AskExpression', value: { type: 'StringLiteral', value: 'question' }, line: 1 },
        ]
        const summary = summarizeAST(ast)
        assert.ok(summary.includes('AI'))
    })
})

/* ═══ File Explanation ═════════════════════════════════ */

describe('M11: File Explanation', () => {
    it('explains English Mode file', () => {
        const source = 'mode: english\nget the user name\nshow the result'
        const result = explainFile(source, 'test.lume')
        assert.ok(result.annotations.length >= 2)
        assert.ok(result.summary.includes('English Mode'))
    })

    it('explains JavaScript file', () => {
        const source = `const x = 5;
function greet(name) {
  console.log("Hello " + name);
  return name;
}
if (x > 3) {
  greet("World");
}`
        const result = explainFile(source, 'test.js')
        assert.ok(result.annotations.length > 0)
        assert.ok(result.annotations.some(a => a.explanation.includes('constant')))
        assert.ok(result.annotations.some(a => a.explanation.includes('function')))
    })

    it('explains TypeScript file', () => {
        const source = `import { User } from './types';
class UserService {
  async getUser(id: number) {
    const result = await fetch("/api/user");
    return result;
  }
}`
        const result = explainFile(source, 'service.ts')
        assert.ok(result.annotations.length > 0)
        assert.ok(result.summary.includes('TypeScript'))
    })

    it('returns error for unsupported file types', () => {
        const result = explainFile('some content', 'file.xyz')
        assert.ok(result.summary.includes('Unsupported'))
    })

    it('handles mode: natural files', () => {
        const source = 'mode: natural\nobtener el nombre del usuario'
        const result = explainFile(source, 'test.lume')
        assert.ok(result.annotations.length >= 1)
    })
})

/* ═══ JS Line Explanation ══════════════════════════════ */

describe('M11: JS/TS Line Explanation', () => {
    it('explains variable declarations', () => {
        const result = explainFile('const name = "John";', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('constant')))
    })

    it('explains function declarations', () => {
        const result = explainFile('function calculate(x) {}', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('function')))
    })

    it('explains async functions', () => {
        const result = explainFile('async function fetchData() {}', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('async')))
    })

    it('explains imports', () => {
        const result = explainFile("import { foo } from 'bar';", 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('Import')))
    })

    it('explains conditionals', () => {
        const result = explainFile('if (x > 5) {', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('condition')))
    })

    it('explains loops', () => {
        const result = explainFile('for (const item of list) {', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('Loop')))
    })

    it('explains return statements', () => {
        const result = explainFile('return result;', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('Return')))
    })

    it('explains console logging', () => {
        const result = explainFile('console.log("debug");', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('Log')))
    })

    it('explains class declarations', () => {
        const result = explainFile('class UserService {', 'test.js')
        assert.ok(result.annotations.some(a => a.explanation.includes('class')))
    })

    it('skips comments', () => {
        const result = explainFile('// this is a comment', 'test.js')
        assert.equal(result.annotations.length, 0)
    })

    it('skips closing braces', () => {
        const result = explainFile('}', 'test.js')
        assert.equal(result.annotations.length, 0)
    })
})

/* ═══ No Regression ════════════════════════════════════ */

describe('M11: No Regression', () => {
    it('all standard Lume AST types have explainers', () => {
        const standardTypes = [
            'LetDeclaration', 'DefineDeclaration', 'ShowStatement', 'LogStatement',
            'SetStatement', 'ReturnStatement', 'IfStatement', 'WhenStatement',
            'FunctionDeclaration', 'ForEachStatement', 'WhileStatement',
            'BreakStatement', 'ContinueStatement', 'AssignmentExpression',
            'TypeDeclaration', 'TestBlock', 'UseStatement', 'ExportStatement',
        ]
        for (const type of standardTypes) {
            const explanation = explainNode({ type, name: 'test', value: null, params: [], body: [], condition: null })
            assert.ok(explanation, `Missing explainer for ${type}`)
            assert.ok(!explanation.includes('Unknown'), `${type} should not return "Unknown": got "${explanation}"`)
        }
    })

    it('all English Mode AST types have explainers', () => {
        const englishTypes = [
            'VariableAccess', 'StoreOperation', 'DeleteOperation', 'CreateOperation',
            'UpdateOperation', 'SendOperation', 'FilterOperation', 'SortOperation',
            'ConnectionSetup', 'EventListener', 'NavigateOperation', 'DelayStatement', 'RawBlock',
        ]
        for (const type of englishTypes) {
            const explanation = explainNode({ type })
            assert.ok(explanation, `Missing explainer for ${type}`)
            assert.ok(!explanation.includes('Unknown'), `${type} should not return "Unknown"`)
        }
    })
})
