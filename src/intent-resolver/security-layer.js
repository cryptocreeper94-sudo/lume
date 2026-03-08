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

    return {
        safe: threats.length === 0,
        threats,
        blocked: threats.some(t => t.level === 'BLOCK'),
        needsConfirmation: threats.some(t => t.level === 'CONFIRM'),
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
