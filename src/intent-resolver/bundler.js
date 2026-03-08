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

    // Shebang for Node.js targets
    if (target === 'node' || target === 'linux' || target === 'macos' || target === 'windows') {
        parts.push('#!/usr/bin/env node')
    }

    // Self-contained header
    parts.push(`"use strict";`)
    parts.push(`// Lume Compiled Bundle — Zero Dependencies`)
    parts.push(`// Target: ${target}`)
    parts.push('')

    // Polyfills
    if (polyfills.trim()) {
        parts.push(polyfills)
        parts.push('')
    }

    // Main application code
    parts.push('// ═══ Application Code ═══')
    parts.push(compiledJS)

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
    return ['linux', 'macos', 'windows', 'wasm']
}
