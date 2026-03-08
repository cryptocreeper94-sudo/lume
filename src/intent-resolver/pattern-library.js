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

    // ══════════════════════════════════════════════
    //  PHASE 14A: Expanded Patterns
    // ══════════════════════════════════════════════

    // ── MATH: Add ──
    {
        match: /^(?:add|plus)\s+(.+?)\s+(?:to|and)\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: '+', left: m[2].trim(), right: m[1].trim() }),
        tags: ['math']
    },

    // ── MATH: Subtract ──
    {
        match: /^(?:subtract|minus|take)\s+(.+?)\s+from\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: '-', left: m[2].trim(), right: m[1].trim() }),
        tags: ['math']
    },

    // ── MATH: Multiply ──
    {
        match: /^(?:multiply)\s+(.+?)\s+(?:by|times)\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: '*', left: m[1].trim(), right: m[2].trim() }),
        tags: ['math']
    },

    // ── MATH: Divide ──
    {
        match: /^(?:divide)\s+(.+?)\s+by\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: '/', left: m[1].trim(), right: m[2].trim() }),
        tags: ['math']
    },

    // ── STRING: Combine ──
    {
        match: /^(?:combine|concatenate|join|merge)\s+(.+?)\s+(?:and|with|,)\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: '+', left: m[1].trim(), right: m[2].trim(), hint: 'string' }),
        tags: ['string']
    },

    // ── STRING: Split ──
    {
        match: /^(?:split|break|divide)\s+(?:the\s+)?(.+?)\s+(?:by|on|at|using)\s+(.+)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'split', object: slugify(m[1]), args: [m[2].trim()] }),
        tags: ['string']
    },

    // ── STRING: Replace ──
    {
        match: /^(?:replace)\s+(.+?)\s+with\s+(.+?)\s+in\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'replace', object: slugify(m[3]), args: [m[1].trim(), m[2].trim()] }),
        tags: ['string']
    },

    // ── ARRAY: Add to list ──
    {
        match: /^(?:add|push|append)\s+(.+?)\s+to\s+(?:the\s+)?(?:list|array|collection)\s*(?:of\s+)?(.+)?$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'push', object: m[2] ? slugify(m[2]) : 'list', args: [m[1].trim()] }),
        tags: ['array']
    },

    // ── ARRAY: Remove from list ──
    {
        match: /^(?:remove|pop|take out)\s+(.+?)\s+from\s+(?:the\s+)?(?:list|array|collection)\s*(?:of\s+)?(.+)?$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'remove', object: m[2] ? slugify(m[2]) : 'list', args: [m[1].trim()] }),
        tags: ['array']
    },

    // ── ARRAY: Count ──
    {
        match: /^(?:count|how many)\s+(?:the\s+)?(?:items?\s+in\s+)?(?:the\s+)?(.+?)(?:\s+in\s+(?:the\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'MemberExpression', object: slugify(m[2] || m[1]), property: 'length' }),
        tags: ['array']
    },

    // ── UI: Make bigger/smaller (M10 integration) ──
    {
        match: /^(?:make)\s+(?:the\s+)?(.+?)\s+(bigger|smaller|larger|tiny|huge|bold|italic|rounded|hidden|visible)$/i,
        resolve: (m) => ({ type: 'StyleOperation', target: slugify(m[1]), style: m[2].toLowerCase() }),
        tags: ['ui', 'style']
    },

    // ── UI: Center/align (M10 integration) ──
    {
        match: /^(?:center|align|move)\s+(?:the\s+)?(.+?)(?:\s+(?:to\s+)?(?:the\s+)?(left|right|center|top|bottom))?$/i,
        resolve: (m) => ({ type: 'SpatialOperation', target: slugify(m[1]), position: m[2] || 'center' }),
        tags: ['ui', 'layout']
    },

    // ── UI: Hide/Show ──
    {
        match: /^(?:hide|toggle)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'StyleOperation', target: slugify(m[1]), style: 'hidden' }),
        tags: ['ui', 'visibility']
    },

    // ── VALIDATION ──
    {
        match: /^(?:check|make sure|ensure|verify|validate)\s+(?:that\s+)?(?:the\s+)?(.+?)\s+(?:is\s+)?(?:not\s+)?(empty|null|valid|a number|present|defined|undefined|zero)$/i,
        resolve: (m) => ({ type: 'ValidationCheck', target: slugify(m[1]), check: m[2].toLowerCase(), negated: m[0].toLowerCase().includes('not') }),
        tags: ['validation']
    },

    // ── ERROR HANDLING: Try/Fail ──
    {
        match: /^(?:try to|attempt to)\s+(.+?)(?:\s+or\s+(?:fail|error|throw)\s+(?:with\s+)?(.+))?$/i,
        resolve: (m) => ({ type: 'TryBlock', action: m[1], fallback: m[2] || null }),
        tags: ['error', 'control']
    },

    // ══════════════════════════════════════════════
    //  PHASE 14B: HTTP, Comparison, Logging, etc.
    // ══════════════════════════════════════════════

    // ── HTTP: Fetch/GET ──
    {
        match: /^(?:fetch|get|request|call)\s+(?:data\s+from\s+)?(?:the\s+)?(?:url|api|endpoint)?\s*["\u2018\u201c]?([^\u201d"\u2019]+)["\u2019\u201d]?\s*(?:as\s+(json|text|html))?$/i,
        resolve: (m) => ({ type: 'FetchExpression', url: m[1].trim(), format: m[2] || 'json', method: 'GET' }),
        tags: ['network', 'http']
    },

    // ── HTTP: POST ──
    {
        match: /^(?:post|send|submit)\s+(?:data\s+)?to\s+["\u2018\u201c]?([^\u201d"\u2019]+)["\u2019\u201d]?\s*(?:with\s+(.+))?$/i,
        resolve: (m) => ({ type: 'FetchExpression', url: m[1].trim(), method: 'POST', body: m[2] || null }),
        tags: ['network', 'http']
    },

    // ── COMPARE: Equals ──
    {
        match: /^(?:check\s+)?(?:if\s+)?(?:the\s+)?(.+?)\s+(?:is\s+)?(?:equal\s+to|equals?|==|===|the same as)\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: '===', left: slugify(m[1]), right: m[2].trim() }),
        tags: ['comparison']
    },

    // ── COMPARE: Greater/Less ──
    {
        match: /^(?:check\s+)?(?:if\s+)?(?:the\s+)?(.+?)\s+is\s+(greater|less|more|fewer|bigger|smaller)\s+than\s+(.+)$/i,
        resolve: (m) => ({ type: 'BinaryExpression', operator: m[2].match(/greater|more|bigger/) ? '>' : '<', left: slugify(m[1]), right: m[3].trim() }),
        tags: ['comparison']
    },

    // ── COMPARE: Contains ──
    {
        match: /^(?:check\s+)?(?:if\s+)?(?:the\s+)?(.+?)\s+(?:contains?|includes?|has)\s+(.+)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'includes', object: slugify(m[1]), args: [m[2].trim()] }),
        tags: ['comparison', 'string']
    },

    // ── LOG: Console output ──
    {
        match: /^(?:log|debug|trace|console\.log)\s+(.+)$/i,
        resolve: (m) => ({ type: 'ShowStatement', value: m[1], target: 'console' }),
        tags: ['output', 'debug']
    },

    // ── LOG: Warn ──
    {
        match: /^(?:warn|warning)\s+(.+)$/i,
        resolve: (m) => ({ type: 'ShowStatement', value: m[1], target: 'console.warn' }),
        tags: ['output', 'debug']
    },

    // ── CONVERT: To number ──
    {
        match: /^(?:convert|turn|cast|parse)\s+(?:the\s+)?(.+?)\s+(?:to|into)\s+(?:a\s+)?(number|integer|int|float|decimal)$/i,
        resolve: (m) => ({ type: 'ConvertExpression', value: slugify(m[1]), target: 'number' }),
        tags: ['conversion']
    },

    // ── CONVERT: To string ──
    {
        match: /^(?:convert|turn|cast)\s+(?:the\s+)?(.+?)\s+(?:to|into)\s+(?:a\s+)?(string|text)$/i,
        resolve: (m) => ({ type: 'ConvertExpression', value: slugify(m[1]), target: 'string' }),
        tags: ['conversion']
    },

    // ── CONVERT: To boolean ──
    {
        match: /^(?:convert|turn|cast|is)\s+(?:the\s+)?(.+?)\s+(?:to|into)\s+(?:a\s+)?(boolean|bool|true or false)$/i,
        resolve: (m) => ({ type: 'ConvertExpression', value: slugify(m[1]), target: 'boolean' }),
        tags: ['conversion']
    },

    // ── FORMAT: Currency/Date/Number ──
    {
        match: /^(?:format)\s+(?:the\s+)?(.+?)\s+as\s+(?:a\s+)?(currency|date|percentage|number|phone|email)$/i,
        resolve: (m) => ({ type: 'FormatExpression', value: slugify(m[1]), format: m[2].toLowerCase() }),
        tags: ['formatting']
    },

    // ── SCHEDULE: Run later ──
    {
        match: /^(?:schedule|run|execute)\s+(.+?)\s+(?:in|after)\s+(\d+|[a-z]+)\s*(seconds?|minutes?|hours?|days?|ms)$/i,
        resolve: (m) => ({ type: 'ScheduleExpression', action: m[1], delay: parseNumber(m[2]), unit: m[3].replace(/s$/, '') }),
        tags: ['timing', 'async']
    },

    // ── SCHEDULE: Repeat interval ──
    {
        match: /^(?:every|each)\s+(\d+|[a-z]+)\s*(seconds?|minutes?|hours?)\s*,?\s*(.+)$/i,
        resolve: (m) => ({ type: 'IntervalExpression', interval: parseNumber(m[1]), unit: m[2].replace(/s$/, ''), action: m[3] }),
        tags: ['timing', 'loop']
    },

    // ── GROUP BY ──
    {
        match: /^(?:group)\s+(?:the\s+)?(.+?)\s+by\s+(.+)$/i,
        resolve: (m) => ({ type: 'GroupOperation', target: slugify(m[1]), key: slugify(m[2]) }),
        tags: ['data', 'transform']
    },

    // ── MAP: Transform each ──
    {
        match: /^(?:transform|map|convert each|change each)\s+(?:the\s+)?(.+?)\s+(?:to|into)\s+(.+)$/i,
        resolve: (m) => ({ type: 'MapOperation', target: slugify(m[1]), transform: m[2] }),
        tags: ['data', 'transform']
    },

    // ── REDUCE: Calculate total ──
    {
        match: /^(?:calculate|compute|find)\s+(?:the\s+)?(?:total|sum|average|min|max|minimum|maximum)\s+(?:of\s+)?(?:the\s+)?(.+)$/i,
        resolve: (m) => {
            const op = m[0].toLowerCase()
            const agg = op.includes('average') ? 'average' : op.includes('sum') || op.includes('total') ? 'sum' : op.includes('max') ? 'max' : op.includes('min') ? 'min' : 'sum'
            return { type: 'AggregateExpression', operation: agg, target: slugify(m[1]) }
        },
        tags: ['data', 'math']
    },

    // ── UNIQUE / DEDUPLICATE ──
    {
        match: /^(?:get\s+)?(?:unique|distinct|deduplicate|remove duplicates?\s+(?:from|in))\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'UniqueOperation', target: slugify(m[1]) }),
        tags: ['data', 'transform']
    },

    // ── REVERSE ──
    {
        match: /^(?:reverse|flip|invert)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'reverse', object: slugify(m[1]), args: [] }),
        tags: ['data', 'transform']
    },

    // ── FIRST/LAST ──
    {
        match: /^(?:get\s+)?(?:the\s+)?(first|last)\s+(?:(\d+)\s+)?(?:items?\s+)?(?:from|of|in)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'SliceOperation', position: m[1], count: m[2] ? parseInt(m[2]) : 1, target: slugify(m[3]) }),
        tags: ['data', 'access']
    },

    // ── CLONE / COPY ──
    {
        match: /^(?:clone|copy|duplicate)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'CloneOperation', target: slugify(m[1]) }),
        tags: ['data']
    },

    // ── MERGE ──
    {
        match: /^(?:merge|combine|mix)\s+(?:the\s+)?(.+?)\s+(?:and|with|into)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'MergeOperation', left: slugify(m[1]), right: slugify(m[2]) }),
        tags: ['data', 'transform']
    },

    // ── FLATTEN ──
    {
        match: /^(?:flatten)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'flat', object: slugify(m[1]), args: [] }),
        tags: ['data', 'transform']
    },

    // ── PRINT / ALERT ──
    {
        match: /^(?:alert|notify|popup|toast)\s+(.+)$/i,
        resolve: (m) => ({ type: 'ShowStatement', value: m[1], target: 'alert' }),
        tags: ['output', 'ui']
    },

    // ── THROW ERROR ──
    {
        match: /^(?:throw|raise)\s+(?:an?\s+)?(?:error|exception)\s*(?::\s*|with\s+(?:message\s+)?)?(.+)?$/i,
        resolve: (m) => ({ type: 'ThrowStatement', message: m[1] || 'An error occurred' }),
        tags: ['error', 'control']
    },

    // ── IMPORT DEFAULT ──
    {
        match: /^(?:import|require|include)\s+(.+?)$/i,
        resolve: (m) => ({ type: 'UseStatement', name: slugify(m[1]), source: m[1].replace(/['"]/g, '') }),
        tags: ['module']
    },

    // ── ELSE / OTHERWISE ──
    {
        match: /^(?:else|otherwise)\s*,?\s*(.+)?$/i,
        resolve: (m) => ({ type: 'ElseBlock', body: m[1] || null }),
        tags: ['control', 'conditional']
    },

    // ── PIPE VALUE ──
    {
        match: /^(?:pipe|pass|chain)\s+(?:the\s+)?(.+?)\s+(?:through|to|into)\s+(.+)$/i,
        resolve: (m) => ({ type: 'PipeExpression', value: slugify(m[1]), target: m[2] }),
        tags: ['functional']
    },

    // ── CALL FUNCTION ──
    {
        match: /^(?:call|invoke|run|execute)\s+(?:the\s+)?(?:function\s+)?(.+?)(?:\s+with\s+(.+))?$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: slugify(m[1]), args: m[2] ? m[2].split(/,\s*/).map(a => a.trim()) : [] }),
        tags: ['function']
    },

    // ══════════════════════════════════════════════
    //  PHASE 14B-2: Sort, String, Date, Return, Events
    // ══════════════════════════════════════════════

    // ── SORT ──
    {
        match: /^(?:sort)\s+(?:the\s+)?(.+?)\s+(?:by\s+(.+?)\s+)?(ascending|descending|asc|desc|a-z|z-a|newest|oldest|lowest|highest)?$/i,
        resolve: (m) => {
            const dir = m[3] ? (m[3].match(/desc|z-a|newest|highest/) ? 'desc' : 'asc') : 'asc'
            return { type: 'SortOperation', target: slugify(m[1]), key: m[2] ? slugify(m[2]) : null, direction: dir }
        },
        tags: ['data', 'transform']
    },

    // ── SORT: Order by ──
    {
        match: /^(?:order)\s+(?:the\s+)?(.+?)\s+by\s+(.+?)(?:\s+(ascending|descending|asc|desc))?$/i,
        resolve: (m) => ({ type: 'SortOperation', target: slugify(m[1]), key: slugify(m[2]), direction: m[3]?.match(/desc/) ? 'desc' : 'asc' }),
        tags: ['data', 'transform']
    },

    // ── STRING: Uppercase ──
    {
        match: /^(?:make|convert|change)\s+(?:the\s+)?(.+?)\s+(?:to\s+)?(?:upper\s*case|uppercase|all caps|capitalized?)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'toUpperCase', object: slugify(m[1]), args: [] }),
        tags: ['string', 'transform']
    },

    // ── STRING: Lowercase ──
    {
        match: /^(?:make|convert|change)\s+(?:the\s+)?(.+?)\s+(?:to\s+)?(?:lower\s*case|lowercase)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'toLowerCase', object: slugify(m[1]), args: [] }),
        tags: ['string', 'transform']
    },

    // ── STRING: Trim ──
    {
        match: /^(?:trim|strip|clean)\s+(?:the\s+)?(.+?)(?:\s+(?:whitespace|spaces))?$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: 'trim', object: slugify(m[1]), args: [] }),
        tags: ['string', 'transform']
    },

    // ── STRING: Length ──
    {
        match: /^(?:get\s+)?(?:the\s+)?(?:length|size|count)\s+of\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'PropertyAccess', object: slugify(m[1]), property: 'length' }),
        tags: ['string', 'data']
    },

    // ── STRING: Starts/Ends with ──
    {
        match: /^(?:check\s+)?(?:if\s+)?(?:the\s+)?(.+?)\s+(starts?|begins?|ends?)\s+with\s+(.+)$/i,
        resolve: (m) => ({ type: 'CallExpression', callee: m[2].match(/^(start|begin)/) ? 'startsWith' : 'endsWith', object: slugify(m[1]), args: [m[3].trim()] }),
        tags: ['string', 'comparison']
    },

    // ── DATE: Get current ──
    {
        match: /^(?:get\s+)?(?:the\s+)?(?:current\s+)?(?:date and time|datetime|timestamp|time|date|now|today)$/i,
        resolve: (m) => {
            const val = m[0].toLowerCase()
            return { type: 'DateExpression', operation: val.includes('time') && !val.includes('date') ? 'time' : val.includes('today') || val === 'date' ? 'date' : 'now' }
        },
        tags: ['date']
    },

    // ── DATE: Add/Subtract time ──
    {
        match: /^(?:add|subtract)\s+(\d+)\s+(days?|hours?|minutes?|weeks?|months?|years?)\s+(?:to|from)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'DateMathExpression', operation: m[0].toLowerCase().startsWith('add') ? 'add' : 'subtract', amount: parseInt(m[1]), unit: m[2].replace(/s$/, ''), target: slugify(m[3]) }),
        tags: ['date', 'math']
    },

    // ── RETURN ──
    {
        match: /^(?:return|give back|output|yield|result is)\s+(.+)$/i,
        resolve: (m) => ({ type: 'ReturnStatement', value: m[1] }),
        tags: ['control', 'function']
    },

    // ── EVENT: On click ──
    {
        match: /^(?:when|on|if)\s+(?:the\s+)?(.+?)\s+(?:is\s+)?(?:clicked|pressed|tapped|selected|activated)(?:\s*,?\s*(.+))?$/i,
        resolve: (m) => ({ type: 'EventListener', target: slugify(m[1]), event: 'click', handler: m[2] || null }),
        tags: ['event', 'ui']
    },

    // ── EVENT: On hover ──
    {
        match: /^(?:when|on|if)\s+(?:the\s+)?(?:user\s+)?(?:hovers?\s+(?:over\s+)?|mouses?\s+over\s+)(?:the\s+)?(.+?)(?:\s*,?\s*(.+))?$/i,
        resolve: (m) => ({ type: 'EventListener', target: slugify(m[1]), event: 'hover', handler: m[2] || null }),
        tags: ['event', 'ui']
    },

    // ── EVENT: On change ──
    {
        match: /^(?:when|on|if)\s+(?:the\s+)?(.+?)\s+(?:changes?|is\s+(?:updated|modified|changed))(?:\s*,?\s*(.+))?$/i,
        resolve: (m) => ({ type: 'EventListener', target: slugify(m[1]), event: 'change', handler: m[2] || null }),
        tags: ['event', 'ui']
    },

    // ── EVENT: On submit ──
    {
        match: /^(?:when|on|if)\s+(?:the\s+)?(.+?)\s+(?:is\s+)?(?:submitted|sent)(?:\s*,?\s*(.+))?$/i,
        resolve: (m) => ({ type: 'EventListener', target: slugify(m[1]), event: 'submit', handler: m[2] || null }),
        tags: ['event', 'ui']
    },

    // ── EVENT: On load ──
    {
        match: /^(?:when|on|after|once)\s+(?:the\s+)?(?:page|app|window|document)\s+(?:is\s+)?(?:loaded|ready|starts?)(?:\s*,?\s*(.+))?$/i,
        resolve: (m) => ({ type: 'EventListener', target: 'document', event: 'DOMContentLoaded', handler: m[1] || null }),
        tags: ['event', 'lifecycle']
    },

    // ── RANGE: From X to Y ──
    {
        match: /^(?:from|range)\s+(\d+)\s+to\s+(\d+)(?:\s+(?:step|by)\s+(\d+))?$/i,
        resolve: (m) => ({ type: 'RangeExpression', start: parseInt(m[1]), end: parseInt(m[2]), step: m[3] ? parseInt(m[3]) : 1 }),
        tags: ['data', 'loop']
    },

    // ── CONDITIONAL ASSIGN ──
    {
        match: /^(?:set|let|make)\s+(?:the\s+)?(.+?)\s+(?:to|=|be)\s+(.+?)\s+(?:if|when)\s+(.+)$/i,
        resolve: (m) => ({ type: 'ConditionalAssignment', name: slugify(m[1]), value: m[2], condition: m[3] }),
        tags: ['control', 'variable']
    },

    // ── DEFAULT VALUE ──
    {
        match: /^(?:set|let|make)\s+(?:the\s+)?(.+?)\s+(?:to|=|be)\s+(.+?)\s+(?:or|otherwise|else|default(?:ing)?(?:\s+to)?)\s+(.+)$/i,
        resolve: (m) => ({ type: 'DefaultAssignment', name: slugify(m[1]), value: m[2], fallback: m[3] }),
        tags: ['variable']
    },

    // ── EXISTS CHECK ──
    {
        match: /^(?:check\s+)?(?:if\s+)?(?:the\s+)?(.+?)\s+(?:exists?|is\s+(?:defined|available|set|present))$/i,
        resolve: (m) => ({ type: 'ExistsCheck', target: slugify(m[1]) }),
        tags: ['validation']
    },

    // ── TYPE CHECK ──
    {
        match: /^(?:check\s+)?(?:if\s+)?(?:the\s+)?(.+?)\s+is\s+(?:a\s+)?(string|number|boolean|list|array|object|map|function|null|undefined|date)$/i,
        resolve: (m) => ({ type: 'TypeCheck', target: slugify(m[1]), expectedType: m[2].toLowerCase() }),
        tags: ['validation', 'type']
    },

    // ── SWAP ──
    {
        match: /^(?:swap|exchange|switch)\s+(?:the\s+)?(.+?)\s+(?:and|with)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'SwapOperation', left: slugify(m[1]), right: slugify(m[2]) }),
        tags: ['data']
    },

    // ── TOGGLE ──
    {
        match: /^(?:toggle)\s+(?:the\s+)?(.+?)(?:\s+(?:on|off))?$/i,
        resolve: (m) => ({ type: 'ToggleOperation', target: slugify(m[1]) }),
        tags: ['ui', 'state']
    },

    // ── RESET / CLEAR ──
    {
        match: /^(?:reset|clear|empty|initialize|init)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'ResetOperation', target: slugify(m[1]) }),
        tags: ['state']
    },

    // ── INCREMENT / DECREMENT ──
    {
        match: /^(?:increment|increase|bump|add to)\s+(?:the\s+)?(.+?)(?:\s+by\s+(\d+))?$/i,
        resolve: (m) => ({ type: 'IncrementOperation', target: slugify(m[1]), amount: m[2] ? parseInt(m[2]) : 1 }),
        tags: ['math', 'state']
    },
    {
        match: /^(?:decrement|decrease|reduce)\s+(?:the\s+)?(.+?)(?:\s+by\s+(\d+))?$/i,
        resolve: (m) => ({ type: 'DecrementOperation', target: slugify(m[1]), amount: m[2] ? parseInt(m[2]) : 1 }),
        tags: ['math', 'state']
    },

    // ── REDIRECT / NAVIGATE ──
    {
        match: /^(?:redirect|navigate|go)\s+(?:the\s+user\s+)?to\s+(.+)$/i,
        resolve: (m) => ({ type: 'NavigateOperation', target: m[1].replace(/['"]/g, '') }),
        tags: ['navigation', 'ui']
    },

    // ── FOCUS ──
    {
        match: /^(?:focus|focus on|select)\s+(?:the\s+)?(.+)$/i,
        resolve: (m) => ({ type: 'FocusOperation', target: slugify(m[1]) }),
        tags: ['ui']
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
