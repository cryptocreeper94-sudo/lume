/**
 * Lume Bundler — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectRuntimeFeatures, generatePolyfills, createBundle, getCompileCommand, detectPlatform, supportedTargets } from '../../src/intent-resolver/bundler.js'

describe('Bundler: detectRuntimeFeatures', () => {
    it('detects async features', () => { const r = detectRuntimeFeatures('await fetch("url")'); assert.ok(r.features.has('async')) })
    it('detects network', () => { const r = detectRuntimeFeatures('fetch("http")'); assert.ok(r.features.has('network')) })
    it('detects DOM', () => { const r = detectRuntimeFeatures('document.querySelector("#app")'); assert.ok(r.features.has('dom')) })
    it('detects console', () => { const r = detectRuntimeFeatures('console.log("hi")'); assert.ok(r.features.has('console')) })
    it('detects file-io', () => { const r = detectRuntimeFeatures('readFileSync("file")'); assert.ok(r.features.has('file-io')) })
    it('detects monitor', () => { const r = detectRuntimeFeatures('LUME_MONITOR.start()'); assert.ok(r.features.has('monitor')) })
    it('detects heal', () => { const r = detectRuntimeFeatures('LUME_HEAL.recover()'); assert.ok(r.features.has('heal')) })
    it('detects optimize', () => { const r = detectRuntimeFeatures('LUME_OPTIMIZE.memoize()'); assert.ok(r.features.has('optimize')) })
    it('detects evolve', () => { const r = detectRuntimeFeatures('LUME_EVOLVE.suggest()'); assert.ok(r.features.has('evolve')) })
    it('returns size estimate', () => { const r = detectRuntimeFeatures('const x = 1;'); assert.ok(r.size.original > 0) })
    it('empty code has no features', () => { assert.equal(detectRuntimeFeatures('const x = 1;').features.size, 0) })
})

describe('Bundler: generatePolyfills', () => {
    it('generates header comment', () => { assert.ok(generatePolyfills(new Set()).includes('Zero-Dependency')) })
    it('includes monitor polyfill', () => { assert.ok(generatePolyfills(new Set(['monitor'])).includes('LUME_MONITOR')) })
    it('includes heal polyfill', () => { assert.ok(generatePolyfills(new Set(['heal'])).includes('LUME_HEAL')) })
})

describe('Bundler: createBundle', () => {
    it('creates bundle with shebang for node', () => { const r = createBundle('console.log(1)', { target: 'node' }); assert.ok(r.bundle.includes('#!/usr/bin/env node')) })
    it('includes use strict', () => { const r = createBundle('x'); assert.ok(r.bundle.includes('"use strict"')) })
    it('returns size', () => { const r = createBundle('x'); assert.ok(r.size > 0) })
    it('returns feature list', () => { const r = createBundle('console.log(1)'); assert.ok(Array.isArray(r.features)) })
    it('minify removes comments', () => { const r = createBundle('// test\nconst x = 1;', { minify: true }); assert.ok(!r.bundle.includes('// test')) })
})

describe('Bundler: getCompileCommand', () => {
    it('returns bun command for linux', () => { const r = getCompileCommand('out.js', 'app', { target: 'linux' }); assert.equal(r.command, 'bun') })
    it('returns bun command for windows', () => { const r = getCompileCommand('out.js', 'app', { target: 'windows' }); assert.equal(r.command, 'bun') })
    it('returns echo for wasm', () => { const r = getCompileCommand('out.js', 'app', { target: 'wasm' }); assert.equal(r.command, 'echo') })
})

describe('Bundler: detectPlatform', () => {
    it('returns a platform string', () => { assert.ok(['linux', 'macos', 'windows'].includes(detectPlatform())) })
})

describe('Bundler: supportedTargets', () => {
    it('returns 4 targets', () => { assert.equal(supportedTargets().length, 4) })
    it('includes wasm', () => { assert.ok(supportedTargets().includes('wasm')) })
})
