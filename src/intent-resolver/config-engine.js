/**
 * ═══════════════════════════════════════════════════════════
 *  LUME CONFIG ENGINE — Type-Safe Configuration as Code
 *  
 *  Replace YAML/TOML/JSON with natural language config:
 *    config database = postgres at "db.example.com" port 5432
 *    config api_key = env("API_KEY")
 *    config cache = redis with ttl 3600
 *    config server.port = 8080
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Known configuration types with validation rules
 */
const CONFIG_TYPES = {
    postgres: { type: 'database', driver: 'pg', defaultPort: 5432 },
    mysql: { type: 'database', driver: 'mysql2', defaultPort: 3306 },
    mongodb: { type: 'database', driver: 'mongoose', defaultPort: 27017 },
    redis: { type: 'cache', driver: 'ioredis', defaultPort: 6379 },
    sqlite: { type: 'database', driver: 'better-sqlite3', defaultPort: null },
    smtp: { type: 'email', driver: 'nodemailer', defaultPort: 587 },
}

/**
 * Detect config block in Lume source
 */
export function detectConfig(line) {
    const trimmed = line.trim()

    // config <key> = env("<var>")
    const envMatch = trimmed.match(
        /^config\s+([\w.]+)\s*=\s*env\s*\(\s*["'](\w+)["']\s*\)$/i
    )
    if (envMatch) {
        return {
            type: 'ConfigDeclaration',
            key: envMatch[1],
            source: 'env',
            envVar: envMatch[2],
        }
    }

    // config <key> = <service> at "<host>" port <n>
    const serviceMatch = trimmed.match(
        /^config\s+([\w.]+)\s*=\s*(\w+)\s+at\s+["'](.+?)["'](?:\s+port\s+(\d+))?(?:\s+with\s+(.+))?$/i
    )
    if (serviceMatch) {
        const serviceType = serviceMatch[2].toLowerCase()
        const known = CONFIG_TYPES[serviceType]
        return {
            type: 'ConfigDeclaration',
            key: serviceMatch[1],
            service: serviceType,
            host: serviceMatch[3],
            port: serviceMatch[4] ? parseInt(serviceMatch[4]) : (known?.defaultPort || null),
            options: serviceMatch[5] ? parseConfigOptions(serviceMatch[5]) : {},
            driver: known?.driver || null,
        }
    }

    // config <key> = <value> with <options>
    const withMatch = trimmed.match(
        /^config\s+([\w.]+)\s*=\s*(.+?)\s+with\s+(.+)$/i
    )
    if (withMatch) {
        return {
            type: 'ConfigDeclaration',
            key: withMatch[1],
            value: parseConfigValue(withMatch[2]),
            options: parseConfigOptions(withMatch[3]),
        }
    }

    // config <key> = <value>
    const simpleMatch = trimmed.match(
        /^config\s+([\w.]+)\s*=\s*(.+)$/i
    )
    if (simpleMatch) {
        return {
            type: 'ConfigDeclaration',
            key: simpleMatch[1],
            value: parseConfigValue(simpleMatch[2]),
        }
    }

    return null
}

/**
 * Parse config options from "with" clause
 * e.g. "ttl 3600 and max_connections 10" → { ttl: 3600, max_connections: 10 }
 */
function parseConfigOptions(str) {
    const opts = {}
    const pairs = str.split(/\s+and\s+|\s*,\s*/)
    for (const pair of pairs) {
        const match = pair.trim().match(/^(\w+)\s+(.+)$/)
        if (match) {
            opts[match[1]] = parseConfigValue(match[2])
        }
    }
    return opts
}

/**
 * Parse a config value (number, boolean, string, or reference)
 */
function parseConfigValue(str) {
    const trimmed = str.trim()
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed)
    if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed)
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    if (trimmed.startsWith('"') || trimmed.startsWith("'")) return trimmed.slice(1, -1)
    return trimmed
}

/**
 * Compile a ConfigDeclaration to JavaScript
 */
export function compileConfig(node) {
    const lines = []

    if (node.source === 'env') {
        lines.push(`const ${node.key.replace(/\./g, '_')} = process.env.${node.envVar};`)
        lines.push(`if (!${node.key.replace(/\./g, '_')}) throw new Error('Missing env: ${node.envVar}');`)
        return lines.join('\n')
    }

    if (node.service) {
        const varName = node.key.replace(/\./g, '_')
        const opts = JSON.stringify({
            host: node.host,
            port: node.port,
            ...node.options,
        }, null, 2)
        lines.push(`// Lume Config: ${node.service}`)
        lines.push(`const ${varName} = ${opts};`)
        if (node.driver) {
            lines.push(`// Driver: ${node.driver}`)
        }
        return lines.join('\n')
    }

    // Simple value
    const varName = node.key.replace(/\./g, '_')
    const val = typeof node.value === 'string' ? `"${node.value}"` : JSON.stringify(node.value)
    return `const ${varName} = ${val};`
}

/**
 * English Mode patterns for config
 */
export const configPatterns = [
    {
        match: /^(?:set|configure|config)\s+(?:the\s+)?(\w+)\s+(?:to|as)\s+(.+)$/i,
        resolve: (m) => ({ type: 'ConfigDeclaration', key: m[1], value: parseConfigValue(m[2]) }),
        tags: ['config', 'devops']
    },
    {
        match: /^(?:connect|use)\s+(\w+)\s+(?:database|db|cache)\s+at\s+["'](.+?)["']$/i,
        resolve: (m) => ({
            type: 'ConfigDeclaration',
            key: 'database',
            service: m[1].toLowerCase(),
            host: m[2],
            port: CONFIG_TYPES[m[1].toLowerCase()]?.defaultPort || null,
        }),
        tags: ['config', 'database']
    },
    {
        match: /^(?:load|read|get)\s+(?:the\s+)?(\w+)\s+from\s+(?:the\s+)?environment$/i,
        resolve: (m) => ({ type: 'ConfigDeclaration', key: m[1], source: 'env', envVar: m[1].toUpperCase() }),
        tags: ['config', 'env']
    },
]

export { CONFIG_TYPES }
