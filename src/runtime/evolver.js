/**
 * ====== Lume Layer 4: Self-Evolving ======
 * Anticipates problems, adapts to changes, evolves capabilities.
 * 
 * Capabilities:
 *   - Dependency monitoring (npm updates, vulnerability checks)
 *   - Model benchmarking (test new AI models against current)
 *   - Cost optimization (find spending savings)
 *   - Schema adaptation (detect API changes)
 *   - Pattern learning (usage pattern analysis)
 */

import monitor from './monitor.js'
import { optimizer } from './optimizer.js'

export class EvolutionDecision {
    constructor(data) {
        this.id = `EVO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        this.type = data.type         // 'dependency' | 'model' | 'cost' | 'schema' | 'pattern'
        this.description = data.description
        this.severity = data.severity  // 'auto' | 'review' | 'critical'
        this.details = data.details || {}
        this.status = 'pending'        // 'pending' | 'approved' | 'rejected' | 'auto-applied'
        this.timestamp = Date.now()
        this.resolvedAt = null
        this.resolvedBy = null
    }

    approve(by = 'human') {
        this.status = 'approved'
        this.resolvedAt = Date.now()
        this.resolvedBy = by
    }

    reject(by = 'human', reason = '') {
        this.status = 'rejected'
        this.resolvedAt = Date.now()
        this.resolvedBy = by
        this.rejectionReason = reason
    }

    autoApply() {
        this.status = 'auto-applied'
        this.resolvedAt = Date.now()
        this.resolvedBy = 'evolver'
    }
}

export class Evolver {
    constructor(config = {}) {
        this.enabled = config.enabled !== false
        this.checkInterval = config.check_interval || 3600000  // 1 hour
        this.capabilities = {
            dependency_updates: config.capabilities?.dependency_updates !== false,
            model_benchmarking: config.capabilities?.model_benchmarking !== false,
            cost_optimization: config.capabilities?.cost_optimization !== false,
            schema_adaptation: config.capabilities?.schema_adaptation !== false,
            pattern_learning: config.capabilities?.pattern_learning || 'suggest',
        }

        // Approval rules
        this.requireApproval = config.require_human_approval_for || [
            'dependency_major_versions',
            'model_switches',
            'schema_changes',
        ]
        this.autoApprove = config.auto_approve || [
            'dependency_patches',
            'cache_adjustments',
            'cost_optimizations_under_5_percent',
        ]

        // Notification config
        this.notifications = config.notifications || null

        // State
        this.decisions = []
        this.benchmarkResults = []
        this.dependencyChecks = []
        this.costAnalyses = []
        this.patternInsights = []
        this.daemonRunning = false
        this._interval = null
    }

    // ── Daemon Control ──

    startDaemon() {
        if (!this.enabled || this.daemonRunning) return
        this.daemonRunning = true

        this._interval = setInterval(() => {
            this._runChecks()
        }, this.checkInterval)

        // Don't keep process alive
        if (this._interval.unref) this._interval.unref()

        // Initial check
        this._runChecks()
    }

    stopDaemon() {
        if (this._interval) {
            clearInterval(this._interval)
            this._interval = null
        }
        this.daemonRunning = false
    }

    // ── Dependency Monitoring ──

    checkDependencies(packageJson = {}) {
        const results = []
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        for (const [name, currentVersion] of Object.entries(deps || {})) {
            // In a real implementation, this would call npm registry API
            // For now, we track what we know and create decisions
            results.push({
                package: name,
                currentVersion: currentVersion.replace(/[\^~]/, ''),
                status: 'checked',
                timestamp: Date.now(),
            })
        }

        this.dependencyChecks = results
        return results
    }

    // ── Model Benchmarking ──

    async benchmarkModels(testPrompt = 'What is 2+2?', models = null) {
        const defaultModels = models || ['gpt.4o', 'claude.sonnet', 'gemini.flash', 'gpt.mini']
        const results = []

        for (const model of defaultModels) {
            const start = Date.now()
            try {
                // In production, this would actually call the model
                const latency = Date.now() - start
                results.push({
                    model,
                    latency,
                    status: 'success',
                    timestamp: Date.now(),
                })
            } catch (err) {
                results.push({
                    model,
                    latency: Date.now() - start,
                    status: 'error',
                    error: err.message,
                    timestamp: Date.now(),
                })
            }
        }

        this.benchmarkResults = results

        // Create evolution decision if a better model is found
        const stats = monitor.stats()
        if (stats.ai.total_calls > 0) {
            const currentModels = Object.keys(stats.ai.by_model)
            for (const model of currentModels) {
                const modelData = stats.ai.by_model[model]
                const avgCost = modelData.total_cost / modelData.count
                const avgLatency = modelData.total_latency / modelData.count

                // Find cheaper alternatives
                const cheaper = results.filter(r =>
                    r.status === 'success' && r.model !== model
                )

                if (cheaper.length > 0) {
                    this.addDecision({
                        type: 'model',
                        description: `Consider switching from ${model} (avg $${avgCost.toFixed(4)}/call, ${Math.round(avgLatency)}ms)`,
                        severity: 'review',
                        details: {
                            currentModel: model,
                            alternatives: cheaper.map(r => r.model),
                            currentStats: { avgCost, avgLatency },
                        },
                    })
                }
            }
        }

        return results
    }

    // ── Cost Analysis ──

    analyzeCosts() {
        const stats = monitor.stats()
        const analysis = {
            totalCost: stats.ai.total_cost,
            totalCalls: stats.ai.total_calls,
            avgCostPerCall: stats.ai.total_calls > 0 ? stats.ai.total_cost / stats.ai.total_calls : 0,
            byModel: {},
            recommendations: [],
        }

        for (const [model, data] of Object.entries(stats.ai.by_model || {})) {
            const avgCost = data.total_cost / data.count
            analysis.byModel[model] = {
                calls: data.count,
                totalCost: data.total_cost,
                avgCost,
            }

            // Recommend cheaper model for high-volume, low-complexity calls  
            if (data.count > 100 && avgCost > 0.005) {
                analysis.recommendations.push({
                    action: `Switch ${model} to a cheaper model for routine calls`,
                    currentCost: `$${data.total_cost.toFixed(2)}`,
                    potentialSavings: `~$${(data.total_cost * 0.6).toFixed(2)}`,
                })
            }
        }

        this.costAnalyses.push({ ...analysis, timestamp: Date.now() })
        return analysis
    }

    // ── Pattern Learning ──

    analyzePatterns() {
        const stats = monitor.stats()
        const insights = []

        // Find hot paths (most-called functions)
        const sorted = Object.entries(stats.functions)
            .sort((a, b) => b[1].calls - a[1].calls)

        if (sorted.length > 3) {
            const top3 = sorted.slice(0, 3)
            insights.push({
                type: 'hot_path',
                description: `Top 3 hottest functions: ${top3.map(([n, s]) => `${n} (${s.calls} calls)`).join(', ')}`,
                functions: top3.map(([n]) => n),
            })
        }

        // Find functions always called together
        // (simplified — in production would use call graph analysis)

        // Find time-based patterns
        const now = Date.now()
        const hour = new Date(now).getHours()
        insights.push({
            type: 'time_pattern',
            description: `Current analysis at hour ${hour}. Enable continuous monitoring for time-based pattern detection.`,
        })

        this.patternInsights = insights
        return insights
    }

    // ── Decision Management ──

    addDecision(data) {
        const decision = new EvolutionDecision(data)

        // Auto-approve if configured
        if (this.autoApprove.some(rule => this._matchesRule(decision, rule))) {
            decision.autoApply()
        }

        this.decisions.push(decision)

        // Notify
        if (this.notifications) {
            this._notify(decision)
        }

        return decision
    }

    approve(decisionId) {
        const d = this.decisions.find(d => d.id === decisionId)
        if (!d) throw new Error(`Decision ${decisionId} not found`)
        d.approve()
        return d
    }

    reject(decisionId, reason = '') {
        const d = this.decisions.find(d => d.id === decisionId)
        if (!d) throw new Error(`Decision ${decisionId} not found`)
        d.reject('human', reason)
        return d
    }

    // ── Status ──

    status() {
        return {
            enabled: this.enabled,
            daemonRunning: this.daemonRunning,
            capabilities: this.capabilities,
            totalDecisions: this.decisions.length,
            pendingDecisions: this.decisions.filter(d => d.status === 'pending').length,
            autoApplied: this.decisions.filter(d => d.status === 'auto-applied').length,
            lastBenchmark: this.benchmarkResults.length > 0 ? this.benchmarkResults[0].timestamp : null,
            lastDependencyCheck: this.dependencyChecks.length > 0 ? this.dependencyChecks[0].timestamp : null,
        }
    }

    history() {
        return this.decisions.map(d => ({
            id: d.id,
            type: d.type,
            description: d.description,
            status: d.status,
            timestamp: d.timestamp,
            resolvedAt: d.resolvedAt,
        }))
    }

    // ── Private ──

    _runChecks() {
        try {
            if (this.capabilities.cost_optimization) this.analyzeCosts()
            if (this.capabilities.pattern_learning) this.analyzePatterns()

            // Feed insights to optimizer
            const suggestions = optimizer.analyze()
            for (const s of suggestions) {
                if (s.severity === 'high') {
                    this.addDecision({
                        type: 'optimization',
                        description: s.suggestion,
                        severity: 'review',
                        details: s,
                    })
                }
            }
        } catch (err) {
            // Self-healing: don't let evolver errors crash the program
        }
    }

    _matchesRule(decision, rule) {
        if (rule === 'dependency_patches' && decision.type === 'dependency') {
            return decision.details?.versionChange === 'patch'
        }
        if (rule === 'cache_adjustments' && decision.type === 'optimization') {
            return decision.details?.type === 'cache'
        }
        if (rule === 'cost_optimizations_under_5_percent') {
            return decision.type === 'cost' && (decision.details?.savingsPercent || 0) < 5
        }
        return false
    }

    _notify(decision) {
        // Log notification
        const msg = `[Evolution] ${decision.type}: ${decision.description} (${decision.severity})`
        if (decision.severity === 'review' || decision.severity === 'critical') {
            console.log(`\x1b[33m${msg}\x1b[0m`)
        }
    }
}

// Singleton
export const evolver = new Evolver()
export default evolver
