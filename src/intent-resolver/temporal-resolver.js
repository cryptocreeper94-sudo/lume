/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Temporal Resolver
 *  Converts natural language time expressions into dynamic
 *  Date calculations as AST nodes
 * ═══════════════════════════════════════════════════════════
 */

/* ── Temporal Expression Patterns ────────────────────── */
const TEMPORAL_PATTERNS = [
    // Relative days
    { match: /\btoday\b/i, resolve: () => 'new Date(new Date().setHours(0,0,0,0))' },
    { match: /\byesterday\b/i, resolve: () => 'new Date(Date.now() - 86400000)' },
    { match: /\btomorrow\b/i, resolve: () => 'new Date(Date.now() + 86400000)' },

    // Relative periods
    { match: /\blast week\b/i, resolve: () => 'new Date(Date.now() - 7 * 86400000)' },
    { match: /\blast month\b/i, resolve: () => 'new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)' },
    { match: /\blast year\b/i, resolve: () => 'new Date(new Date().getFullYear() - 1, 0, 1)' },
    { match: /\bthis week\b/i, resolve: () => '(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; })()' },
    { match: /\bthis month\b/i, resolve: () => 'new Date(new Date().getFullYear(), new Date().getMonth(), 1)' },
    { match: /\bthis year\b/i, resolve: () => 'new Date(new Date().getFullYear(), 0, 1)' },
    { match: /\bnext week\b/i, resolve: () => 'new Date(Date.now() + 7 * 86400000)' },
    { match: /\bnext month\b/i, resolve: () => 'new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)' },
    { match: /\bnext year\b/i, resolve: () => 'new Date(new Date().getFullYear() + 1, 0, 1)' },

    // "N days/weeks/hours ago"
    {
        match: /(\d+)\s*(days?|weeks?|hours?|minutes?|mins?|months?|years?)\s*ago/i,
        resolve: (m) => `new Date(Date.now() - ${parseTimespan(m[1], m[2])})`
    },

    // "in N days/weeks/hours"
    {
        match: /in\s+(\d+)\s*(days?|weeks?|hours?|minutes?|mins?|months?|years?)/i,
        resolve: (m) => `new Date(Date.now() + ${parseTimespan(m[1], m[2])})`
    },

    // "at Xam/pm tomorrow" / "at X:XX"
    {
        match: /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:tomorrow)?/i,
        resolve: (m) => {
            let h = parseInt(m[1])
            if (m[3]?.toLowerCase() === 'pm' && h < 12) h += 12
            if (m[3]?.toLowerCase() === 'am' && h === 12) h = 0
            const mins = m[2] ? parseInt(m[2]) : 0
            const isTomorrow = /tomorrow/i.test(m.input)
            const dayOffset = isTomorrow ? '+ 86400000' : ''
            return `(() => { const d = new Date(Date.now() ${dayOffset}); d.setHours(${h},${mins},0,0); return d; })()`
        }
    },

    // "every Monday/Tuesday/..." (scheduling)
    {
        match: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        resolve: (m) => {
            const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 }
            return `{ schedule: 'weekly', dayOfWeek: ${days[m[1].toLowerCase()]} }`
        }
    },

    // "between X and Y" (date ranges)
    {
        match: /between\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+and\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
        resolve: (m) => {
            const months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 }
            return `{ range: [new Date(new Date().getFullYear(), ${months[m[1].toLowerCase()]}, 1), new Date(new Date().getFullYear(), ${months[m[2].toLowerCase()] + 1}, 0)] }`
        }
    },

    // "now"
    { match: /\bright now\b|\bcurrently\b|\bat this moment\b/i, resolve: () => 'new Date()' },
]

/**
 * Convert a timespan to milliseconds
 */
function parseTimespan(amount, unit) {
    const n = parseInt(amount)
    const u = unit.toLowerCase().replace(/s$/, '')
    switch (u) {
        case 'minute': case 'min': return `${n} * 60000`
        case 'hour': return `${n} * 3600000`
        case 'day': return `${n} * 86400000`
        case 'week': return `${n} * 604800000`
        case 'month': return `${n} * 2592000000`
        case 'year': return `${n} * 31536000000`
        default: return `${n} * 86400000`
    }
}

/**
 * Detect and resolve temporal expressions in a sentence.
 * Returns { hasTemporalRef, expressions[], resolvedText }
 */
export function resolveTemporal(input) {
    const expressions = []
    let text = input

    for (const p of TEMPORAL_PATTERNS) {
        const m = text.match(p.match)
        if (m) {
            const resolved = p.resolve(m)
            expressions.push({
                original: m[0],
                resolved,
                index: m.index,
            })
        }
    }

    return {
        hasTemporalRef: expressions.length > 0,
        expressions,
        input,
    }
}

/**
 * Check if a sentence contains temporal references
 */
export function hasTemporalExpression(input) {
    return TEMPORAL_PATTERNS.some(p => p.match.test(input))
}
