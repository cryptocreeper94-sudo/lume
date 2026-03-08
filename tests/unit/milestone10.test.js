/**
 * ═══════════════════════════════════════════════════════════
 *  Milestone 10: Visual Context Awareness — Test Suite
 *  Tests UI Registry, spatial/style resolution, component
 *  templates, app plan generation, and project scaffolding.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    UIRegistry,
    SPATIAL_MAP,
    STYLE_MAP,
    COMPONENT_TEMPLATES,
    getComponentTemplate,
} from '../../src/intent-resolver/ui-registry.js'

import {
    parseAppDescription,
    generateProjectStructure,
    APP_TEMPLATES,
    FEATURE_MODIFIERS,
} from '../../src/intent-resolver/app-generator.js'

/* ═══ UI Registry ══════════════════════════════════════ */

describe('M10: UI Registry', () => {
    it('registers and queries elements', () => {
        const reg = new UIRegistry()
        reg.register('login form', 'form')
        const result = reg.query('the login form')
        assert.ok(result)
        assert.equal(result.name, 'login form')
    })

    it('fuzzy matches partial names', () => {
        const reg = new UIRegistry()
        reg.register('navigation bar', 'nav')
        const result = reg.query('navigation')
        assert.ok(result)
        assert.equal(result.name, 'navigation bar')
    })

    it('word-overlap matching', () => {
        const reg = new UIRegistry()
        reg.register('user profile card', 'div')
        const result = reg.query('profile card')
        assert.ok(result)
    })

    it('returns null for no match', () => {
        const reg = new UIRegistry()
        reg.register('header', 'div')
        const result = reg.query('completely unrelated')
        assert.equal(result, null)
    })

    it('getAll returns all elements', () => {
        const reg = new UIRegistry()
        reg.register('header', 'div')
        reg.register('footer', 'div')
        assert.equal(reg.getAll().length, 2)
    })

    it('clear removes all elements', () => {
        const reg = new UIRegistry()
        reg.register('header', 'div')
        reg.clear()
        assert.equal(reg.getAll().length, 0)
    })
})

/* ═══ Spatial Resolution ═══════════════════════════════ */

describe('M10: Spatial Resolution', () => {
    it('resolves "center"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveSpatial('center')
        assert.ok(result)
        assert.ok(result.css.includes('center'))
    })

    it('resolves "left"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveSpatial('left')
        assert.ok(result)
        assert.ok(result.css.includes('left'))
    })

    it('resolves "sticky"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveSpatial('sticky')
        assert.ok(result)
        assert.ok(result.css.includes('sticky'))
    })

    it('returns null for unknown spatial terms', () => {
        const reg = new UIRegistry()
        assert.equal(reg.resolveSpatial('xyzabc'), null)
    })

    it('has all major spatial terms', () => {
        const required = ['left', 'right', 'center', 'top', 'bottom', 'full width', 'sticky']
        for (const term of required) {
            assert.ok(SPATIAL_MAP[term], `Missing spatial term: ${term}`)
        }
    })
})

/* ═══ Style Resolution ═════════════════════════════════ */

describe('M10: Style Resolution', () => {
    it('resolves "bold"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveStyle('bold')
        assert.ok(result)
        assert.ok(result.css.includes('bold'))
    })

    it('resolves color "blue"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveStyle('blue')
        assert.ok(result)
        assert.ok(result.css.includes('#3b82f6'))
    })

    it('resolves "rounded"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveStyle('rounded')
        assert.ok(result)
        assert.ok(result.css.includes('border-radius'))
    })

    it('resolves "shadow"', () => {
        const reg = new UIRegistry()
        const result = reg.resolveStyle('shadow')
        assert.ok(result)
        assert.ok(result.css.includes('box-shadow'))
    })

    it('returns null for unknown styles', () => {
        const reg = new UIRegistry()
        assert.equal(reg.resolveStyle('xyzabc'), null)
    })

    it('has all major style terms', () => {
        const required = ['bigger', 'smaller', 'bold', 'italic', 'rounded', 'shadow', 'blue', 'red', 'dark']
        for (const term of required) {
            assert.ok(STYLE_MAP[term], `Missing style term: ${term}`)
        }
    })
})

/* ═══ Component Templates ══════════════════════════════ */

describe('M10: Component Templates', () => {
    it('gets login form template', () => {
        const template = getComponentTemplate('login form')
        assert.ok(template)
        assert.equal(template.type, 'form')
        assert.ok(template.children.length > 0)
    })

    it('gets navigation bar template', () => {
        const template = getComponentTemplate('navigation bar')
        assert.ok(template)
        assert.equal(template.type, 'nav')
    })

    it('alias "navbar" works', () => {
        const template = getComponentTemplate('navbar')
        assert.ok(template)
        assert.equal(template.type, 'nav')
    })

    it('alias "login" works', () => {
        const template = getComponentTemplate('login')
        assert.ok(template)
        assert.equal(template.type, 'form')
    })

    it('returns null for unknown templates', () => {
        const template = getComponentTemplate('quantum particle accelerator')
        assert.equal(template, null)
    })

    it('has all major component templates', () => {
        const required = ['login form', 'signup form', 'navigation bar', 'search bar', 'user profile', 'data table']
        for (const name of required) {
            assert.ok(COMPONENT_TEMPLATES[name], `Missing template: ${name}`)
        }
    })
})

/* ═══ App Description Parsing ══════════════════════════ */

describe('M10: App Description Parsing', () => {
    it('parses "a blog with authentication"', () => {
        const result = parseAppDescription('a blog with authentication')
        assert.equal(result.template, 'blog')
        assert.ok(result.features.includes('authentication'))
        assert.ok(result.plan.components.length > 0)
        assert.ok(result.plan.models.Post)
        assert.ok(result.plan.models.User)
    })

    it('parses "an ecommerce store"', () => {
        const result = parseAppDescription('an ecommerce store')
        assert.equal(result.template, 'ecommerce')
        assert.ok(result.plan.models.Product)
    })

    it('parses "a todo app with dark mode"', () => {
        const result = parseAppDescription('a todo app with dark mode')
        assert.equal(result.template, 'todo')
        assert.ok(result.features.includes('dark mode'))
    })

    it('parses "a chat app with authentication and notifications"', () => {
        const result = parseAppDescription('a chat app with authentication and notifications')
        assert.equal(result.template, 'chat')
        assert.ok(result.features.includes('authentication'))
        assert.ok(result.features.includes('notifications'))
        assert.ok(result.plan.models.User)
        assert.ok(result.plan.models.Notification)
    })

    it('parses aliases like "shop"', () => {
        const result = parseAppDescription('a shop with search')
        assert.equal(result.template, 'ecommerce')
        assert.ok(result.features.includes('search'))
    })

    it('defaults to custom for unknown descriptions', () => {
        const result = parseAppDescription('a completely unique application')
        assert.equal(result.template, 'custom')
    })

    it('deduplicates components', () => {
        const result = parseAppDescription('a dashboard with admin features')
        const uniqueComponents = new Set(result.plan.components)
        assert.equal(uniqueComponents.size, result.plan.components.length, 'Components should be deduplicated')
    })
})

/* ═══ Project Structure Generation ════════════════════ */

describe('M10: Project Structure Generation', () => {
    it('generates core files', () => {
        const plan = parseAppDescription('a blog').plan
        const structure = generateProjectStructure(plan)
        const paths = structure.files.map(f => f.path)
        assert.ok(paths.includes('package.json'))
        assert.ok(paths.includes('index.html'))
        assert.ok(paths.includes('src/main.js'))
        assert.ok(paths.includes('src/styles.css'))
    })

    it('generates component files', () => {
        const plan = parseAppDescription('a blog').plan
        const structure = generateProjectStructure(plan)
        const componentFiles = structure.files.filter(f => f.path.startsWith('src/components/'))
        assert.ok(componentFiles.length > 0)
    })

    it('generates model files', () => {
        const plan = parseAppDescription('a blog with authentication').plan
        const structure = generateProjectStructure(plan)
        const modelFiles = structure.files.filter(f => f.path.startsWith('src/models/'))
        assert.ok(modelFiles.length > 0)
        assert.ok(modelFiles.some(f => f.path.includes('post')))
        assert.ok(modelFiles.some(f => f.path.includes('user')))
    })

    it('generates server files for API plans', () => {
        const plan = parseAppDescription('a blog').plan
        const structure = generateProjectStructure(plan)
        const serverFiles = structure.files.filter(f => f.path.startsWith('server/'))
        assert.ok(serverFiles.length > 0)
    })

    it('generates middleware files for auth', () => {
        const plan = parseAppDescription('a blog with authentication').plan
        const structure = generateProjectStructure(plan)
        const mwFiles = structure.files.filter(f => f.path.includes('middleware'))
        assert.ok(mwFiles.length > 0)
    })

    it('generates router for multi-route apps', () => {
        const plan = parseAppDescription('a blog').plan
        const structure = generateProjectStructure(plan)
        assert.ok(structure.files.some(f => f.path === 'src/router.js'))
    })
})

/* ═══ Template Coverage ═══════════════════════════════ */

describe('M10: Template Coverage', () => {
    it('has all 6 app templates', () => {
        const required = ['blog', 'todo', 'ecommerce', 'dashboard', 'chat', 'api']
        for (const name of required) {
            assert.ok(APP_TEMPLATES[name], `Missing template: ${name}`)
        }
    })

    it('all templates have required fields', () => {
        for (const [name, template] of Object.entries(APP_TEMPLATES)) {
            assert.ok(template.description, `${name} missing description`)
            assert.ok(Array.isArray(template.components), `${name} missing components`)
            assert.ok(Array.isArray(template.routes), `${name} missing routes`)
            assert.ok(template.models, `${name} missing models`)
        }
    })

    it('has all major feature modifiers', () => {
        const required = ['authentication', 'dark mode', 'search', 'admin', 'notifications']
        for (const name of required) {
            assert.ok(FEATURE_MODIFIERS[name], `Missing feature: ${name}`)
        }
    })
})
