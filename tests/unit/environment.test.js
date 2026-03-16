/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Environment — Comprehensive Test Suite
 *  Tests environment blocks, env variable references,
 *  feature flags, env checks, and JS compilation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    detectEnvironmentBlock, parseEnvironmentBlock, detectEnvReference,
    detectEnvCheck, detectFeatureFlag, compileEnvironmentBlock,
    compileEnvVariable, compileFeatureCheck
} from '../../src/intent-resolver/environment.js'

// ══════════════════════════════════════
//  detectEnvironmentBlock
// ══════════════════════════════════════

describe('Environment: detectEnvironmentBlock', () => {
    it('detects "in production:"', () => {
        const r = detectEnvironmentBlock('in production:')
        assert.ok(r)
        assert.equal(r.environment, 'production')
    })
    it('detects "in development:"', () => {
        const r = detectEnvironmentBlock('in development:')
        assert.equal(r.environment, 'development')
    })
    it('detects "in staging:"', () => {
        const r = detectEnvironmentBlock('in staging:')
        assert.equal(r.environment, 'staging')
    })
    it('detects "in test:"', () => {
        const r = detectEnvironmentBlock('in testing:')
        assert.equal(r.environment, 'test')
    })
    it('detects shorthand "in prod:"', () => {
        const r = detectEnvironmentBlock('in prod:')
        assert.equal(r.environment, 'production')
    })
    it('returns null for non-env', () => {
        assert.equal(detectEnvironmentBlock('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  parseEnvironmentBlock
// ══════════════════════════════════════

describe('Environment: parseEnvironmentBlock', () => {
    it('parses environment block with body', () => {
        const lines = ['in production:', '  enable caching', '  use CDN']
        const r = parseEnvironmentBlock(lines, 0)
        assert.ok(r)
        assert.equal(r.type, 'EnvironmentBlock')
        assert.equal(r.environment, 'production')
        assert.equal(r.body.length, 2)
    })
    it('returns null for non-env line', () => {
        assert.equal(parseEnvironmentBlock(['let x = 1'], 0), null)
    })
})

// ══════════════════════════════════════
//  detectEnvReference
// ══════════════════════════════════════

describe('Environment: detectEnvReference', () => {
    it('detects "get the database URL from the environment"', () => {
        const r = detectEnvReference('get the database URL from the environment')
        assert.ok(r)
        assert.equal(r.type, 'EnvVariable')
        assert.equal(r.envKey, 'DATABASE_URL')
    })
    it('parses "fail if missing"', () => {
        const r = detectEnvReference('get the api key from the environment, fail if missing')
        assert.ok(r.failIfMissing)
    })
    it('parses default value', () => {
        const r = detectEnvReference('get the port from the environment, default to "3000"')
        assert.equal(r.defaultValue, '3000')
    })
    it('returns null for non-env reference', () => {
        assert.equal(detectEnvReference('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  detectEnvCheck
// ══════════════════════════════════════

describe('Environment: detectEnvCheck', () => {
    it('detects "if we\'re in production"', () => {
        const r = detectEnvCheck("if we're in production")
        assert.ok(r)
        assert.equal(r.environment, 'production')
    })
    it('detects "the environment is development"', () => {
        const r = detectEnvCheck('the environment is development')
        assert.ok(r)
        assert.equal(r.environment, 'development')
    })
    it('returns null for non-env check', () => {
        assert.equal(detectEnvCheck('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  detectFeatureFlag
// ══════════════════════════════════════

describe('Environment: detectFeatureFlag', () => {
    it('detects feature flag check', () => {
        const r = detectFeatureFlag('if the dark mode feature is enabled:')
        assert.ok(r)
        assert.equal(r.type, 'FeatureCheck')
        assert.equal(r.featureName, 'dark mode')
        assert.equal(r.envKey, 'FEATURE_DARK_MODE')
    })
    it('returns null for non-feature', () => {
        assert.equal(detectFeatureFlag('let x = 1'), null)
    })
})

// ══════════════════════════════════════
//  Compile Functions
// ══════════════════════════════════════

describe('Environment: compileEnvironmentBlock', () => {
    it('generates process.env check', () => {
        const js = compileEnvironmentBlock({ environment: 'production', body: ['enable caching'] })
        assert.ok(js.includes('process.env.NODE_ENV'))
        assert.ok(js.includes('production'))
    })
    it('generates unconditional for wildcard', () => {
        const js = compileEnvironmentBlock({ environment: '*', body: ['log version'] })
        assert.ok(!js.includes('process.env'))
    })
})

describe('Environment: compileEnvVariable', () => {
    it('generates process.env access', () => {
        const js = compileEnvVariable({ name: 'api key', envKey: 'API_KEY', defaultValue: null, failIfMissing: false })
        assert.ok(js.includes('process.env.API_KEY'))
    })
    it('includes default value', () => {
        const js = compileEnvVariable({ name: 'port', envKey: 'PORT', defaultValue: '3000', failIfMissing: false })
        assert.ok(js.includes('3000'))
    })
    it('includes fail check when required', () => {
        const js = compileEnvVariable({ name: 'secret', envKey: 'SECRET', defaultValue: null, failIfMissing: true })
        assert.ok(js.includes('throw'))
    })
})

describe('Environment: compileFeatureCheck', () => {
    it('generates feature flag check', () => {
        const js = compileFeatureCheck({ envKey: 'FEATURE_DARK_MODE' }, ['enable dark theme'])
        assert.ok(js.includes('FEATURE_DARK_MODE'))
        assert.ok(js.includes('true'))
    })
})
