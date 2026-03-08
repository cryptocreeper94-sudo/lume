/**
 * ═══════════════════════════════════════════════════════════
 *  LUME — UI Element Registry (M10)
 *  Maps UI elements in a project for natural language targeting.
 * 
 *  Capabilities:
 *    - Register/query components by natural name
 *    - Spatial resolution ("left", "center", "above")
 *    - Style resolution ("bigger", "blue", "more spacing")
 *    - Project scanning for UI element discovery
 * ═══════════════════════════════════════════════════════════
 */

/* ── Spatial Terms ────────────────────────────────────── */

export const SPATIAL_MAP = {
    // Position
    'left': { property: 'textAlign', value: 'left', css: 'text-align: left' },
    'right': { property: 'textAlign', value: 'right', css: 'text-align: right' },
    'center': { property: 'textAlign', value: 'center', css: 'text-align: center' },
    'centered': { property: 'textAlign', value: 'center', css: 'text-align: center' },
    'top': { property: 'verticalAlign', value: 'top', css: 'vertical-align: top' },
    'bottom': { property: 'verticalAlign', value: 'bottom', css: 'vertical-align: bottom' },
    'above': { property: 'position', value: 'relative', css: 'position: relative; top: -1rem' },
    'below': { property: 'position', value: 'relative', css: 'position: relative; top: 1rem' },
    // Layout
    'full width': { property: 'width', value: '100%', css: 'width: 100%' },
    'half width': { property: 'width', value: '50%', css: 'width: 50%' },
    'sidebar': { property: 'display', value: 'flex', css: 'display: flex; flex-direction: row' },
    'sticky': { property: 'position', value: 'sticky', css: 'position: sticky; top: 0' },
    'fixed': { property: 'position', value: 'fixed', css: 'position: fixed' },
    'hidden': { property: 'display', value: 'none', css: 'display: none' },
    'visible': { property: 'display', value: 'block', css: 'display: block' },
}

/* ── Style Terms ──────────────────────────────────────── */

export const STYLE_MAP = {
    // Size
    'bigger': { property: 'fontSize', relative: '+0.25rem', css: 'font-size: larger' },
    'smaller': { property: 'fontSize', relative: '-0.25rem', css: 'font-size: smaller' },
    'larger': { property: 'fontSize', relative: '+0.5rem', css: 'font-size: larger' },
    'tiny': { property: 'fontSize', value: '0.75rem', css: 'font-size: 0.75rem' },
    'huge': { property: 'fontSize', value: '2rem', css: 'font-size: 2rem' },
    // Spacing
    'more spacing': { property: 'padding', relative: '+0.5rem', css: 'padding: 1rem' },
    'less spacing': { property: 'padding', relative: '-0.25rem', css: 'padding: 0.25rem' },
    'more margin': { property: 'margin', relative: '+0.5rem', css: 'margin: 1rem' },
    'compact': { property: 'gap', value: '0.25rem', css: 'gap: 0.25rem' },
    'spacious': { property: 'gap', value: '2rem', css: 'gap: 2rem' },
    // Colors
    'blue': { property: 'color', value: '#3b82f6', css: 'color: #3b82f6' },
    'red': { property: 'color', value: '#ef4444', css: 'color: #ef4444' },
    'green': { property: 'color', value: '#22c55e', css: 'color: #22c55e' },
    'yellow': { property: 'color', value: '#eab308', css: 'color: #eab308' },
    'purple': { property: 'color', value: '#a855f7', css: 'color: #a855f7' },
    'white': { property: 'color', value: '#ffffff', css: 'color: #ffffff' },
    'black': { property: 'color', value: '#000000', css: 'color: #000000' },
    'dark': { property: 'backgroundColor', value: '#1a1a2e', css: 'background-color: #1a1a2e; color: #ffffff' },
    'light': { property: 'backgroundColor', value: '#f8f9fa', css: 'background-color: #f8f9fa; color: #1a1a2e' },
    // Typography
    'bold': { property: 'fontWeight', value: 'bold', css: 'font-weight: bold' },
    'italic': { property: 'fontStyle', value: 'italic', css: 'font-style: italic' },
    'underline': { property: 'textDecoration', value: 'underline', css: 'text-decoration: underline' },
    // Borders
    'rounded': { property: 'borderRadius', value: '0.5rem', css: 'border-radius: 0.5rem' },
    'bordered': { property: 'border', value: '1px solid #e5e7eb', css: 'border: 1px solid #e5e7eb' },
    'shadow': { property: 'boxShadow', value: '0 4px 6px rgba(0,0,0,0.1)', css: 'box-shadow: 0 4px 6px rgba(0,0,0,0.1)' },
}

/* ── UI Registry ──────────────────────────────────────── */

export class UIRegistry {
    constructor() {
        this.elements = new Map()
        this.nextId = 1
    }

    /**
     * Register a UI component.
     * @param {string} name - Natural name (e.g., "login form", "header")
     * @param {string} type - Component type (e.g., "form", "button", "div")
     * @param {object} [options] - { position, children, styles, id }
     * @returns {object} The registered element
     */
    register(name, type, options = {}) {
        const id = options.id || `ui-${this.nextId++}`
        const element = {
            id,
            name: name.toLowerCase(),
            type,
            position: options.position || null,
            children: options.children || [],
            styles: options.styles || {},
            created: Date.now(),
        }
        this.elements.set(id, element)
        return element
    }

    /**
     * Query a component by natural name (fuzzy match).
     * @param {string} query - Natural language query (e.g., "the login form")
     * @returns {object|null}
     */
    query(query) {
        const normalized = query.toLowerCase()
            .replace(/^(the|a|an)\s+/, '')
            .replace(/\s+/g, ' ')
            .trim()

        // Exact match
        for (const [, el] of this.elements) {
            if (el.name === normalized) return el
        }

        // Partial match
        for (const [, el] of this.elements) {
            if (el.name.includes(normalized) || normalized.includes(el.name)) return el
        }

        // Word-overlap match
        const queryWords = new Set(normalized.split(/\s+/))
        let bestMatch = null
        let bestScore = 0

        for (const [, el] of this.elements) {
            const nameWords = new Set(el.name.split(/\s+/))
            const overlap = [...queryWords].filter(w => nameWords.has(w)).length
            const score = overlap / Math.max(queryWords.size, nameWords.size)
            if (score > bestScore && score > 0.3) {
                bestScore = score
                bestMatch = el
            }
        }

        return bestMatch
    }

    /**
     * Get all registered elements.
     * @returns {object[]}
     */
    getAll() {
        return [...this.elements.values()]
    }

    /**
     * Resolve a spatial term to CSS properties.
     * @param {string} term - Natural spatial term
     * @returns {object|null}
     */
    resolveSpatial(term) {
        return SPATIAL_MAP[term.toLowerCase()] || null
    }

    /**
     * Resolve a style term to CSS properties.
     * @param {string} term - Natural style term
     * @returns {object|null}
     */
    resolveStyle(term) {
        return STYLE_MAP[term.toLowerCase()] || null
    }

    /**
     * Clear the registry.
     */
    clear() {
        this.elements.clear()
        this.nextId = 1
    }
}

/* ── Component Templates ──────────────────────────────── */

/**
 * Common component templates for "add a login form" style commands.
 */
export const COMPONENT_TEMPLATES = {
    'login form': {
        type: 'form',
        children: [
            { type: 'input', name: 'email', label: 'Email', inputType: 'email' },
            { type: 'input', name: 'password', label: 'Password', inputType: 'password' },
            { type: 'button', name: 'submit', label: 'Log In', action: 'submit' },
        ],
        css: `
.login-form { max-width: 400px; margin: 0 auto; padding: 2rem; }
.login-form input { display: block; width: 100%; padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
.login-form button { width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer; }
.login-form button:hover { background: #2563eb; }`,
    },
    'signup form': {
        type: 'form',
        children: [
            { type: 'input', name: 'name', label: 'Full Name', inputType: 'text' },
            { type: 'input', name: 'email', label: 'Email', inputType: 'email' },
            { type: 'input', name: 'password', label: 'Password', inputType: 'password' },
            { type: 'input', name: 'confirm', label: 'Confirm Password', inputType: 'password' },
            { type: 'button', name: 'submit', label: 'Sign Up', action: 'submit' },
        ],
    },
    'navigation bar': {
        type: 'nav',
        children: [
            { type: 'link', name: 'home', label: 'Home', href: '/' },
            { type: 'link', name: 'about', label: 'About', href: '/about' },
            { type: 'link', name: 'contact', label: 'Contact', href: '/contact' },
        ],
    },
    'search bar': {
        type: 'form',
        children: [
            { type: 'input', name: 'query', label: 'Search', inputType: 'search' },
            { type: 'button', name: 'search', label: 'Search', action: 'search' },
        ],
    },
    'user profile': {
        type: 'section',
        children: [
            { type: 'image', name: 'avatar', label: 'Profile Picture' },
            { type: 'text', name: 'username', label: 'Username' },
            { type: 'text', name: 'bio', label: 'Bio' },
        ],
    },
    'data table': {
        type: 'table',
        children: [
            { type: 'thead', name: 'header', label: 'Table Header' },
            { type: 'tbody', name: 'body', label: 'Table Body' },
        ],
    },
}

/**
 * Get a component template by natural name (fuzzy match).
 * @param {string} name - Natural name like "login form", "nav bar"
 * @returns {object|null}
 */
export function getComponentTemplate(name) {
    const normalized = name.toLowerCase().trim()

    // Exact match
    if (COMPONENT_TEMPLATES[normalized]) return { ...COMPONENT_TEMPLATES[normalized], name: normalized }

    // Alias match
    const aliases = {
        'nav bar': 'navigation bar',
        'navbar': 'navigation bar',
        'nav': 'navigation bar',
        'search': 'search bar',
        'profile': 'user profile',
        'table': 'data table',
        'login': 'login form',
        'signup': 'signup form',
        'register form': 'signup form',
        'sign up form': 'signup form',
    }

    const aliasKey = aliases[normalized]
    if (aliasKey && COMPONENT_TEMPLATES[aliasKey]) return { ...COMPONENT_TEMPLATES[aliasKey], name: aliasKey }

    return null
}
