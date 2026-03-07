/**
 * ====== Lume Layer 3: Self-Optimizing ======
 * Uses AI to analyze performance data and improve code.
 * 
 * Triggers:
 *   - Slow function (avg_time > threshold)
 *   - Repeated inputs (same inputs 50+ times → add caching)
 *   - High error rate (> 10% over 1 hour)
 *   - Expensive AI calls (tokens > budget)
 * 
 * Modes:
 *   - "suggest" — Show suggestions, wait for approval
 *   - "auto" — Apply automatically (with safety guardrails)
 */

import monitor from './monitor.js'

export class MutationLog {
    constructor() {
        this.entries = []  // Append-only log
    }

    add(entry) {
        this.entries.push({
            id: `MUT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...entry,
            timestamp: Date.now(),
            rolledBack: false,
        })
        return this.entries[this.entries.length - 1].id
    }

    get(id) {
        return this.entries.find(e => e.id === id)
    }

    rollback(id) {
        const entry = this.get(id)
        if (!entry) throw new Error(`Mutation ${id} not found`)
        if (entry.rolledBack) throw new Error(`Mutation ${id} already rolled back`)
        entry.rolledBack = true
        entry.rollbackTimestamp = Date.now()
        return entry
    }

    history() {
        return [...this.entries]
    }

    pending() {
        return this.entries.filter(e => e.status === 'pending')
    }
}

export class Optimizer {
    constructor(config = {}) {
        this.enabled = config.enabled !== false
        this.mode = config.mode || 'suggest'          // 'suggest' | 'auto'
        this.aiModel = config.ai_model || 'claude.sonnet'
        this.budget = config.budget || 1000            // tokens per optimization
        this.maxMutationsPerDay = config.max_mutations_per_day || 10
        this.requireTestPass = config.require_test_pass !== false
        this.requireIntentPass = config.require_intent_pass !== false
        this.logAllChanges = config.log_all_changes !== false
        this.ignoreFunctions = new Set(config.ignore || [])

        this.mutationLog = new MutationLog()
        this.suggestions = []
        this.todayMutations = 0
        this.lastResetDay = new Date().toDateString()
    }

    // ── Analysis ──

    analyze() {
        const stats = monitor.stats()
        const suggestions = []

        for (const [name, fn] of Object.entries(stats.functions)) {
            if (this.ignoreFunctions.has(name)) continue

            // Slow function detection
            if (fn.avg_time > 200 && fn.calls > 100) {
                suggestions.push({
                    type: 'slow_function',
                    function: name,
                    metric: `avg_time: ${fn.avg_time}ms`,
                    suggestion: `Function '${name}' is slow (${fn.avg_time}ms avg over ${fn.calls} calls). Consider caching or optimizing.`,
                    severity: fn.avg_time > 1000 ? 'high' : 'medium',
                })
            }

            // High error rate
            if (fn.error_rate > 0.1 && fn.calls > 50) {
                suggestions.push({
                    type: 'high_error_rate',
                    function: name,
                    metric: `error_rate: ${(fn.error_rate * 100).toFixed(1)}%`,
                    suggestion: `Function '${name}' has a ${(fn.error_rate * 100).toFixed(1)}% error rate. Analyze error patterns.`,
                    severity: 'high',
                })
            }

            // Unused function
            if (fn.calls === 0) {
                suggestions.push({
                    type: 'unused_function',
                    function: name,
                    metric: 'calls: 0',
                    suggestion: `Function '${name}' has never been called. Consider removing it.`,
                    severity: 'low',
                })
            }
        }

        // AI cost analysis
        if (stats.ai.total_cost > 0) {
            for (const [model, data] of Object.entries(stats.ai.by_model)) {
                const avgCost = data.total_cost / data.count
                if (avgCost > 0.01) {  // > $0.01 per call
                    suggestions.push({
                        type: 'expensive_ai',
                        model,
                        metric: `avg_cost: $${avgCost.toFixed(4)}`,
                        suggestion: `AI calls to '${model}' cost $${avgCost.toFixed(4)}/call. Consider a cheaper model.`,
                        severity: 'medium',
                    })
                }
            }
        }

        this.suggestions = suggestions
        return suggestions
    }

    // ── Optimization Request ──

    async requestOptimization(functionName, sourceCode, options = {}) {
        if (!this.enabled) return null
        if (this.ignoreFunctions.has(functionName)) return null

        // Rate limit
        this._checkDayReset()
        if (this.todayMutations >= this.maxMutationsPerDay) {
            return { status: 'rate_limited', message: `Max ${this.maxMutationsPerDay} mutations/day reached` }
        }

        const stats = monitor.stats()
        const fnStats = stats.functions[functionName] || {}

        const mutationId = this.mutationLog.add({
            function: functionName,
            trigger: options.trigger || 'manual',
            originalSource: sourceCode,
            status: 'pending',
            fnStats: { ...fnStats },
        })

        // In suggest mode, just store the suggestion
        if (this.mode === 'suggest') {
            return {
                status: 'pending',
                id: mutationId,
                message: `Optimization suggestion created for '${functionName}'. Run 'lume optimize apply ${mutationId}' to apply.`,
            }
        }

        // In auto mode, would apply (but we need AI call + sandbox)
        return {
            status: 'pending',
            id: mutationId,
            message: `Auto-optimization queued for '${functionName}'.`,
        }
    }

    // ── Apply / Rollback ──

    apply(mutationId) {
        const entry = this.mutationLog.get(mutationId)
        if (!entry) throw new Error(`Mutation ${mutationId} not found`)
        entry.status = 'applied'
        entry.appliedAt = Date.now()
        this.todayMutations++
        return entry
    }

    rollback(mutationId) {
        const entry = this.mutationLog.rollback(mutationId)
        return entry
    }

    // ── Status ──

    status() {
        return {
            enabled: this.enabled,
            mode: this.mode,
            todayMutations: this.todayMutations,
            maxPerDay: this.maxMutationsPerDay,
            totalMutations: this.mutationLog.entries.length,
            pendingSuggestions: this.suggestions.length,
            ignoredFunctions: [...this.ignoreFunctions],
        }
    }

    log() {
        return this.mutationLog.history()
    }

    // ── Private ──

    _checkDayReset() {
        const today = new Date().toDateString()
        if (today !== this.lastResetDay) {
            this.todayMutations = 0
            this.lastResetDay = today
        }
    }
}

// Singleton
export const optimizer = new Optimizer()
export default optimizer
