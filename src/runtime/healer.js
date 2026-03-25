/**
 * ====== Lume Layer 2: Self-Healing ======
 * Detects failures and recovers automatically.
 * 
 * Strategies:
 *   - Retry with exponential backoff
 *   - Circuit breaker pattern (CLOSED → OPEN → HALF-OPEN)
 *   - AI model fallback chain
 *   - Cached/default value fallback
 *   - Dependency timeout handling
 */
import monitor from './monitor.js'
import { execSync } from 'node:child_process'

export class CircuitBreaker {
    constructor(name, config = {}) {
        this.name = name
        this.threshold = config.threshold || 5        // failures before opening
        this.cooldown = config.cooldown || 30000       // ms before half-open
        this.state = 'CLOSED'  // CLOSED | OPEN | HALF-OPEN
        this.failures = 0
        this.lastFailure = null
        this.lastStateChange = Date.now()
    }

    async execute(fn, fallback = null) {
        // Check if circuit should transition from OPEN → HALF-OPEN
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailure > this.cooldown) {
                this.state = 'HALF-OPEN'
                this.lastStateChange = Date.now()
            } else {
                // Circuit is open — use fallback
                if (fallback) return await fallback()
                throw new Error(`Circuit breaker '${this.name}' is OPEN — service unavailable`)
            }
        }

        try {
            const result = await fn()
            // Success — reset
            if (this.state === 'HALF-OPEN') {
                this.state = 'CLOSED'
                this.lastStateChange = Date.now()
            }
            this.failures = 0
            return result
        } catch (err) {
            this.failures++
            this.lastFailure = Date.now()

            if (this.failures >= this.threshold) {
                this.state = 'OPEN'
                this.lastStateChange = Date.now()
                monitor.trackHealing({
                    type: 'circuit_opened',
                    name: this.name,
                    failures: this.failures,
                })
            }

            if (fallback) {
                monitor.trackHealing({
                    type: 'fallback_used',
                    name: this.name,
                    error: err.message,
                })
                return await fallback()
            }
            throw err
        }
    }

    getState() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailure,
            lastStateChange: this.lastStateChange,
        }
    }
}

export class Healer {
    constructor(config = {}) {
        this.retries = config.retries || 3
        this.backoff = config.backoff || 'exponential'  // 'exponential' | 'linear' | 'fixed'
        this.baseDelay = config.baseDelay || 1000        // ms
        this.maxDelay = config.maxDelay || 30000         // ms
        this.circuitBreakers = new Map()
        this.healLog = []

        // AI model fallback chain
        this.fallbackModels = config.fallback_models || [
            'claude.sonnet', 'gpt.4o', 'gpt.mini', 'gemini.flash'
        ]

        // Callbacks
        this.onHeal = config.on_heal || null
    }

    // ── Retry with Backoff ──

    async retry(fn, options = {}) {
        const maxRetries = options.retries || this.retries
        const label = options.label || 'unknown'
        let lastError = null

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn()
                if (attempt > 0) {
                    this._logHeal({
                        type: 'retry_success',
                        function: label,
                        attempts: attempt + 1,
                    })
                }
                return result
            } catch (err) {
                lastError = err
                if (attempt < maxRetries) {
                    const delay = this._calculateDelay(attempt)
                    this._logHeal({
                        type: 'retry',
                        function: label,
                        attempt: attempt + 1,
                        delay,
                        error: err.message,
                    })
                    await this._sleep(delay)
                }
            }
        }

        this._logHeal({
            type: 'retry_exhausted',
            function: label,
            attempts: maxRetries + 1,
            error: lastError.message,
        })

        throw lastError
    }

    // ── Circuit Breaker ──

    getCircuitBreaker(name, config = {}) {
        if (!this.circuitBreakers.has(name)) {
            this.circuitBreakers.set(name, new CircuitBreaker(name, config))
        }
        return this.circuitBreakers.get(name)
    }

    // ── AI Model Fallback ──

    async withModelFallback(aiCallFn, models = null) {
        const chain = models || this.fallbackModels
        let lastError = null

        for (const model of chain) {
            try {
                const result = await aiCallFn(model)
                return result
            } catch (err) {
                lastError = err
                this._logHeal({
                    type: 'model_fallback',
                    from: model,
                    error: err.message,
                })
            }
        }

        throw new Error(`All models in fallback chain failed. Last error: ${lastError.message}`)
    }

    // ── Healable Wrapper ──
    // Wraps a function with automatic retry + circuit breaker + fallback

    healable(fn, options = {}) {
        const healer = this
        const label = options.label || fn.name || 'anonymous'
        const cb = options.circuitBreaker
            ? this.getCircuitBreaker(label, options.circuitBreaker)
            : null
        const fallbackFn = options.fallback || null

        return async function (...args) {
            const execute = () => fn(...args)
            const fallback = fallbackFn ? () => fallbackFn(...args) : null

            try {
                if (cb) {
                    return await cb.execute(
                        () => healer.retry(execute, { label, retries: options.retries }),
                        fallback
                    )
                }
                return await healer.retry(execute, { label, retries: options.retries })
            } catch (err) {
                if (options.autoRewrite) {
                    healer._logHeal({ type: 'auto_rewrite_start', function: label, error: err.message })
                    try {
                        healer._attemptAutoRewrite(err)
                        healer._logHeal({ type: 'auto_rewrite_success', function: label })
                    } catch (rewriteErr) {
                        healer._logHeal({ type: 'auto_rewrite_failed', function: label, error: rewriteErr.message })
                    }
                }
                if (fallback) {
                    healer._logHeal({
                        type: 'fallback_final',
                        function: label,
                        error: err.message,
                    })
                    return await fallback()
                }
                throw err
            }
        }
    }

    // ── Status ──

    status() {
        const breakers = {}
        for (const [name, cb] of this.circuitBreakers) {
            breakers[name] = cb.getState()
        }
        return {
            circuitBreakers: breakers,
            totalHealingEvents: this.healLog.length,
            recentEvents: this.healLog.slice(-20),
        }
    }

    log() {
        return [...this.healLog]
    }

    // ── Private ──

    _calculateDelay(attempt) {
        let delay
        switch (this.backoff) {
            case 'exponential':
                delay = this.baseDelay * Math.pow(2, attempt)
                break
            case 'linear':
                delay = this.baseDelay * (attempt + 1)
                break
            case 'fixed':
            default:
                delay = this.baseDelay
        }
        // Add jitter (±20%)
        const jitter = delay * 0.2 * (Math.random() * 2 - 1)
        return Math.min(delay + jitter, this.maxDelay)
    }

    _logHeal(event) {
        const entry = { ...event, timestamp: Date.now() }
        this.healLog.push(entry)
        monitor.trackHealing(entry)
        if (this.onHeal) {
            try { this.onHeal(entry) } catch { }
        }
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    _attemptAutoRewrite(err) {
        if (!err.stack) throw new Error('No stack trace available for auto-rewrite')
        const stack = err.stack.split('\n')
        let callerFile = null
        for (const line of stack) {
            if (line.includes('.lume') || (line.includes('.js') && !line.includes('healer.js'))) {
                const match = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at\s+(.*?):(\d+):(\d+)/)
                if (match && match[1] && !match[1].startsWith('node:')) {
                    callerFile = match[1]
                    break
                }
            }
        }
        if (!callerFile) throw new Error('Could not isolate failing file geometry for AST auto-rewrite')

        // Invoke the lume compiler in self-healing mode to dynamically mutate the AST and hot-swap
        try {
            const lumeBin = process.platform === 'win32' ? 'node .\\bin\\lume.js' : 'node ./bin/lume.js'
            const sanitizedError = err.message.replace(/"/g, "'").replace(/\n/g, ' ')
            execSync(`${lumeBin} build "${callerFile}" --heal="${sanitizedError}"`, { stdio: 'ignore' })
        } catch (e) {
            throw new Error(`Auto-rewrite AST compilation failed: ${e.message}`)
        }
    }
}

// Singleton
export const healer = new Healer()
export default healer
