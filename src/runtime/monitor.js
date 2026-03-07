/**
 * ====== Lume Layer 1: Self-Monitoring ======
 * Watches everything, collects data. Always on by default.
 * 
 * Metrics tracked:
 *   - execution_time: Per-function timing (ms)
 *   - call_count: How many times each function runs
 *   - error_rate: Errors per function over time
 *   - memory_usage: Heap snapshots at intervals
 *   - ai_call_latency: Response time for ask/think/generate
 *   - ai_call_cost: Token usage per AI call
 *   - fetch_success_rate: HTTP success/failure ratio
 */

export class Monitor {
    constructor(config = {}) {
        this.enabled = config.enabled !== false
        this.interval = config.interval || 5000     // ms
        this.retention = config.retention || 86400000 // 24 hours in ms
        this.alerts = config.alert_on || {}
        this.dashboardPort = config.port || 9090

        // Metrics storage
        this.functions = {}   // name → { calls, errors, totalTime, minTime, maxTime, times[] }
        this.aiCalls = []     // { model, type, latency, tokens, cost, timestamp }
        this.fetchCalls = []  // { url, method, status, latency, timestamp }
        this.memorySnapshots = []
        this.healingEvents = []
        this.startTime = Date.now()

        // Interval for memory tracking
        this._memoryInterval = null
        if (this.enabled) {
            this._startMemoryTracking()
        }
    }

    // ── Function Instrumentation ──

    start(functionName) {
        if (!this.enabled) return Date.now()
        if (!this.functions[functionName]) {
            this.functions[functionName] = {
                calls: 0,
                errors: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                times: [],
                lastCall: null,
            }
        }
        return Date.now()
    }

    success(functionName, startTime) {
        if (!this.enabled) return
        const elapsed = Date.now() - startTime
        const fn = this.functions[functionName]
        if (!fn) return
        fn.calls++
        fn.totalTime += elapsed
        fn.minTime = Math.min(fn.minTime, elapsed)
        fn.maxTime = Math.max(fn.maxTime, elapsed)
        fn.lastCall = Date.now()
        fn.times.push({ time: elapsed, timestamp: Date.now() })
        this._trimTimes(fn)
        this._checkAlerts(functionName)
    }

    error(functionName, startTime, err) {
        if (!this.enabled) return
        const elapsed = Date.now() - startTime
        const fn = this.functions[functionName]
        if (!fn) return
        fn.calls++
        fn.errors++
        fn.totalTime += elapsed
        fn.lastCall = Date.now()
        fn.times.push({ time: elapsed, timestamp: Date.now(), error: err.message })
        this._trimTimes(fn)
        this._checkAlerts(functionName)
    }

    // ── AI Call Tracking ──

    trackAICall(type, model, latency, tokens = 0, cost = 0) {
        if (!this.enabled) return
        this.aiCalls.push({
            type,     // 'ask' | 'think' | 'generate'
            model,
            latency,
            tokens,
            cost,
            timestamp: Date.now(),
        })
        this._trimArray(this.aiCalls)
    }

    // ── Fetch Tracking ──

    trackFetch(url, method, status, latency) {
        if (!this.enabled) return
        this.fetchCalls.push({
            url,
            method,
            status,
            success: status >= 200 && status < 400,
            latency,
            timestamp: Date.now(),
        })
        this._trimArray(this.fetchCalls)
    }

    // ── Healing Event Tracking ──

    trackHealing(event) {
        this.healingEvents.push({
            ...event,
            timestamp: Date.now(),
        })
    }

    // ── Stats API ──

    stats() {
        const functionStats = {}
        for (const [name, fn] of Object.entries(this.functions)) {
            functionStats[name] = {
                calls: fn.calls,
                errors: fn.errors,
                error_rate: fn.calls > 0 ? fn.errors / fn.calls : 0,
                avg_time: fn.calls > 0 ? Math.round(fn.totalTime / fn.calls) : 0,
                min_time: fn.minTime === Infinity ? 0 : fn.minTime,
                max_time: fn.maxTime,
                last_call: fn.lastCall,
            }
        }

        const totalAICost = this.aiCalls.reduce((sum, c) => sum + c.cost, 0)
        const avgAILatency = this.aiCalls.length > 0
            ? Math.round(this.aiCalls.reduce((s, c) => s + c.latency, 0) / this.aiCalls.length)
            : 0

        const fetchSuccess = this.fetchCalls.filter(f => f.success).length
        const fetchTotal = this.fetchCalls.length

        return {
            uptime: Date.now() - this.startTime,
            functions: functionStats,
            ai: {
                total_calls: this.aiCalls.length,
                total_cost: totalAICost,
                avg_latency: avgAILatency,
                by_model: this._groupBy(this.aiCalls, 'model'),
            },
            fetch: {
                total_calls: fetchTotal,
                success_rate: fetchTotal > 0 ? fetchSuccess / fetchTotal : 1,
            },
            memory: {
                current: this._getMemory(),
                snapshots: this.memorySnapshots.slice(-10),
            },
            healing: {
                total_events: this.healingEvents.length,
                recent: this.healingEvents.slice(-10),
            },
        }
    }

    // ── Dashboard ──

    dashboard() {
        const s = this.stats()
        const lines = []
        lines.push('\x1b[35m  ✦ Lume Monitor Dashboard\x1b[0m')
        lines.push(`\x1b[2m  Uptime: ${this._formatDuration(s.uptime)}\x1b[0m`)
        lines.push('')

        // Functions
        lines.push('\x1b[36m  Functions:\x1b[0m')
        for (const [name, stats] of Object.entries(s.functions)) {
            const errRate = (stats.error_rate * 100).toFixed(1)
            const errColor = stats.error_rate > 0.05 ? '\x1b[31m' : '\x1b[32m'
            lines.push(`    ${name}: ${stats.calls} calls, avg ${stats.avg_time}ms, ${errColor}${errRate}% errors\x1b[0m`)
        }

        // AI
        if (s.ai.total_calls > 0) {
            lines.push('')
            lines.push('\x1b[36m  AI Calls:\x1b[0m')
            lines.push(`    Total: ${s.ai.total_calls}, avg latency: ${s.ai.avg_latency}ms, cost: $${s.ai.total_cost.toFixed(4)}`)
        }

        // Fetch
        if (s.fetch.total_calls > 0) {
            lines.push('')
            lines.push('\x1b[36m  HTTP:\x1b[0m')
            lines.push(`    ${s.fetch.total_calls} calls, ${(s.fetch.success_rate * 100).toFixed(1)}% success`)
        }

        // Memory
        lines.push('')
        lines.push(`\x1b[36m  Memory:\x1b[0m ${this._formatBytes(s.memory.current.heapUsed)} / ${this._formatBytes(s.memory.current.heapTotal)}`)

        // Healing
        if (s.healing.total_events > 0) {
            lines.push('')
            lines.push(`\x1b[36m  Healing Events:\x1b[0m ${s.healing.total_events}`)
        }

        return lines.join('\n')
    }

    // ── Web Dashboard HTML ──

    dashboardHTML() {
        const s = this.stats()
        const fnRows = Object.entries(s.functions).map(([name, st]) => `
            <tr>
                <td>${name}</td>
                <td>${st.calls}</td>
                <td>${st.avg_time}ms</td>
                <td class="${st.error_rate > 0.05 ? 'error' : 'ok'}">${(st.error_rate * 100).toFixed(1)}%</td>
            </tr>`).join('')

        return `<!DOCTYPE html>
<html>
<head>
    <title>Lume Monitor</title>
    <meta http-equiv="refresh" content="5">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a1a; color: #e0e0ff; font-family: 'SF Mono', monospace; padding: 2rem; }
        h1 { color: #c084fc; margin-bottom: 1rem; }
        .card { background: #1a1a2e; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #2a2a4e; }
        .card h2 { color: #60a5fa; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.8rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #2a2a4e; }
        th { color: #a0a0c0; font-size: 0.8rem; }
        .ok { color: #4ade80; }
        .error { color: #f87171; }
        .metric { font-size: 2rem; font-weight: bold; color: #c084fc; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <h1>✦ Lume Monitor</h1>
    <p style="color:#666;margin-bottom:1rem">Uptime: ${this._formatDuration(s.uptime)} · Auto-refresh: 5s</p>
    <div class="grid">
        <div class="card"><h2>Total Functions</h2><div class="metric">${Object.keys(s.functions).length}</div></div>
        <div class="card"><h2>AI Calls</h2><div class="metric">${s.ai.total_calls}</div></div>
        <div class="card"><h2>HTTP Calls</h2><div class="metric">${s.fetch.total_calls}</div></div>
        <div class="card"><h2>Memory</h2><div class="metric">${this._formatBytes(s.memory.current.heapUsed)}</div></div>
    </div>
    <div class="card">
        <h2>Function Performance</h2>
        <table>
            <thead><tr><th>Function</th><th>Calls</th><th>Avg Time</th><th>Error Rate</th></tr></thead>
            <tbody>${fnRows || '<tr><td colspan="4" style="color:#666">No function calls yet</td></tr>'}</tbody>
        </table>
    </div>
</body>
</html>`
    }

    // ── Cleanup ──

    stop() {
        if (this._memoryInterval) {
            clearInterval(this._memoryInterval)
            this._memoryInterval = null
        }
    }

    // ── Private ──

    _startMemoryTracking() {
        this._memoryInterval = setInterval(() => {
            this.memorySnapshots.push({
                ...this._getMemory(),
                timestamp: Date.now(),
            })
            this._trimArray(this.memorySnapshots, 1000)
        }, this.interval)

        // Don't keep process alive just for monitoring
        if (this._memoryInterval.unref) {
            this._memoryInterval.unref()
        }
    }

    _getMemory() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const m = process.memoryUsage()
            return { heapUsed: m.heapUsed, heapTotal: m.heapTotal, rss: m.rss }
        }
        return { heapUsed: 0, heapTotal: 0, rss: 0 }
    }

    _trimTimes(fn) {
        const cutoff = Date.now() - this.retention
        fn.times = fn.times.filter(t => t.timestamp > cutoff)
    }

    _trimArray(arr, max = 10000) {
        while (arr.length > max) arr.shift()
    }

    _checkAlerts(functionName) {
        const fn = this.functions[functionName]
        if (!fn || !this.alerts) return

        if (this.alerts.error_rate && fn.calls > 10) {
            const rate = fn.errors / fn.calls
            if (rate > this.alerts.error_rate) {
                console.warn(`\x1b[33m⚠ Monitor Alert: ${functionName} error rate ${(rate * 100).toFixed(1)}% exceeds threshold ${this.alerts.error_rate * 100}%\x1b[0m`)
            }
        }

        if (this.alerts.avg_time && fn.calls > 10) {
            const avg = fn.totalTime / fn.calls
            if (avg > this.alerts.avg_time) {
                console.warn(`\x1b[33m⚠ Monitor Alert: ${functionName} avg time ${Math.round(avg)}ms exceeds threshold ${this.alerts.avg_time}ms\x1b[0m`)
            }
        }
    }

    _groupBy(arr, key) {
        const groups = {}
        for (const item of arr) {
            const k = item[key] || 'unknown'
            if (!groups[k]) groups[k] = { count: 0, total_latency: 0, total_cost: 0 }
            groups[k].count++
            groups[k].total_latency += item.latency || 0
            groups[k].total_cost += item.cost || 0
        }
        return groups
    }

    _formatDuration(ms) {
        const s = Math.floor(ms / 1000)
        if (s < 60) return `${s}s`
        if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
        const h = Math.floor(s / 3600)
        return `${h}h ${Math.floor((s % 3600) / 60)}m`
    }

    _formatBytes(bytes) {
        if (bytes === 0) return '0 B'
        const units = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
    }
}

// Singleton instance
export const monitor = new Monitor()
export default monitor
