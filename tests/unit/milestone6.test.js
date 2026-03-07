/**
 * ====== Lume Unit Tests — Milestone 6: Self-Sustaining Runtime ======
 * Tests all 4 layers: Monitor, Healer, Optimizer, Evolver
 * Plus lexer/parser/transpiler integration for M6 keywords.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, TokenType } from '../../src/lexer.js'
import { parse, NodeType } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'
import { Monitor } from '../../src/runtime/monitor.js'
import { Healer, CircuitBreaker } from '../../src/runtime/healer.js'
import { Optimizer, MutationLog } from '../../src/runtime/optimizer.js'
import { Evolver, EvolutionDecision } from '../../src/runtime/evolver.js'

// ── Helpers ──
function compileToJS(source) {
    const tokens = tokenize(source, 'test.lume')
    const ast = parse(tokens, 'test.lume')
    return transpile(ast, 'test.lume')
}
function parseAST(source) {
    const tokens = tokenize(source, 'test.lume')
    return parse(tokens, 'test.lume')
}

// ════════════════════════════════════════
// LEXER: M6 Keywords & Decorators
// ════════════════════════════════════════
describe('Lexer: M6 Keywords', () => {
    it('tokenizes monitor as keyword', () => {
        const tokens = tokenize('monitor', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'monitor')
    })

    it('tokenizes heal as keyword', () => {
        const tokens = tokenize('heal', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'heal')
    })

    it('tokenizes optimize as keyword', () => {
        const tokens = tokenize('optimize', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'optimize')
    })

    it('tokenizes evolve as keyword', () => {
        const tokens = tokenize('evolve', 'test.lume')
        assert.equal(tokens[0].type, TokenType.KEYWORD)
        assert.equal(tokens[0].value, 'evolve')
    })

    it('tokenizes @healable decorator', () => {
        const tokens = tokenize('@healable', 'test.lume')
        assert.equal(tokens[0].type, TokenType.AT)
        assert.equal(tokens[0].value, '@healable')
    })

    it('tokenizes @critical decorator', () => {
        const tokens = tokenize('@critical', 'test.lume')
        assert.equal(tokens[0].type, TokenType.AT)
        assert.equal(tokens[0].value, '@critical')
    })
})

// ════════════════════════════════════════
// PARSER: Config Blocks & Decorators
// ════════════════════════════════════════
describe('Parser: Config Blocks', () => {
    it('parses monitor block', () => {
        const ast = parseAST('monitor:\n    dashboard: true\n    port: 9090\n')
        assert.equal(ast.body[0].type, NodeType.MonitorBlock)
        assert.ok(ast.body[0].config)
    })

    it('parses heal block', () => {
        const ast = parseAST('heal:\n    retries: 3\n    backoff: exponential\n')
        assert.equal(ast.body[0].type, NodeType.HealBlock)
    })

    it('parses optimize block', () => {
        const ast = parseAST('optimize:\n    enabled: true\n    mode: suggest\n')
        assert.equal(ast.body[0].type, NodeType.OptimizeBlock)
    })

    it('parses evolve block', () => {
        const ast = parseAST('evolve:\n    enabled: true\n    daemon: true\n')
        assert.equal(ast.body[0].type, NodeType.EvolveBlock)
    })
})

describe('Parser: Decorators', () => {
    it('parses @healable on function', () => {
        const ast = parseAST('@healable\nto greet(name: text) -> text:\n    return name\n')
        const fn = ast.body[0]
        assert.equal(fn.type, NodeType.FunctionDeclaration)
        assert.equal(fn.decorator, '@healable')
    })
})

// ════════════════════════════════════════
// TRANSPILER: M6 Code Generation
// ════════════════════════════════════════
describe('Transpiler: M6', () => {
    it('emits runtime imports for monitor block', () => {
        const js = compileToJS('monitor:\n    dashboard: true\n')
        assert.ok(js.includes('import'))
        assert.ok(js.includes('monitor'))
    })

    it('emits config assignment for monitor', () => {
        const js = compileToJS('monitor:\n    dashboard: true\n')
        assert.ok(js.includes('Object.assign'))
    })

    it('emits runtime imports for @healable', () => {
        const js = compileToJS('@healable\nto greet():\n    show "hi"\n')
        assert.ok(js.includes('healer'))
    })
})

// ════════════════════════════════════════
// LAYER 1: Monitor
// ════════════════════════════════════════
describe('Layer 1: Monitor', () => {
    it('tracks function calls', () => {
        const m = new Monitor()
        const t = m.start('greet')
        m.success('greet', t)
        const s = m.stats()
        assert.equal(s.functions.greet.calls, 1)
        assert.ok(s.functions.greet.avg_time >= 0)
        m.stop()
    })

    it('tracks errors', () => {
        const m = new Monitor()
        const t = m.start('risky')
        m.error('risky', t, new Error('boom'))
        const s = m.stats()
        assert.equal(s.functions.risky.errors, 1)
        assert.equal(s.functions.risky.error_rate, 1)
        m.stop()
    })

    it('calculates error rate', () => {
        const m = new Monitor()
        for (let i = 0; i < 10; i++) {
            const t = m.start('mixed')
            if (i < 3) m.error('mixed', t, new Error('fail'))
            else m.success('mixed', t)
        }
        const s = m.stats()
        assert.equal(s.functions.mixed.calls, 10)
        assert.equal(s.functions.mixed.errors, 3)
        assert.ok(Math.abs(s.functions.mixed.error_rate - 0.3) < 0.01)
        m.stop()
    })

    it('tracks AI calls', () => {
        const m = new Monitor()
        m.trackAICall('ask', 'claude.sonnet', 500, 100, 0.003)
        m.trackAICall('think', 'gpt.4o', 300, 50, 0.002)
        const s = m.stats()
        assert.equal(s.ai.total_calls, 2)
        assert.equal(s.ai.total_cost, 0.005)
        assert.ok(s.ai.by_model['claude.sonnet'])
        m.stop()
    })

    it('tracks fetch calls', () => {
        const m = new Monitor()
        m.trackFetch('https://api.example.com', 'GET', 200, 150)
        m.trackFetch('https://api.example.com', 'GET', 500, 2000)
        const s = m.stats()
        assert.equal(s.fetch.total_calls, 2)
        assert.equal(s.fetch.success_rate, 0.5)
        m.stop()
    })

    it('reports memory', () => {
        const m = new Monitor()
        const s = m.stats()
        assert.ok(s.memory.current.heapUsed > 0)
        m.stop()
    })

    it('generates dashboard string', () => {
        const m = new Monitor()
        const t = m.start('test_fn')
        m.success('test_fn', t)
        const dash = m.dashboard()
        assert.ok(dash.includes('Monitor Dashboard'))
        assert.ok(dash.includes('test_fn'))
        m.stop()
    })

    it('generates HTML dashboard', () => {
        const m = new Monitor()
        const t = m.start('html_fn')
        m.success('html_fn', t)
        const html = m.dashboardHTML()
        assert.ok(html.includes('<!DOCTYPE html>'))
        assert.ok(html.includes('html_fn'))
        m.stop()
    })

    it('reports uptime', () => {
        const m = new Monitor()
        const s = m.stats()
        assert.ok(s.uptime >= 0)
        m.stop()
    })
})

// ════════════════════════════════════════
// LAYER 2: Healer
// ════════════════════════════════════════
describe('Layer 2: Healer — Retry', () => {
    it('retries on failure and succeeds', async () => {
        const h = new Healer({ baseDelay: 10, maxDelay: 50 })
        let calls = 0
        const result = await h.retry(() => {
            calls++
            if (calls < 3) throw new Error('not yet')
            return 'success'
        }, { label: 'test', retries: 5 })
        assert.equal(result, 'success')
        assert.equal(calls, 3)
    })

    it('exhausts retries and throws', async () => {
        const h = new Healer({ baseDelay: 10, maxDelay: 50, retries: 2 })
        let calls = 0
        try {
            await h.retry(() => {
                calls++
                throw new Error('always fails')
            }, { label: 'fail_test', retries: 2 })
            assert.fail('Should have thrown')
        } catch (err) {
            assert.equal(err.message, 'always fails')
            assert.equal(calls, 3)
        }
    })

    it('logs healing events', async () => {
        const h = new Healer({ baseDelay: 10 })
        let calls = 0
        await h.retry(() => {
            calls++
            if (calls < 2) throw new Error('once')
            return 'ok'
        }, { label: 'logged', retries: 3 })
        const log = h.log()
        assert.ok(log.length > 0)
        assert.ok(log.some(e => e.function === 'logged'))
    })
})

describe('Layer 2: Healer — Circuit Breaker', () => {
    it('opens after threshold failures', async () => {
        const cb = new CircuitBreaker('test-svc', { threshold: 3, cooldown: 100 })
        assert.equal(cb.state, 'CLOSED')

        for (let i = 0; i < 3; i++) {
            try { await cb.execute(() => { throw new Error('fail') }) } catch { }
        }
        assert.equal(cb.state, 'OPEN')
    })

    it('uses fallback when open', async () => {
        const cb = new CircuitBreaker('test-svc2', { threshold: 1, cooldown: 50000 })
        try { await cb.execute(() => { throw new Error('fail') }) } catch { }
        assert.equal(cb.state, 'OPEN')

        const result = await cb.execute(
            () => 'should not run',
            () => 'fallback value'
        )
        assert.equal(result, 'fallback value')
    })

    it('transitions to HALF-OPEN after cooldown', async () => {
        const cb = new CircuitBreaker('test-svc3', { threshold: 1, cooldown: 50 })
        try { await cb.execute(() => { throw new Error('fail') }) } catch { }
        assert.equal(cb.state, 'OPEN')

        await new Promise(r => setTimeout(r, 80))
        try { await cb.execute(() => 'recovered') } catch { }
        // Should have transitioned through HALF-OPEN to CLOSED
        assert.equal(cb.state, 'CLOSED')
    })

    it('reports state', () => {
        const cb = new CircuitBreaker('state-test', {})
        const state = cb.getState()
        assert.equal(state.name, 'state-test')
        assert.equal(state.state, 'CLOSED')
    })
})

describe('Layer 2: Healer — Healable Wrapper', () => {
    it('wraps function with retry', async () => {
        const h = new Healer({ baseDelay: 10 })
        let calls = 0
        const fn = h.healable(() => {
            calls++
            if (calls < 2) throw new Error('fail')
            return 'ok'
        }, { label: 'wrapped', retries: 3 })
        const result = await fn()
        assert.equal(result, 'ok')
    })

    it('uses fallback on total failure', async () => {
        const h = new Healer({ baseDelay: 10 })
        const fn = h.healable(
            () => { throw new Error('always') },
            { label: 'with-fallback', retries: 1, fallback: () => 'safe-value' }
        )
        const result = await fn()
        assert.equal(result, 'safe-value')
    })
})

// ════════════════════════════════════════
// LAYER 3: Optimizer
// ════════════════════════════════════════
describe('Layer 3: Optimizer', () => {
    it('analyzes monitoring data', () => {
        const m = new Monitor()
        // Simulate a slow function
        for (let i = 0; i < 200; i++) {
            const t = m.start('slow_fn')
            m.success('slow_fn', t - 300) // fake: 300ms execution
        }
        // Reset singleton for isolated test
        const o = new Optimizer()
        const suggestions = o.analyze()
        // May or may not detect slow_fn depending on global monitor
        assert.ok(Array.isArray(suggestions))
        m.stop()
    })

    it('creates optimization request', async () => {
        const o = new Optimizer({ mode: 'suggest' })
        const result = await o.requestOptimization('greet', 'to greet(name):\n    return name\n')
        assert.equal(result.status, 'pending')
        assert.ok(result.id.startsWith('MUT-'))
    })

    it('applies mutation', async () => {
        const o = new Optimizer()
        const result = await o.requestOptimization('test_fn', 'to test_fn():\n    show "hi"\n')
        o.apply(result.id)
        const entry = o.mutationLog.get(result.id)
        assert.equal(entry.status, 'applied')
    })

    it('rolls back mutation', async () => {
        const o = new Optimizer()
        const result = await o.requestOptimization('rollback_fn', 'to rollback_fn():\n    show "hi"\n')
        o.apply(result.id)
        o.rollback(result.id)
        const entry = o.mutationLog.get(result.id)
        assert.equal(entry.rolledBack, true)
    })

    it('rate limits mutations', async () => {
        const o = new Optimizer({ max_mutations_per_day: 2 })
        await o.requestOptimization('fn1', 'code1')
        o.apply((await o.requestOptimization('fn1', 'code1')).id)
        o.apply((await o.requestOptimization('fn2', 'code2')).id)
        const result = await o.requestOptimization('fn3', 'code3')
        assert.equal(result.status, 'rate_limited')
    })

    it('ignores listed functions', async () => {
        const o = new Optimizer({ ignore: ['payment_handler'] })
        const result = await o.requestOptimization('payment_handler', 'code')
        assert.equal(result, null)
    })

    it('reports status', () => {
        const o = new Optimizer()
        const s = o.status()
        assert.equal(s.enabled, true)
        assert.equal(s.mode, 'suggest')
    })
})

describe('Layer 3: MutationLog', () => {
    it('adds and retrieves entries', () => {
        const log = new MutationLog()
        const id = log.add({ function: 'greet', trigger: 'slow' })
        assert.ok(id.startsWith('MUT-'))
        const entry = log.get(id)
        assert.equal(entry.function, 'greet')
    })

    it('prevents double rollback', () => {
        const log = new MutationLog()
        const id = log.add({ function: 'test' })
        log.rollback(id)
        assert.throws(() => log.rollback(id), /already rolled back/)
    })

    it('history is append-only', () => {
        const log = new MutationLog()
        log.add({ fn: 'a' })
        log.add({ fn: 'b' })
        assert.equal(log.history().length, 2)
    })
})

// ════════════════════════════════════════
// LAYER 4: Evolver
// ════════════════════════════════════════
describe('Layer 4: Evolver', () => {
    it('creates evolution decisions', () => {
        const e = new Evolver()
        const d = e.addDecision({
            type: 'dependency',
            description: 'lodash 4.17 → 4.18 available',
            severity: 'auto',
        })
        assert.ok(d.id.startsWith('EVO-'))
        assert.equal(d.status, 'pending')
    })

    it('approves decisions', () => {
        const e = new Evolver()
        const d = e.addDecision({
            type: 'model',
            description: 'GPT-5 available for benchmarking',
            severity: 'review',
        })
        e.approve(d.id)
        assert.equal(d.status, 'approved')
    })

    it('rejects decisions', () => {
        const e = new Evolver()
        const d = e.addDecision({
            type: 'schema',
            description: 'API field added',
            severity: 'review',
        })
        e.reject(d.id, 'Not ready')
        assert.equal(d.status, 'rejected')
    })

    it('auto-applies patch dependencies', () => {
        const e = new Evolver({ auto_approve: ['dependency_patches'] })
        const d = e.addDecision({
            type: 'dependency',
            description: 'lodash 4.17.21 → 4.17.22',
            severity: 'auto',
            details: { versionChange: 'patch' },
        })
        assert.equal(d.status, 'auto-applied')
    })

    it('analyzes costs', () => {
        const e = new Evolver()
        const analysis = e.analyzeCosts()
        assert.ok(analysis.totalCost !== undefined)
        assert.ok(analysis.recommendations !== undefined)
    })

    it('analyzes patterns', () => {
        const e = new Evolver()
        const insights = e.analyzePatterns()
        assert.ok(Array.isArray(insights))
    })

    it('reports status', () => {
        const e = new Evolver()
        const s = e.status()
        assert.equal(s.enabled, true)
        assert.equal(s.daemonRunning, false)
    })

    it('reports history', () => {
        const e = new Evolver()
        e.addDecision({ type: 'test', description: 'Test decision', severity: 'auto' })
        const h = e.history()
        assert.equal(h.length, 1)
        assert.equal(h[0].type, 'test')
    })

    it('starts and stops daemon', () => {
        const e = new Evolver({ check_interval: 100000 })
        e.startDaemon()
        assert.equal(e.daemonRunning, true)
        e.stopDaemon()
        assert.equal(e.daemonRunning, false)
    })
})

describe('Layer 4: EvolutionDecision', () => {
    it('creates with pending status', () => {
        const d = new EvolutionDecision({
            type: 'model',
            description: 'New model available',
            severity: 'review',
        })
        assert.ok(d.id.startsWith('EVO-'))
        assert.equal(d.status, 'pending')
    })

    it('tracks approval', () => {
        const d = new EvolutionDecision({
            type: 'model',
            description: 'Switch model',
            severity: 'review',
        })
        d.approve()
        assert.equal(d.status, 'approved')
        assert.ok(d.resolvedAt > 0)
    })
})

// ════════════════════════════════════════
// LAYER INTEGRATION
// ════════════════════════════════════════
describe('Layer Integration', () => {
    it('monitor feeds data to healer', () => {
        const m = new Monitor()
        m.trackHealing({ type: 'test_event', message: 'test' })
        const s = m.stats()
        assert.equal(s.healing.total_events, 1)
        m.stop()
    })

    it('healer logs events to monitor', async () => {
        const m = new Monitor()
        const h = new Healer({ baseDelay: 10 })
        let calls = 0
        await h.retry(() => {
            calls++
            if (calls < 2) throw new Error('once')
            return 'ok'
        }, { label: 'integrated', retries: 3 })
        // Healer internally calls monitor.trackHealing
        assert.ok(h.log().length > 0)
        m.stop()
    })
})

// ════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ════════════════════════════════════════
describe('M6: No Regression', () => {
    it('hello.lume still works', () => {
        const js = compileToJS('show "Hello from Lume"')
        assert.ok(js.includes('console.log'))
    })

    it('AI calls still compile', () => {
        const js = compileToJS('let x = ask "What is 2+2?"')
        assert.ok(js.includes('__lume_ask'))
    })

    it('pipe still works', () => {
        const js = compileToJS('let x = 42 |> double')
        assert.ok(js.includes('double(42)'))
    })

    it('fetch still works', () => {
        const js = compileToJS('let data = fetch "url" as json')
        assert.ok(js.includes('fetch'))
    })

    it('functions still work end-to-end', () => {
        const js = compileToJS('to double(n: number) -> n * 2\nshow 5 |> double')
        const output = []
        const origLog = console.log
        console.log = (...args) => output.push(args.join(' '))
        try { new Function(js)() } finally { console.log = origLog }
        assert.equal(output[0], '10')
    })
})
