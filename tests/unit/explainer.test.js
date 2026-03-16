/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Explainer (Reverse Mode) — Comprehensive Test Suite
 *  Tests AST-to-English explanation, line-by-line annotation,
 *  summary paragraph, JS/TS line heuristics, and file explain.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { explainNode, explainAST, summarizeAST, explainFile } from '../../src/intent-resolver/explainer.js'

// ══════════════════════════════════════
//  explainNode — Standard Lume
// ══════════════════════════════════════

describe('Explainer: explainNode standard', () => {
    it('explains LetDeclaration', () => {
        const result = explainNode({ type: 'LetDeclaration', name: 'x', value: { type: 'NumberLiteral', value: 42 } })
        assert.ok(result.includes('variable'))
        assert.ok(result.includes('x'))
    })
    it('explains DefineDeclaration', () => {
        const result = explainNode({ type: 'DefineDeclaration', name: 'PI', value: { type: 'NumberLiteral', value: 3.14 } })
        assert.ok(result.includes('constant'))
        assert.ok(result.includes('PI'))
    })
    it('explains ShowStatement', () => {
        const result = explainNode({ type: 'ShowStatement', value: { type: 'StringLiteral', value: 'hello' } })
        assert.ok(result.includes('Display'))
    })
    it('explains SetStatement', () => {
        const result = explainNode({ type: 'SetStatement', name: 'count', value: { type: 'NumberLiteral', value: 10 } })
        assert.ok(result.includes('Change'))
        assert.ok(result.includes('count'))
    })
    it('explains ReturnStatement', () => {
        const result = explainNode({ type: 'ReturnStatement', value: null })
        assert.ok(result.includes('Return'))
    })
    it('explains IfStatement', () => {
        const result = explainNode({ type: 'IfStatement', condition: { type: 'BinaryExpression', operator: '>', left: { type: 'Identifier', name: 'x' }, right: { type: 'NumberLiteral', value: 0 } } })
        assert.ok(result.includes('If'))
    })
    it('explains FunctionDeclaration', () => {
        const result = explainNode({ type: 'FunctionDeclaration', name: 'greet', params: [{ name: 'name' }] })
        assert.ok(result.includes('function'))
        assert.ok(result.includes('greet'))
        assert.ok(result.includes('name'))
    })
    it('explains ForEachStatement', () => {
        const result = explainNode({ type: 'ForEachStatement', item: 'user', iterable: { type: 'Identifier', name: 'users' } })
        assert.ok(result.includes('each'))
        assert.ok(result.includes('user'))
    })
    it('explains WhileStatement', () => {
        const result = explainNode({ type: 'WhileStatement', condition: 'a condition' })
        assert.ok(result.includes('repeating'))
    })
    it('explains BreakStatement', () => {
        const result = explainNode({ type: 'BreakStatement' })
        assert.ok(result.includes('Stop'))
    })
    it('explains ContinueStatement', () => {
        const result = explainNode({ type: 'ContinueStatement' })
        assert.ok(result.includes('Skip'))
    })
    it('explains TypeDeclaration', () => {
        const result = explainNode({ type: 'TypeDeclaration', name: 'User', fields: [{ name: 'name' }, { name: 'age' }] })
        assert.ok(result.includes('User'))
    })
    it('explains TestBlock', () => {
        const result = explainNode({ type: 'TestBlock', name: 'adds numbers' })
        assert.ok(result.includes('Test'))
    })
    it('explains UseStatement', () => {
        const result = explainNode({ type: 'UseStatement', source: 'stdlib', imports: ['math'] })
        assert.ok(result.includes('Import'))
    })
    it('explains unknown type', () => {
        const result = explainNode({ type: 'SomeWeirdNode' })
        assert.ok(result.includes('SomeWeirdNode'))
    })
    it('explains null node', () => {
        const result = explainNode(null)
        assert.ok(result.includes('Unknown'))
    })
})

// ══════════════════════════════════════
//  explainNode — AI Integration
// ══════════════════════════════════════

describe('Explainer: explainNode AI', () => {
    it('explains AskExpression', () => {
        const result = explainNode({ type: 'AskExpression', value: { type: 'StringLiteral', value: 'summarize' } })
        assert.ok(result.includes('AI'))
    })
    it('explains ThinkExpression', () => {
        const result = explainNode({ type: 'ThinkExpression', value: { type: 'StringLiteral', value: 'analyze' } })
        assert.ok(result.includes('AI'))
    })
})

// ══════════════════════════════════════
//  explainNode — Self-Sustaining
// ══════════════════════════════════════

describe('Explainer: explainNode self-sustaining', () => {
    it('explains MonitorBlock', () => {
        const result = explainNode({ type: 'MonitorBlock' })
        assert.ok(result.includes('monitoring'))
    })
    it('explains HealBlock', () => {
        const result = explainNode({ type: 'HealBlock' })
        assert.ok(result.includes('self-healing'))
    })
    it('explains OptimizeBlock', () => {
        const result = explainNode({ type: 'OptimizeBlock' })
        assert.ok(result.includes('optimization'))
    })
    it('explains EvolveBlock', () => {
        const result = explainNode({ type: 'EvolveBlock' })
        assert.ok(result.includes('evolution'))
    })
})

// ══════════════════════════════════════
//  explainNode — English Mode
// ══════════════════════════════════════

describe('Explainer: explainNode English Mode', () => {
    it('explains VariableAccess', () => {
        const result = explainNode({ type: 'VariableAccess', source: 'users' })
        assert.ok(result.includes('users'))
    })
    it('explains DeleteOperation', () => {
        const result = explainNode({ type: 'DeleteOperation', target: 'old records' })
        assert.ok(result.includes('Delete'))
    })
    it('explains CreateOperation', () => {
        const result = explainNode({ type: 'CreateOperation', entity: 'user' })
        assert.ok(result.includes('Create'))
    })
    it('explains SendOperation', () => {
        const result = explainNode({ type: 'SendOperation', what: 'email' })
        assert.ok(result.includes('Send'))
    })
    it('explains EventListener', () => {
        const result = explainNode({ type: 'EventListener', event: 'click' })
        assert.ok(result.includes('click'))
    })
    it('explains NavigateOperation', () => {
        const result = explainNode({ type: 'NavigateOperation', destination: '/home' })
        assert.ok(result.includes('Navigate'))
    })
})

// ══════════════════════════════════════
//  explainAST — Line-by-Line
// ══════════════════════════════════════

describe('Explainer: explainAST', () => {
    it('annotates all nodes', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'x', value: { type: 'NumberLiteral', value: 1 }, line: 1 },
            { type: 'ShowStatement', value: { type: 'Identifier', name: 'x' }, line: 2 },
        ]
        const annotations = explainAST(ast)
        assert.equal(annotations.length, 2)
    })
    it('includes line numbers', () => {
        const ast = [{ type: 'ShowStatement', value: 'hi', line: 5 }]
        const annotations = explainAST(ast)
        assert.equal(annotations[0].line, 5)
    })
    it('includes type', () => {
        const ast = [{ type: 'BreakStatement', line: 1 }]
        const annotations = explainAST(ast)
        assert.equal(annotations[0].type, 'BreakStatement')
    })
    it('recursively explains body children', () => {
        const ast = [{
            type: 'IfStatement',
            condition: 'true',
            line: 1,
            body: [{ type: 'ShowStatement', value: 'yes', line: 2 }]
        }]
        const annotations = explainAST(ast)
        assert.ok(annotations.length >= 2)  // If + nested Show
    })
    it('handles empty AST', () => {
        const annotations = explainAST([])
        assert.equal(annotations.length, 0)
    })
})

// ══════════════════════════════════════
//  summarizeAST — Summary Paragraph
// ══════════════════════════════════════

describe('Explainer: summarizeAST', () => {
    it('returns string', () => {
        const result = summarizeAST([{ type: 'ShowStatement', value: 'hi', line: 1 }])
        assert.equal(typeof result, 'string')
    })
    it('counts statements', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
            { type: 'ShowStatement', value: 'hi', line: 2 },
            { type: 'ReturnStatement', line: 3 },
        ]
        const result = summarizeAST(ast)
        assert.ok(result.includes('3 statements'))
    })
    it('mentions functions', () => {
        const ast = [{ type: 'FunctionDeclaration', name: 'greet', params: [], line: 1 }]
        const result = summarizeAST(ast)
        assert.ok(result.includes('function'))
    })
    it('mentions imports', () => {
        const ast = [{ type: 'UseStatement', source: 'stdlib', line: 1 }]
        const result = summarizeAST(ast)
        assert.ok(result.includes('imports'))
    })
    it('handles empty AST', () => {
        const result = summarizeAST([])
        assert.ok(result.includes('empty'))
    })
})

// ══════════════════════════════════════
//  explainFile
// ══════════════════════════════════════

describe('Explainer: explainFile', () => {
    it('explains JS file with annotations', () => {
        const result = explainFile(`const x = 1;\nfunction hello() {}`, 'test.js')
        assert.ok(result.annotations.length >= 1)
        assert.ok(result.summary.includes('JavaScript'))
    })
    it('explains TS file', () => {
        const result = explainFile(`const y: number = 2;`, 'test.ts')
        assert.ok(result.summary.includes('TypeScript'))
    })
    it('handles unsupported file type', () => {
        const result = explainFile('some content', 'test.py')
        assert.ok(result.summary.includes('Unsupported'))
    })
    it('explains English Mode lume file', () => {
        const result = explainFile('mode: english\nget the user data\nshow the results', 'test.lume')
        assert.ok(result.annotations.length >= 2)
    })
    it('JS: detects variable declarations', () => {
        const result = explainFile('const name = "Alice";', 'app.js')
        const decl = result.annotations.find(a => a.explanation.includes('constant'))
        assert.ok(decl)
    })
    it('JS: detects function declarations', () => {
        const result = explainFile('function calculate() {}', 'app.js')
        const fn = result.annotations.find(a => a.explanation.includes('function'))
        assert.ok(fn)
    })
    it('JS: detects imports', () => {
        const result = explainFile("import { foo } from 'bar';", 'app.js')
        const imp = result.annotations.find(a => a.explanation.includes('Import'))
        assert.ok(imp)
    })
    it('JS: detects classes', () => {
        const result = explainFile('class Animal {}', 'app.js')
        const cls = result.annotations.find(a => a.explanation.includes('class'))
        assert.ok(cls)
    })
})
