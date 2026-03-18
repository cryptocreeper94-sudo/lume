/**
 * ═══════════════════════════════════════════════════════
 *  GAP 12: Testing Framework — Natural Language Tests
 *
 *  - `test "name":` and `describe "group":` blocks
 *  - 20+ assertion patterns → Jest expect() calls
 *  - Setup/teardown: before each/after each/all
 *  - Compiles to valid Jest test suites
 * ═══════════════════════════════════════════════════════
 */

// ── Assertion Pattern Map ──
const ASSERTION_PATTERNS = [
    { regex: /^(.+?)\s+should\s+be\s+greater\s+than\s+(.+)$/i, template: (a, b) => `expect(${a}).toBeGreaterThan(${b});` },
    { regex: /^(.+?)\s+should\s+be\s+less\s+than\s+(.+)$/i, template: (a, b) => `expect(${a}).toBeLessThan(${b});` },
    { regex: /^(.+?)\s+should\s+be\s+between\s+(.+?)\s+and\s+(.+)$/i, template: (a, b, c) => `expect(${a}).toBeGreaterThanOrEqual(${b});\nexpect(${a}).toBeLessThanOrEqual(${c});` },
    { regex: /^(.+?)\s+should\s+not\s+be\s+empty$/i, template: (a) => `expect(${a}.length).toBeGreaterThan(0);` },
    { regex: /^(.+?)\s+should\s+be\s+empty$/i, template: (a) => `expect(${a}).toHaveLength(0);` },
    { regex: /^(.+?)\s+should\s+have\s+(\d+)\s+items?$/i, template: (a, b) => `expect(${a}).toHaveLength(${b});` },
    { regex: /^(.+?)\s+should\s+not?\s+contain\s+(.+)$/i, template: (a, b) => `expect(${a}).toContain(${b});` },
    { regex: /^(.+?)\s+should\s+not?\s+include\s+(.+)$/i, template: (a, b) => `expect(${a}).toContain(${b});` },
    { regex: /^(.+?)\s+should\s+match\s+(.+)$/i, template: (a, b) => `expect(${a}).toMatch(${b});` },
    { regex: /^(.+?)\s+should\s+not\s+be\s+(.+)$/i, template: (a, b) => `expect(${a}).not.toBe(${b});` },
    { regex: /^(.+?)\s+should\s+be\s+true$/i, template: (a) => `expect(${a}).toBe(true);` },
    { regex: /^(.+?)\s+should\s+be\s+false$/i, template: (a) => `expect(${a}).toBe(false);` },
    { regex: /^(.+?)\s+should\s+be\s+null$/i, template: (a) => `expect(${a}).toBeNull();` },
    { regex: /^(.+?)\s+should\s+exist$/i, template: (a) => `expect(${a}).toBeDefined();` },
    { regex: /^(.+?)\s+should\s+not\s+exist$/i, template: (a) => `expect(${a}).toBeUndefined();` },
    { regex: /^(.+?)\s+should\s+equal\s+(.+)$/i, template: (a, b) => `expect(${a}).toEqual(${b});` },
    { regex: /^(.+?)\s+should\s+be\s+(.+)$/i, template: (a, b) => `expect(${a}).toBe(${b});` },
    { regex: /^it\s+should\s+succeed$/i, template: () => `// assertion: no error thrown` },
    { regex: /^it\s+should\s+fail$/i, template: () => `expect(() => { /* action */ }).toThrow();` },
    { regex: /^the\s+error\s+should\s+say\s+["'](.+?)["']$/i, template: (msg) => `expect(__error.message).toBe(${JSON.stringify(msg)});` },
    { regex: /^it\s+should\s+take\s+less\s+than\s+(\d+)\s+milliseconds?$/i, template: (ms) => `expect(Date.now() - __startTime).toBeLessThan(${ms});` },
]

/**
 * Detect test block start: `test "name":`
 */
export function detectTestBlock(line) {
    const match = line.match(/^test\s+["'](.+?)["']\s*:\s*$/i)
    if (match) return { name: match[1] }
    return null
}

/**
 * Detect describe block start: `describe "group":`
 */
export function detectDescribeBlock(line) {
    const match = line.match(/^describe\s+["'](.+?)["']\s*:\s*$/i)
    if (match) return { name: match[1] }
    return null
}

/**
 * Detect setup/teardown
 */
export function detectSetupTeardown(line) {
    const trimmed = line.trim()
    if (/^before\s+each\s+test\s*:/i.test(trimmed)) return { type: 'beforeEach' }
    if (/^after\s+each\s+test\s*:/i.test(trimmed)) return { type: 'afterEach' }
    if (/^before\s+all\s+tests?\s*:/i.test(trimmed)) return { type: 'beforeAll' }
    if (/^after\s+all\s+tests?\s*:/i.test(trimmed)) return { type: 'afterAll' }
    return null
}

/**
 * Parse an assertion line into Jest expect() code
 */
export function parseAssertion(line) {
    const trimmed = line.trim()
    for (const pattern of ASSERTION_PATTERNS) {
        const match = trimmed.match(pattern.regex)
        if (match) {
            const args = match.slice(1).map(a => sanitizeValue(a))
            return { jest: pattern.template(...args), original: trimmed }
        }
    }
    return null // Not an assertion
}

/**
 * Sanitize a value reference for Jest code
 */
function sanitizeValue(val) {
    const trimmed = val.trim()
    // Quoted string
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed
    }
    // Number
    if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed
    // Boolean
    if (trimmed === 'true' || trimmed === 'false') return trimmed
    // null
    if (trimmed === 'null') return 'null'
    // Possessive: "the user's name" → user.name
    const possessive = trimmed.match(/^the\s+(\w+)'s\s+(\w+)$/i)
    if (possessive) return `${possessive[1]}.${possessive[2]}`
    // "the X" → X
    const theMatch = trimmed.match(/^the\s+(.+)$/i)
    if (theMatch) return theMatch[1].replace(/\s+/g, '_')
    // Direct reference
    return trimmed.replace(/\s+/g, '_')
}

/**
 * Parse a complete test block (test "name": + indented body)
 */
export function parseTestBlockFull(lines, startIdx) {
    const header = detectTestBlock(lines[startIdx].trim())
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
        type: 'TestCase',
        name: header.name,
        body: body.map(l => {
            const verification = parseVerify(l)
            if (verification) return verification
            const assertion = parseAssertion(l)
            return assertion || { instruction: l }
        }),
        endIdx: i,
    }
}

/**
 * Parse a complete describe block
 */
export function parseDescribeBlockFull(lines, startIdx) {
    const header = detectDescribeBlock(lines[startIdx].trim())
    if (!header) return null

    const tests = []
    const setup = []
    const teardown = []
    let i = startIdx + 1

    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed) { i++; continue }
        if (!line.startsWith('  ') && !line.startsWith('\t')) break

        // Setup/teardown
        const st = detectSetupTeardown(trimmed)
        if (st) {
            const stBody = []
            let j = i + 1
            while (j < lines.length) {
                const sl = lines[j]
                if (!sl.trim() || (!sl.startsWith('    ') && !sl.startsWith('\t\t'))) break
                stBody.push(sl.trim())
                j++
            }
            if (st.type.startsWith('before')) setup.push({ type: st.type, body: stBody })
            else teardown.push({ type: st.type, body: stBody })
            i = j
            continue
        }

        // Nested test
        const testBlock = parseTestBlockFull(lines, i)
        if (testBlock) {
            tests.push(testBlock)
            i = testBlock.endIdx
            continue
        }

        i++
    }

    return {
        type: 'TestSuite',
        name: header.name,
        tests,
        setup,
        teardown,
        endIdx: i,
    }
}

/**
 * Compile a TestSuite/TestCase to Jest JavaScript
 */
export function compileTestSuite(node) {
    const lines = []

    if (node.type === 'TestSuite') {
        lines.push(`describe('${node.name}', () => {`)
        for (const s of node.setup) {
            lines.push(`  ${s.type}(() => {`)
            for (const b of s.body) lines.push(`    // ${b}`)
            lines.push(`  });`)
        }
        for (const t of node.tests) {
            const testLines = compileTestSuite(t)
            lines.push(...testLines.split('\n').map(l => '  ' + l))
        }
        for (const t of node.teardown) {
            lines.push(`  ${t.type}(() => {`)
            for (const b of t.body) lines.push(`    // ${b}`)
            lines.push(`  });`)
        }
        lines.push(`});`)
    } else if (node.type === 'TestCase') {
        lines.push(`test('${node.name}', async () => {`)
        for (const item of node.body) {
            if (item.jest) {
                lines.push(`  ${item.jest}`)
            } else if (item.verify) {
                lines.push(`  ${item.verify}`)
            } else if (item.instruction) {
                lines.push(`  // ${item.instruction}`)
            }
        }
        lines.push(`});`)
    }

    return lines.join('\n')
}


// ═══════════════════════════════════════════════════════════
//  VERIFY KEYWORD — Natural Language Assertions
//
//  Lume syntax:
//    verify that response.status is 200
//    verify users is not empty
//    verify name contains "John"
//    verify count is greater than 0
//    verify result equals expected
//    verify that logged_in is true
// ═══════════════════════════════════════════════════════════

const VERIFY_PATTERNS = [
    // verify that X is greater/less than Y
    {
        regex: /^verify\s+(?:that\s+)?(.+?)\s+is\s+(greater|less|more|fewer)\s+than\s+(.+)$/i,
        compile: (m) => {
            const op = m[2].match(/greater|more/) ? '>' : '<'
            const opWord = op === '>' ? 'greater than' : 'less than'
            return `if (!(${sanitizeValue(m[1])} ${op} ${sanitizeValue(m[3])})) throw new Error('Verification failed: expected ${m[1].trim()} to be ${opWord} ${m[3].trim()}');`
        }
    },
    // verify that X is not empty
    {
        regex: /^verify\s+(?:that\s+)?(.+?)\s+is\s+not\s+empty$/i,
        compile: (m) => {
            return `if (!${sanitizeValue(m[1])} || (Array.isArray(${sanitizeValue(m[1])}) && ${sanitizeValue(m[1])}.length === 0) || ${sanitizeValue(m[1])}.length === 0) throw new Error('Verification failed: expected ${m[1].trim()} to not be empty');`
        }
    },
    // verify that X is empty
    {
        regex: /^verify\s+(?:that\s+)?(.+?)\s+is\s+empty$/i,
        compile: (m) => {
            return `if (${sanitizeValue(m[1])} && ${sanitizeValue(m[1])}.length > 0) throw new Error('Verification failed: expected ${m[1].trim()} to be empty');`
        }
    },
    // verify that X contains Y
    {
        regex: /^verify\s+(?:that\s+)?(.+?)\s+(?:contains?|includes?|has)\s+(.+)$/i,
        compile: (m) => {
            return `if (!${sanitizeValue(m[1])}.includes(${sanitizeValue(m[2])})) throw new Error('Verification failed: expected ${m[1].trim()} to contain ${m[2].trim()}');`
        }
    },
    // verify that X is not Y
    {
        regex: /^verify\s+(?:that\s+)?(.+?)\s+is\s+not\s+(.+)$/i,
        compile: (m) => {
            return `if (${sanitizeValue(m[1])} === ${sanitizeValue(m[2])}) throw new Error('Verification failed: expected ${m[1].trim()} to NOT be ${m[2].trim()}');`
        }
    },
    // verify that X equals Y / verify that X is Y
    {
        regex: /^verify\s+(?:that\s+)?(.+?)\s+(?:is|equals?|==)\s+(.+)$/i,
        compile: (m) => {
            return `if (${sanitizeValue(m[1])} !== ${sanitizeValue(m[2])}) throw new Error('Verification failed: expected ${m[1].trim()} to be ${m[2].trim()}, got ' + ${sanitizeValue(m[1])});`
        }
    },
    // verify that X (truthy check)
    {
        regex: /^verify\s+(?:that\s+)?(.+)$/i,
        compile: (m) => {
            return `if (!${sanitizeValue(m[1])}) throw new Error('Verification failed: ${m[1].trim()} is not truthy');`
        }
    },
]

/**
 * Detect and parse a verify statement
 */
export function detectVerify(line) {
    const trimmed = line.trim()
    if (!trimmed.match(/^verify\s+/i)) return null

    for (const pattern of VERIFY_PATTERNS) {
        const match = trimmed.match(pattern.regex)
        if (match) {
            return {
                type: 'VerifyExpression',
                original: trimmed,
                compiled: pattern.compile(match),
            }
        }
    }
    return null
}

/**
 * Parse a verify line (for use inside test blocks)
 */
export function parseVerify(line) {
    const result = detectVerify(line)
    if (!result) return null
    return { verify: result.compiled, original: result.original }
}

/**
 * English Mode patterns for verify
 */
export const verifyPatterns = [
    {
        match: /^(?:verify|confirm|assert|ensure|make sure)\s+(?:that\s+)?(.+?)\s+(?:is|equals?)\s+(.+)$/i,
        resolve: (m) => ({ type: 'VerifyExpression', left: m[1], operator: '===', right: m[2] }),
        tags: ['testing', 'verify']
    },
    {
        match: /^(?:verify|confirm|assert|ensure)\s+(?:that\s+)?(.+?)\s+(?:contains?|includes?)\s+(.+)$/i,
        resolve: (m) => ({ type: 'VerifyExpression', left: m[1], operator: 'includes', right: m[2] }),
        tags: ['testing', 'verify']
    },
    {
        match: /^(?:verify|confirm|assert|ensure)\s+(?:that\s+)?(.+?)\s+is\s+not\s+empty$/i,
        resolve: (m) => ({ type: 'VerifyExpression', left: m[1], operator: 'notEmpty' }),
        tags: ['testing', 'verify']
    },
]

