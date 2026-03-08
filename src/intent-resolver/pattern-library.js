/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Layer A: Pattern Library
 *  Deterministic phrase → AST mappings (no AI needed)
 *  50+ patterns with synonym rings and variable slots
 * ═══════════════════════════════════════════════════════════
 */

/* ── Synonym Rings ────────────────────────────────────── */
export const synonymRings = {
    get: ['get', 'fetch', 'retrieve', 'grab', 'pull', 'obtain', 'access', 'look up', 'find', 'query', 'read', 'load'],
    show: ['show', 'display', 'render', 'present', 'print', 'output', 'log', 'put on screen', 'let me see', 'reveal'],
    save: ['save', 'store', 'persist', 'write', 'keep', 'preserve', 'hang onto', 'put in the database', 'insert', 'record'],
    delete: ['delete', 'remove', 'destroy', 'erase', 'clear', 'wipe', 'purge', 'get rid of', 'throw away', 'drop'],
    create: ['create', 'make', 'build', 'generate', 'construct', 'instantiate', 'spin up', 'set up', 'add', 'new'],
    send: ['send', 'dispatch', 'fire', 'emit', 'transmit', 'broadcast', 'fire off', 'deliver', 'post', 'push'],
    calculate: ['calculate', 'compute', 'process', 'evaluate', 'crunch', 'tally', 'add up', 'figure out', 'sum', 'count'],
    update: ['update', 'modify', 'change', 'edit', 'alter', 'adjust', 'set', 'patch', 'revise'],
    check: ['check', 'verify', 'validate', 'test', 'confirm', 'ensure', 'assert', 'inspect'],
    wait: ['wait', 'pause', 'delay', 'sleep', 'hold', 'hang on'],
    connect: ['connect', 'link', 'join', 'attach', 'bind', 'hook up', 'wire'],
    listen: ['listen', 'watch', 'observe', 'subscribe', 'on', 'when', 'handle'],
    stop: ['stop', 'halt', 'end', 'cancel', 'abort', 'terminate', 'kill', 'quit'],
    sort: ['sort', 'order', 'arrange', 'rank', 'organize'],
    filter: ['filter', 'select', 'pick', 'choose', 'narrow', 'where', 'only'],
    monitor: ['monitor', 'track', 'watch', 'observe', 'keep an eye on', 'supervise'],
    heal: ['heal', 'fix', 'repair', 'recover', 'retry', 'patch things up'],
    optimize: ['optimize', 'improve', 'speed up', 'make faster', 'tune', 'enhance'],
    evolve: ['evolve', 'adapt', 'learn', 'grow', 'upgrade', 'advance'],
}

/**
 * Resolve a word to its canonical synonym ring key.
 * Returns null if no ring matches.
 */
export function resolveVerb(word) {
    const w = word.toLowerCase().trim()
    for (const [canonical, ring] of Object.entries(synonymRings)) {
        if (ring.includes(w)) return canonical
    }
    return null
}

/* ── Pattern Definitions ─────────────────────────────── */
// Each pattern has:
//   match:   regex or function to test input
//   resolve: function returning AST node(s)
//   tags:    categorization for search/docs

export const patterns = [
    // ── GET operations ──
    {
        match: /^(?:get|fetch|retrieve|grab|pull|find|load|read|access|obtain|look up)\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'VariableAccess', target: slugify(m[1]), source: m[2] ? slugify(m[2]) : null }),
        tags: ['data', 'read']
    },

    // ── SHOW / DISPLAY ──
    {
        match: /^(?:show|display|render|print|output|log|present)\s+(?:the\s+)?(.+?)(?:\s+(?:on|in|to)\s+(?:the\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'ShowStatement', value: slugify(m[1]), target: m[2] ? slugify(m[2]) : 'default' }),
        tags: ['output', 'ui']
    },

    // ── SAVE / STORE ──
    {
        match: /^(?:save|store|persist|write|keep|insert|record)\s+(?:the\s+)?(.+?)(?:\s+(?:to|in|into)\s+(?:the\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'StoreOperation', value: slugify(m[1]), target: m[2] ? slugify(m[2]) : 'database' }),
        tags: ['data', 'write']
    },

    // ── DELETE / REMOVE ──
    {
        match: /^(?:delete|remove|destroy|erase|clear|wipe|purge|drop)\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'DeleteOperation', target: slugify(m[1]), source: m[2] ? slugify(m[2]) : null }),
        tags: ['data', 'destructive']
    },

    // ── CREATE / MAKE ──
    {
        match: /^(?:create|make|build|generate|add|set up)\s+(?:a\s+)?(?:new\s+)?(.+?)(?:\s+with\s+(.+))?$/i,
        resolve: (m) => ({ type: 'CreateOperation', target: slugify(m[1]), fields: m[2] ? parseFields(m[2]) : [] }),
        tags: ['data', 'write']
    },

    // ── UPDATE / MODIFY ──
    {
        match: /^(?:update|modify|change|edit|set|adjust|patch)\s+(?:the\s+)?(.+?)(?:\s+to\s+(.+))?$/i,
        resolve: (m) => ({ type: 'UpdateOperation', target: slugify(m[1]), value: m[2] || null }),
        tags: ['data', 'write']
    },

    // ── SEND ──
    {
        match: /^(?:send|fire|dispatch|post|push|deliver|broadcast)\s+(?:an?\s+)?(.+?)(?:\s+to\s+(.+))?$/i,
        resolve: (m) => ({ type: 'SendOperation', payload: slugify(m[1]), target: m[2] || null }),
        tags: ['network', 'action']
    },

    // ── REPEAT / LOOP ──
    {
        match: /^(?:repeat|loop|do)\s+(?:this\s+)?(\d+|[a-z]+)\s*times?$/i,
        resolve: (m) => ({ type: 'RepeatLoop', count: parseNumber(m[1]) }),
        tags: ['control', 'loop']
    },

    // ── FOR EACH ──
    {
        match: /^(?:for each|for every|loop (?:through|over))\s+(.+?)(?:\s+in\s+(?:the\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'ForEachLoop', item: slugify(m[1]), collection: m[2] ? slugify(m[2]) : null }),
        tags: ['control', 'loop']
    },

    // ── WHILE ──
    {
        match: /^(?:while|as long as|keep going (?:while|until))\s+(.+)$/i,
        resolve: (m) => ({ type: 'WhileLoop', condition: m[1] }),
        tags: ['control', 'loop']
    },

    // ── IF / CONDITIONAL ──
    {
        match: /^(?:if|when|check (?:if|whether))\s+(.+?)(?:,?\s*(?:then\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'IfStatement', condition: m[1], body: m[2] || null }),
        tags: ['control', 'conditional']
    },

    // ── WAIT / DELAY ──
    {
        match: /^(?:wait|pause|delay|sleep|hold)\s+(?:for\s+)?(\d+|[a-z]+)\s*(seconds?|milliseconds?|ms|minutes?|mins?|s)$/i,
        resolve: (m) => ({ type: 'DelayStatement', duration: parseDelay(m[1], m[2]) }),
        tags: ['timing']
    },

    // ── SORT ──
    {
        match: /^(?:sort|order|arrange|rank)\s+(?:the\s+)?(.+?)(?:\s+by\s+(.+?))?(?:\s+(ascending|descending|asc|desc))?$/i,
        resolve: (m) => ({ type: 'SortOperation', target: slugify(m[1]), by: m[2] ? slugify(m[2]) : null, order: m[3] ? (m[3].startsWith('desc') ? 'desc' : 'asc') : 'asc' }),
        tags: ['data', 'transform']
    },

    // ── FILTER ──
    {
        match: /^(?:filter|select|pick|choose|narrow)\s+(?:the\s+)?(.+?)(?:\s+(?:where|by|that|who)\s+(.+))?$/i,
        resolve: (m) => ({ type: 'FilterOperation', target: slugify(m[1]), condition: m[2] || null }),
        tags: ['data', 'transform']
    },

    // ── CONNECT ──
    {
        match: /^(?:connect|link|hook up|wire)\s+(?:to\s+)?(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'ConnectionSetup', target: m[1] }),
        tags: ['network', 'setup']
    },

    // ── EVENT LISTENER ──
    {
        match: /^(?:when|on|if)\s+(?:the\s+)?(.+?)\s+(?:is\s+)?(?:clicked|pressed|submitted|changed|loaded|hovered|toggled|selected)/i,
        resolve: (m) => ({ type: 'EventListener', element: slugify(m[1]), event: extractEvent(m[0]) }),
        tags: ['event', 'ui']
    },

    // ── ASK AI ──
    {
        match: /^(?:ask|query|tell)\s+(?:the\s+)?(?:ai|gpt|model|llm|assistant)\s+(?:to\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'AskExpression', prompt: m[1] }),
        tags: ['ai']
    },

    // ── THINK ──
    {
        match: /^(?:think|analyze|consider|reason)\s+(?:about\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'ThinkExpression', input: m[1] }),
        tags: ['ai']
    },

    // ── GENERATE ──
    {
        match: /^(?:generate|produce|create)\s+(?:a\s+)?(.+?)(?:\s+(?:using|with|from)\s+(.+))?$/i,
        resolve: (m) => ({ type: 'GenerateExpression', output: m[1], using: m[2] || null }),
        tags: ['ai']
    },

    // ── IMPORT / USE ──
    {
        match: /^(?:bring in|import|use|get|load)\s+(.+?)\s+from\s+(.+)$/i,
        resolve: (m) => ({ type: 'UseStatement', name: slugify(m[1]), source: m[2].replace(/['"]/g, '') }),
        tags: ['module']
    },

    // ── EXPORT / EXPOSE ──
    {
        match: /^(?:make\s+(?:this|.+?)\s+available|export|expose|share)\s*(?:(?:to\s+)?other\s+files)?(?:\s+(.+))?$/i,
        resolve: (m) => ({ type: 'ExposeStatement', name: m[1] ? slugify(m[1]) : null }),
        tags: ['module']
    },

    // ── REDIRECT / NAVIGATE ──
    {
        match: /^(?:redirect|navigate|go)\s+(?:to\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'NavigateOperation', target: m[1] }),
        tags: ['navigation']
    },

    // ── RETURN ──
    {
        match: /^(?:return|give back|send back|output)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'ReturnStatement', value: m[1] }),
        tags: ['control']
    },

    // ── VARIABLE ASSIGNMENT ──
    {
        match: /^(?:set|let|define|assign)\s+(?:the\s+)?(.+?)\s+(?:to|as|=|equals?)\s+(.+)$/i,
        resolve: (m) => ({ type: 'VariableDeclaration', name: slugify(m[1]), value: m[2] }),
        tags: ['variable']
    },

    // ── FUNCTION DECLARATION ──
    {
        match: /^(?:to|define|create)\s+(?:a\s+)?(?:function\s+)?(?:called\s+|named\s+)?(.+?)(?:\s+that\s+(?:takes|accepts|receives)\s+(.+))?:?$/i,
        resolve: (m) => ({ type: 'FunctionDeclaration', name: slugify(m[1]), params: m[2] ? parseFields(m[2]) : [] }),
        tags: ['function']
    },

    // ── MONITOR (M6 self-sustaining) ──
    {
        match: /^(?:monitor|track|watch|observe|keep an eye on)\s+(?:this\s+)?(?:function|block|code|process)?(.*)$/i,
        resolve: (m) => ({ type: 'MonitorBlock', target: m[1]?.trim() || 'current' }),
        tags: ['runtime', 'self-sustaining']
    },

    // ── HEAL (M6 self-sustaining) ──
    {
        match: /^(?:if\s+(?:this|it)\s+fails?,?\s*)?(?:retry|heal|fix|recover)\s*(?:(\d+)\s*times?)?/i,
        resolve: (m) => ({ type: 'HealBlock', retries: m[1] ? parseInt(m[1]) : 3 }),
        tags: ['runtime', 'self-sustaining']
    },

    // ── OPTIMIZE (M6 self-sustaining) ──
    {
        match: /^(?:optimize|improve|speed up|make faster|tune)\s+(?:this\s+)?(?:for\s+)?(.+)?$/i,
        resolve: (m) => ({ type: 'OptimizeBlock', target: m[1] || 'speed' }),
        tags: ['runtime', 'self-sustaining']
    },

    // ── EVOLVE (M6 self-sustaining) ──
    {
        match: /^(?:evolve|adapt|keep (?:this )?running|watch for (?:security )?updates?|keep (?:this )?updated)/i,
        resolve: () => ({ type: 'EvolveBlock', dependency_updates: true }),
        tags: ['runtime', 'self-sustaining']
    },

    // ── HEALABLE DECORATOR ──
    {
        match: /^(?:keep\s+(?:this\s+)?running\s+even\s+if\s+(?:it\s+)?breaks?|make\s+(?:this\s+)?(?:healable|recoverable|resilient))/i,
        resolve: () => ({ type: 'HealableDecorator' }),
        tags: ['runtime', 'self-sustaining']
    },

    // ── COST TRACKING ──
    {
        match: /^(?:track\s+(?:how\s+much\s+)?(?:this\s+)?costs?|monitor\s+(?:the\s+)?(?:ai\s+)?costs?)/i,
        resolve: () => ({ type: 'MonitorBlock', metrics: ['ai_call_cost'] }),
        tags: ['runtime', 'self-sustaining']
    },

    // ── FALLBACK MODEL ──
    {
        match: /^(?:if\s+(?:the\s+)?(?:ai\s+)?model\s+is\s+down,?\s*)?(?:use|try)\s+(?:a\s+)?(?:backup|fallback)\s*(?:model)?/i,
        resolve: () => ({ type: 'HealBlock', fallback_models: true }),
        tags: ['runtime', 'self-sustaining']
    },
]

/* ── Helpers ──────────────────────────────────────────── */

function slugify(str) {
    if (!str) return ''
    return str.trim()
        .replace(/^(?:the|a|an|my|our|their)\s+/i, '')
        .replace(/[''`]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
}

function parseFields(str) {
    return str.split(/,\s*|\s+and\s+/).map(f => slugify(f)).filter(Boolean)
}

function parseNumber(str) {
    const map = {
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        a: 1, couple: 2, few: 3, several: 5, dozen: 12, hundred: 100, thousand: 1000
    }
    const n = parseInt(str)
    return isNaN(n) ? (map[str.toLowerCase()] || 1) : n
}

function parseDelay(amount, unit) {
    const ms = parseNumber(amount)
    const u = unit.toLowerCase()
    if (u.startsWith('ms') || u.startsWith('milli')) return ms
    if (u.startsWith('min')) return ms * 60000
    return ms * 1000
}

function extractEvent(str) {
    const events = ['clicked', 'pressed', 'submitted', 'changed', 'loaded', 'hovered', 'toggled', 'selected']
    const lower = str.toLowerCase()
    return events.find(e => lower.includes(e)) || 'click'
}

/**
 * Try to match an input string against all patterns.
 * Returns { matched: true, ast, pattern } or { matched: false }
 */
export function matchPattern(input) {
    const trimmed = input.trim()
    for (const p of patterns) {
        const m = trimmed.match(p.match)
        if (m) {
            return { matched: true, ast: p.resolve(m), pattern: p, confidence: 1.0 }
        }
    }
    return { matched: false }
}
