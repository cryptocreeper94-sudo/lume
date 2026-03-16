/**
 * Lume App Generator — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseAppDescription, generateProjectStructure, APP_TEMPLATES, FEATURE_MODIFIERS } from '../../src/intent-resolver/app-generator.js'

describe('AppGenerator: APP_TEMPLATES', () => {
    it('has 6+ templates', () => { assert.ok(Object.keys(APP_TEMPLATES).length >= 6) })
    it('blog has routes', () => { assert.ok(APP_TEMPLATES.blog.routes.length > 0) })
    it('todo has models', () => { assert.ok(APP_TEMPLATES.todo.models.Task) })
    it('ecommerce has components', () => { assert.ok(APP_TEMPLATES.ecommerce.components.length > 3) })
    it('chat has api', () => { assert.ok(APP_TEMPLATES.chat.api.length > 0) })
})

describe('AppGenerator: FEATURE_MODIFIERS', () => {
    it('has authentication', () => { assert.ok(FEATURE_MODIFIERS.authentication) })
    it('auth is alias for authentication', () => { assert.deepEqual(FEATURE_MODIFIERS.auth, FEATURE_MODIFIERS.authentication) })
    it('dark mode has styles', () => { assert.ok(FEATURE_MODIFIERS['dark mode'].styles) })
    it('search has components', () => { assert.ok(FEATURE_MODIFIERS.search.components.length > 0) })
})

describe('AppGenerator: parseAppDescription', () => {
    it('detects blog template', () => { const r = parseAppDescription('a blog with posts'); assert.equal(r.template, 'blog') })
    it('detects todo template', () => { const r = parseAppDescription('a todo app'); assert.equal(r.template, 'todo') })
    it('detects ecommerce template', () => { const r = parseAppDescription('an ecommerce store'); assert.equal(r.template, 'ecommerce') })
    it('detects features', () => { const r = parseAppDescription('a blog with authentication'); assert.ok(r.features.includes('authentication')) })
    it('detects multiple features', () => { const r = parseAppDescription('a blog with authentication and dark mode'); assert.ok(r.features.length >= 2) })
    it('falls back to custom', () => { const r = parseAppDescription('a recipe manager'); assert.equal(r.template, 'custom') })
    it('merges features into plan', () => { const r = parseAppDescription('a blog with authentication'); assert.ok(r.plan.models.User) })
    it('deduplicates components', () => { const r = parseAppDescription('a dashboard with admin'); assert.equal(r.plan.components.length, new Set(r.plan.components).size) })
    it('detects alias "store"', () => { const r = parseAppDescription('a store'); assert.equal(r.template, 'ecommerce') })
})

describe('AppGenerator: generateProjectStructure', () => {
    it('generates file list', () => {
        const plan = { name: 'test', description: 'Test', components: ['header'], routes: ['/'], models: {}, api: [], middleware: [], styles: {} }
        const r = generateProjectStructure(plan)
        assert.ok(r.files.length > 2)
    })
    it('includes package.json', () => {
        const plan = { name: 'test', description: 'Test', components: [], routes: ['/'], models: {}, api: [], middleware: [], styles: {} }
        assert.ok(generateProjectStructure(plan).files.some(f => f.path === 'package.json'))
    })
    it('includes index.html', () => {
        const plan = { name: 'test', description: 'Test', components: [], routes: ['/'], models: {}, api: [], middleware: [], styles: {} }
        assert.ok(generateProjectStructure(plan).files.some(f => f.path === 'index.html'))
    })
    it('generates component files', () => {
        const plan = { name: 'test', description: 'Test', components: ['header', 'sidebar'], routes: ['/'], models: {}, api: [], middleware: [], styles: {} }
        const r = generateProjectStructure(plan)
        assert.ok(r.files.some(f => f.path.includes('header')))
    })
    it('generates server for API plans', () => {
        const plan = { name: 'test', description: 'Test', components: [], routes: ['/'], models: { Item: { name: 'text' } }, api: ['GET /api/items'], middleware: [], styles: {} }
        const r = generateProjectStructure(plan)
        assert.ok(r.files.some(f => f.path.includes('server')))
    })
    it('generates model files', () => {
        const plan = { name: 'test', description: 'Test', components: [], routes: ['/'], models: { User: { email: 'text' } }, api: [], middleware: [], styles: {} }
        const r = generateProjectStructure(plan)
        assert.ok(r.files.some(f => f.path.includes('user.js')))
    })
})
