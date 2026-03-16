/**
 * ═══════════════════════════════════════════════════════════
 *  Lume SourceMap — Comprehensive Test Suite
 *  Tests source map generation, line mapping, resolution,
 *  JSON/comment export, and enhanced English Mode metadata.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SourceMap, generateSourceMap } from '../../src/sourcemap.js'

// ══════════════════════════════════════
//  SourceMap Class
// ══════════════════════════════════════

describe('SourceMap: Constructor', () => {
    it('stores the filename', () => {
        const sm = new SourceMap('test.lume')
        assert.equal(sm.lumeFilename, 'test.lume')
    })
    it('starts with empty mappings', () => {
        const sm = new SourceMap('test.lume')
        assert.deepEqual(sm.mappings, [])
    })
})

describe('SourceMap: addMapping', () => {
    it('adds a basic mapping', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        assert.equal(sm.mappings.length, 1)
        assert.equal(sm.mappings[0].jsLine, 1)
        assert.equal(sm.mappings[0].lumeLine, 1)
    })
    it('supports optional name', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(5, 3, 'greet')
        assert.equal(sm.mappings[0].name, 'greet')
    })
    it('defaults name to null', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        assert.equal(sm.mappings[0].name, null)
    })
    it('stores multiple mappings', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        sm.addMapping(2, 2)
        sm.addMapping(5, 3)
        assert.equal(sm.mappings.length, 3)
    })
})

describe('SourceMap: addEnhancedMapping', () => {
    it('adds mapping with English Mode metadata', () => {
        const sm = new SourceMap('english.lume')
        sm.addEnhancedMapping(10, 5, {
            instruction: 'get the user data',
            resolvedBy: 'pattern-library',
            confidence: 0.95,
            astType: 'VariableAccess',
            name: 'user_data'
        })
        const m = sm.mappings[0]
        assert.equal(m.js_line, 10)
        assert.equal(m.lume_line, 5)
        assert.equal(m.lume_instruction, 'get the user data')
        assert.equal(m.resolved_by, 'pattern-library')
        assert.equal(m.confidence, 0.95)
        assert.equal(m.ast_node, 'VariableAccess')
        assert.equal(m.name, 'user_data')
    })
    it('defaults metadata fields to null', () => {
        const sm = new SourceMap('test.lume')
        sm.addEnhancedMapping(1, 1, {})
        const m = sm.mappings[0]
        assert.equal(m.lume_instruction, null)
        assert.equal(m.resolved_by, null)
        assert.equal(m.confidence, null)
        assert.equal(m.ast_node, null)
    })
})

describe('SourceMap: resolve', () => {
    it('resolves exact JS line', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        sm.addMapping(5, 3)
        sm.addMapping(10, 7)
        const result = sm.resolve(5)
        assert.equal(result.jsLine, 5)
        assert.equal(result.lumeLine, 3)
    })
    it('resolves to closest mapping before JS line', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        sm.addMapping(10, 5)
        const result = sm.resolve(7)  // Between 1 and 10
        assert.equal(result.jsLine, 1)
        assert.equal(result.lumeLine, 1)
    })
    it('returns null for line before any mapping', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(5, 3)
        const result = sm.resolve(2)
        assert.equal(result, null)
    })
    it('returns best match for high line numbers', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        sm.addMapping(5, 3)
        sm.addMapping(10, 7)
        const result = sm.resolve(100)
        assert.equal(result.jsLine, 10)
    })
})

describe('SourceMap: toJSON', () => {
    it('returns object with file and mappings', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        const json = sm.toJSON()
        assert.equal(json.file, 'test.lume')
        assert.ok(Array.isArray(json.mappings))
        assert.equal(json.mappings.length, 1)
    })
})

describe('SourceMap: toComment', () => {
    it('returns base64 data URL comment', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        const comment = sm.toComment()
        assert.ok(comment.startsWith('//# sourceMappingURL=data:application/json;base64,'))
    })
    it('contains valid base64', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1, 'x')
        const comment = sm.toComment()
        const b64 = comment.replace('//# sourceMappingURL=data:application/json;base64,', '')
        const decoded = Buffer.from(b64, 'base64').toString()
        const parsed = JSON.parse(decoded)
        assert.equal(parsed.file, 'test.lume')
    })
})

// ══════════════════════════════════════
//  generateSourceMap Function
// ══════════════════════════════════════

describe('SourceMap: generateSourceMap', () => {
    it('returns a SourceMap instance', () => {
        const sm = generateSourceMap('let x = 1', 'let x = 1;', 'test.lume')
        assert.ok(sm instanceof SourceMap)
    })
    it('sets the correct filename', () => {
        const sm = generateSourceMap('let x = 1', 'let x = 1;', 'test.lume')
        assert.equal(sm.lumeFilename, 'test.lume')
    })
    it('creates mappings for non-empty lines', () => {
        const lume = 'let x = 1\nlet y = 2\nshow x'
        const js = '// Generated by Lume\nlet x = 1;\nlet y = 2;\nconsole.log(x);'
        const sm = generateSourceMap(lume, js, 'test.lume')
        assert.ok(sm.mappings.length > 0)
    })
    it('skips the Generated header line', () => {
        const lume = 'let x = 1'
        const js = '// Generated by Lume Compiler\nlet x = 1;'
        const sm = generateSourceMap(lume, js, 'test.lume')
        // Should not map the header
        const headerMapping = sm.mappings.find(m => m.jsLine === 1 && m.name === 'Generated')
        assert.equal(headerMapping, undefined)
    })
    it('handles empty source', () => {
        const sm = generateSourceMap('', '', 'empty.lume')
        assert.ok(sm instanceof SourceMap)
    })
    it('handles multiline programs', () => {
        const lume = 'let a = 1\nlet b = 2\nlet c = 3\nlet d = 4\nlet e = 5'
        const js = '// Generated\nlet a = 1;\nlet b = 2;\nlet c = 3;\nlet d = 4;\nlet e = 5;'
        const sm = generateSourceMap(lume, js, 'multi.lume')
        assert.ok(sm.mappings.length >= 5)
    })
})
