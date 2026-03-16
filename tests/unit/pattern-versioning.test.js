/**
 * Lume Pattern Versioning — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PATTERN_LIBRARY_VERSION, parseVersionDeclaration, semverCompare, classifyChange, diffVersions, migrateFile, formatUpgradeReport, getAvailableVersions } from '../../src/intent-resolver/pattern-versioning.js'

describe('PatternVersioning: PATTERN_LIBRARY_VERSION', () => {
    it('is a semver string', () => { assert.ok(/^\d+\.\d+\.\d+$/.test(PATTERN_LIBRARY_VERSION)) })
})

describe('PatternVersioning: parseVersionDeclaration', () => {
    it('parses "patterns: 1.0"', () => { assert.equal(parseVersionDeclaration('patterns: 1.0\nlet x = 1'), '1.0') })
    it('parses "patterns: 1.1.0"', () => { assert.equal(parseVersionDeclaration('patterns: 1.1.0\ncode'), '1.1.0') })
    it('returns null when missing', () => { assert.equal(parseVersionDeclaration('let x = 1\nshow x'), null) })
})

describe('PatternVersioning: semverCompare', () => {
    it('equal versions', () => { assert.equal(semverCompare('1.0.0', '1.0.0'), 0) })
    it('a < b', () => { assert.equal(semverCompare('1.0.0', '1.1.0'), -1) })
    it('a > b', () => { assert.equal(semverCompare('2.0.0', '1.9.9'), 1) })
    it('patch comparison', () => { assert.equal(semverCompare('1.0.1', '1.0.2'), -1) })
})

describe('PatternVersioning: classifyChange', () => {
    it('major change', () => { assert.equal(classifyChange('1.0.0', '2.0.0'), 'major') })
    it('minor change', () => { assert.equal(classifyChange('1.0.0', '1.1.0'), 'minor') })
    it('patch change', () => { assert.equal(classifyChange('1.0.0', '1.0.1'), 'patch') })
})

describe('PatternVersioning: diffVersions', () => {
    it('diffs 1.0.0 → 1.1.0', () => { const r = diffVersions('1.0.0', '1.1.0'); assert.equal(r.changeType, 'minor'); assert.ok(r.newPatterns.length > 0) })
    it('returns error for unknown version', () => { const r = diffVersions('1.0.0', '99.0.0'); assert.ok(r.error) })
    it('includes deprecated patterns', () => { const r = diffVersions('1.0.0', '1.1.0'); assert.ok(r.deprecatedPatterns.length > 0) })
    it('safeToAutoUpdate for minor', () => { const r = diffVersions('1.0.0', '1.1.0'); assert.ok(r.safeToAutoUpdate) })
})

describe('PatternVersioning: migrateFile', () => {
    it('replaces deprecated patterns', () => {
        const diff = { deprecatedPatterns: [{ pattern: 'grab', replacement: 'get' }] }
        const result = migrateFile('grab the user data', diff)
        assert.ok(result.includes('get'))
        assert.ok(!result.includes('grab'))
    })
})

describe('PatternVersioning: formatUpgradeReport', () => {
    it('formats report string', () => {
        const diff = { from: '1.0.0', to: '1.1.0', changeType: 'minor', newPatterns: [{ pattern: 'test', node: 'TestBlock' }], changedResolutions: {}, deprecatedPatterns: [] }
        const report = formatUpgradeReport(diff, null)
        assert.ok(report.includes('1.0.0'))
        assert.ok(report.includes('1.1.0'))
    })
})

describe('PatternVersioning: getAvailableVersions', () => {
    it('returns sorted array', () => { const versions = getAvailableVersions(); assert.ok(versions.length >= 2) })
})
