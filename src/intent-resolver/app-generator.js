/**
 * ═══════════════════════════════════════════════════════════
 *  LUME — Full-Stack App Generator (M10)
 *  Generates complete application scaffolding from
 *  natural language descriptions via `lume create`.
 *
 *  Input:  "a blog with user authentication"
 *  Output: Complete project structure, routes, components,
 *          database schema, and API endpoints.
 * ═══════════════════════════════════════════════════════════
 */

/* ── Application Template Registry ────────────────────── */

const APP_TEMPLATES = {
    'blog': {
        description: 'A blog application with posts and comments',
        components: ['header', 'post-list', 'post-card', 'post-detail', 'comment-form'],
        routes: ['/', '/post/:id', '/new', '/login'],
        models: {
            Post: { title: 'text', content: 'text', author: 'text', createdAt: 'date' },
            Comment: { content: 'text', author: 'text', postId: 'text', createdAt: 'date' },
        },
        api: ['GET /api/posts', 'GET /api/posts/:id', 'POST /api/posts', 'POST /api/posts/:id/comments'],
    },
    'todo': {
        description: 'A task management application',
        components: ['task-list', 'task-item', 'add-task', 'filter-bar'],
        routes: ['/', '/completed', '/active'],
        models: {
            Task: { title: 'text', completed: 'boolean', priority: 'number', createdAt: 'date' },
        },
        api: ['GET /api/tasks', 'POST /api/tasks', 'PATCH /api/tasks/:id', 'DELETE /api/tasks/:id'],
    },
    'ecommerce': {
        description: 'An online store with products and cart',
        components: ['product-grid', 'product-card', 'cart', 'checkout', 'header', 'search-bar'],
        routes: ['/', '/product/:id', '/cart', '/checkout', '/login', '/register'],
        models: {
            Product: { name: 'text', price: 'number', description: 'text', image: 'text', category: 'text' },
            CartItem: { productId: 'text', quantity: 'number', userId: 'text' },
            Order: { userId: 'text', items: 'list', total: 'number', status: 'text' },
        },
        api: ['GET /api/products', 'GET /api/products/:id', 'POST /api/cart', 'DELETE /api/cart/:id', 'POST /api/orders'],
    },
    'dashboard': {
        description: 'An analytics dashboard with charts',
        components: ['sidebar', 'chart-area', 'stat-card', 'data-table', 'header'],
        routes: ['/', '/analytics', '/users', '/settings'],
        models: {
            Metric: { name: 'text', value: 'number', category: 'text', timestamp: 'date' },
        },
        api: ['GET /api/metrics', 'GET /api/metrics/:category', 'GET /api/users'],
    },
    'chat': {
        description: 'A real-time chat application',
        components: ['message-list', 'message-input', 'channel-sidebar', 'user-list'],
        routes: ['/', '/channel/:id', '/dm/:userId'],
        models: {
            Message: { content: 'text', author: 'text', channelId: 'text', createdAt: 'date' },
            Channel: { name: 'text', description: 'text', members: 'list' },
        },
        api: ['GET /api/channels', 'GET /api/channels/:id/messages', 'POST /api/channels/:id/messages', 'WS /ws'],
    },
    'api': {
        description: 'A REST API backend',
        components: [],
        routes: [],
        models: {
            Resource: { name: 'text', data: 'map' },
        },
        api: ['GET /api/resources', 'GET /api/resources/:id', 'POST /api/resources', 'PUT /api/resources/:id', 'DELETE /api/resources/:id'],
    },
}

/* ── Feature Modifiers ────────────────────────────────── */

const FEATURE_MODIFIERS = {
    'authentication': {
        models: { User: { email: 'text', password: 'text', name: 'text', role: 'text' } },
        routes: ['/login', '/register', '/profile'],
        components: ['login-form', 'register-form', 'profile-page'],
        api: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me', 'POST /api/auth/logout'],
        middleware: ['auth-guard'],
    },
    'auth': null, // alias → authentication
    'users': null, // alias → authentication
    'dark mode': {
        components: ['theme-toggle'],
        styles: { '--bg': '#1a1a2e', '--text': '#e0e0e0', '--primary': '#3b82f6' },
    },
    'search': {
        components: ['search-bar', 'search-results'],
        api: ['GET /api/search?q=:query'],
    },
    'admin': {
        routes: ['/admin', '/admin/users', '/admin/settings'],
        components: ['admin-dashboard', 'user-management', 'admin-sidebar'],
        api: ['GET /api/admin/users', 'PATCH /api/admin/users/:id', 'GET /api/admin/stats'],
        middleware: ['admin-guard'],
    },
    'notifications': {
        components: ['notification-bell', 'notification-list'],
        models: { Notification: { message: 'text', read: 'boolean', userId: 'text', createdAt: 'date' } },
        api: ['GET /api/notifications', 'PATCH /api/notifications/:id/read'],
    },
    'file upload': {
        components: ['file-uploader', 'file-preview'],
        api: ['POST /api/upload', 'GET /api/files/:id'],
    },
    'pagination': {
        components: ['pagination-bar'],
    },
    'responsive': {
        styles: { breakpoints: { mobile: '576px', tablet: '768px', desktop: '1200px' } },
    },
}

// Resolve aliases
FEATURE_MODIFIERS['auth'] = FEATURE_MODIFIERS['authentication']
FEATURE_MODIFIERS['users'] = FEATURE_MODIFIERS['authentication']

/* ── App Plan Generator ───────────────────────────────── */

/**
 * Parse a natural language description into an app plan.
 *
 * @param {string} description - "a blog with user authentication and dark mode"
 * @returns {{ template: string, features: string[], plan: object }}
 */
export function parseAppDescription(description) {
    const normalized = description.toLowerCase().trim()

    // Detect base template
    let template = null
    let templateName = null

    const aliases = {
        'store': 'ecommerce', 'shop': 'ecommerce', 'marketplace': 'ecommerce',
        'task manager': 'todo', 'task app': 'todo', 'to-do': 'todo', 'to do': 'todo',
        'analytics': 'dashboard', 'admin panel': 'dashboard',
        'messaging': 'chat', 'messenger': 'chat',
        'backend': 'api', 'rest api': 'api',
    }

    for (const [keyword, name] of Object.entries(APP_TEMPLATES)) {
        if (normalized.includes(keyword)) {
            template = APP_TEMPLATES[keyword]
            templateName = keyword
            break
        }
    }

    if (!template) {
        for (const [alias, name] of Object.entries(aliases)) {
            if (normalized.includes(alias)) {
                template = APP_TEMPLATES[name]
                templateName = name
                break
            }
        }
    }

    // Default to generic app
    if (!template) {
        template = { description: 'A custom web application', components: ['header', 'main-content'], routes: ['/'], models: {}, api: [] }
        templateName = 'custom'
    }

    // Detect feature modifiers
    const features = []
    for (const [keyword, modifier] of Object.entries(FEATURE_MODIFIERS)) {
        if (modifier && normalized.includes(keyword)) {
            features.push(keyword)
        }
    }

    // Build merged plan
    const plan = buildPlan(template, templateName, features)

    return { template: templateName, features, plan }
}

/**
 * Build a complete app plan by merging template + features.
 */
function buildPlan(template, name, features) {
    const plan = {
        name,
        description: template.description,
        components: [...(template.components || [])],
        routes: [...(template.routes || [])],
        models: { ...template.models },
        api: [...(template.api || [])],
        middleware: [],
        styles: {},
    }

    for (const featureName of features) {
        const modifier = FEATURE_MODIFIERS[featureName]
        if (!modifier) continue

        if (modifier.components) plan.components.push(...modifier.components)
        if (modifier.routes) plan.routes.push(...modifier.routes)
        if (modifier.api) plan.api.push(...modifier.api)
        if (modifier.models) Object.assign(plan.models, modifier.models)
        if (modifier.middleware) plan.middleware.push(...modifier.middleware)
        if (modifier.styles) Object.assign(plan.styles, modifier.styles)
    }

    // Deduplicate
    plan.components = [...new Set(plan.components)]
    plan.routes = [...new Set(plan.routes)]
    plan.api = [...new Set(plan.api)]
    plan.middleware = [...new Set(plan.middleware)]

    return plan
}

/**
 * Generate a project structure description from a plan.
 *
 * @param {object} plan - The merged app plan
 * @returns {{ files: Array<{ path: string, type: string, description: string }> }}
 */
export function generateProjectStructure(plan) {
    const files = []

    // ── Core files ──
    files.push({
        path: 'package.json', type: 'config', description: 'Project dependencies and scripts', content: JSON.stringify({
            name: plan.name || 'lume-app',
            version: '1.0.0',
            type: 'module',
            scripts: { dev: 'node server/index.js', start: 'node server/index.js', build: 'echo "No build step needed"' },
            dependencies: {
                ...(plan.api.length > 0 ? { express: '^4.18.0', cors: '^2.8.5' } : {}),
                ...(plan.middleware.includes('auth-guard') ? { jsonwebtoken: '^9.0.0', bcryptjs: '^2.4.3' } : {}),
            }
        }, null, 2)
    })

    files.push({
        path: 'index.html', type: 'html', description: 'Entry point HTML file', content:
            `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${plan.name || 'Lume App'}</title>
    <link rel="stylesheet" href="src/styles.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="src/main.js"></script>
</body>
</html>` })

    files.push({
        path: 'src/main.js', type: 'js', description: 'Application entry point', content:
            `// ${plan.description}
// Generated by Lume Create

${plan.components.map(c => `import { ${camelCase(c)} } from './components/${c}.js'`).join('\n')}
${plan.routes.length > 1 ? "import { initRouter } from './router.js'" : ''}

function init() {
    const app = document.getElementById('app')
    if (!app) return
    ${plan.routes.length > 1 ? 'initRouter(app)' : `app.innerHTML = '<h1>${plan.name || 'App'}</h1>'`}
    console.log('${plan.name || 'App'} initialized')
}

document.addEventListener('DOMContentLoaded', init)
` })

    files.push({
        path: 'src/styles.css', type: 'css', description: 'Global styles', content:
            `/* ${plan.name || 'Lume App'} — Global Styles */
:root {
    --primary: #3b82f6;
    --bg: #0a0a1a;
    --surface: #111128;
    --text: #e0e0e0;
    --text-muted: #888;
    --border: #222;
    --radius: 8px;
    --font: 'Inter', -apple-system, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; }
a { color: var(--primary); text-decoration: none; }
button { cursor: pointer; font-family: inherit; }
input, textarea { font-family: inherit; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 12px; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.btn { background: var(--primary); color: white; border: none; border-radius: var(--radius); padding: 10px 20px; font-weight: 600; }
.btn:hover { opacity: 0.9; }
.grid { display: grid; gap: 16px; }
` })

    // ── Components ──
    for (const component of plan.components) {
        const fileName = component.replace(/\s+/g, '-')
        const funcName = camelCase(component)
        files.push({ path: `src/components/${fileName}.js`, type: 'component', description: `${component} component`, content: generateComponentCode(component, funcName, plan) })
    }

    // ── Router ──
    if (plan.routes.length > 1) {
        const navLinks = plan.routes.map(r => {
            const label = r === '/' ? 'Home' : r.split('/').filter(Boolean)[0]
            return '<a href="' + r + '">' + label + '</a>'
        }).join(' | ')
        files.push({
            path: 'src/router.js', type: 'js', description: 'Client-side routing', content:
                `// Client-side router
const routes = ${JSON.stringify(plan.routes, null, 4)}

export function initRouter(app) {
    function navigate(path) {
        window.history.pushState({}, '', path)
        render(app, path)
    }

    function render(container, path) {
        const route = routes.find(r => r === path) || '/'
        container.innerHTML = '<nav class="nav">${navLinks}</nav><main id="page"></main>'
        container.querySelectorAll('a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); navigate(a.getAttribute('href')) }))
    }

    window.addEventListener('popstate', () => render(app, window.location.pathname))
    render(app, window.location.pathname)
    return { navigate }
}
` })
    }

    // ── Models ──
    for (const [modelName, fields] of Object.entries(plan.models)) {
        files.push({ path: `src/models/${modelName.toLowerCase()}.js`, type: 'model', description: `${modelName} data model`, content: generateModelCode(modelName, fields) })
    }

    // ── Server ──
    if (plan.api.length > 0) {
        files.push({
            path: 'server/index.js', type: 'js', description: 'API server entry point', content:
                `import express from 'express'
import cors from 'cors'
import { router } from './routes.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use('/api', router)
app.use(express.static('.'))

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT))
` })

        files.push({ path: 'server/routes.js', type: 'js', description: 'API route definitions', content: generateRoutesCode(plan) })
    }

    // ── Middleware ──
    for (const mw of plan.middleware) {
        files.push({ path: `server/middleware/${mw}.js`, type: 'middleware', description: `${mw} middleware`, content: generateMiddlewareCode(mw) })
    }

    // ── Config ──
    files.push({
        path: '.env', type: 'config', description: 'Environment variables', content:
            `PORT=3000
NODE_ENV=development
${plan.middleware.includes('auth-guard') ? 'JWT_SECRET=change-me-in-production\n' : ''}`
    })

    files.push({
        path: 'README.md', type: 'docs', description: 'Project documentation', content:
            `# ${plan.name || 'Lume App'}

${plan.description}

Generated by Lume Create.

## Quick Start
npm install
npm run dev

## API Endpoints
${plan.api.map(e => '- ' + e).join('\n') || 'None'}
` })

    return { files }
}

/* ── Code Generators ──────────────────────────────────── */

function camelCase(str) {
    return str.replace(/[-\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toLowerCase())
}

function pascalCase(str) {
    return str.replace(/[-\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase())
}

function generateComponentCode(name, funcName, plan) {
    const templates = {
        'header': `export function header() {
    return \`<header class="header">
        <div class="container" style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px">
            <a href="/" style="font-size:20px;font-weight:800">${plan.name || 'App'}</a>
            <nav>${plan.routes.slice(0, 4).map(r => `<a href="${r}" style="margin-left:16px">${r === '/' ? 'Home' : r.replace('/', '')}</a>`).join('')}</nav>
        </div>
    </header>\`
}`,
        'login-form': `export function loginForm() {
    return \`<div class="card" style="max-width:400px;margin:80px auto">
        <h2 style="margin-bottom:16px">Sign In</h2>
        <form id="login-form">
            <input type="email" placeholder="Email" required style="width:100%;margin-bottom:12px" />
            <input type="password" placeholder="Password" required style="width:100%;margin-bottom:16px" />
            <button type="submit" class="btn" style="width:100%">Sign In</button>
        </form>
        <p style="margin-top:12px;font-size:13px;color:var(--text-muted)">Don't have an account? <a href="/register">Register</a></p>
    </div>\`
}`,
        'register-form': `export function registerForm() {
    return \`<div class="card" style="max-width:400px;margin:80px auto">
        <h2 style="margin-bottom:16px">Create Account</h2>
        <form id="register-form">
            <input type="text" placeholder="Full Name" required style="width:100%;margin-bottom:12px" />
            <input type="email" placeholder="Email" required style="width:100%;margin-bottom:12px" />
            <input type="password" placeholder="Password" required style="width:100%;margin-bottom:16px" />
            <button type="submit" class="btn" style="width:100%">Create Account</button>
        </form>
    </div>\`
}`,
        'search-bar': `export function searchBar() {
    return \`<div style="margin:16px 0">
        <input type="search" id="search-input" placeholder="Search..." style="width:100%;padding:12px 16px;font-size:15px" />
    </div>\`
}`,
        'sidebar': `export function sidebar() {
    return \`<aside class="sidebar" style="width:240px;border-right:1px solid var(--border);padding:20px;min-height:100vh">
        <nav style="display:flex;flex-direction:column;gap:8px">
            ${plan.routes.map(r => `<a href="${r}" style="padding:8px 12px;border-radius:6px">${r === '/' ? 'Dashboard' : r.replace('/', '').replace(/\//g, ' > ')}</a>`).join('\n            ')}
        </nav>
    </aside>\`
}`,
        'theme-toggle': `export function themeToggle() {
    return \`<button id="theme-toggle" class="btn" style="padding:6px 12px;font-size:12px" onclick="document.body.classList.toggle('light')">🌙 / ☀️</button>\`
}`,
        'notification-bell': `export function notificationBell() {
    return \`<button id="notifications" style="position:relative;background:none;border:none;font-size:20px;cursor:pointer">🔔<span id="notif-count" style="position:absolute;top:-4px;right:-4px;background:red;color:white;border-radius:50%;font-size:10px;padding:2px 5px">0</span></button>\`
}`,
        'pagination-bar': `export function paginationBar(current = 1, total = 10) {
    const pages = Array.from({ length: Math.min(total, 7) }, (_, i) => i + 1)
    return \`<div style="display:flex;gap:4px;justify-content:center;margin:24px 0">
        \${pages.map(p => \`<button class="btn" style="padding:6px 12px;\${p === current ? 'opacity:1' : 'opacity:0.5'}">\${p}</button>\`).join('')}
    </div>\`
}`,
    }

    if (templates[name]) return templates[name]

    // Generic component
    return `export function ${funcName}(data = {}) {
    return \`<div class="card ${name}" id="${name}">
        <h3>${pascalCase(name)}</h3>
        <div class="${name}-content">
            <!-- ${name} content renders here -->
        </div>
    </div>\`
}
`
}

function generateModelCode(name, fields) {
    const fieldEntries = Object.entries(fields)
    return `// ${name} Model
// Fields: ${fieldEntries.map(([k, v]) => `${k} (${v})`).join(', ')}

const ${name.toLowerCase()}s = []
let nextId = 1

export function create${name}(data) {
    const record = { id: nextId++, ${fieldEntries.map(([k, v]) => `${k}: data.${k} || ${v === 'number' ? '0' : v === 'boolean' ? 'false' : v === 'list' ? '[]' : v === 'date' ? 'new Date().toISOString()' : "''"}`).join(', ')} }
    ${name.toLowerCase()}s.push(record)
    return record
}

export function getAll${name}s() { return ${name.toLowerCase()}s }

export function get${name}ById(id) { return ${name.toLowerCase()}s.find(r => r.id === id) }

export function update${name}(id, data) {
    const idx = ${name.toLowerCase()}s.findIndex(r => r.id === id)
    if (idx === -1) return null
    Object.assign(${name.toLowerCase()}s[idx], data)
    return ${name.toLowerCase()}s[idx]
}

export function delete${name}(id) {
    const idx = ${name.toLowerCase()}s.findIndex(r => r.id === id)
    if (idx === -1) return false
    ${name.toLowerCase()}s.splice(idx, 1)
    return true
}
`
}

function generateRoutesCode(plan) {
    const modelNames = Object.keys(plan.models)
    return `import { Router } from 'express'
${modelNames.map(m => `import { create${m}, getAll${m}s, get${m}ById, update${m}, delete${m} } from '../src/models/${m.toLowerCase()}.js'`).join('\n')}
${plan.middleware.map(mw => `import { ${camelCase(mw)} } from './middleware/${mw}.js'`).join('\n')}

export const router = Router()

${plan.api.map(endpoint => {
        const [method, path] = endpoint.split(' ')
        const routeMethod = method.toLowerCase()
        if (routeMethod === 'ws') return `// WebSocket: ${path}`
        const model = modelNames.find(m => path.toLowerCase().includes(m.toLowerCase() + 's') || path.toLowerCase().includes(m.toLowerCase()))
        if (!model) return `router.${routeMethod}('${path.replace('/api', '')}', (req, res) => res.json({ message: 'TODO' }))`
        if (routeMethod === 'get' && path.includes(':id')) return `router.get('${path.replace('/api', '')}', (req, res) => { const item = get${model}ById(Number(req.params.id)); item ? res.json(item) : res.status(404).json({ error: 'Not found' }) })`
        if (routeMethod === 'get') return `router.get('${path.replace('/api', '')}', (req, res) => res.json(getAll${model}s()))`
        if (routeMethod === 'post') return `router.post('${path.replace('/api', '')}', (req, res) => res.status(201).json(create${model}(req.body)))`
        if (routeMethod === 'put' || routeMethod === 'patch') return `router.${routeMethod}('${path.replace('/api', '')}', (req, res) => { const item = update${model}(Number(req.params.id), req.body); item ? res.json(item) : res.status(404).json({ error: 'Not found' }) })`
        if (routeMethod === 'delete') return `router.delete('${path.replace('/api', '')}', (req, res) => delete${model}(Number(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: 'Not found' }))`
        return `router.${routeMethod}('${path.replace('/api', '')}', (req, res) => res.json({ message: 'TODO' }))`
    }).join('\n')}
`
}

function generateMiddlewareCode(name) {
    if (name === 'auth-guard') return `import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

export function authGuard(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        res.status(401).json({ error: 'Invalid token' })
    }
}
`
    if (name === 'admin-guard') return `export function adminGuard(req, res, next) {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    next()
}
`
    return `export function ${camelCase(name)}(req, res, next) {
    // ${name} middleware logic
    next()
}
`
}

export { APP_TEMPLATES, FEATURE_MODIFIERS }