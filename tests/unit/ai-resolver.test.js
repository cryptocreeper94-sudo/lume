import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aiResolve, batchResolve } from '../../src/intent-resolver/ai-resolver.js'

describe('AIResolver (Layer B Fallback Execution)', () => {
    it('returns unresolved IntentBlock AST when API key is missing rather than halting', async () => {
        let oldKey, oldLumeKey
        if (process.env.OPENAI_API_KEY) { oldKey = process.env.OPENAI_API_KEY; delete process.env.OPENAI_API_KEY; }
        if (process.env.LUME_AI_KEY) { oldLumeKey = process.env.LUME_AI_KEY; delete process.env.LUME_AI_KEY; }
        
        // Ensure no API keys are present dynamically
        process.env.OPENAI_API_KEY = ''
        process.env.LUME_AI_KEY = ''
        
        const r = await aiResolve('do some complex ai stuff')
        
        // Assert Deep AST Correctness explicitly
        assert.equal(r.resolved, true, 'Graceful degradation should still map to a valid AST envelope')
        assert.equal(r.ast.type, 'IntentBlock', 'Fallback must yield an IntentBlock node')
        assert.equal(r.ast.intent, 'unresolved', 'Fallback block must be flagged as unresolved')
        
        if (oldKey !== undefined) process.env.OPENAI_API_KEY = oldKey
        if (oldLumeKey !== undefined) process.env.LUME_AI_KEY = oldLumeKey
    })

    it('immediately throws an explicit compilation error when --strict-english is enabled', async () => {
        const r = await aiResolve('do some complex ai stuff', { strict: true })
        
        assert.equal(r.resolved, false, 'Strict mode must refuse to map unknown inputs entirely')
        assert.equal(r.error, 'Strict mode: Layer A pattern match failed.', 'Strict mode must emit the correct terminal failure sequence')
        assert.equal(r.confidence, 0, 'Rejected queries possess zero deterministic confidence')
    })

    it('bypasses AI resolution entirely when explicitly matching a deterministic Compile Lock cache map', async () => {
        const cache = { 
            'show hello connected world': { 
                ast: { type: 'ShowStatement', value: { type: 'StringLiteral', value: 'hello connected world' } }, 
                confidence: 0.99 
            } 
        }
        
        const r = await aiResolve('show hello connected world', { lockCache: cache })
        
        // Structural validation checking exact sub-branches
        assert.equal(r.cached, true, 'Resolving loop must hit the external compile lock configuration')
        assert.equal(r.ast.type, 'ShowStatement', 'AST wrapper block must strictly map downward from the locked cache payload')
        assert.equal(r.ast.value.value, 'hello connected world', 'AST dynamic literal branch must correctly reflect the pre-cached value state')
        assert.equal(r.confidence, 0.99, 'Bypassed locks should map the exact cached original confidence metrics')
    })
    
    it('strictly flags overarching batch-level resolutions with compilation blocks under strict protocols', async () => {
        const results = await batchResolve(['do something random mapped via batch'], { strict: true })
        assert.equal(results.length, 1)
        assert.equal(results[0].resolved, false)
        assert.match(results[0].error, /Strict mode: Layer A pattern match failed/)
    })
})
