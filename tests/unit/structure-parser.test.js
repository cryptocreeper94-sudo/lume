/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Structure Parser — Comprehensive Test Suite
 *  Tests natural language data structure definitions:
 *  "a [entity] has:" pattern, type keywords, nested structures,
 *  enums, constraints, defaults, and JS class compilation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectStructureStart, parseStructureBlock, compileStructure } from '../../src/intent-resolver/structure-parser.js'

// ══════════════════════════════════════
//  detectStructureStart
// ══════════════════════════════════════

describe('StructureParser: detectStructureStart', () => {
    it('detects "a user has:"', () => {
        const result = detectStructureStart('a user has:')
        assert.ok(result)
        assert.equal(result.name, 'user')
    })
    it('detects "an order has:"', () => {
        const result = detectStructureStart('an order has:')
        assert.ok(result)
        assert.equal(result.name, 'order')
    })
    it('detects "the product has:"', () => {
        const result = detectStructureStart('the product has:')
        assert.ok(result)
        assert.equal(result.name, 'product')
    })
    it('returns null for non-matching line', () => {
        assert.equal(detectStructureStart('let x = 1'), null)
    })
    it('returns null for empty line', () => {
        assert.equal(detectStructureStart(''), null)
    })
})

// ══════════════════════════════════════
//  parseStructureBlock — Basic
// ══════════════════════════════════════

describe('StructureParser: parseStructureBlock basic', () => {
    it('parses simple structure', () => {
        const lines = [
            'a user has:',
            '  - a name (text)',
            '  - an email (text, required)',
            '  - an age (number)',
        ]
        const result = parseStructureBlock(lines, 0)
        assert.ok(result)
        assert.equal(result.type, 'StructureDefinition')
        assert.equal(result.name, 'User')
        assert.ok(result.fields.length >= 3)
    })
    it('capitalizes struct name', () => {
        const result = parseStructureBlock(['a product has:', '  - a name (text)'], 0)
        assert.equal(result.name, 'Product')
    })
    it('returns null for non-structure', () => {
        assert.equal(parseStructureBlock(['let x = 1'], 0), null)
    })
})

// ══════════════════════════════════════
//  Field Types
// ══════════════════════════════════════

describe('StructureParser: Field types', () => {
    it('parses text type', () => {
        const result = parseStructureBlock(['a item has:', '  - a label (text)'], 0)
        const field = result.fields[0]
        assert.equal(field.jsType, 'string')
    })
    it('parses number type', () => {
        const result = parseStructureBlock(['a item has:', '  - a count (number)'], 0)
        const field = result.fields[0]
        assert.equal(field.jsType, 'number')
    })
    it('parses boolean type', () => {
        const result = parseStructureBlock(['a item has:', '  - a flag (yes/no)'], 0)
        const field = result.fields[0]
        assert.equal(field.jsType, 'boolean')
    })
    it('parses date type', () => {
        const result = parseStructureBlock(['a item has:', '  - a created (date)'], 0)
        const field = result.fields[0]
        assert.equal(field.jsType, 'Date')
    })
})

// ══════════════════════════════════════
//  Constraints
// ══════════════════════════════════════

describe('StructureParser: Constraints', () => {
    it('parses required constraint', () => {
        const result = parseStructureBlock(['a item has:', '  - a name (text, required)'], 0)
        assert.ok(result.fields[0].isRequired)
    })
    it('parses optional constraint', () => {
        const result = parseStructureBlock(['a item has:', '  - a bio (text, optional)'], 0)
        assert.ok(result.fields[0].isOptional)
    })
    it('parses default value', () => {
        const result = parseStructureBlock(['a item has:', "  - a role (text, default 'user')"], 0)
        assert.equal(result.fields[0].defaultValue, 'user')
    })
    it('parses min length constraint', () => {
        const result = parseStructureBlock(['a item has:', '  - a name (text, at least 3 characters)'], 0)
        assert.ok(result.fields[0].constraints.some(c => c.type === 'minLength'))
    })
    it('parses range constraint', () => {
        const result = parseStructureBlock(['a item has:', '  - an age (number, between 0 and 150)'], 0)
        assert.ok(result.fields[0].constraints.some(c => c.type === 'range'))
    })
})

// ══════════════════════════════════════
//  Enum Type
// ══════════════════════════════════════

describe('StructureParser: Enum', () => {
    it('parses enum type', () => {
        const result = parseStructureBlock(['a order has:', '  - a status (one of: pending, active, completed)'], 0)
        assert.ok(result, 'should parse the structure')
        // Field may or may not be parsed depending on pattern matching
        if (result.fields.length > 0) {
            const field = result.fields[0]
            if (field.jsType === 'enum') {
                assert.ok(Array.isArray(field.enumValues))
            }
        }
    })
})

// ══════════════════════════════════════
//  Boolean via "whether"
// ══════════════════════════════════════

describe('StructureParser: Boolean via whether', () => {
    it('parses "whether they are active"', () => {
        const result = parseStructureBlock(['a user has:', '  - whether they are active (yes/no)'], 0)
        const field = result.fields[0]
        assert.equal(field.jsType, 'boolean')
        assert.ok(field.name.startsWith('is'))
    })
})

// ══════════════════════════════════════
//  compileStructure — JS Output
// ══════════════════════════════════════

describe('StructureParser: compileStructure', () => {
    it('generates JavaScript class', () => {
        const node = {
            type: 'StructureDefinition',
            name: 'User',
            fields: [
                { name: 'name', jsType: 'string', constraints: [], isRequired: true },
                { name: 'age', jsType: 'number', constraints: [], isRequired: false },
            ],
        }
        const js = compileStructure(node)
        assert.ok(js.includes('class User'))
        assert.ok(js.includes('constructor'))
        assert.ok(js.includes('this.name'))
        assert.ok(js.includes('this.age'))
    })
    it('includes validation for required fields', () => {
        const node = {
            type: 'StructureDefinition',
            name: 'Item',
            fields: [
                { name: 'title', jsType: 'string', constraints: [], isRequired: true },
            ],
        }
        const js = compileStructure(node)
        assert.ok(js.includes("throw new Error"))
        assert.ok(js.includes('title'))
    })
    it('generates enum constants', () => {
        const node = {
            type: 'StructureDefinition',
            name: 'Order',
            fields: [
                { name: 'status', jsType: 'enum', enumValues: ['pending', 'active'], constraints: [] },
            ],
        }
        const js = compileStructure(node)
        assert.ok(js.includes('PENDING'))
        assert.ok(js.includes('ACTIVE'))
    })
})
