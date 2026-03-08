/**
 * ═══════════════════════════════════════════════════════
 *  GAP 13: Environment & Configuration
 *
 *  - "in production:" / "in development:" env blocks
 *  - "get X from the environment" → process.env.X
 *  - "if the X feature is enabled:" → feature flags
 *  - .lume/features.json configuration
 * ═══════════════════════════════════════════════════════
 */

// ── Environment Names ──
const ENV_NAMES = {
    'production': 'production', 'prod': 'production',
    'development': 'development', 'dev': 'development',
    'staging': 'staging', 'stage': 'staging',
    'testing': 'test', 'test': 'test',
    'all environments': '*', 'every environment': '*',
}

/**
 * Detect environment block start: "in production:"
 */
export function detectEnvironmentBlock(line) {
    const match = line.match(/^in\s+(.+?)\s*:\s*$/i)
    if (!match) return null
    const envName = ENV_NAMES[match[1].toLowerCase()]
    if (!envName) return null
    return { environment: envName, rawName: match[1] }
}

/**
 * Parse a complete environment block
 */
export function parseEnvironmentBlock(lines, startIdx) {
    const header = detectEnvironmentBlock(lines[startIdx].trim())
    if (!header) return null

    const body = []
    let i = startIdx + 1
    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed) { i++; continue }
        if (!line.startsWith('  ') && !line.startsWith('\t')) break
        body.push(trimmed)
        i++
    }

    return {
        type: 'EnvironmentBlock',
        environment: header.environment,
        body,
        endIdx: i,
    }
}

/**
 * Detect environment variable reference:
 * "get the database URL from the environment"
 */
export function detectEnvReference(line) {
    // "get X from the environment, ..."
    const match = line.match(/^get\s+(?:the\s+)?(.+?)\s+from\s+the\s+environment(?:,?\s*(.+))?$/i)
    if (!match) return null

    const varName = match[1].trim()
    const suffix = match[2] || ''

    // Parse modifiers
    let failIfMissing = false
    let defaultValue = null

    if (/fail\s+if\s+(?:it'?s?\s+)?missing/i.test(suffix)) {
        failIfMissing = true
    }
    const defaultMatch = suffix.match(/default\s+(?:to\s+)?(.+)/i)
    if (defaultMatch) {
        defaultValue = defaultMatch[1].trim()
        // Strip quotes
        if ((defaultValue.startsWith('"') && defaultValue.endsWith('"')) ||
            (defaultValue.startsWith("'") && defaultValue.endsWith("'"))) {
            defaultValue = defaultValue.slice(1, -1)
        }
    }

    return {
        type: 'EnvVariable',
        name: varName,
        envKey: toEnvKey(varName),
        failIfMissing,
        defaultValue,
    }
}

/**
 * Detect environment check: "if we're in production" / "the environment is production"
 */
export function detectEnvCheck(line) {
    const patterns = [
        /^if\s+(?:we'?re?\s+)?in\s+(\w+)\s*$/i,
        /^(?:the\s+)?environment\s+is\s+(\w+)\s*$/i,
        /^if\s+(?:the\s+)?environment\s+is\s+(\w+)\s*$/i,
    ]
    for (const p of patterns) {
        const match = line.match(p)
        if (match) {
            const env = ENV_NAMES[match[1].toLowerCase()]
            if (env) return { environment: env }
        }
    }
    return null
}

/**
 * Detect feature flag check: "if the X feature is enabled:"
 */
export function detectFeatureFlag(line) {
    const match = line.match(/^if\s+the\s+["']?(.+?)["']?\s+feature\s+is\s+enabled\s*:\s*$/i)
    if (!match) return null
    return {
        type: 'FeatureCheck',
        featureName: match[1],
        envKey: 'FEATURE_' + match[1].toUpperCase().replace(/\s+/g, '_'),
    }
}

/**
 * Load feature configuration from .lume/features.json
 */
export function loadFeatureConfig(projectRoot = '.') {
    try {
        const fs = require('node:fs')
        const path = require('node:path')
        const configPath = path.join(projectRoot, '.lume', 'features.json')
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        }
    } catch { /* ignore */ }
    return { features: {} }
}

/**
 * Compile EnvironmentBlock to JavaScript
 */
export function compileEnvironmentBlock(node) {
    if (node.environment === '*') {
        // "in all environments:" → unconditional
        return node.body.map(l => `// ${l}`).join('\n')
    }
    const lines = []
    lines.push(`if (process.env.NODE_ENV === '${node.environment}') {`)
    for (const action of node.body) {
        lines.push(`  // ${action}`)
    }
    lines.push(`}`)
    return lines.join('\n')
}

/**
 * Compile EnvVariable to JavaScript
 */
export function compileEnvVariable(node) {
    const varName = toCamelCase(node.name)
    let code = `const ${varName} = process.env.${node.envKey}`
    if (node.defaultValue !== null && node.defaultValue !== undefined) {
        code += ` || ${JSON.stringify(node.defaultValue)}`
    }
    code += ';'
    if (node.failIfMissing) {
        code += `\nif (!${varName}) throw new Error('${node.envKey} is required but not set');`
    }
    return code
}

/**
 * Compile FeatureCheck to JavaScript
 */
export function compileFeatureCheck(node, body) {
    const lines = []
    lines.push(`if (process.env.${node.envKey} === 'true') {`)
    for (const action of (body || [])) {
        lines.push(`  // ${action}`)
    }
    lines.push(`}`)
    return lines.join('\n')
}

// ── Helpers ──
function toEnvKey(name) {
    return name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function toCamelCase(str) {
    return str.trim().toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
}
