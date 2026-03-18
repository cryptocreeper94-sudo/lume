/**
 * ═══════════════════════════════════════════════════════════
 *  Resolution Manifest — CHI §8.2 Test Suite
 *  Tests lume-lock.json generation, lookup, recording,
 *  integrity verification, and tamper detection.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { ResolutionManifest, verifyManifestCLI } from '../../src/intent-resolver/resolution-manifest.js'

let tmpDir

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lume-manifest-test-'))
})

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ══════════════════════════════════════
//  Basic Operations
// ══════════════════════════════════════

describe('ResolutionManifest: Basics', () => {
    it('creates a manifest instance', () => {
        const m = new ResolutionManifest(tmpDir)
        assert.ok(m)
        assert.equal(m.entries.size, 0)
    })

    it('records a resolution entry', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('get all users', { type: 'QueryOperation', target: 'users' }, 'layer_a_exact', 1.0)
        assert.equal(m.entries.size, 1)
    })

    it('looks up a recorded entry', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('show the greeting', { type: 'ShowStatement', target: 'greeting' }, 'layer_a_exact', 1.0)
        const result = m.lookup('show the greeting')
        assert.ok(result)
        assert.equal(result.cached, true)
        assert.equal(result.resolvedBy, 'manifest_cache')
        assert.equal(result.originalResolvedBy, 'layer_a_exact')
    })

    it('returns null for unknown entries', () => {
        const m = new ResolutionManifest(tmpDir)
        const result = m.lookup('something unknown')
        assert.equal(result, null)
    })

    it('normalizes source text for lookup', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('GET ALL USERS', { type: 'QueryOperation' }, 'layer_a_exact', 1.0)
        const result = m.lookup('get all users')
        assert.ok(result, 'should match case-insensitively')
    })
})

// ══════════════════════════════════════
//  Persistence
// ══════════════════════════════════════

describe('ResolutionManifest: Persistence', () => {
    it('saves to disk', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('test line', { type: 'ShowStatement' }, 'layer_a_exact', 1.0)
        m.save()
        const lockPath = path.join(tmpDir, '.lume', 'lume-lock.json')
        assert.ok(fs.existsSync(lockPath), 'lume-lock.json should exist')
    })

    it('loads from disk', () => {
        const m1 = new ResolutionManifest(tmpDir)
        m1.record('get users', { type: 'QueryOperation', target: 'users' }, 'layer_a_exact', 1.0)
        m1.record('show data', { type: 'ShowStatement', target: 'data' }, 'layer_a_fuzzy', 0.92)
        m1.save()

        const m2 = new ResolutionManifest(tmpDir)
        assert.equal(m2.entries.size, 2)
        const result = m2.lookup('get users')
        assert.ok(result)
        assert.equal(result.originalResolvedBy, 'layer_a_exact')
    })

    it('saves metadata with stats', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('get users', { type: 'QueryOperation' }, 'layer_a_exact', 1.0)
        m.record('show data', { type: 'ShowStatement' }, 'layer_a_fuzzy', 0.9)
        m.save()

        const lockPath = path.join(tmpDir, '.lume', 'lume-lock.json')
        const raw = JSON.parse(fs.readFileSync(lockPath, 'utf-8'))
        assert.equal(raw.metadata.totalResolutions, 2)
        assert.ok(raw.metadata.layerDistribution.layer_a_exact)
    })
})

// ══════════════════════════════════════
//  Integrity Verification
// ══════════════════════════════════════

describe('ResolutionManifest: Integrity', () => {
    it('verification passes on clean manifest', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('get users', { type: 'QueryOperation' }, 'layer_a_exact', 1.0)
        m.save()
        const result = m.verify()
        assert.ok(result.valid)
        assert.equal(result.errors.length, 0)
    })

    it('detects tampered entries', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('get users', { type: 'QueryOperation' }, 'layer_a_exact', 1.0)
        m.save()

        // Tamper with the file
        const lockPath = path.join(tmpDir, '.lume', 'lume-lock.json')
        const raw = JSON.parse(fs.readFileSync(lockPath, 'utf-8'))
        raw.entries[0].confidence = 0.5  // tamper
        fs.writeFileSync(lockPath, JSON.stringify(raw))

        const m2 = new ResolutionManifest(tmpDir)
        const result = m2.verify()
        assert.ok(!result.valid)
        assert.ok(result.errors.length > 0)
    })

    it('rejects tampered lookup', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('show data', { type: 'ShowStatement' }, 'layer_a_exact', 1.0)
        m.save()

        // Tamper with integrity hash
        const lockPath = path.join(tmpDir, '.lume', 'lume-lock.json')
        const raw = JSON.parse(fs.readFileSync(lockPath, 'utf-8'))
        raw.entries[0].integrityHash = 'tampered'
        fs.writeFileSync(lockPath, JSON.stringify(raw))

        const m2 = new ResolutionManifest(tmpDir)
        const result = m2.lookup('show data')
        assert.equal(result, null, 'tampered entry should be rejected')
    })
})

// ══════════════════════════════════════
//  Stats
// ══════════════════════════════════════

describe('ResolutionManifest: Stats', () => {
    it('returns correct stats', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('get users', { type: 'QueryOperation' }, 'layer_a_exact', 1.0)
        m.record('show data', { type: 'ShowStatement' }, 'layer_a_fuzzy', 0.85)
        m.record('delete x', { type: 'DeleteOperation' }, 'layer_a_exact', 1.0)
        const stats = m.getStats()
        assert.equal(stats.totalEntries, 3)
        assert.equal(stats.layerDistribution.layer_a_exact, 2)
        assert.equal(stats.layerDistribution.layer_a_fuzzy, 1)
        assert.ok(stats.averageConfidence > 0.9)
    })

    it('clear() empties all entries', () => {
        const m = new ResolutionManifest(tmpDir)
        m.record('test', { type: 'ShowStatement' }, 'layer_a_exact', 1.0)
        m.clear()
        assert.equal(m.entries.size, 0)
    })
})
