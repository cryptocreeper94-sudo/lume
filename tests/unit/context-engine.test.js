/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Context Engine — Comprehensive Test Suite
 *  Tests context tracking, variable/model/function registration,
 *  short-term memory, pronoun resolution, dependency graph,
 *  and AI context generation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
    resetFileScope, registerVariable, registerDataModel,
    registerFunction, updateMemory, resolvePronoun,
    getDependents, getAIContext, getAutocorrectContext, context
} from '../../src/intent-resolver/context-engine.js'

// Reset context before each test group
beforeEach(() => {
    resetFileScope()
})

// ══════════════════════════════════════
//  Register Variable
// ══════════════════════════════════════

describe('ContextEngine: registerVariable', () => {
    it('adds variable to file scope', () => {
        resetFileScope()
        registerVariable('name', 'text', 1)
        assert.ok(context.fileScope.variables.some(v => v.name === 'name'))
    })
    it('adds variable to project-level list', () => {
        resetFileScope()
        registerVariable('count', 'number', 2)
        assert.ok(context.variables.includes('count'))
    })
    it('does not duplicate project-level variables', () => {
        resetFileScope()
        registerVariable('x', 'number', 1)
        registerVariable('x', 'number', 5)
        const xCount = context.variables.filter(v => v === 'x').length
        assert.equal(xCount, 1)
    })
    it('stores type information', () => {
        resetFileScope()
        registerVariable('age', 'number', 3)
        const v = context.fileScope.variables.find(v => v.name === 'age')
        assert.equal(v.type, 'number')
    })
    it('stores line number', () => {
        resetFileScope()
        registerVariable('msg', 'text', 10)
        const v = context.fileScope.variables.find(v => v.name === 'msg')
        assert.equal(v.line, 10)
    })
})

// ══════════════════════════════════════
//  Register Data Model
// ══════════════════════════════════════

describe('ContextEngine: registerDataModel', () => {
    it('adds model to dataModels', () => {
        resetFileScope()
        registerDataModel('users', ['name', 'email'])
        assert.ok(context.dataModels['users'])
        assert.deepEqual(context.dataModels['users'].fields, ['name', 'email'])
    })
    it('adds model name to tables list', () => {
        resetFileScope()
        registerDataModel('posts', ['title', 'body'])
        assert.ok(context.tables.includes('posts'))
    })
    it('does not duplicate table names', () => {
        resetFileScope()
        registerDataModel('users', ['name'])
        registerDataModel('users', ['name', 'email'])
        const count = context.tables.filter(t => t === 'users').length
        assert.equal(count, 1)
    })
})

// ══════════════════════════════════════
//  Register Function
// ══════════════════════════════════════

describe('ContextEngine: registerFunction', () => {
    it('adds function name', () => {
        resetFileScope()
        registerFunction('calculate_total', ['items'])
        assert.ok(context.functions.includes('calculate_total'))
    })
    it('does not duplicate', () => {
        resetFileScope()
        registerFunction('greet')
        registerFunction('greet')
        const count = context.functions.filter(f => f === 'greet').length
        assert.equal(count, 1)
    })
})

// ══════════════════════════════════════
//  Short-Term Memory
// ══════════════════════════════════════

describe('ContextEngine: updateMemory', () => {
    it('sets lastSubject', () => {
        resetFileScope()
        updateMemory(1, 'users', 'get', { type: 'VariableAccess' })
        assert.equal(context.memory.lastSubject, 'users')
    })
    it('sets lastAction', () => {
        resetFileScope()
        updateMemory(1, 'users', 'get', { type: 'VariableAccess' })
        assert.equal(context.memory.lastAction, 'get')
    })
    it('pushes to history', () => {
        resetFileScope()
        updateMemory(1, 'users', 'get', { type: 'VariableAccess' })
        assert.equal(context.memory.history.length, 1)
        assert.equal(context.memory.history[0].subject, 'users')
    })
    it('updates file references', () => {
        resetFileScope()
        updateMemory(5, 'config', 'load', { type: 'VariableAccess' })
        assert.ok(context.fileScope.references.some(r => r.name === 'config'))
    })
    it('sets lastValue in fileScope', () => {
        resetFileScope()
        const result = { type: 'VariableAccess' }
        updateMemory(1, 'x', 'get', result)
        assert.equal(context.fileScope.lastValue, result)
    })
})

// ══════════════════════════════════════
//  Pronoun Resolution
// ══════════════════════════════════════

describe('ContextEngine: resolvePronoun', () => {
    it('resolves "it" to last subject', () => {
        resetFileScope()
        updateMemory(1, 'users', 'get', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 2)
        assert.ok(result.resolved)
        assert.equal(result.value, 'users')
    })
    it('resolves "this" to last subject', () => {
        resetFileScope()
        updateMemory(1, 'config', 'load', { type: 'VariableAccess' })
        const result = resolvePronoun('this', 2)
        assert.ok(result.resolved)
        assert.equal(result.value, 'config')
    })
    it('resolves "that" to last subject', () => {
        resetFileScope()
        updateMemory(1, 'report', 'generate', null)
        const result = resolvePronoun('that', 3)
        assert.ok(result.resolved)
        assert.equal(result.value, 'report')
    })
    it('resolves "they" to last subject', () => {
        resetFileScope()
        updateMemory(1, 'items', 'filter', null)
        const result = resolvePronoun('they', 2)
        assert.ok(result.resolved)
        assert.equal(result.value, 'items')
    })
    it('resolves "them" to last subject', () => {
        resetFileScope()
        updateMemory(1, 'records', 'sort', null)
        const result = resolvePronoun('them', 2)
        assert.ok(result.resolved)
    })
    it('warns when no referent exists for "it"', () => {
        resetFileScope()
        const result = resolvePronoun('it', 1)
        assert.equal(result.resolved, false)
        assert.ok(result.warning)
        assert.ok(result.warning.includes('LUME-W003'))
    })
    it('warns when referent is far away', () => {
        resetFileScope()
        updateMemory(1, 'data', 'get', null)
        const result = resolvePronoun('it', 30) // 29 lines later
        assert.ok(result.resolved)
        assert.ok(result.warning)
        assert.ok(result.warning.includes('LUME-W002'))
    })
    it('returns unresolved for unknown pronoun', () => {
        resetFileScope()
        const result = resolvePronoun('zebra', 1)
        assert.equal(result.resolved, false)
    })
})

// ══════════════════════════════════════
//  Reset File Scope
// ══════════════════════════════════════

describe('ContextEngine: resetFileScope', () => {
    it('clears file-level variables', () => {
        registerVariable('x', 'number', 1)
        resetFileScope()
        assert.equal(context.fileScope.variables.length, 0)
    })
    it('clears memory', () => {
        updateMemory(1, 'test', 'get', null)
        resetFileScope()
        assert.equal(context.memory.lastSubject, null)
        assert.equal(context.memory.history.length, 0)
    })
    it('clears references', () => {
        updateMemory(1, 'x', 'set', null)
        resetFileScope()
        assert.equal(context.fileScope.references.length, 0)
    })
})

// ══════════════════════════════════════
//  Dependency Graph
// ══════════════════════════════════════

describe('ContextEngine: getDependents', () => {
    it('returns empty for no dependents', () => {
        resetFileScope()
        updateMemory(1, 'x', 'set', null)
        const deps = getDependents(5)
        assert.deepEqual(deps, [])
    })
    it('finds dependents on the same subject', () => {
        resetFileScope()
        updateMemory(1, 'users', 'get', { type: 'VariableAccess' })
        updateMemory(3, 'users', 'show', { type: 'ShowStatement' })
        const deps = getDependents(1)
        assert.ok(deps.length >= 1)
    })
})

// ══════════════════════════════════════
//  AI Context / Autocorrect Context
// ══════════════════════════════════════

describe('ContextEngine: getAIContext', () => {
    it('returns dataModels', () => {
        resetFileScope()
        registerDataModel('users', ['id'])
        const ctx = getAIContext()
        assert.ok(ctx.dataModels)
        assert.ok(ctx.dataModels.users)
    })
    it('returns tables', () => {
        resetFileScope()
        registerDataModel('posts', ['title'])
        const ctx = getAIContext()
        assert.ok(ctx.tables.includes('posts'))
    })
    it('returns functions', () => {
        resetFileScope()
        registerFunction('greet')
        const ctx = getAIContext()
        assert.ok(ctx.functions.includes('greet'))
    })
    it('returns currentVariables', () => {
        resetFileScope()
        registerVariable('x', 'number', 1)
        const ctx = getAIContext()
        assert.ok(ctx.currentVariables.some(v => v.name === 'x'))
    })
    it('returns recentHistory up to 10', () => {
        resetFileScope()
        for (let i = 0; i < 15; i++) {
            updateMemory(i, `var${i}`, 'set', null)
        }
        const ctx = getAIContext()
        assert.ok(ctx.recentHistory.length <= 10)
    })
})

describe('ContextEngine: getAutocorrectContext', () => {
    it('returns variables list', () => {
        resetFileScope()
        registerVariable('count', 'number', 1)
        const ctx = getAutocorrectContext()
        assert.ok(ctx.variables.includes('count'))
    })
    it('returns tables list', () => {
        resetFileScope()
        registerDataModel('users', ['id'])
        const ctx = getAutocorrectContext()
        assert.ok(ctx.tables.includes('users'))
    })
    it('returns functions list', () => {
        resetFileScope()
        registerFunction('calc')
        const ctx = getAutocorrectContext()
        assert.ok(ctx.functions.includes('calc'))
    })
})
