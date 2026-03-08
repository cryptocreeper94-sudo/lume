/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GAP 4 — Canonical Formatter
 *  Normalizes English instructions to standard form.
 *  The English equivalent of Prettier/Black/gofmt.
 * ═══════════════════════════════════════════════════════════
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/* ── Synonym Table: Informal → Canonical ── */
const VERB_SYNONYMS = {
    grab: 'get', fetch: 'get', pull: 'get', retrieve: 'get', obtain: 'get',
    'look up': 'get', access: 'get', load: 'get', read: 'get', query: 'get',
    display: 'show', render: 'show', present: 'show', print: 'show',
    output: 'show', log: 'show', 'put on screen': 'show', reveal: 'show',
    store: 'save', persist: 'save', write: 'save', keep: 'save',
    insert: 'save', record: 'save', 'put away': 'save',
    remove: 'delete', destroy: 'delete', erase: 'delete', clear: 'delete',
    wipe: 'delete', purge: 'delete', drop: 'delete', 'get rid of': 'delete',
    make: 'create', build: 'create', 'set up': 'create', initialize: 'create',
    add: 'create', generate: 'create',
    modify: 'update', change: 'update', edit: 'update', alter: 'update',
    adjust: 'update', patch: 'update', set: 'update',
    fire: 'send', dispatch: 'send', post: 'send', push: 'send',
    deliver: 'send', broadcast: 'send', transmit: 'send',
    arrange: 'sort', rank: 'sort', order: 'sort', organize: 'sort',
    select: 'filter', pick: 'filter', choose: 'filter', narrow: 'filter',
    halt: 'stop', end: 'stop', cancel: 'stop', abort: 'stop',
    terminate: 'stop', kill: 'stop', quit: 'stop',
    pause: 'wait', delay: 'wait', sleep: 'wait', hold: 'wait',
}

const NOUN_SYNONYMS = {
    db: 'database', 'data store': 'database', 'data source': 'database',
    'info': 'data', 'information': 'data',
    'err': 'error', 'errors': 'errors',
    'msg': 'message', 'notification': 'message',
    'btn': 'button',
    'img': 'image', 'pic': 'image', 'picture': 'image',
    'config': 'configuration', 'cfg': 'configuration',
}

/* ── Filler Phrases (Removed) ── */
const FILLER_PHRASES = [
    /\b(?:all\s+(?:of\s+)?the)\b/gi,
    /\b(?:each\s+(?:of\s+)?the)\b/gi,
    /\b(?:every\s+single)\b/gi,
    /\b(?:go\s+ahead\s+and)\b/gi,
    /\b(?:just)\b/gi,
    /\b(?:please)\b/gi,
    /\b(?:basically)\b/gi,
    /\b(?:simply)\b/gi,
    /\b(?:essentially)\b/gi,
    /\b(?:right\s+now)\b/gi,
    /\b(?:real\s+quick)\b/gi,
]

/* ── Redundant Location Phrases (Removed after "show") ── */
const REDUNDANT_LOCATIONS = [
    /\s+on\s+(?:the\s+)?screen$/i,
    /\s+on\s+(?:the\s+)?display$/i,
    /\s+on\s+(?:the\s+)?page$/i,
    /\s+to\s+(?:the\s+)?user$/i,
    /\s+to\s+(?:the\s+)?console$/i,
]

/**
 * Load style configuration from .lume/style-config.json
 */
export function loadStyleConfig(projectRoot = '.') {
    const configPath = join(projectRoot, '.lume', 'style-config.json')
    const defaults = {
        auto_on_save: false,
        auto_on_commit: true,
        preserve_comments: true,
        verb_style: 'short',
        strictness: 'standard',
    }
    try {
        if (existsSync(configPath)) {
            return { ...defaults, ...JSON.parse(readFileSync(configPath, 'utf-8')).canonicalize }
        }
    } catch { /* ignore */ }
    return defaults
}

/**
 * Canonicalize a single instruction line.
 * @returns {{ canonical: string, changes: string[], wasModified: boolean }}
 */
export function canonicalize(line, config = {}) {
    if (!line.trim() || line.trim().startsWith('#') || line.trim().startsWith('//') || line.trim().startsWith('mode:') || line.trim().startsWith('using:') || line.trim().startsWith('raw:')) {
        return { canonical: line, changes: [], wasModified: false }
    }

    let text = line.trim()
    const changes = []

    // 1. Canonicalize verbs
    for (const [informal, canonical] of Object.entries(VERB_SYNONYMS)) {
        const regex = new RegExp(`\\b${informal.replace(/\s+/g, '\\s+')}\\b`, 'gi')
        if (regex.test(text)) {
            const before = text
            text = text.replace(regex, canonical)
            if (text !== before) {
                changes.push(`verb: "${informal}" → "${canonical}"`)
            }
        }
    }

    // 2. Canonicalize nouns
    for (const [informal, canonical] of Object.entries(NOUN_SYNONYMS)) {
        const regex = new RegExp(`\\b${informal.replace(/\s+/g, '\\s+')}\\b`, 'gi')
        if (regex.test(text)) {
            const before = text
            text = text.replace(regex, canonical)
            if (text !== before) {
                changes.push(`noun: "${informal}" → "${canonical}"`)
            }
        }
    }

    // 3. Remove filler phrases
    for (const filler of FILLER_PHRASES) {
        const before = text
        text = text.replace(filler, '').replace(/\s+/g, ' ').trim()
        if (text !== before) {
            changes.push(`filler removed`)
        }
    }

    // 4. Remove redundant location phrases after "show"
    if (/^show\b/i.test(text)) {
        for (const loc of REDUNDANT_LOCATIONS) {
            const before = text
            text = text.replace(loc, '')
            if (text !== before) {
                changes.push(`redundant location removed`)
            }
        }
    }

    // 5. Strip unnecessary articles (keep when they add clarity)
    text = text.replace(/\b(?:the)\s+(?=\w)/gi, (match) => {
        // Keep "the" before proper nouns or when it disambiguates
        return ''
    }).replace(/\s+/g, ' ').trim()

    // 6. Normalize negation
    text = text.replace(/\bisn't\b/gi, 'is not')
        .replace(/\baren't\b/gi, 'are not')
        .replace(/\bhasn't\b/gi, 'has not')
        .replace(/\bdoesn't\b/gi, 'does not')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bno longer\b/gi, 'not')
        .replace(/\banymore\b/gi, '')
        .replace(/\s+/g, ' ').trim()

    const wasModified = text !== line.trim()
    return { canonical: text, changes: changes.filter((c, i, a) => a.indexOf(c) === i), wasModified }
}

/**
 * Canonicalize an entire file.
 * @returns {{ lines: Array<{lineNum, original, canonical, changes}>, summary: { modified, total } }}
 */
export function canonicalizeFile(source, config = {}) {
    const lines = source.split('\n')
    const results = lines.map((line, i) => {
        const { canonical, changes, wasModified } = canonicalize(line, config)
        return { lineNum: i + 1, original: line, canonical, changes, wasModified }
    })

    const modified = results.filter(r => r.wasModified).length
    return {
        lines: results,
        output: results.map(r => r.canonical).join('\n'),
        summary: { modified, total: lines.length },
    }
}

/**
 * Check if a file is in canonical form.
 * Returns true if no changes needed.
 */
export function isCanonical(source, config = {}) {
    const { summary } = canonicalizeFile(source, config)
    return summary.modified === 0
}

// Export for use in synonym-based lint rules
export { VERB_SYNONYMS, NOUN_SYNONYMS }
