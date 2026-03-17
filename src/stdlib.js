/**
 * ====== Lume Standard Library ======
 * Built-in functions available in all Lume programs.
 * 
 * Modules:
 *   - text:   String manipulation
 *   - math:   Mathematical operations
 *   - list:   Array operations
 *   - time:   Date/time utilities
 *   - convert: Type conversion
 */

// ══════════════════════════
//  TEXT MODULE
// ══════════════════════════

export const text = {
    upper: (s) => String(s).toUpperCase(),
    lower: (s) => String(s).toLowerCase(),
    trim: (s) => String(s).trim(),
    split: (s, sep) => String(s).split(sep),
    join: (arr, sep = ', ') => arr.join(sep),
    replace: (s, from, to) => String(s).replaceAll(from, to),
    contains: (s, sub) => String(s).includes(sub),
    starts_with: (s, prefix) => String(s).startsWith(prefix),
    ends_with: (s, suffix) => String(s).endsWith(suffix),
    length: (s) => String(s).length,
    reverse: (s) => String(s).split('').reverse().join(''),
    repeat: (s, n) => String(s).repeat(n),
    pad_left: (s, n, ch = ' ') => String(s).padStart(n, ch),
    pad_right: (s, n, ch = ' ') => String(s).padEnd(n, ch),
    slice: (s, start, end) => String(s).slice(start, end),
    chars: (s) => String(s).split(''),
}

// ══════════════════════════
//  MATH MODULE
// ══════════════════════════

export const math = {
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    min: (...args) => Math.min(...args),
    max: (...args) => Math.max(...args),
    pow: Math.pow,
    sqrt: Math.sqrt,
    random: () => Math.random(),
    random_int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    pi: Math.PI,
    e: Math.E,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    lerp: (a, b, t) => a + (b - a) * t,
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
}

// ══════════════════════════
//  LIST MODULE
// ══════════════════════════

export const list = {
    first: (arr) => arr[0],
    last: (arr) => arr[arr.length - 1],
    rest: (arr) => arr.slice(1),
    take: (arr, n) => arr.slice(0, n),
    drop: (arr, n) => arr.slice(n),
    map: (arr, fn) => arr.map(fn),
    filter: (arr, fn) => arr.filter(fn),
    reduce: (arr, fn, init) => arr.reduce(fn, init),
    find: (arr, fn) => arr.find(fn),
    contains: (arr, item) => arr.includes(item),
    unique: (arr) => [...new Set(arr)],
    flat: (arr) => arr.flat(),
    sort: (arr, fn) => [...arr].sort(fn),
    reverse: (arr) => [...arr].reverse(),
    zip: (a, b) => a.map((v, i) => [v, b[i]]),
    range: (start, end, step = 1) => {
        const result = []
        for (let i = start; i < end; i += step) result.push(i)
        return result
    },
    chunk: (arr, size) => {
        const chunks = []
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }
        return chunks
    },
    group_by: (arr, fn) => {
        const groups = {}
        for (const item of arr) {
            const key = fn(item)
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        }
        return groups
    },
    count: (arr) => arr.length,
    empty: (arr) => arr.length === 0,
}

// ══════════════════════════
//  TIME MODULE
// ══════════════════════════

export const time = {
    now: () => Date.now(),
    today: () => new Date().toISOString().split('T')[0],
    timestamp: () => new Date().toISOString(),
    format: (ms, fmt = 'iso') => {
        const d = new Date(ms)
        if (fmt === 'iso') return d.toISOString()
        if (fmt === 'date') return d.toLocaleDateString()
        if (fmt === 'time') return d.toLocaleTimeString()
        return d.toString()
    },
    elapsed: (startMs) => Date.now() - startMs,
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
}

// ══════════════════════════
//  CONVERT MODULE
// ══════════════════════════

export const convert = {
    to_number: (v) => Number(v),
    to_text: (v) => String(v),
    to_boolean: (v) => Boolean(v),
    to_json: (v) => JSON.stringify(v, null, 2),
    from_json: (s) => JSON.parse(s),
}

// ══════════════════════════
//  DOM MODULE (Browser)
// ══════════════════════════

export const dom = {
    /**
     * Create an HTML element with optional config.
     * @param {string} tag - Element tag (div, h1, p, section, nav, img, a, span, etc.)
     * @param {object} [opts] - { text, html, id, className, styles, attrs, children, onClick }
     * @returns {HTMLElement}
     */
    create: (tag, opts = {}) => {
        const el = document.createElement(tag)
        if (opts.text) el.textContent = opts.text
        if (opts.html) el.innerHTML = opts.html
        if (opts.id) el.id = opts.id
        if (opts.className) el.className = opts.className
        if (opts.styles) Object.assign(el.style, opts.styles)
        if (opts.attrs) {
            for (const [k, v] of Object.entries(opts.attrs)) {
                el.setAttribute(k, v)
            }
        }
        if (opts.children) {
            for (const child of opts.children) {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child))
                } else {
                    el.appendChild(child)
                }
            }
        }
        if (opts.onClick) el.addEventListener('click', opts.onClick)
        return el
    },

    /** Select a single element. */
    select: (selector) => document.querySelector(selector),

    /** Select all matching elements. */
    select_all: (selector) => [...document.querySelectorAll(selector)],

    /** Append a child to a parent. */
    add_child: (parent, child) => {
        if (typeof parent === 'string') parent = document.querySelector(parent)
        if (typeof child === 'string') child = document.createTextNode(child)
        parent.appendChild(child)
        return child
    },

    /** Set text content. */
    set_text: (el, text) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.textContent = text
    },

    /** Set innerHTML. */
    set_html: (el, html) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.innerHTML = html
    },

    /** Set a single style property. */
    set_style: (el, prop, val) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.style[prop] = val
    },

    /** Set multiple styles. */
    set_styles: (el, styles) => {
        if (typeof el === 'string') el = document.querySelector(el)
        Object.assign(el.style, styles)
    },

    /** Add a CSS class. */
    add_class: (el, ...classes) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.classList.add(...classes)
    },

    /** Remove a CSS class. */
    remove_class: (el, ...classes) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.classList.remove(...classes)
    },

    /** Toggle a CSS class. */
    toggle_class: (el, cls) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.classList.toggle(cls)
    },

    /** Add an event listener. */
    on: (el, event, fn) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.addEventListener(event, fn)
    },

    /** Mount an element to the document body (or a target). */
    mount: (el, target) => {
        const parent = target
            ? (typeof target === 'string' ? document.querySelector(target) : target)
            : document.body
        parent.appendChild(el)
        return el
    },

    /**
     * Inject a CSS string into the page via a <style> tag.
     * @param {string} css - Raw CSS text
     * @param {string} [id] - Optional style element ID (prevents duplicates)
     * @returns {HTMLStyleElement}
     */
    inject_css: (css, id) => {
        if (id) {
            const existing = document.getElementById(id)
            if (existing) { existing.textContent = css; return existing }
        }
        const style = document.createElement('style')
        if (id) style.id = id
        style.textContent = css
        document.head.appendChild(style)
        return style
    },

    /**
     * Animate an element using the Web Animations API.
     * @param {HTMLElement|string} el
     * @param {Keyframe[]} keyframes - Array of keyframe objects
     * @param {object} options - { duration, easing, iterations, fill, delay }
     * @returns {Animation}
     */
    animate: (el, keyframes, options = {}) => {
        if (typeof el === 'string') el = document.querySelector(el)
        return el.animate(keyframes, {
            duration: options.duration || 1000,
            easing: options.easing || 'ease',
            iterations: options.iterations || 1,
            fill: options.fill || 'forwards',
            delay: options.delay || 0,
        })
    },

    /**
     * Create a CSS keyframe animation and inject it.
     * @param {string} name - Animation name
     * @param {string} keyframeCSS - Raw @keyframes body
     * @returns {string} The animation name (for use in style rules)
     */
    keyframes: (name, keyframeCSS) => {
        dom.inject_css(`@keyframes ${name} { ${keyframeCSS} }`, `kf-${name}`)
        return name
    },

    /** Remove an element from the DOM. */
    remove: (el) => {
        if (typeof el === 'string') el = document.querySelector(el)
        if (el && el.parentNode) el.parentNode.removeChild(el)
    },

    /** Remove all children of an element. */
    clear: (el) => {
        if (typeof el === 'string') el = document.querySelector(el)
        while (el.firstChild) el.removeChild(el.firstChild)
    },

    /** Set a data attribute. */
    set_data: (el, key, value) => {
        if (typeof el === 'string') el = document.querySelector(el)
        el.dataset[key] = value
    },

    /** Get a data attribute. */
    get_data: (el, key) => {
        if (typeof el === 'string') el = document.querySelector(el)
        return el.dataset[key]
    },

    /** Scroll an element (or window) smoothly. */
    scroll_to: (target, options = {}) => {
        if (typeof target === 'string') target = document.querySelector(target)
        const el = target || window
        el.scrollTo({ top: options.top || 0, left: options.left || 0, behavior: options.smooth !== false ? 'smooth' : 'auto' })
    },

    /** Observe an element entering the viewport (for skeleton reveals). */
    on_visible: (el, callback, options = {}) => {
        if (typeof el === 'string') el = document.querySelector(el)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target)
                    if (options.once !== false) observer.unobserve(entry.target)
                }
            })
        }, { threshold: options.threshold || 0.1 })
        observer.observe(el)
        return observer
    },

    /** Batch-observe multiple elements for viewport entry (skeleton reveal pattern). */
    reveal_on_scroll: (selector, options = {}) => {
        const elements = document.querySelectorAll(selector)
        const delay = options.stagger || 100
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1'
                        entry.target.style.transform = 'translateY(0)'
                    }, i * delay)
                    observer.unobserve(entry.target)
                }
            })
        }, { threshold: options.threshold || 0.1 })
        elements.forEach(el => {
            el.style.opacity = '0'
            el.style.transform = 'translateY(20px)'
            el.style.transition = `opacity ${options.duration || 600}ms ease, transform ${options.duration || 600}ms ease`
            observer.observe(el)
        })
        return observer
    },

    /** Wait for DOMContentLoaded. */
    ready: (fn) => {
        if (document.readyState !== 'loading') fn()
        else document.addEventListener('DOMContentLoaded', fn)
    },
}

// ══════════════════════════
//  STATE MODULE
// ══════════════════════════

export const state = {
    /**
     * Create a state machine.
     * @param {object} config - { initial, states: { [name]: { on: { EVENT: 'nextState' } } } }
     * @returns {object} Machine with { current, send, on_change, value }
     */
    machine: (config) => {
        let current = config.initial
        const listeners = []
        return {
            get current() { return current },
            send(event) {
                const stateConfig = config.states[current]
                if (stateConfig && stateConfig.on && stateConfig.on[event]) {
                    const next = stateConfig.on[event]
                    const prev = current
                    current = typeof next === 'string' ? next : next.target
                    if (typeof next === 'object' && next.action) next.action(prev, current)
                    listeners.forEach(fn => fn(current, prev, event))
                }
                return current
            },
            on_change(fn) { listeners.push(fn) },
        }
    },

    /**
     * Create a reactive value (simple observable).
     * @param {*} initial - Initial value
     * @returns {object} { get, set, on_change, bind }
     */
    reactive: (initial) => {
        let value = initial
        const listeners = []
        return {
            get: () => value,
            set: (newVal) => {
                const old = value
                value = newVal
                listeners.forEach(fn => fn(value, old))
            },
            on_change: (fn) => { listeners.push(fn) },
            /** Bind to a DOM element's textContent. */
            bind: (el) => {
                if (typeof el === 'string') el = document.querySelector(el)
                el.textContent = value
                listeners.push((v) => { el.textContent = v })
            },
        }
    },
}

// ══════════════════════════
//  EXPORTS
// ══════════════════════════

export const stdlib = { text, math, list, time, convert, dom, state }
export default stdlib
