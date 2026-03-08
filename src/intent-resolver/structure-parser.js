/**
 * ═══════════════════════════════════════════════════════
 *  GAP 10: Data Structures — Complex Object Definition
 *
 *  - `[entity] has:` pattern with indented dash-list
 *  - Type keywords: text, number, yes/no, list of, date, one of
 *  - Nested structures, enums, constraints, defaults
 *  - Generates JS classes with constructors + validation
 * ═══════════════════════════════════════════════════════
 */

// ── Type Keyword Map ──
const TYPE_MAP = {
    'text': 'string', 'string': 'string', 'word': 'string', 'name': 'string',
    'number': 'number', 'count': 'number', 'amount': 'number', 'quantity': 'number',
    'age': 'number', 'price': 'number', 'integer': 'number', 'float': 'number',
    'yes/no': 'boolean', 'true/false': 'boolean', 'boolean': 'boolean',
    'date': 'Date', 'time': 'Date', 'timestamp': 'Date', 'when': 'Date',
}

/**
 * Detect structure definition start: "a [entity] has:"
 */
export function detectStructureStart(line) {
    const match = line.match(/^(?:a|an|the)\s+(\w+)\s+has\s*:\s*$/i)
    if (match) return { name: match[1] }
    return null
}

/**
 * Parse a complete structure block from source lines
 */
export function parseStructureBlock(lines, startIdx) {
    const header = detectStructureStart(lines[startIdx].trim())
    if (!header) return null

    const structName = header.name.charAt(0).toUpperCase() + header.name.slice(1)
    const fields = []
    let i = startIdx + 1

    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()

        // Stop at empty line or non-indented non-dash line
        if (!trimmed) { i++; continue }
        if (!trimmed.startsWith('-') && !line.startsWith(' ') && !line.startsWith('\t')) break

        if (trimmed.startsWith('-')) {
            const field = parseFieldLine(trimmed.slice(1).trim())
            if (field) {
                // Check for nested structure
                if (field.nestedStructure) {
                    const nestedResult = parseNestedStructure(lines, i + 1, field.nestedEntityName)
                    if (nestedResult) {
                        field.nestedFields = nestedResult.fields
                        i = nestedResult.endIdx
                    }
                }
                fields.push(field)
            }
        }
        i++
    }

    return {
        type: 'StructureDefinition',
        name: structName,
        fields,
        endIdx: i,
    }
}

/**
 * Parse a single field line: "a name (text, required, default 'unknown')"
 */
function parseFieldLine(line) {
    // "a list of orders, where each order has:" → nested
    const nestedMatch = line.match(/^(?:a\s+)?list\s+of\s+(\w+)(?:s)?,\s*where\s+each\s+(\w+)\s+has\s*:\s*$/i)
    if (nestedMatch) {
        return {
            name: nestedMatch[1].toLowerCase() + 's',
            jsType: 'Array',
            nestedStructure: true,
            nestedEntityName: nestedMatch[2],
        }
    }

    // "a name (text)" or "whether they are active (yes/no)"
    const match = line.match(/^(?:a|an|the|whether\s+\w+\s+(?:is|are|has))\s+(.+?)(?:\s*\(([^)]+)\))?\s*$/i)
    if (!match) {
        // Try simpler pattern: "name (text)"
        const simple = line.match(/^(\w+(?:\s+\w+)?)\s*\(([^)]+)\)\s*$/)
        if (simple) return parseFieldDetails(simple[1].trim(), simple[2])
        // Bare field name
        const bare = line.match(/^(?:a|an|the)\s+(\w+)\s*$/)
        if (bare) return { name: camelCase(bare[1]), jsType: 'any', constraints: [] }
        return null
    }

    const rawName = match[1].trim()
    const details = match[2] || ''

    // "whether they are active" → isActive (boolean)
    if (line.toLowerCase().startsWith('whether')) {
        const boolName = rawName.replace(/^they\s+(?:are|is|has)\s+/i, '')
        return {
            name: 'is' + boolName.charAt(0).toUpperCase() + boolName.slice(1),
            jsType: 'boolean',
            ...parseConstraints(details || 'yes/no'),
        }
    }

    return parseFieldDetails(rawName, details)
}

/**
 * Parse field name + details string
 */
function parseFieldDetails(rawName, details) {
    const name = camelCase(rawName)
    const parts = details ? details.split(',').map(p => p.trim()) : []
    let jsType = 'any'
    const constraints = []
    let defaultValue = undefined
    let enumValues = null
    let isOptional = false
    let isRequired = false

    for (const part of parts) {
        const lower = part.toLowerCase()

        // Type keyword
        if (TYPE_MAP[lower]) { jsType = TYPE_MAP[lower]; continue }
        // List/array type
        const listMatch = part.match(/^(?:list of|collection of|array of|set of)\s+(\w+)$/i)
        if (listMatch) { jsType = 'Array'; continue }
        // Enum: "one of: pending, active, completed"
        const enumMatch = part.match(/^one\s+of:\s*(.+)$/i)
        if (enumMatch) {
            jsType = 'enum'
            enumValues = enumMatch[1].split(',').map(v => v.trim().toLowerCase())
            continue
        }
        // Default
        const defaultMatch = part.match(/^default\s+(.+)$/i)
        if (defaultMatch) { defaultValue = parseDefaultValue(defaultMatch[1]); continue }
        // Required/optional
        if (lower === 'required') { isRequired = true; continue }
        if (lower === 'optional') { isOptional = true; continue }
        // Constraints
        const minLen = part.match(/^at\s+least\s+(\d+)\s+characters?$/i)
        if (minLen) { constraints.push({ type: 'minLength', value: Number(minLen[1]) }); continue }
        const maxLen = part.match(/^at\s+most\s+(\d+)\s+characters?$/i)
        if (maxLen) { constraints.push({ type: 'maxLength', value: Number(maxLen[1]) }); continue }
        const between = part.match(/^between\s+(\d+)\s+and\s+(\d+)$/i)
        if (between) { constraints.push({ type: 'range', min: Number(between[1]), max: Number(between[2]) }); continue }
        const mustContain = part.match(/^must\s+contain\s+(.+)$/i)
        if (mustContain) { constraints.push({ type: 'contains', value: mustContain[1] }); continue }

        // Fallback: try as type
        if (TYPE_MAP[lower]) jsType = TYPE_MAP[lower]
    }

    return { name, jsType, defaultValue, enumValues, constraints, isOptional, isRequired }
}

/**
 * Parse nested structure fields
 */
function parseNestedStructure(lines, startIdx, entityName) {
    const fields = []
    let i = startIdx
    while (i < lines.length) {
        const line = lines[i].trim()
        if (!line) { i++; continue }
        if (!line.startsWith('-')) break
        const field = parseFieldLine(line.slice(1).trim())
        if (field) fields.push(field)
        i++
    }
    return { fields, endIdx: i }
}

/**
 * Parse default value literal
 */
function parseDefaultValue(val) {
    const lower = val.toLowerCase().trim()
    if (lower === 'true' || lower === 'yes') return true
    if (lower === 'false' || lower === 'no') return false
    if (lower === 'null' || lower === 'none') return null
    if (/^\d+$/.test(val)) return Number(val)
    if (/^\d+\.\d+$/.test(val)) return Number(val)
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        return val.slice(1, -1)
    }
    return val.trim()
}

/**
 * Parse constraints from details string
 */
function parseConstraints(details) {
    return { constraints: [] }
}

/**
 * Convert to camelCase
 */
function camelCase(str) {
    return str.trim().toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^[^a-z]/, c => c.toLowerCase())
}

/**
 * Compile a StructureDefinition AST node to JavaScript class source
 */
export function compileStructure(node) {
    const lines = []
    const className = node.name

    // Generate enum constants first
    for (const field of node.fields) {
        if (field.jsType === 'enum' && field.enumValues) {
            const enumName = `${className.toUpperCase()}_${field.name.toUpperCase()}`
            const entries = field.enumValues.map(v => {
                const key = v.toUpperCase().replace(/\s+/g, '_')
                return `${key}: '${v}'`
            })
            lines.push(`const ${enumName} = { ${entries.join(', ')} };`)
        }
    }

    // Generate nested classes
    for (const field of node.fields) {
        if (field.nestedStructure && field.nestedFields) {
            const nestedName = field.nestedEntityName.charAt(0).toUpperCase() + field.nestedEntityName.slice(1)
            lines.push(...generateClass(nestedName, field.nestedFields, className))
        }
    }

    // Generate main class
    lines.push(...generateClass(className, node.fields, null))

    return lines.join('\n')
}

/**
 * Generate a JavaScript class from field definitions
 */
function generateClass(name, fields, parentName) {
    const lines = []
    const nonNested = fields.filter(f => !f.nestedStructure)
    const nested = fields.filter(f => f.nestedStructure)
    const paramNames = [...nonNested, ...nested].map(f => f.name)
    const defaults = nonNested.map(f => {
        if (f.defaultValue !== undefined) return `${f.name} = ${JSON.stringify(f.defaultValue)}`
        if (f.jsType === 'boolean') return `${f.name} = ${f.defaultValue !== undefined ? f.defaultValue : true}`
        if (f.isOptional) return `${f.name} = null`
        return f.name
    })
    const nestedDefaults = nested.map(f => `${f.name} = []`)

    lines.push(`class ${name} {`)
    lines.push(`  constructor({ ${[...defaults, ...nestedDefaults].join(', ')} } = {}) {`)

    // Validation
    for (const field of nonNested) {
        if (field.isRequired) {
            if (field.jsType === 'string') {
                const minLen = field.constraints.find(c => c.type === 'minLength')
                if (minLen) {
                    lines.push(`    if (!${field.name} || ${field.name}.length < ${minLen.value}) throw new Error('${field.name} is required and must be at least ${minLen.value} characters');`)
                } else {
                    lines.push(`    if (!${field.name}) throw new Error('${field.name} is required');`)
                }
            } else {
                lines.push(`    if (${field.name} === undefined || ${field.name} === null) throw new Error('${field.name} is required');`)
            }
        }
        for (const c of (field.constraints || [])) {
            if (c.type === 'contains') {
                lines.push(`    if (${field.name} && !${field.name}.includes('${c.value}')) throw new Error('${field.name} must contain ${c.value}');`)
            }
            if (c.type === 'range') {
                lines.push(`    if (${field.name} !== null && (${field.name} < ${c.min} || ${field.name} > ${c.max})) throw new Error('${field.name} must be between ${c.min} and ${c.max}');`)
            }
        }
        if (field.jsType === 'enum' && field.enumValues) {
            lines.push(`    if (!${JSON.stringify(field.enumValues)}.includes(${field.name})) throw new Error('${field.name} must be one of: ${field.enumValues.join(', ')}');`)
        }
    }

    // Assignments
    for (const field of nonNested) {
        lines.push(`    this.${field.name} = ${field.name};`)
    }
    for (const field of nested) {
        const nestedName = field.nestedEntityName.charAt(0).toUpperCase() + field.nestedEntityName.slice(1)
        lines.push(`    this.${field.name} = ${field.name}.map(o => new ${nestedName}(o));`)
    }

    lines.push(`  }`)
    lines.push(`}`)

    return lines
}
