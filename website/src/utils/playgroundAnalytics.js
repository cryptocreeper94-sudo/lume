/**
 * ═══════════════════════════════════════════════════════
 *  LUME PLAYGROUND ANALYTICS
 *  CHI Paper — Compilation Telemetry for User Studies
 *
 *  Logs every compilation event for:
 *    - Resolution distribution (which layers handle what %)
 *    - Voice profile learning curves
 *    - Disambiguation frequency
 *    - Review mode usage
 *    - First-interpretation approval rates
 *    - Task completion time (TCT)
 *
 *  Data is stored in localStorage with consent.
 *  Can be exported as JSON for the CHI paper's
 *  [POST-LAUNCH] sections.
 * ═══════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'lume_analytics'
const CONSENT_KEY = 'lume_analytics_consent'

/**
 * Check if analytics consent has been given
 */
export function hasConsent() {
    try {
        return localStorage.getItem(CONSENT_KEY) === 'true'
    } catch { return false }
}

/**
 * Set analytics consent
 */
export function setConsent(granted) {
    try {
        localStorage.setItem(CONSENT_KEY, granted ? 'true' : 'false')
    } catch { /* no-op */ }
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
    return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

/**
 * Main analytics logger class
 */
export class PlaygroundAnalytics {
    constructor() {
        this.sessionId = generateSessionId()
        this.sessionStart = Date.now()
        this.events = []
    }

    /**
     * Log a compilation event
     * @param {object} data - Compilation telemetry
     */
    logCompilation(data) {
        if (!hasConsent()) return

        const event = {
            type: 'compilation',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            elapsedMs: Date.now() - this.sessionStart,

            // Input
            inputMode: data.inputMode || 'text',            // 'text' | 'voice'
            sourceLineCount: data.sourceLineCount || 0,
            mode: data.mode || 'english',                   // 'english' | 'standard'

            // Resolution
            totalResolved: data.totalResolved || 0,
            totalUnresolved: data.totalUnresolved || 0,
            toleranceChainPath: data.toleranceChainPath || {},  // { layer_a_exact: N, ... }
            averageConfidence: data.averageConfidence || 0,

            // New features (CHI paper)
            manifestHits: data.manifestHits || 0,
            disambiguationsTriggered: data.disambiguationsTriggered || 0,
            reviewModeUsed: data.reviewModeUsed || false,
            reviewApprovedFirstTime: data.reviewApprovedFirstTime || null,
            voiceProfileMappingsApplied: data.voiceProfileMappingsApplied || 0,
            auditoryModeUsed: data.auditoryModeUsed || false,

            // Timing
            compilationTimeMs: data.compilationTimeMs || 0,
            executionTimeMs: data.executionTimeMs || 0,

            // Auto-corrections
            autoCorrections: data.autoCorrections || 0,
        }

        this.events.push(event)
        this._persist()
    }

    /**
     * Log a disambiguation event
     */
    logDisambiguation(data) {
        if (!hasConsent()) return

        const event = {
            type: 'disambiguation',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            line: data.line,
            pronoun: data.pronoun,
            candidateCount: data.candidates?.length || 0,
            selectedCandidate: data.selectedCandidate || null,
            timeToDecideMs: data.timeToDecideMs || 0,
        }

        this.events.push(event)
        this._persist()
    }

    /**
     * Log a review mode decision
     */
    logReviewDecision(data) {
        if (!hasConsent()) return

        const event = {
            type: 'review_decision',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            totalLines: data.totalLines || 0,
            approvedLines: data.approvedLines || 0,
            rejectedLines: data.rejectedLines || 0,
            skippedLines: data.skippedLines || 0,
            approvedFirstTime: data.approvedFirstTime || false,
            timeToReviewMs: data.timeToReviewMs || 0,
        }

        this.events.push(event)
        this._persist()
    }

    /**
     * Log a voice input event
     */
    logVoiceInput(data) {
        if (!hasConsent()) return

        const event = {
            type: 'voice_input',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            rawTranscript: data.rawTranscript || '',
            cleanedTranscript: data.cleanedTranscript || '',
            fillersRemoved: data.fillersRemoved || 0,
            repeatsCollapsed: data.repeatsCollapsed || 0,
        }

        this.events.push(event)
        this._persist()
    }

    /**
     * Persist events to localStorage
     */
    _persist() {
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
            // Keep last 1000 events max
            const merged = [...existing, ...this.events].slice(-1000)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
            this.events = [] // Flush after persist
        } catch { /* storage full or unavailable */ }
    }

    /**
     * Export all analytics as JSON (for CHI paper data)
     */
    static exportData() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
            return {
                exportedAt: new Date().toISOString(),
                totalEvents: data.length,
                events: data,
                summary: PlaygroundAnalytics.summarize(data),
            }
        } catch { return { events: [], summary: {} } }
    }

    /**
     * Generate summary statistics from analytics data
     * These map directly to CHI paper [POST-LAUNCH] sections
     */
    static summarize(events) {
        const compilations = events.filter(e => e.type === 'compilation')
        const disambiguations = events.filter(e => e.type === 'disambiguation')
        const reviews = events.filter(e => e.type === 'review_decision')
        const voiceInputs = events.filter(e => e.type === 'voice_input')

        // Resolution distribution — CHI Table 5
        const layerCounts = {}
        for (const c of compilations) {
            if (c.toleranceChainPath) {
                for (const [layer, count] of Object.entries(c.toleranceChainPath)) {
                    layerCounts[layer] = (layerCounts[layer] || 0) + count
                }
            }
        }

        // Voice vs text usage
        const voiceCompilations = compilations.filter(c => c.inputMode === 'voice').length
        const textCompilations = compilations.filter(c => c.inputMode === 'text').length

        // Review mode approval rate
        const reviewsApprovedFirst = reviews.filter(r => r.approvedFirstTime).length

        return {
            // Overview
            totalCompilations: compilations.length,
            uniqueSessions: new Set(compilations.map(c => c.sessionId)).size,

            // Resolution distribution (CHI Table 5)
            layerDistribution: layerCounts,
            averageConfidence: compilations.length > 0
                ? Math.round((compilations.reduce((s, c) => s + (c.averageConfidence || 0), 0) / compilations.length) * 100) / 100
                : 0,

            // Input modes
            voiceCompilations,
            textCompilations,
            voiceInputRatio: compilations.length > 0
                ? Math.round((voiceCompilations / compilations.length) * 100) : 0,

            // Disambiguation (CHI §5.5)
            totalDisambiguations: disambiguations.length,
            avgTimeToDisambiguate: disambiguations.length > 0
                ? Math.round(disambiguations.reduce((s, d) => s + d.timeToDecideMs, 0) / disambiguations.length)
                : 0,

            // Review mode (CHI §8.3)
            totalReviewsSeen: reviews.length,
            firstTimeApprovalRate: reviews.length > 0
                ? Math.round((reviewsApprovedFirst / reviews.length) * 100) : 0,

            // Manifest cache hits
            totalManifestHits: compilations.reduce((s, c) => s + (c.manifestHits || 0), 0),

            // Voice cleanup
            totalVoiceInputs: voiceInputs.length,
        }
    }

    /**
     * Clear all analytics data
     */
    static clearData() {
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* no-op */ }
    }
}
