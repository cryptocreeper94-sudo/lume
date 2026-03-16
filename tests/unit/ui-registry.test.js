/**
 * Lume UI Registry — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UIRegistry, SPATIAL_MAP, STYLE_MAP, COMPONENT_TEMPLATES, getComponentTemplate } from '../../src/intent-resolver/ui-registry.js'

describe('UIRegistry: register and query', () => {
    it('registers element', () => { const reg = new UIRegistry(); const el = reg.register('login form', 'form'); assert.ok(el.id) })
    it('queries by exact name', () => { const reg = new UIRegistry(); reg.register('header', 'div'); assert.ok(reg.query('header')) })
    it('queries with article stripping', () => { const reg = new UIRegistry(); reg.register('search bar', 'form'); assert.ok(reg.query('the search bar')) })
    it('queries by partial match', () => { const reg = new UIRegistry(); reg.register('navigation bar', 'nav'); assert.ok(reg.query('navigation')) })
    it('returns null for unknown', () => { const reg = new UIRegistry(); assert.equal(reg.query('nonexistent'), null) })
    it('getAll returns all elements', () => { const reg = new UIRegistry(); reg.register('a', 'div'); reg.register('b', 'div'); assert.equal(reg.getAll().length, 2) })
    it('clear removes all', () => { const reg = new UIRegistry(); reg.register('a', 'div'); reg.clear(); assert.equal(reg.getAll().length, 0) })
})

describe('UIRegistry: spatial resolution', () => {
    it('resolves "left"', () => { const reg = new UIRegistry(); const r = reg.resolveSpatial('left'); assert.equal(r.value, 'left') })
    it('resolves "center"', () => { const reg = new UIRegistry(); assert.ok(reg.resolveSpatial('center')) })
    it('resolves "sticky"', () => { const reg = new UIRegistry(); assert.ok(reg.resolveSpatial('sticky')) })
    it('returns null for unknown', () => { const reg = new UIRegistry(); assert.equal(reg.resolveSpatial('upside down'), null) })
})

describe('UIRegistry: style resolution', () => {
    it('resolves "bold"', () => { const reg = new UIRegistry(); assert.equal(reg.resolveStyle('bold').value, 'bold') })
    it('resolves "blue"', () => { const reg = new UIRegistry(); assert.ok(reg.resolveStyle('blue').value.includes('#')) })
    it('resolves "rounded"', () => { const reg = new UIRegistry(); assert.ok(reg.resolveStyle('rounded')) })
    it('returns null for unknown', () => { const reg = new UIRegistry(); assert.equal(reg.resolveStyle('sparkly'), null) })
})

describe('UIRegistry: SPATIAL_MAP', () => {
    it('has 14+ entries', () => { assert.ok(Object.keys(SPATIAL_MAP).length >= 14) })
    it('each has css property', () => { Object.values(SPATIAL_MAP).forEach(v => assert.ok(v.css)) })
})

describe('UIRegistry: STYLE_MAP', () => {
    it('has 18+ entries', () => { assert.ok(Object.keys(STYLE_MAP).length >= 18) })
    it('includes colors', () => { assert.ok(STYLE_MAP.blue) })
})

describe('UIRegistry: getComponentTemplate', () => {
    it('gets login form', () => { assert.ok(getComponentTemplate('login form')) })
    it('gets alias "navbar"', () => { assert.ok(getComponentTemplate('navbar')) })
    it('gets alias "search"', () => { assert.ok(getComponentTemplate('search')) })
    it('returns null for unknown', () => { assert.equal(getComponentTemplate('weather widget'), null) })
})

describe('UIRegistry: COMPONENT_TEMPLATES', () => {
    it('has 6 templates', () => { assert.equal(Object.keys(COMPONENT_TEMPLATES).length, 6) })
    it('login form has children', () => { assert.ok(COMPONENT_TEMPLATES['login form'].children.length >= 3) })
})
