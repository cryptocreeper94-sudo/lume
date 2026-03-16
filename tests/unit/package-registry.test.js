/**
 * Lume Package Registry — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PACKAGE_REGISTRY, detectPackageReference, recognizePackage, generateImport, getPackageContext, formatMissingPackageError, formatPackagePrompt, formatUnknownPackagePrompt } from '../../src/intent-resolver/package-registry.js'

describe('PackageRegistry: PACKAGE_REGISTRY', () => {
    it('has 20+ packages', () => { assert.ok(Object.keys(PACKAGE_REGISTRY).length >= 20) })
    it('express has capabilities', () => { assert.ok(PACKAGE_REGISTRY.express.capabilities.length > 0) })
    it('each has npm field', () => { Object.values(PACKAGE_REGISTRY).forEach(p => assert.ok(p.npm)) })
    it('each has importStyle', () => { Object.values(PACKAGE_REGISTRY).forEach(p => assert.ok(p.importStyle)) })
})

describe('PackageRegistry: detectPackageReference', () => {
    it('detects "use Express to create a server"', () => { const r = detectPackageReference('use Express to create a web server'); assert.ok(r); assert.equal(r.packageName, 'Express') })
    it('extracts instruction', () => { const r = detectPackageReference('use Lodash to sort the list'); assert.equal(r.instruction, 'sort the list') })
    it('returns null for non-use line', () => { assert.equal(detectPackageReference('show the data'), null) })
})

describe('PackageRegistry: recognizePackage', () => {
    it('recognizes by direct name', () => { const r = recognizePackage('express'); assert.ok(r); assert.equal(r.key, 'express') })
    it('recognizes by alias', () => { const r = recognizePackage('JWT'); assert.ok(r); assert.equal(r.key, 'jsonwebtoken') })
    it('recognizes by capability', () => { const r = recognizePackage('web scraping'); assert.ok(r) })
    it('returns null for unknown', () => { assert.equal(recognizePackage('nonexistent-pkg-xyz'), null) })
    it('case insensitive', () => { assert.ok(recognizePackage('Express')) })
})

describe('PackageRegistry: generateImport', () => {
    it('generates ESM import', () => { const r = generateImport(PACKAGE_REGISTRY.express, 'esm'); assert.ok(r.includes('import')) })
    it('generates CJS require', () => { const r = generateImport(PACKAGE_REGISTRY.express, 'cjs'); assert.ok(r.includes('require')) })
})

describe('PackageRegistry: getPackageContext', () => {
    it('returns context hint', () => { const r = getPackageContext('express', 'create a web server'); assert.ok(r); assert.ok(r.code) })
    it('returns null for no match', () => { assert.equal(getPackageContext('express', 'fly to the moon'), null) })
})

describe('PackageRegistry: formatMissingPackageError', () => {
    it('returns LUME-E060', () => { const r = formatMissingPackageError('Express', 'express', 5); assert.equal(r.code, 'LUME-E060') })
    it('includes suggestion', () => { assert.ok(formatMissingPackageError('X', 'x', 1).suggestion.includes('npm install')) })
})

describe('PackageRegistry: formatPackagePrompt', () => {
    it('includes package name', () => { assert.ok(formatPackagePrompt('Express', 'express').includes('Express')) })
})

describe('PackageRegistry: formatUnknownPackagePrompt', () => {
    it('includes name', () => { assert.ok(formatUnknownPackagePrompt('FooBar').includes('FooBar')) })
    it('has 4 options', () => { const r = formatUnknownPackagePrompt('test'); assert.ok(r.includes('4.')) })
})
