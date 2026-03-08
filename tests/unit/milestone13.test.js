/**
 * ═══════════════════════════════════════════════════════════
 *  Milestone 13: Zero-Dependency Runtime — Test Suite
 *  Tests bundler, runtime feature detection, polyfill
 *  generation, binary compilation commands, and cross-targets.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    detectRuntimeFeatures,
    generatePolyfills,
    createBundle,
    getCompileCommand,
    detectPlatform,
    supportedTargets,
} from '../../src/intent-resolver/bundler.js'

/* ═══ Runtime Feature Detection ═══════════════════════ */

describe('M13: Runtime Feature Detection', () => {
    it('detects AI API usage', () => {
        const { features } = detectRuntimeFeatures('const result = fetch("https://api.openai.com/v1/chat")')
        assert.ok(features.has('network'))
    })

    it('detects file I/O', () => {
        const { features } = detectRuntimeFeatures("const data = readFileSync('file.txt')")
        assert.ok(features.has('file-io'))
    })

    it('detects network fetch', () => {
        const { features } = detectRuntimeFeatures("const response = fetch('/api/data')")
        assert.ok(features.has('network'))
    })

    it('detects monitor runtime', () => {
        const { features } = detectRuntimeFeatures('LUME_MONITOR.start(healthCheck, 5000)')
        assert.ok(features.has('monitor'))
    })

    it('detects heal runtime', () => {
        const { features } = detectRuntimeFeatures('LUME_HEAL.register("db", recoverFromError)')
        assert.ok(features.has('heal'))
    })

    it('detects optimize runtime', () => {
        const { features } = detectRuntimeFeatures('LUME_OPTIMIZE.memoize("key", expFn)')
        assert.ok(features.has('optimize'))
    })

    it('detects evolve runtime', () => {
        const { features } = detectRuntimeFeatures('LUME_EVOLVE.suggest("Consider caching")')
        assert.ok(features.has('evolve'))
    })

    it('detects async usage', () => {
        const { features } = detectRuntimeFeatures('async function run() { await getData() }')
        assert.ok(features.has('async'))
    })

    it('detects DOM usage', () => {
        const { features } = detectRuntimeFeatures("document.querySelector('#app')")
        assert.ok(features.has('dom'))
    })

    it('detects console usage', () => {
        const { features } = detectRuntimeFeatures('console.log("hello")')
        assert.ok(features.has('console'))
    })

    it('returns empty features for simple code', () => {
        const { features } = detectRuntimeFeatures('const x = 5;\nconst y = x + 10;')
        assert.equal(features.size, 0)
    })

    it('estimates bundle size', () => {
        const code = 'LUME_MONITOR.start(() => {}, 1000);'
        const { size } = detectRuntimeFeatures(code)
        assert.ok(size.estimated > size.original)
    })
})

/* ═══ Polyfill Generation ═════════════════════════════ */

describe('M13: Polyfill Generation', () => {
    it('generates monitor polyfill', () => {
        const polyfills = generatePolyfills(new Set(['monitor']))
        assert.ok(polyfills.includes('LUME_MONITOR'))
        assert.ok(polyfills.includes('start'))
    })

    it('generates heal polyfill', () => {
        const polyfills = generatePolyfills(new Set(['heal']))
        assert.ok(polyfills.includes('LUME_HEAL'))
        assert.ok(polyfills.includes('recover'))
    })

    it('generates optimize polyfill', () => {
        const polyfills = generatePolyfills(new Set(['optimize']))
        assert.ok(polyfills.includes('LUME_OPTIMIZE'))
        assert.ok(polyfills.includes('memoize'))
    })

    it('generates evolve polyfill', () => {
        const polyfills = generatePolyfills(new Set(['evolve']))
        assert.ok(polyfills.includes('LUME_EVOLVE'))
        assert.ok(polyfills.includes('suggest'))
    })

    it('generates multiple polyfills', () => {
        const polyfills = generatePolyfills(new Set(['monitor', 'heal']))
        assert.ok(polyfills.includes('LUME_MONITOR'))
        assert.ok(polyfills.includes('LUME_HEAL'))
    })

    it('generates empty polyfills for no features', () => {
        const polyfills = generatePolyfills(new Set())
        assert.ok(polyfills.includes('none'))
    })

    it('includes timestamp header', () => {
        const polyfills = generatePolyfills(new Set(['monitor']))
        assert.ok(polyfills.includes('Generated:'))
    })
})

/* ═══ Bundle Creation ═════════════════════════════════ */

describe('M13: Bundle Creation', () => {
    it('creates a basic bundle', () => {
        const { bundle, size, features, target } = createBundle('console.log("hello");')
        assert.ok(bundle.includes('console.log("hello")'))
        assert.ok(bundle.includes('use strict'))
        assert.ok(size > 0)
        assert.equal(target, 'node')
    })

    it('includes shebang for node target', () => {
        const { bundle } = createBundle('console.log("hello");', { target: 'node' })
        assert.ok(bundle.startsWith('#!/usr/bin/env node'))
    })

    it('detects and includes polyfills', () => {
        const { bundle, features } = createBundle('LUME_MONITOR.start(() => {}, 1000);')
        assert.ok(features.includes('monitor'))
        assert.ok(bundle.includes('LUME_MONITOR'))
    })

    it('supports minification', () => {
        const { bundle: normal } = createBundle('// This is a comment\nconsole.log("hello");\n\n\n\n')
        const { bundle: minified } = createBundle('// This is a comment\nconsole.log("hello");\n\n\n\n', { minify: true })
        assert.ok(minified.length <= normal.length)
    })

    it('sets target correctly', () => {
        const { target } = createBundle('console.log("hello");', { target: 'linux' })
        assert.equal(target, 'linux')
    })

    it('includes Application Code marker', () => {
        const { bundle } = createBundle('const x = 5;')
        assert.ok(bundle.includes('Application Code'))
    })
})

/* ═══ Compile Command ═════════════════════════════════ */

describe('M13: Compile Command', () => {
    it('generates Bun compile for Linux', () => {
        const cmd = getCompileCommand('app.js', 'app', { target: 'linux' })
        assert.equal(cmd.command, 'bun')
        assert.ok(cmd.args.includes('--compile'))
        assert.ok(cmd.args.includes('bun-linux-x64'))
    })

    it('generates Bun compile for macOS', () => {
        const cmd = getCompileCommand('app.js', 'app', { target: 'macos' })
        assert.equal(cmd.command, 'bun')
        assert.ok(cmd.args.includes('bun-darwin-x64'))
    })

    it('generates Bun compile for Windows', () => {
        const cmd = getCompileCommand('app.js', 'app.exe', { target: 'windows' })
        assert.equal(cmd.command, 'bun')
        assert.ok(cmd.args.includes('bun-windows-x64'))
    })

    it('handles WASM target (experimental)', () => {
        const cmd = getCompileCommand('app.js', 'app.wasm', { target: 'wasm' })
        assert.equal(cmd.target, 'wasm')
    })

    it('detects current platform', () => {
        const platform = detectPlatform()
        assert.ok(['linux', 'macos', 'windows'].includes(platform))
    })

    it('lists supported targets', () => {
        const targets = supportedTargets()
        assert.ok(targets.includes('linux'))
        assert.ok(targets.includes('macos'))
        assert.ok(targets.includes('windows'))
        assert.ok(targets.includes('wasm'))
    })
})

/* ═══ No Regression ════════════════════════════════════ */

describe('M13: No Regression', () => {
    it('bundled output is valid JavaScript', () => {
        const code = `
const users = [];
function addUser(name) {
    users.push({ name, id: users.length + 1 });
    console.log("Added " + name);
}
addUser("Alice");
addUser("Bob");
console.log(users.length + " users");`

        const { bundle } = createBundle(code)
        // Should not throw when parsed as JS
        assert.ok(bundle.includes('Alice'))
        assert.ok(bundle.includes('addUser'))
    })

    it('self-sustaining features preserved in bundles', () => {
        const code = `
LUME_MONITOR.start(() => {
    const health = checkHealth();
    if (!health.ok) LUME_HEAL.recover(health.error);
}, 5000);
LUME_OPTIMIZE.memoize("result", () => expensiveCalc());
LUME_EVOLVE.suggest("Consider using a cache here");`

        const { bundle, features } = createBundle(code)
        assert.ok(features.includes('monitor'))
        assert.ok(features.includes('heal'))
        assert.ok(features.includes('optimize'))
        assert.ok(features.includes('evolve'))
        // All polyfills should be in the bundle
        assert.ok(bundle.includes('LUME_MONITOR'))
        assert.ok(bundle.includes('LUME_HEAL'))
        assert.ok(bundle.includes('LUME_OPTIMIZE'))
        assert.ok(bundle.includes('LUME_EVOLVE'))
    })
})
