/**
 * Lume Module Resolver — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseUsingDirective, resolveReference, formatModuleError, detectCircularDeps } from '../../src/intent-resolver/module-resolver.js'

describe('ModuleResolver: parseUsingDirective', () => {
    it('parses explicit .lume file', () => { const r = parseUsingDirective('using: helpers.lume'); assert.equal(r.type, 'file'); assert.equal(r.path, 'helpers.lume') })
    it('parses "everything from X"', () => { const r = parseUsingDirective('using: everything from models'); assert.equal(r.type, 'folder') })
    it('parses "the user module"', () => { const r = parseUsingDirective('using: the user module'); assert.equal(r.type, 'module') })
    it('returns null for non-using line', () => { assert.equal(parseUsingDirective('let x = 1'), null) })
    it('normalizes module name', () => { const r = parseUsingDirective('using: the payment processor module'); assert.ok(r.candidates.some(c => c.includes('payment'))) })
})

describe('ModuleResolver: resolveReference', () => {
    const index = { definitions: { 'user_data': [{ file: 'models/user.lume', line: 5, type: 'variable' }] } }
    it('resolves from using files (Tier 2)', () => { const r = resolveReference('user data', ['models/user.lume'], index); assert.ok(r.resolved); assert.equal(r.source, 'using') })
    it('resolves from auto-search (Tier 3)', () => { const r = resolveReference('user data', [], index); assert.ok(r.resolved); assert.equal(r.source, 'auto') })
    it('returns not_found for missing', () => { const r = resolveReference('unknown', [], index); assert.equal(r.source, 'not_found') })
    it('returns ambiguous for multiple candidates', () => {
        const idx = { definitions: { 'data': [{ file: 'a.lume' }, { file: 'b.lume' }] } }
        const r = resolveReference('data', [], idx)
        assert.equal(r.source, 'ambiguous')
    })
})

describe('ModuleResolver: formatModuleError', () => {
    it('returns LUME-E050 error', () => { const r = formatModuleError('count', 5, 'main.lume', []); assert.equal(r.code, 'LUME-E050') })
    it('includes line number', () => { const r = formatModuleError('x', 10, 'file.lume', []); assert.ok(r.message.includes('10')) })
})

describe('ModuleResolver: detectCircularDeps', () => {
    it('detects no cycles', () => { assert.equal(detectCircularDeps({ 'a.lume': ['b.lume'], 'b.lume': [] }).length, 0) })
    it('detects simple cycle', () => { assert.ok(detectCircularDeps({ 'a.lume': ['b.lume'], 'b.lume': ['a.lume'] }).length > 0) })
})
