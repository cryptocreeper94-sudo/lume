/**
 * ═══════════════════════════════════════════════════════════
 *  Milestone 12: Collaborative Intent (Phase A) — Test Suite
 *  Tests AST-level diffing, conflict detection, cross-language
 *  view rendering, and diff formatting.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    nodeIdentity,
    diffAST,
    detectConflicts,
    renderInLanguage,
    formatDiff,
} from '../../src/intent-resolver/ast-differ.js'

/* ═══ Node Identity ═══════════════════════════════════ */

describe('M12: Node Identity', () => {
    it('identifies functions by name', () => {
        const id = nodeIdentity({ type: 'FunctionDeclaration', name: 'greet', params: [{ name: 'name' }] })
        assert.equal(id, 'fn:greet')
    })

    it('identifies variables by name', () => {
        const id = nodeIdentity({ type: 'LetDeclaration', name: 'count' })
        assert.equal(id, 'var:count')
    })

    it('identifies types by name', () => {
        const id = nodeIdentity({ type: 'TypeDeclaration', name: 'User' })
        assert.equal(id, 'type:User')
    })

    it('identifies imports by source', () => {
        const id = nodeIdentity({ type: 'UseStatement', source: 'math' })
        assert.equal(id, 'use:math')
    })

    it('identifies tests by name', () => {
        const id = nodeIdentity({ type: 'TestBlock', name: 'addition' })
        assert.equal(id, 'test:addition')
    })

    it('uses line number for unnamed nodes', () => {
        const id = nodeIdentity({ type: 'ShowStatement', line: 5 })
        assert.ok(id.includes('L5'))
    })

    it('handles null nodes', () => {
        assert.equal(nodeIdentity(null), 'null')
    })
})

/* ═══ AST Diff ════════════════════════════════════════ */

describe('M12: AST Diff', () => {
    it('detects added nodes', () => {
        const astA = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
        ]
        const astB = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
            { type: 'LetDeclaration', name: 'y', line: 2 },
        ]
        const diffs = diffAST(astA, astB)
        const adds = diffs.filter(d => d.type === 'add')
        assert.ok(adds.length > 0)
        assert.ok(adds.some(d => d.identity.includes('y')))
    })

    it('detects removed nodes', () => {
        const astA = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
            { type: 'LetDeclaration', name: 'y', line: 2 },
        ]
        const astB = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
        ]
        const diffs = diffAST(astA, astB)
        const removes = diffs.filter(d => d.type === 'remove')
        assert.ok(removes.length > 0)
        assert.ok(removes.some(d => d.identity.includes('y')))
    })

    it('detects modified nodes', () => {
        const astA = [
            { type: 'FunctionDeclaration', name: 'calc', params: [{ name: 'x' }], body: [1, 2], line: 1 },
        ]
        const astB = [
            { type: 'FunctionDeclaration', name: 'calc', params: [{ name: 'x' }, { name: 'y' }], body: [1, 2, 3], line: 1 },
        ]
        const diffs = diffAST(astA, astB)
        const mods = diffs.filter(d => d.type === 'modify')
        assert.ok(mods.length > 0)
        assert.ok(mods[0].changes.length > 0)
    })

    it('detects no changes for identical ASTs', () => {
        const ast = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
            { type: 'ShowStatement', line: 2 },
        ]
        const diffs = diffAST(ast, ast)
        assert.equal(diffs.length, 0)
    })

    it('detects moved nodes', () => {
        const astA = [
            { type: 'LetDeclaration', name: 'x', line: 1 },
            { type: 'FunctionDeclaration', name: 'foo', params: [], body: [], line: 2 },
        ]
        const astB = [
            { type: 'FunctionDeclaration', name: 'foo', params: [], body: [], line: 1 },
            { type: 'LetDeclaration', name: 'x', line: 2 },
        ]
        const diffs = diffAST(astA, astB)
        const moves = diffs.filter(d => d.type === 'move')
        assert.ok(moves.length > 0)
    })
})

/* ═══ Conflict Detection ═════════════════════════════ */

describe('M12: Conflict Detection', () => {
    it('detects conflicts when both sides modify same node', () => {
        const diffsOurs = [
            { type: 'modify', identity: 'var:count', changes: ['value: 5 → 10'] },
        ]
        const diffsTheirs = [
            { type: 'modify', identity: 'var:count', changes: ['value: 5 → 20'] },
        ]
        const result = detectConflicts(diffsOurs, diffsTheirs)
        assert.equal(result.conflicts.length, 1)
        assert.equal(result.conflicts[0].identity, 'var:count')
    })

    it('no conflicts when changes are to different nodes', () => {
        const diffsOurs = [
            { type: 'modify', identity: 'var:x', changes: ['value: 1 → 2'] },
        ]
        const diffsTheirs = [
            { type: 'modify', identity: 'var:y', changes: ['value: 3 → 4'] },
        ]
        const result = detectConflicts(diffsOurs, diffsTheirs)
        assert.equal(result.conflicts.length, 0)
        assert.equal(result.safeOurs.length, 1)
        assert.equal(result.safeTheirs.length, 1)
    })

    it('both remove same node = safe (same intent)', () => {
        const diffsOurs = [
            { type: 'remove', identity: 'var:old' },
        ]
        const diffsTheirs = [
            { type: 'remove', identity: 'var:old' },
        ]
        const result = detectConflicts(diffsOurs, diffsTheirs)
        assert.equal(result.conflicts.length, 0)
    })

    it('one adds + one removes = conflict', () => {
        const diffsOurs = [
            { type: 'add', identity: 'var:new' },
        ]
        const diffsTheirs = [
            { type: 'remove', identity: 'var:new' },
        ]
        const result = detectConflicts(diffsOurs, diffsTheirs)
        assert.equal(result.conflicts.length, 1)
    })
})

/* ═══ Cross-Language View ════════════════════════════ */

describe('M12: Cross-Language View', () => {
    it('renders AST in Spanish', () => {
        const ast = [
            { type: 'ShowStatement', name: 'resultado', line: 1 },
            { type: 'CreateOperation', entity: 'usuario', line: 2 },
        ]
        const lines = renderInLanguage(ast, 'es')
        assert.ok(lines[0].includes('mostrar'))
        assert.ok(lines[1].includes('crear'))
    })

    it('renders AST in French', () => {
        const ast = [
            { type: 'DeleteOperation', target: 'ancien', line: 1 },
        ]
        const lines = renderInLanguage(ast, 'fr')
        assert.ok(lines[0].includes('supprimer'))
    })

    it('renders AST in German', () => {
        const ast = [
            { type: 'StoreOperation', what: 'daten', line: 1 },
        ]
        const lines = renderInLanguage(ast, 'de')
        assert.ok(lines[0].includes('speichern'))
    })

    it('renders AST in Japanese', () => {
        const ast = [
            { type: 'ShowStatement', name: 'データ', line: 1 },
        ]
        const lines = renderInLanguage(ast, 'ja')
        assert.ok(lines[0].includes('表示'))
    })

    it('renders AST in Chinese', () => {
        const ast = [
            { type: 'CreateOperation', entity: '用户', line: 1 },
        ]
        const lines = renderInLanguage(ast, 'zh')
        assert.ok(lines[0].includes('创建'))
    })

    it('falls back to English for unknown language', () => {
        const ast = [
            { type: 'ShowStatement', name: 'result', line: 1 },
        ]
        const lines = renderInLanguage(ast, 'xx')
        assert.ok(lines[0].includes('show'))
    })
})

/* ═══ Diff Formatting ════════════════════════════════ */

describe('M12: Diff Formatting', () => {
    it('formats an empty diff', () => {
        const output = formatDiff([])
        assert.ok(output.includes('No changes'))
    })

    it('formats ADD entries', () => {
        const output = formatDiff([{ type: 'add', identity: 'var:x', lineB: 5 }])
        assert.ok(output.includes('ADD'))
        assert.ok(output.includes('var:x'))
    })

    it('formats REMOVE entries', () => {
        const output = formatDiff([{ type: 'remove', identity: 'fn:greet', lineA: 10 }])
        assert.ok(output.includes('REMOVE'))
        assert.ok(output.includes('fn:greet'))
    })

    it('formats MODIFY entries with changes', () => {
        const output = formatDiff([
            { type: 'modify', identity: 'var:count', changes: ['value: 5 → 10'] },
        ])
        assert.ok(output.includes('MODIFY'))
        assert.ok(output.includes('value'))
    })

    it('formats MOVE entries', () => {
        const output = formatDiff([
            { type: 'move', identity: 'fn:calc', lineA: 1, lineB: 5, changes: [] },
        ])
        assert.ok(output.includes('MOVE'))
    })

    it('includes change count', () => {
        const output = formatDiff([
            { type: 'add', identity: 'var:a', lineB: 1 },
            { type: 'remove', identity: 'var:b', lineA: 2 },
        ])
        assert.ok(output.includes('2 change'))
    })
})
