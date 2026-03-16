/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Comments — Comprehensive Test Suite
 *  Tests comment detection (#, //, note:, todo:, fixme:,
 *  explain:, why:, warning:), inline stripping, AST output,
 *  doc generation, and ambiguous comment detection.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    detectComment, parseExplainBlock, stripInlineComment,
    toCommentAST, generateDocs, detectAmbiguousComment
} from '../../src/intent-resolver/comments.js'

// ══════════════════════════════════════
//  detectComment
// ══════════════════════════════════════

describe('Comments: detectComment', () => {
    it('detects # comment', () => {
        const r = detectComment('# this is a note')
        assert.ok(r)
        assert.equal(r.type, 'hash')
        assert.equal(r.text, 'this is a note')
    })
    it('detects // comment', () => {
        const r = detectComment('// some comment')
        assert.ok(r)
        assert.equal(r.type, 'line')
    })
    it('detects note:', () => {
        const r = detectComment('note: remember to fix this')
        assert.ok(r)
        assert.equal(r.type, 'note')
    })
    it('detects todo:', () => {
        const r = detectComment('todo: add validation')
        assert.ok(r)
        assert.equal(r.type, 'todo')
    })
    it('detects fixme:', () => {
        const r = detectComment('fixme: this is broken')
        assert.ok(r)
        assert.equal(r.type, 'fixme')
    })
    it('detects explain:', () => {
        const r = detectComment('explain: how this works')
        assert.ok(r)
        assert.equal(r.type, 'explain')
    })
    it('detects why:', () => {
        const r = detectComment('why: we use this approach')
        assert.ok(r)
        assert.equal(r.type, 'why')
    })
    it('detects warning:', () => {
        const r = detectComment('warning: deprecated')
        assert.ok(r)
        assert.equal(r.type, 'warning')
    })
    it('returns null for code', () => {
        assert.equal(detectComment('let x = 1'), null)
    })
    it('returns null for empty', () => {
        assert.equal(detectComment(''), null)
    })
    it('does not detect shebang as comment', () => {
        assert.equal(detectComment('#!'), null)
    })
})

// ══════════════════════════════════════
//  parseExplainBlock
// ══════════════════════════════════════

describe('Comments: parseExplainBlock', () => {
    it('parses single-line explain', () => {
        const r = parseExplainBlock(['explain: this function sorts data'], 0)
        assert.ok(r)
        assert.equal(r.type, 'CommentNode')
        assert.equal(r.commentType, 'explain')
    })
    it('parses multi-line explain', () => {
        const lines = ['explain: sorting algorithm', '  uses quicksort', '  O(n log n) average']
        const r = parseExplainBlock(lines, 0)
        assert.ok(r.text.includes('quicksort'))
    })
    it('returns null for non-explain', () => {
        assert.equal(parseExplainBlock(['let x = 1'], 0), null)
    })
})

// ══════════════════════════════════════
//  stripInlineComment
// ══════════════════════════════════════

describe('Comments: stripInlineComment', () => {
    it('strips inline # comment', () => {
        const r = stripInlineComment('let x = 1 # set x')
        assert.equal(r.instruction, 'let x = 1')
        assert.equal(r.comment, 'set x')
    })
    it('does not strip # inside strings', () => {
        const r = stripInlineComment('let x = "hello # world"')
        assert.equal(r.instruction, 'let x = "hello # world"')
        assert.equal(r.comment, null)
    })
    it('returns full line if no comment', () => {
        const r = stripInlineComment('let x = 1')
        assert.equal(r.instruction, 'let x = 1')
        assert.equal(r.comment, null)
    })
})

// ══════════════════════════════════════
//  toCommentAST
// ══════════════════════════════════════

describe('Comments: toCommentAST', () => {
    it('converts note to AST', () => {
        const r = toCommentAST({ type: 'note', text: 'important', jsPrefix: '//' })
        assert.equal(r.type, 'CommentNode')
        assert.ok(r.jsOutput.includes('//'))
    })
    it('converts explain to block comment', () => {
        const r = toCommentAST({ type: 'explain', text: 'detailed explanation' })
        assert.ok(r.jsOutput.includes('/*'))
    })
    it('converts todo to AST', () => {
        const r = toCommentAST({ type: 'todo', text: 'add tests', jsPrefix: '// TODO:' })
        assert.ok(r.jsOutput.includes('TODO'))
    })
})

// ══════════════════════════════════════
//  generateDocs
// ══════════════════════════════════════

describe('Comments: generateDocs', () => {
    it('generates markdown with header', () => {
        const docs = generateDocs('# comment\nnote: important', 'app.lume')
        assert.ok(docs.includes('# app.lume'))
    })
    it('includes todo items', () => {
        const docs = generateDocs('todo: fix this\ntodo: add that', 'file.lume')
        assert.ok(docs.includes('TODO'))
    })
    it('includes warnings', () => {
        const docs = generateDocs('warning: deprecated API', 'file.lume')
        assert.ok(docs.includes('Warning'))
    })
    it('shows empty message for no comments', () => {
        const docs = generateDocs('let x = 1\nshow x', 'file.lume')
        assert.ok(docs.includes('No documentation comments found'))
    })
})

// ══════════════════════════════════════
//  detectAmbiguousComment
// ══════════════════════════════════════

describe('Comments: detectAmbiguousComment', () => {
    it('warns about "note the user..."', () => {
        const r = detectAmbiguousComment("note the user's preferences")
        assert.ok(r)
        assert.equal(r.code, 'LUME-L011')
    })
    it('does not warn about "note:"', () => {
        assert.equal(detectAmbiguousComment('note: this is a comment'), null)
    })
    it('does not warn about regular code', () => {
        assert.equal(detectAmbiguousComment('let x = 1'), null)
    })
})
