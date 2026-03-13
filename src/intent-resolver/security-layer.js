/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Security Layer
 *  11 threat categories + Guardian Output Scanner scaffold
 *  Checks every AST node before it reaches the transpiler
 * ═══════════════════════════════════════════════════════════
 */

/* ── Threat Categories ───────────────────────────────── */
export const THREAT_CATEGORIES = {
    FILE_DESTRUCTION: { level: 'BLOCK', code: 'LUME-E003', label: 'File system destruction' },
    CREDENTIAL_EXPOSURE: { level: 'BLOCK', code: 'LUME-E003', label: 'Credential exposure' },
    NETWORK_EXFILTRATION: { level: 'WARNING', code: 'LUME-W004', label: 'Network exfiltration' },
    DATABASE_DESTRUCTION: { level: 'CONFIRM', code: 'LUME-W004', label: 'Database destruction' },
    INFINITE_OPERATIONS: { level: 'WARNING', code: 'LUME-W004', label: 'Infinite operations' },
    SYSTEM_COMMANDS: { level: 'BLOCK', code: 'LUME-E003', label: 'System command execution' },
    SEMANTIC_CAMOUFLAGE: { level: 'BLOCK', code: 'LUME-E003', label: 'Semantic camouflage' },
    NL_INJECTION: { level: 'BLOCK', code: 'LUME-E003', label: 'Natural language injection' },
    PRIVILEGE_ESCALATION: { level: 'CONFIRM', code: 'LUME-W004', label: 'Privilege escalation' },
    MASS_OPERATIONS: { level: 'WARNING', code: 'LUME-W004', label: 'Mass operations' },
    RESOURCE_EXHAUSTION: { level: 'BLOCK', code: 'LUME-E003', label: 'Resource exhaustion' },
}

/* ── Detection Patterns (input-level) ────────────────── */
const DESTRUCTIVE_PATTERNS = [
    /\b(?:delete|remove|destroy|erase|clear|wipe|purge|drop)\s+(?:all|every|entire|whole)\b/i,
    /\b(?:wipe|nuke|erase)\s+(?:the\s+)?(?:drive|disk|system|directory|folder|files?)\b/i,
    /\bformat\s+(?:the\s+)?(?:drive|disk|hard)\b/i,
    /\brm\s+-rf\b/i,
    /\bdel\s+\/[sfq]/i,
]

const CREDENTIAL_PATTERNS = [
    /\b(?:show|display|print|log|send|output|expose)\s+(?:the\s+)?(?:api[_ ]?key|password|secret|token|credential|private[_ ]?key)\b/i,
    /\b(?:send|post|push|upload)\s+.*(?:password|secret|key|token|credential)\b/i,
    /\bprocess\.env\b.*(?:send|output|show|log)/i,
]

const EXFILTRATION_PATTERNS = [
    /\b(?:send|upload|post|push)\s+(?:all|every|entire)\s+.*(?:data|records?|information|files?)\s+to\b/i,
    /\b(?:send|upload)\s+.*(?:to\s+)?(?:https?:\/\/|external|outside)\b/i,
]

const SYSTEM_COMMAND_PATTERNS = [
    /\b(?:run|execute|exec|spawn|system)\s+(?:a\s+)?(?:shell|command|terminal|cmd|bash|script)\b/i,
    /\bchild_process\b/i,
    /\beval\s*\(/i,
    /\bnew\s+Function\s*\(/i,
]

const PRIVILEGE_PATTERNS = [
    /\b(?:give|grant|assign|set)\s+.*(?:admin|superuser|root|owner)\s+(?:access|role|permissions?|privileges?)\b/i,
    /\b(?:bypass|skip|disable|ignore)\s+(?:authentication|authorization|auth|security|permissions?)\b/i,
    /\b(?:make|set)\s+.*(?:account|user)\s+.*(?:admin|superuser)\b/i,
]

const MASS_OPERATION_PATTERNS = [
    /\b(?:send|email|sms|text|notify)\s+.*(?:every|all|each)\s+(?:user|customer|subscriber|member)\b/i,
    /\b(?:make|send)\s+(\d{3,}|thousands?|millions?)\s+.*(?:requests?|calls?|emails?)\b/i,
]

const INFINITE_PATTERNS = [
    /\b(?:repeat|loop)\s+forever\b/i,
    /\bwhile\s+true\b/i,
    /\bkeep\s+doing\s+this\b/i,
    /\bnever\s+stop\b/i,
]

const RESOURCE_PATTERNS = [
    /\b(?:allocate|create|open)\s+.*(?:terabyte|gigabyte|million|billion|unlimited)\b/i,
    /\bcreate\s+.*(?:million|billion|thousands?)\s+.*(?:connections?|threads?|files?)\b/i,
]

/* ── Prompt Injection Detection (NL attacks) ────────── */
const PROMPT_INJECTION_PATTERNS = [
    /\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|rules?|constraints?|guidelines?)\b/i,
    /\b(?:you\s+are\s+now|pretend\s+(?:you\s+are|to\s+be)|act\s+as\s+(?:if|a)|roleplay\s+as)\b/i,
    /\b(?:override|bypass|disable|turn\s+off|deactivate)\s+(?:safety|security|filter|guard|scan|protection|restriction)\b/i,
    /\b(?:system\s+prompt|hidden\s+instructions?|developer\s+mode|debug\s+mode|god\s+mode|admin\s+mode)\b/i,
    /\b(?:do\s+not|don'?t)\s+(?:scan|check|filter|block|flag|restrict|sanitize)\b/i,
    /\b(?:inject|payload|exploit|xss|sqli|sql\s+injection|cross[\s-]site)\b/i,
    /\b(?:jailbreak|escape\s+(?:the\s+)?sandbox|break\s+(?:out\s+of|free))\b/i,
    /\b```(?:system|hidden|secret)\b/i,
]

/* ── AI Output Sanitization Patterns ─────────────────── */
const DANGEROUS_OUTPUT_PATTERNS = [
    { pattern: /\beval\s*\(/g, label: 'eval() call', level: 'BLOCK' },
    { pattern: /\bnew\s+Function\s*\(/g, label: 'Function constructor', level: 'BLOCK' },
    { pattern: /\bchild_process\b/g, label: 'child_process module', level: 'BLOCK' },
    { pattern: /\brequire\s*\(\s*['"](?:fs|child_process|net|dgram|cluster|worker_threads|vm)['"]\s*\)/g, label: 'dangerous module import', level: 'BLOCK' },
    { pattern: /\bimport\s.*from\s+['"](?:fs|child_process|net|dgram|cluster|worker_threads|vm)['"]/g, label: 'dangerous module import', level: 'BLOCK' },
    { pattern: /\bprocess\.exit\b/g, label: 'process.exit call', level: 'WARNING' },
    { pattern: /\bprocess\.env\b/g, label: 'environment variable access', level: 'WARNING' },
    { pattern: /\b__proto__\b|\bconstructor\s*\[/g, label: 'prototype pollution', level: 'BLOCK' },
    { pattern: /\bglobalThis\b|\bglobal\.\b/g, label: 'global scope access', level: 'WARNING' },
    { pattern: /\bdocument\.write\b|\binnerHTML\s*=/g, label: 'unsafe DOM write', level: 'WARNING' },
    { pattern: /\bFetch\s*\(|XMLHttpRequest/g, label: 'network request in output', level: 'WARNING' },
]

/* ── Rate Limiting Thresholds ────────────────────────── */
const AI_CALL_LIMIT = 10
const AI_CALL_PATTERN = /\b(?:ask|think|generate)\s+(?:gpt|claude|gemini|o1|o3|llm|ai)\b/gi

/* ── Main Security Check ─────────────────────────────── */

/**
 * Check an input line for security threats.
 * Returns { safe: boolean, threats: Array<{category, level, message}> }
 */
export function checkSecurity(input, config = {}) {
    if (config.unsafeMode) return { safe: true, threats: [] }

    const threats = []

    // File destruction
    for (const p of DESTRUCTIVE_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'FILE_DESTRUCTION', ...THREAT_CATEGORIES.FILE_DESTRUCTION, message: `Destructive operation detected: "${input}"` })
    }

    // Credential exposure
    for (const p of CREDENTIAL_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'CREDENTIAL_EXPOSURE', ...THREAT_CATEGORIES.CREDENTIAL_EXPOSURE, message: `Credential exposure risk: "${input}"` })
    }

    // Network exfiltration
    for (const p of EXFILTRATION_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'NETWORK_EXFILTRATION', ...THREAT_CATEGORIES.NETWORK_EXFILTRATION, message: `Data exfiltration risk: "${input}"` })
    }

    // System commands
    for (const p of SYSTEM_COMMAND_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'SYSTEM_COMMANDS', ...THREAT_CATEGORIES.SYSTEM_COMMANDS, message: `System command execution blocked: "${input}"` })
    }

    // Privilege escalation
    for (const p of PRIVILEGE_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'PRIVILEGE_ESCALATION', ...THREAT_CATEGORIES.PRIVILEGE_ESCALATION, message: `Privilege escalation detected: "${input}"` })
    }

    // Mass operations
    for (const p of MASS_OPERATION_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'MASS_OPERATIONS', ...THREAT_CATEGORIES.MASS_OPERATIONS, message: `Mass operation detected: "${input}"` })
    }

    // Infinite operations
    for (const p of INFINITE_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'INFINITE_OPERATIONS', ...THREAT_CATEGORIES.INFINITE_OPERATIONS, message: `Infinite operation detected: "${input}". Add a stop condition.` })
    }

    // Resource exhaustion
    for (const p of RESOURCE_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'RESOURCE_EXHAUSTION', ...THREAT_CATEGORIES.RESOURCE_EXHAUSTION, message: `Resource exhaustion risk: "${input}"` })
    }

    // Prompt injection (NL attacks)
    for (const p of PROMPT_INJECTION_PATTERNS) {
        if (p.test(input)) threats.push({ category: 'NL_INJECTION', ...THREAT_CATEGORIES.NL_INJECTION, message: `Prompt injection attempt detected: "${input}"` })
    }

    return {
        safe: threats.length === 0,
        threats,
        blocked: threats.some(t => t.level === 'BLOCK'),
        needsConfirmation: threats.some(t => t.level === 'CONFIRM'),
    }
}

/**
 * Scan generated JavaScript output for dangerous patterns.
 * Called after transpilation to catch unsafe code that may have slipped through.
 * Returns { safe, threats: Array<{line, pattern, level, message}> }
 */
export function scanGeneratedCode(js, config = {}) {
    if (config.unsafeMode) return { safe: true, threats: [] }

    const threats = []
    const lines = js.split('\n')

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const { pattern, label, level } of DANGEROUS_OUTPUT_PATTERNS) {
            // Reset lastIndex for global regexes
            pattern.lastIndex = 0
            if (pattern.test(line)) {
                threats.push({
                    line: i + 1,
                    pattern: label,
                    level,
                    message: `Dangerous pattern "${label}" found in compiled output at line ${i + 1}`,
                    code: line.trim().substring(0, 80),
                })
            }
        }
    }

    return {
        safe: threats.length === 0,
        threats,
        blocked: threats.some(t => t.level === 'BLOCK'),
        summary: {
            blocked: threats.filter(t => t.level === 'BLOCK').length,
            warnings: threats.filter(t => t.level === 'WARNING').length,
        },
    }
}

/**
 * Check a source file for excessive AI call usage (rate limiting).
 * Returns { withinLimit, count, limit, message }
 */
export function checkAIRateLimit(source, config = {}) {
    const limit = config.aiCallLimit || AI_CALL_LIMIT
    const matches = source.match(AI_CALL_PATTERN) || []
    const count = matches.length

    return {
        withinLimit: count <= limit,
        count,
        limit,
        message: count > limit
            ? `${count} AI calls detected (limit: ${limit}). This may cause excessive API usage and costs. Consider refactoring.`
            : null,
    }
}

/**
 * Check an AST node for security issues (Guardian Output Scanner — live scanning)
 */
export function scanASTNode(node, config = {}) {
    const threats = []

    if (node.type === 'DeleteOperation' && !node.filter) {
        threats.push({ category: 'DATABASE_DESTRUCTION', ...THREAT_CATEGORIES.DATABASE_DESTRUCTION, message: `Unfiltered delete on "${node.target}" — this will delete ALL records.` })
    }

    if (node.type === 'SendOperation' && node.target) {
        const allowed = config.allowedDomains || ['localhost']
        const isAllowed = allowed.some(d => node.target.includes(d))
        if (!isAllowed) {
            threats.push({ category: 'NETWORK_EXFILTRATION', ...THREAT_CATEGORIES.NETWORK_EXFILTRATION, message: `Network request to undeclared domain: ${node.target}` })
        }
    }

    return { safe: threats.length === 0, threats }
}

/**
 * Full security audit of a source file + compiled output.
 * Runs all three layers: input scan, output scan, rate limit check.
 */
export function fullSecurityAudit(source, compiledJs, config = {}) {
    const inputLines = source.split('\n').filter(l => l.trim())
    const inputThreats = []

    for (let i = 0; i < inputLines.length; i++) {
        const result = checkSecurity(inputLines[i], config)
        if (!result.safe) {
            for (const t of result.threats) {
                inputThreats.push({ ...t, line: i + 1, source: inputLines[i] })
            }
        }
    }

    const outputScan = compiledJs ? scanGeneratedCode(compiledJs, config) : { safe: true, threats: [] }
    const rateLimit = checkAIRateLimit(source, config)

    const allThreats = [...inputThreats, ...outputScan.threats]
    const blocked = allThreats.some(t => t.level === 'BLOCK')

    return {
        safe: allThreats.length === 0 && rateLimit.withinLimit,
        blocked,
        inputThreats,
        outputThreats: outputScan.threats,
        rateLimit,
        summary: {
            totalThreats: allThreats.length,
            blocked: allThreats.filter(t => t.level === 'BLOCK').length,
            warnings: allThreats.filter(t => t.level === 'WARNING' || t.level === 'CONFIRM').length,
            aiCalls: rateLimit.count,
        },
    }
}

/**
 * Generate a security certificate header for compiled output
 */
export function generateCertificate(file, nodeCount, rawBlockCount, scanLevel, hash) {
    return `/**
 * LUME SECURITY CERTIFIED
 * Source: ${file}
 * AST nodes scanned: ${nodeCount}/${nodeCount} passed
 * Raw blocks scanned: ${rawBlockCount}/${rawBlockCount} passed
 * Scan level: ${scanLevel}
 * Compiled: ${new Date().toISOString()}
 * Certificate hash: ${hash}
 * Verify: lume verify --hash ${hash}
 */`
}

/**
 * Format threat for compiler output
 */
export function formatThreat(threat, lineNum) {
    const prefix = threat.level === 'BLOCK' ? '✖' : threat.level === 'CONFIRM' ? '⚠' : '△'
    return `  [guardian] Line ${lineNum}: ${prefix} ${threat.label}\n    ${threat.message}\n    Action: ${threat.level === 'BLOCK' ? 'BLOCKED' : threat.level === 'CONFIRM' ? 'Requires confirmation (y/n)' : 'Warning — review recommended'}`
}
