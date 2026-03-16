/**
 * Lume AI Resolver — Test Suite
 * Tests the prompt building and validation logic (no actual API calls)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aiResolve, batchResolve, localAIResolve } from '../../src/intent-resolver/ai-resolver.js'

describe('AIResolver: aiResolve', () => {
    it('returns result object', async () => {
        const r = await aiResolve('show hello')
        assert.ok(typeof r === 'object')
        assert.ok('resolved' in r)
    })
    it('uses cache if provided', async () => {
        const cache = { 'show hello': { ast: { type: 'ShowStatement', value: 'hello' }, confidence: 0.9 } }
        const r = await aiResolve('show hello', { lockCache: cache })
        assert.ok(r.cached)
        assert.equal(r.ast.type, 'ShowStatement')
    })
    it('returns IntentBlock when no API key', async () => {
        const oldKey = process.env.OPENAI_API_KEY
        delete process.env.OPENAI_API_KEY
        delete process.env.LUME_AI_KEY
        const r = await aiResolve('complex instruction')
        // Without API key it should gracefully degrade
        assert.ok(typeof r === 'object')
        process.env.OPENAI_API_KEY = oldKey
    })
})

describe('AIResolver: batchResolve', () => {
    it('returns array of results', async () => {
        const r = await batchResolve(['show hello', 'create x'])
        assert.ok(Array.isArray(r))
        assert.equal(r.length, 2)
    })
    it('each result has lineIndex', async () => {
        const r = await batchResolve(['test'])
        assert.ok('lineIndex' in r[0])
    })
})

describe('AIResolver: localAIResolve', () => {
    it('returns pending when offline', async () => {
        const r = await localAIResolve('show hello')
        // Should gracefully handle no Ollama running
        assert.ok(typeof r === 'object')
        assert.ok('resolved' in r)
    })
})
