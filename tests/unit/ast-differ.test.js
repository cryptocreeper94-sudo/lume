/**
 * Lume AST Differ — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { nodeIdentity, diffAST, detectConflicts, renderInLanguage, formatDiff } from '../../src/intent-resolver/ast-differ.js'

describe('ASTDiffer: nodeIdentity', () => {
    it('identifies FunctionDeclaration by name', () => { assert.equal(nodeIdentity({ type: 'FunctionDeclaration', name: 'greet' }), 'fn:greet') })
    it('identifies LetDeclaration by name', () => { assert.equal(nodeIdentity({ type: 'LetDeclaration', name: 'x' }), 'var:x') })
    it('identifies DefineDeclaration', () => { assert.equal(nodeIdentity({ type: 'DefineDeclaration', name: 'PI' }), 'var:PI') })
    it('identifies TypeDeclaration', () => { assert.equal(nodeIdentity({ type: 'TypeDeclaration', name: 'User' }), 'type:User') })
    it('identifies TestBlock', () => { assert.equal(nodeIdentity({ type: 'TestBlock', name: 'adds' }), 'test:adds') })
    it('identifies UseStatement', () => { assert.equal(nodeIdentity({ type: 'UseStatement', source: 'math' }), 'use:math') })
    it('handles null node', () => { assert.equal(nodeIdentity(null), 'null') })
    it('falls back to type:line', () => { assert.ok(nodeIdentity({ type: 'Unknown', line: 5 }).includes('L5')) })
})

describe('ASTDiffer: diffAST', () => {
    it('detects no changes for identical ASTs', () => { assert.equal(diffAST([{ type: 'LetDeclaration', name: 'x', line: 1 }], [{ type: 'LetDeclaration', name: 'x', line: 1 }]).length, 0) })
    it('detects additions', () => {
        const diffs = diffAST([], [{ type: 'LetDeclaration', name: 'x', line: 1 }])
        assert.ok(diffs.some(d => d.type === 'add'))
    })
    it('detects removals', () => {
        const diffs = diffAST([{ type: 'LetDeclaration', name: 'x', line: 1 }], [])
        assert.ok(diffs.some(d => d.type === 'remove'))
    })
    it('detects modifications', () => {
        const diffs = diffAST(
            [{ type: 'LetDeclaration', name: 'x', value: 1, line: 1 }],
            [{ type: 'LetDeclaration', name: 'x', value: 2, line: 1 }]
        )
        assert.ok(diffs.some(d => d.type === 'modify'))
    })
    it('detects moves', () => {
        const diffs = diffAST(
            [{ type: 'LetDeclaration', name: 'x', line: 1 }, { type: 'LetDeclaration', name: 'y', line: 2 }],
            [{ type: 'LetDeclaration', name: 'y', line: 1 }, { type: 'LetDeclaration', name: 'x', line: 2 }]
        )
        assert.ok(diffs.some(d => d.type === 'move'))
    })
})

describe('ASTDiffer: detectConflicts', () => {
    it('no conflicts for disjoint changes', () => {
        const r = detectConflicts([{ identity: 'var:x', type: 'modify' }], [{ identity: 'var:y', type: 'modify' }])
        assert.equal(r.conflicts.length, 0)
    })
    it('detects conflict when both modify same node', () => {
        const r = detectConflicts([{ identity: 'fn:greet', type: 'modify' }], [{ identity: 'fn:greet', type: 'modify' }])
        assert.ok(r.conflicts.length > 0)
    })
    it('no conflict when both remove same node', () => {
        const r = detectConflicts([{ identity: 'var:x', type: 'remove' }], [{ identity: 'var:x', type: 'remove' }])
        assert.equal(r.conflicts.length, 0)
    })
})

describe('ASTDiffer: renderInLanguage', () => {
    it('renders Spanish', () => {
        const lines = renderInLanguage([{ type: 'ShowStatement', value: { value: 'hello' } }], 'es')
        assert.ok(lines[0].includes('mostrar'))
    })
    it('renders French', () => {
        const lines = renderInLanguage([{ type: 'DeleteOperation', target: 'users' }], 'fr')
        assert.ok(lines[0].includes('supprimer'))
    })
    it('renders German', () => {
        const lines = renderInLanguage([{ type: 'CreateOperation', entity: 'item' }], 'de')
        assert.ok(lines[0].includes('erstellen'))
    })
})

describe('ASTDiffer: formatDiff', () => {
    it('returns no changes message', () => { assert.ok(formatDiff([]).includes('No changes')) })
    it('formats add entries', () => { assert.ok(formatDiff([{ type: 'add', identity: 'var:x', lineB: 1 }]).includes('ADD')) })
    it('formats remove entries', () => { assert.ok(formatDiff([{ type: 'remove', identity: 'var:x', lineA: 1 }]).includes('REMOVE')) })
})
