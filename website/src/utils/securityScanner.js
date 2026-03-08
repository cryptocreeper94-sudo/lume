/**
 * ═══════════════════════════════════════════════════════════
 *  LUME SECURITY SCANNER — Client-Side Guardian
 *  Scans code lines for 11 threat categories and produces
 *  per-line security verdicts + a certificate hash.
 * ═══════════════════════════════════════════════════════════
 */

const THREAT_RULES = [
    {
        id: 'file-destroy', label: 'File Destruction', severity: 'critical',
        pattern: /\b(delete|remove|destroy|erase|wipe|purge)\b.*\b(all|every|system|root|directory|folder|disk)\b/i
    },
    {
        id: 'credential-leak', label: 'Credential Exposure', severity: 'critical',
        pattern: /\b(show|display|print|log|send|expose|output)\b.*\b(password|secret|token|api.?key|credential|private.?key)\b/i
    },
    {
        id: 'privilege-escalation', label: 'Privilege Escalation', severity: 'high',
        pattern: /\b(make|set|grant|give)\b.*\b(admin|root|superuser|owner|all.?permissions?)\b/i
    },
    {
        id: 'resource-exhaust', label: 'Resource Exhaustion', severity: 'high',
        pattern: /\b(infinite|forever|never.?stop|unlimited|endless)\b.*\b(loop|send|create|request|allocat)\b/i
    },
    {
        id: 'exfiltration', label: 'Data Exfiltration', severity: 'critical',
        pattern: /\b(send|post|upload|transmit|export)\b.*\b(all|every|user|customer|personal|private)\b.*\b(external|outside|third.?party|remote)\b/i
    },
    {
        id: 'mass-data', label: 'Mass Data Operation', severity: 'high',
        pattern: /\b(delete|remove|drop|truncate|wipe)\b.*\b(all|every|entire)\b.*\b(record|row|data|table|user|entry|document)\b/i
    },
    {
        id: 'system-mod', label: 'System Modification', severity: 'medium',
        pattern: /\b(change|modify|alter|overwrite)\b.*\b(system|config|environment|registry|kernel)\b/i
    },
    {
        id: 'unauthorized-access', label: 'Unauthorized Access', severity: 'high',
        pattern: /\b(read|access|open|get)\b.*\b(\/etc\/|passwd|shadow|\.ssh|\.env|private|secret)\b/i
    },
    {
        id: 'obfuscation', label: 'Obfuscation Attempt', severity: 'medium',
        pattern: /\b(base64|encode|obfuscate|encrypt|hide|disguise)\b.*\b(command|instruction|code|payload)\b/i
    },
    {
        id: 'injection', label: 'Injection Pattern', severity: 'critical',
        pattern: /\b(inject|execute|eval|exec|run)\b.*\b(sql|command|shell|script|raw|arbitrary)\b/i
    },
    {
        id: 'dos', label: 'Denial of Service', severity: 'high',
        pattern: /\b(send|make|create|generate)\b.*\b(million|billion|thousand|flood|spam|bomb)\b.*\b(request|email|message|packet)\b/i
    },
]

/**
 * Scan a single line for security threats.
 * @param {string} line - Source line
 * @param {number} lineNum - 1-indexed line number
 * @returns {{ lineNum: number, status: 'pass'|'flag'|'warn', threats: Array<{id,label,severity}> }}
 */
export function scanLine(line, lineNum) {
    const threats = []
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('mode:')) {
        return { lineNum, status: 'pass', threats: [] }
    }
    for (const rule of THREAT_RULES) {
        if (rule.pattern.test(trimmed)) {
            threats.push({ id: rule.id, label: rule.label, severity: rule.severity })
        }
    }
    return {
        lineNum,
        status: threats.length > 0 ? (threats.some(t => t.severity === 'critical') ? 'flag' : 'warn') : 'pass',
        threats,
    }
}

/**
 * Scan all lines and produce a full security report.
 * @param {string} source - Full source code
 * @param {string} inputMethod - 'voice' | 'text'
 * @returns {{ results: Array, certificate: object, summary: object }}
 */
export function scanCode(source, inputMethod = 'text') {
    const lines = source.split('\n')
    const results = lines.map((line, i) => scanLine(line, i + 1))

    const passed = results.filter(r => r.status === 'pass').length
    const warned = results.filter(r => r.status === 'warn').length
    const flagged = results.filter(r => r.status === 'flag').length
    const allThreats = results.flatMap(r => r.threats)
    const totalLines = results.length
    const clean = flagged === 0 && warned === 0

    // Generate certificate hash (simplified SHA-like fingerprint)
    const hashInput = source + '|' + new Date().toISOString() + '|' + inputMethod
    let hash = 0
    for (let i = 0; i < hashInput.length; i++) {
        const char = hashInput.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
    }
    const certHash = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12)

    const certificate = {
        status: clean ? 'CERTIFIED' : (flagged > 0 ? 'REJECTED' : 'WARNING'),
        source: `playground (${lines.length} lines)`,
        mode: source.trim().startsWith('mode:') ? 'english' : 'standard',
        scanned: `${passed}/${totalLines} passed`,
        inputMethod,
        timestamp: new Date().toISOString(),
        hash: certHash,
        threats: allThreats.length,
    }

    return {
        results,
        certificate,
        summary: { passed, warned, flagged, total: totalLines, clean, threats: allThreats },
    }
}

/**
 * Generate a certificate comment block for embedding in JS output.
 */
export function formatCertificate(cert) {
    if (cert.status === 'CERTIFIED') {
        return [
            '/**',
            ' * LUME SECURITY CERTIFIED ✓',
            ` * Source: ${cert.source}`,
            ` * Mode: ${cert.mode}`,
            ` * Scanned: ${cert.scanned}`,
            ` * Input: ${cert.inputMethod}`,
            ` * Compiled: ${cert.timestamp}`,
            ` * Hash: ${cert.hash}`,
            ` * Verify: lume verify --hash ${cert.hash}`,
            ' */',
        ].join('\n')
    }
    return [
        '/**',
        ` * LUME SECURITY ${cert.status} ⚠`,
        ` * Source: ${cert.source}`,
        ` * ${cert.threats} threat(s) detected`,
        ` * Compiled: ${cert.timestamp}`,
        ' * This output has NOT been certified.',
        ' */',
    ].join('\n')
}
