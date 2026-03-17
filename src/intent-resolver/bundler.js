/**
 * ═══════════════════════════════════════════════════════════
 *  LUME — Zero-Dependency Bundler (M13)
 *  Compiles Lume programs into:
 *    A) Single-file JavaScript bundles (--bundle)
 *    B) Standalone binaries (--compile via Bun/Deno)
 *
 *  Features:
 *    - Tree-shaking for unused runtime features
 *    - Inlines all imports into a single .js file
 *    - Runtime polyfill injection for self-sustaining features
 *    - Cross-compilation targets: linux, macos, windows, wasm
 * ═══════════════════════════════════════════════════════════
 */

/* ── Runtime Feature Detection ────────────────────────── */

/**
 * Scans compiled JS for runtime features to determine which
 * polyfills need to be included in the bundle.
 *
 * @param {string} compiledJS - The compiled JavaScript source
 * @returns {{ features: Set<string>, size: { original: number, estimated: number } }}
 */
export function detectRuntimeFeatures(compiledJS) {
    const features = new Set()

    // AI Integration (M3)
    if (/\b(fetch|axios|openai|anthropic)\s*\(/.test(compiledJS) || /LUME_AI_MODEL/.test(compiledJS)) {
        features.add('ai-api')
    }

    // File I/O (M4)
    if (/\b(readFileSync|writeFileSync|readFile|writeFile|fs\.)/.test(compiledJS)) {
        features.add('file-io')
    }

    // Network (M4)
    if (/\bfetch\s*\(/.test(compiledJS)) {
        features.add('network')
    }

    // Self-sustaining runtime (M5-M6)
    if (/\b(LUME_MONITOR|monitor_loop|healthCheck)\b/.test(compiledJS)) {
        features.add('monitor')
    }
    if (/\b(LUME_HEAL|auto_heal|recoverFromError)\b/.test(compiledJS)) {
        features.add('heal')
    }
    if (/\b(LUME_OPTIMIZE|perf_optimize)\b/.test(compiledJS)) {
        features.add('optimize')
    }
    if (/\b(LUME_EVOLVE|evolution_suggest)\b/.test(compiledJS)) {
        features.add('evolve')
    }

    // Timer/async
    if (/\b(setTimeout|setInterval|Promise|async|await)\b/.test(compiledJS)) {
        features.add('async')
    }

    // DOM
    if (/\b(document\.|window\.|querySelector|addEventListener)\b/.test(compiledJS)) {
        features.add('dom')
    }

    // Console
    if (/\bconsole\.\w+/.test(compiledJS)) {
        features.add('console')
    }

    // Estimate bundle size
    const polyfillSizes = {
        'ai-api': 2000,
        'file-io': 500,
        'network': 300,
        'monitor': 1500,
        'heal': 1200,
        'optimize': 1000,
        'evolve': 800,
        'async': 200,
        'dom': 100,
        'console': 50,
    }

    const polyfillTotal = [...features].reduce((sum, f) => sum + (polyfillSizes[f] || 0), 0)

    return {
        features,
        size: {
            original: compiledJS.length,
            estimated: compiledJS.length + polyfillTotal,
        },
    }
}

/* ── Runtime Polyfills ────────────────────────────────── */

const RUNTIME_POLYFILLS = {
    'monitor': `
// ═══ Lume Monitor Runtime ═══
globalThis.LUME_MONITOR = {
  intervals: [],
  start(fn, ms) { this.intervals.push(setInterval(fn, ms)); },
  stop() { this.intervals.forEach(clearInterval); this.intervals = []; },
};`,
    'heal': `
// ═══ Lume Self-Heal Runtime ═══
globalThis.LUME_HEAL = {
  handlers: new Map(),
  register(name, handler) { this.handlers.set(name, handler); },
  async recover(error) {
    for (const [, handler] of this.handlers) {
      try { await handler(error); return true; } catch {}
    }
    return false;
  },
};`,
    'optimize': `
// ═══ Lume Optimizer Runtime ═══
globalThis.LUME_OPTIMIZE = {
  cache: new Map(),
  memoize(key, fn) {
    if (this.cache.has(key)) return this.cache.get(key);
    const result = fn();
    this.cache.set(key, result);
    return result;
  },
};`,
    'evolve': `
// ═══ Lume Evolution Runtime ═══
globalThis.LUME_EVOLVE = {
  suggestions: [],
  suggest(msg) { this.suggestions.push({ msg, ts: Date.now() }); },
  getSuggestions() { return this.suggestions; },
};`,
    'file-io': `
// ═══ Lume File I/O ═══
import { readFileSync, writeFileSync } from 'node:fs';`,
}

/**
 * Generate runtime polyfill code for the detected features.
 *
 * @param {Set<string>} features - Set of feature names from detectRuntimeFeatures
 * @returns {string} Polyfill code to prepend to the bundle
 */
export function generatePolyfills(features) {
    const parts = ['// ═══ Lume Zero-Dependency Runtime ═══']
    parts.push(`// Generated: ${new Date().toISOString()}`)
    parts.push(`// Features: ${[...features].join(', ') || 'none'}`)
    parts.push('')

    for (const feature of features) {
        if (RUNTIME_POLYFILLS[feature]) {
            parts.push(RUNTIME_POLYFILLS[feature])
        }
    }

    return parts.join('\n')
}

/* ── Browser Stdlib Inline ────────────────────────────── */

const BROWSER_STDLIB = `
// ═══ Lume Standard Library (Browser) ═══
const text = {
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
};

const math = {
  abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
  min: (...a) => Math.min(...a), max: (...a) => Math.max(...a),
  pow: Math.pow, sqrt: Math.sqrt, random: () => Math.random(),
  random_int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  pi: Math.PI, e: Math.E, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log,
  clamp: (v, lo, hi) => Math.min(Math.max(v, lo), hi),
  lerp: (a, b, t) => a + (b - a) * t,
  sum: (arr) => arr.reduce((a, b) => a + b, 0),
  average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
};

const list = {
  first: (a) => a[0], last: (a) => a[a.length - 1],
  rest: (a) => a.slice(1), take: (a, n) => a.slice(0, n), drop: (a, n) => a.slice(n),
  map: (a, fn) => a.map(fn), filter: (a, fn) => a.filter(fn),
  reduce: (a, fn, init) => a.reduce(fn, init), find: (a, fn) => a.find(fn),
  contains: (a, item) => a.includes(item), unique: (a) => [...new Set(a)],
  flat: (a) => a.flat(), sort: (a, fn) => [...a].sort(fn), reverse: (a) => [...a].reverse(),
  zip: (a, b) => a.map((v, i) => [v, b[i]]),
  range: (start, end, step = 1) => { const r = []; for (let i = start; i < end; i += step) r.push(i); return r; },
  chunk: (a, s) => { const c = []; for (let i = 0; i < a.length; i += s) c.push(a.slice(i, i + s)); return c; },
  count: (a) => a.length, empty: (a) => a.length === 0,
};

const time = {
  now: () => Date.now(),
  today: () => new Date().toISOString().split('T')[0],
  timestamp: () => new Date().toISOString(),
  format: (ms, fmt = 'iso') => {
    const d = new Date(ms);
    if (fmt === 'iso') return d.toISOString();
    if (fmt === 'date') return d.toLocaleDateString();
    if (fmt === 'time') return d.toLocaleTimeString();
    return d.toString();
  },
  elapsed: (s) => Date.now() - s,
  sleep: (ms) => new Promise(r => setTimeout(r, ms)),
};

const convert = {
  to_number: Number, to_text: String, to_boolean: Boolean,
  to_json: (v) => JSON.stringify(v, null, 2),
  from_json: (s) => JSON.parse(s),
};

const dom = {
  create: (tag, opts = {}) => {
    const el = document.createElement(tag);
    if (opts.text) el.textContent = opts.text;
    if (opts.html) el.innerHTML = opts.html;
    if (opts.id) el.id = opts.id;
    if (opts.className) el.className = opts.className;
    if (opts.styles) Object.assign(el.style, opts.styles);
    if (opts.attrs) { for (const [k, v] of Object.entries(opts.attrs)) el.setAttribute(k, v); }
    if (opts.children) { for (const c of opts.children) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    if (opts.onClick) el.addEventListener('click', opts.onClick);
    return el;
  },
  select: (s) => document.querySelector(s),
  select_all: (s) => [...document.querySelectorAll(s)],
  add_child: (p, c) => { if (typeof p === 'string') p = document.querySelector(p); if (typeof c === 'string') c = document.createTextNode(c); p.appendChild(c); return c; },
  set_text: (el, t) => { if (typeof el === 'string') el = document.querySelector(el); el.textContent = t; },
  set_html: (el, h) => { if (typeof el === 'string') el = document.querySelector(el); el.innerHTML = h; },
  set_style: (el, p, v) => { if (typeof el === 'string') el = document.querySelector(el); el.style[p] = v; },
  set_styles: (el, s) => { if (typeof el === 'string') el = document.querySelector(el); Object.assign(el.style, s); },
  add_class: (el, ...c) => { if (typeof el === 'string') el = document.querySelector(el); el.classList.add(...c); },
  remove_class: (el, ...c) => { if (typeof el === 'string') el = document.querySelector(el); el.classList.remove(...c); },
  toggle_class: (el, c) => { if (typeof el === 'string') el = document.querySelector(el); el.classList.toggle(c); },
  on: (el, ev, fn) => { if (typeof el === 'string') el = document.querySelector(el); el.addEventListener(ev, fn); },
  mount: (el, t) => { const p = t ? (typeof t === 'string' ? document.querySelector(t) : t) : document.body; p.appendChild(el); return el; },
  inject_css: (css, id) => {
    if (id) { const e = document.getElementById(id); if (e) { e.textContent = css; return e; } }
    const s = document.createElement('style'); if (id) s.id = id; s.textContent = css; document.head.appendChild(s); return s;
  },
  animate: (el, kf, opts = {}) => {
    if (typeof el === 'string') el = document.querySelector(el);
    return el.animate(kf, { duration: opts.duration || 1000, easing: opts.easing || 'ease', iterations: opts.iterations || 1, fill: opts.fill || 'forwards', delay: opts.delay || 0 });
  },
  keyframes: (name, body) => { dom.inject_css('@keyframes ' + name + ' { ' + body + ' }', 'kf-' + name); return name; },
  remove: (el) => { if (typeof el === 'string') el = document.querySelector(el); if (el && el.parentNode) el.parentNode.removeChild(el); },
  clear: (el) => { if (typeof el === 'string') el = document.querySelector(el); while (el.firstChild) el.removeChild(el.firstChild); },
  set_data: (el, k, v) => { if (typeof el === 'string') el = document.querySelector(el); el.dataset[k] = v; },
  get_data: (el, k) => { if (typeof el === 'string') el = document.querySelector(el); return el.dataset[k]; },
  scroll_to: (t, o = {}) => { if (typeof t === 'string') t = document.querySelector(t); (t || window).scrollTo({ top: o.top || 0, left: o.left || 0, behavior: o.smooth !== false ? 'smooth' : 'auto' }); },
  on_visible: (el, cb, opts = {}) => {
    if (typeof el === 'string') el = document.querySelector(el);
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { cb(e.target); if (opts.once !== false) obs.unobserve(e.target); } }); }, { threshold: opts.threshold || 0.1 });
    obs.observe(el); return obs;
  },
  reveal_on_scroll: (sel, opts = {}) => {
    const els = document.querySelectorAll(sel); const d = opts.stagger || 100;
    const obs = new IntersectionObserver((entries) => { entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }, i * d); obs.unobserve(e.target); } }); }, { threshold: opts.threshold || 0.1 });
    els.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity ' + (opts.duration || 600) + 'ms ease, transform ' + (opts.duration || 600) + 'ms ease'; obs.observe(el); });
    return obs;
  },
  ready: (fn) => { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); },
};

const state = {
  machine: (cfg) => {
    let cur = cfg.initial; const ls = [];
    return {
      get current() { return cur; },
      send(ev) { const sc = cfg.states[cur]; if (sc && sc.on && sc.on[ev]) { const nx = sc.on[ev]; const pv = cur; cur = typeof nx === 'string' ? nx : nx.target; if (typeof nx === 'object' && nx.action) nx.action(pv, cur); ls.forEach(fn => fn(cur, pv, ev)); } return cur; },
      on_change(fn) { ls.push(fn); },
    };
  },
  reactive: (init) => {
    let v = init; const ls = [];
    return {
      get: () => v,
      set: (nv) => { const o = v; v = nv; ls.forEach(fn => fn(v, o)); },
      on_change: (fn) => { ls.push(fn); },
      bind: (el) => { if (typeof el === 'string') el = document.querySelector(el); el.textContent = v; ls.push((nv) => { el.textContent = nv; }); },
    };
  },
};
`;

/* ── Bundle Generation ────────────────────────────────── */

/**
 * Create a single-file JavaScript bundle from compiled Lume output.
 *
 * @param {string} compiledJS - The compiled JavaScript from the transpiler
 * @param {object} [options] - { minify, includeSourceMap, target }
 * @returns {{ bundle: string, size: number, features: string[], target: string }}
 */
export function createBundle(compiledJS, options = {}) {
    const target = options.target || 'node'
    const { features, size } = detectRuntimeFeatures(compiledJS)

    // Generate polyfills
    const polyfills = generatePolyfills(features)

    // Build the bundle
    const parts = []

    // Shebang for Node.js targets only
    if (target !== 'browser' && (target === 'node' || target === 'linux' || target === 'macos' || target === 'windows')) {
        parts.push('#!/usr/bin/env node')
    }

    // Self-contained header
    if (target === 'browser') {
        parts.push(`// Lume Compiled Bundle — Browser`)
        parts.push(`// Zero Dependencies — Built with Lume`)
        parts.push(`// Generated: ${new Date().toISOString()}`)
        parts.push('')
        parts.push('(function() {')
        parts.push('"use strict";')
    } else {
        parts.push(`"use strict";`)
        parts.push(`// Lume Compiled Bundle — Zero Dependencies`)
        parts.push(`// Target: ${target}`)
    }
    parts.push('')

    // Polyfills
    if (polyfills.trim()) {
        parts.push(polyfills)
        parts.push('')
    }

    // For browser target, inline the stdlib modules
    if (target === 'browser') {
        parts.push(BROWSER_STDLIB)
        parts.push('')
    }

    // Main application code — strip Node.js imports for browser target
    parts.push('// ═══ Application Code ═══')
    let appCode = compiledJS
    if (target === 'browser') {
        // Strip Node.js-specific imports
        appCode = appCode
            .replace(/^import\s+.*from\s+["']node:.*["'];?\s*$/gm, '')
            .replace(/^import\s+.*from\s+["']lume-runtime.*["'];?\s*$/gm, '')
            .replace(/^const\s+__lume_config\s*=.*$/gm, '')
            .replace(/^\/\/\s*Generated by Lume Compiler\s*$/gm, '')
            .trim()
    }
    parts.push(appCode)

    // Close IIFE for browser
    if (target === 'browser') {
        parts.push('')
        parts.push('})();')
    }

    let bundle = parts.join('\n')

    // Basic minification (remove comments and extra whitespace)
    if (options.minify) {
        bundle = minify(bundle)
    }

    return {
        bundle,
        size: bundle.length,
        features: [...features],
        target,
    }
}

/**
 * Basic JavaScript minification (no external deps).
 * Removes comments, compresses whitespace.
 */
function minify(code) {
    return code
        // Remove single-line comments (but not URLs)
        .replace(/(?<!:)\/\/(?!.*['"`]).*$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Compress multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim trailing whitespace
        .replace(/[ \t]+$/gm, '')
        .trim()
}

/* ── Compile Command ──────────────────────────────────── */

/**
 * Generate the shell command to compile a bundle into a standalone binary.
 * Uses Bun's compile feature.
 *
 * @param {string} bundlePath - Path to the .js bundle file
 * @param {string} outputPath - Path for the output binary
 * @param {object} [options] - { target: 'linux'|'macos'|'windows'|'wasm' }
 * @returns {{ command: string, args: string[], target: string }}
 */
export function getCompileCommand(bundlePath, outputPath, options = {}) {
    const target = options.target || detectPlatform()

    // Target mapping for Bun cross-compilation
    const bunTargets = {
        'linux': 'bun-linux-x64',
        'macos': 'bun-darwin-x64',
        'windows': 'bun-windows-x64',
    }

    const bunTarget = bunTargets[target]

    if (target === 'wasm') {
        // WASM compilation (experimental — future milestone)
        return {
            command: 'echo',
            args: ['WASM compilation is experimental. Use --target linux|macos|windows for native binaries.'],
            target: 'wasm',
        }
    }

    if (bunTarget) {
        return {
            command: 'bun',
            args: ['build', bundlePath, '--compile', '--target', bunTarget, '--outfile', outputPath],
            target,
        }
    }

    // Fallback: use Deno
    return {
        command: 'deno',
        args: ['compile', '--output', outputPath, bundlePath],
        target,
    }
}

/**
 * Detect the current platform.
 * @returns {'linux'|'macos'|'windows'}
 */
export function detectPlatform() {
    const platform = typeof process !== 'undefined' ? process.platform : 'linux'
    if (platform === 'win32') return 'windows'
    if (platform === 'darwin') return 'macos'
    return 'linux'
}

/**
 * Get supported compilation targets.
 * @returns {string[]}
 */
export function supportedTargets() {
    return ['linux', 'macos', 'windows', 'browser', 'wasm']
}
