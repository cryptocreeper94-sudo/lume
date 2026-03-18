/**
 * ═══════════════════════════════════════════════════════════
 *  LUME REVIEW MODE — Human-in-the-Loop Verification
 *  CHI Paper §8.3 — Review Mode: Human-in-the-Loop Verification
 *
 *  "Review Mode presents the compiler's interpretation before
 *   any code is emitted."
 *
 *  This transforms compilation from a black-box process to a
 *  transparent, collaboratively verified one. The developer
 *  reviews the compiler's UNDERSTANDING in plain English —
 *  not the generated code.
 *
 *  Modes:
 *    CLI:        lume compile app.lume --review
 *    Playground: "Approve" modal before sandbox execution
 *    Auditory:   Compiler speaks interpretation, dev approves by voice
 * ═══════════════════════════════════════════════════════════
 */

import readline from 'readline'

/**
 * Format an AST node as a human-readable review entry.
 * This is the core of Review Mode — the compiler explains
 * its interpretation in plain English.
 *
 * @param {object} node - The resolved AST node
 * @param {string} source - The original English source line
 * @returns {object} Structured review entry
 */
export function formatReviewEntry(node, source) {
    const entry = {
        line: node.line,
        source: source.trim(),
        intent: describeIntent(node),
        filter: describeFilter(node),
        resolvedBy: formatLayerName(node.resolvedBy),
        confidence: node.confidence || (node.resolvedBy?.includes('exact') ? 1.0 : node.similarity || 0.95),
        nodeType: node.type,
        risk: assessRisk(node),
    }

    return entry
}

/**
 * Generate a complete review report for an entire compilation.
 *
 * @param {object[]} ast - Array of resolved AST nodes
 * @param {string[]} sourceLines - Original source lines
 * @param {object} stats - Compilation statistics
 * @returns {object} Full review report
 */
export function generateReviewReport(ast, sourceLines, stats) {
    const entries = ast.map(node => {
        const sourceLine = sourceLines[node.line - 1] || ''
        return formatReviewEntry(node, sourceLine)
    })

    const highRisk = entries.filter(e => e.risk === 'HIGH')
    const mediumRisk = entries.filter(e => e.risk === 'MEDIUM')
    const lowConfidence = entries.filter(e => e.confidence < 0.85)

    return {
        entries,
        summary: {
            totalLines: entries.length,
            highRiskCount: highRisk.length,
            mediumRiskCount: mediumRisk.length,
            lowConfidenceCount: lowConfidence.length,
            averageConfidence: entries.length > 0
                ? Math.round((entries.reduce((s, e) => s + e.confidence, 0) / entries.length) * 100) / 100
                : 0,
            layerDistribution: stats?.layerDistribution || {},
        },
        needsAttention: highRisk.length > 0 || lowConfidence.length > 0,
        highRiskEntries: highRisk,
        lowConfidenceEntries: lowConfidence,
    }
}

/**
 * CLI Review Mode — Interactive line-by-line approval.
 *
 *   $ lume compile app.lume --review
 *
 *   Line 1: "get all the users who signed up this month"
 *   ├─ Intent: QUERY on collection 'users'
 *   ├─ Filter: created_at >= start of current month
 *   ├─ Resolved by: ExactPatternMatch (confidence: 97%)
 *   └─ Output: const result = await db.query('SELECT * ...');
 *
 *   ✓ Approve?  [y]es / [n]o / [e]dit
 *
 * @param {object} report - The review report from generateReviewReport
 * @param {object} options - { nonInteractive, autoApprove }
 * @returns {object} { approved: boolean, rejected: number[], edited: number[] }
 */
export async function cliReviewMode(report, options = {}) {
    const results = { approved: true, rejected: [], edited: [], skipped: [] }

    if (options.nonInteractive || options.autoApprove) {
        // Non-interactive: approve everything, but warn about high-risk
        if (report.highRiskEntries.length > 0) {
            console.log(`\n⚠ Review Mode: ${report.highRiskEntries.length} high-risk resolution(s) detected.`)
            for (const entry of report.highRiskEntries) {
                console.log(`  Line ${entry.line}: ${entry.source} [${entry.risk}]`)
            }
        }
        return results
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const ask = (q) => new Promise(resolve => rl.question(q, resolve))

    console.log('\n═══ LUME REVIEW MODE ═══')
    console.log(`Reviewing ${report.entries.length} resolved line(s)...\n`)

    for (const entry of report.entries) {
        // Display the structured review
        console.log(`  Line ${entry.line}: "${entry.source}"`)
        console.log(`  ├─ Intent: ${entry.intent}`)
        if (entry.filter) console.log(`  ├─ Filter: ${entry.filter}`)
        console.log(`  ├─ Resolved by: ${entry.resolvedBy} (confidence: ${Math.round(entry.confidence * 100)}%)`)
        console.log(`  └─ Risk: ${entry.risk}`)

        // Only prompt for non-LOW risk or low confidence
        if (entry.risk !== 'LOW' || entry.confidence < 0.85) {
            const answer = await ask(`\n  ✓ Approve?  [y]es / [n]o / [s]kip : `)
            const a = answer.trim().toLowerCase()

            if (a === 'n' || a === 'no') {
                results.rejected.push(entry.line)
                results.approved = false
                console.log(`  ✗ Rejected line ${entry.line}`)
            } else if (a === 's' || a === 'skip') {
                results.skipped.push(entry.line)
            } else {
                console.log(`  ✓ Approved`)
            }
        } else {
            console.log(`  ✓ Auto-approved (high confidence, low risk)`)
        }
        console.log()
    }

    rl.close()

    if (results.rejected.length > 0) {
        console.log(`\n✗ Review rejected ${results.rejected.length} line(s). Compilation halted.`)
        console.log(`  Rejected lines: ${results.rejected.join(', ')}`)
        console.log(`  Rephrase and recompile.\n`)
    } else {
        console.log(`✓ All ${report.entries.length} line(s) approved. Proceeding with compilation.\n`)
    }

    return results
}

/**
 * Playground Review Mode — returns structured data for a UI modal.
 * The frontend renders this as an interactive approval dialog.
 *
 * @param {object} report - Review report
 * @returns {object} Playground-ready review data
 */
export function playgroundReviewData(report) {
    return {
        type: 'review_modal',
        title: 'Review Mode — Compiler Interpretation',
        subtitle: `${report.entries.length} resolution(s) to review`,
        entries: report.entries.map(e => ({
            line: e.line,
            source: e.source,
            intent: e.intent,
            filter: e.filter,
            resolvedBy: e.resolvedBy,
            confidence: Math.round(e.confidence * 100),
            risk: e.risk,
            riskColor: e.risk === 'HIGH' ? '#ff4444' : e.risk === 'MEDIUM' ? '#ffaa00' : '#44ff44',
            needsApproval: e.risk !== 'LOW' || e.confidence < 0.85,
        })),
        summary: report.summary,
        actions: ['approve_all', 'review_each', 'reject'],
    }
}

/**
 * Auditory Review Mode — generates TTS-ready text for each entry.
 * CHI Paper §7.2 — Auditory Mode
 *
 * @param {object} report - Review report
 * @returns {string[]} Array of TTS-ready strings
 */
export function auditoryReviewText(report) {
    const texts = []

    texts.push(`Review Mode: ${report.entries.length} lines to review.`)

    for (const entry of report.entries) {
        let speech = `Line ${entry.line}. `
        speech += `I understood: ${entry.intent}. `
        if (entry.filter) speech += `Filtering by ${entry.filter}. `
        speech += `Confidence: ${Math.round(entry.confidence * 100)} percent. `

        if (entry.risk === 'HIGH') {
            speech += `Warning: this is a high risk operation. `
        }

        speech += `Shall I compile?`
        texts.push(speech)
    }

    return texts
}

/* ── Helper functions ────────────────────────────────── */

/**
 * Describe what the AST node intends to do in plain English
 */
function describeIntent(node) {
    const type = node.type || 'Unknown'
    const target = node.target || node.name || node.value || ''

    const descriptions = {
        'QueryOperation': `QUERY on collection '${target}'`,
        'ShowStatement': `DISPLAY ${target || 'output'}`,
        'StoreOperation': `SAVE ${target}`,
        'CreateOperation': `CREATE new ${target}`,
        'DeleteOperation': `DELETE ${target}`,
        'UpdateOperation': `UPDATE ${target}`,
        'SendOperation': `SEND ${target}`,
        'SortOperation': `SORT ${target}`,
        'FilterOperation': `FILTER ${target}`,
        'ForEachLoop': `ITERATE over ${target}`,
        'IfStatement': `CONDITIONAL check on ${target}`,
        'AskExpression': `AI QUERY: ${target}`,
        'WaitStatement': `WAIT ${node.duration || target}`,
        'ConnectOperation': `CONNECT to ${target}`,
        'ReturnStatement': `RETURN ${target}`,
        'VariableDeclaration': `DECLARE variable '${target}'`,
        'FunctionDeclaration': `DEFINE function '${node.name || target}'`,
        'RawBlock': `RAW JavaScript block`,
        'ImportStatement': `IMPORT ${target}`,
    }

    return descriptions[type] || `${type} operation on '${target}'`
}

/**
 * Describe any filter/condition in the AST node
 */
function describeFilter(node) {
    if (node.filter) return node.filter
    if (node.condition) return `condition: ${node.condition}`
    if (node.where) return `where ${node.where}`
    return null
}

/**
 * Translate resolvedBy strings to human-friendly names
 */
function formatLayerName(resolvedBy) {
    const names = {
        'layer_a_exact': 'ExactPatternMatch',
        'layer_a_fuzzy': 'FuzzyPatternMatch',
        'layer_a_wordbag': 'WordBagAnalysis',
        'layer_b_ai': 'AIResolver',
        'manifest_cache': 'ManifestCache',
        'clarification_interactive': 'InteractiveClarification',
        'clarification_cache': 'ClarificationCache',
    }
    return names[resolvedBy] || resolvedBy || 'Unknown'
}

/**
 * Assess the risk level of an AST node
 */
function assessRisk(node) {
    const type = node.type || ''
    const highRisk = ['DeleteOperation', 'SendOperation', 'RawBlock']
    const mediumRisk = ['UpdateOperation', 'StoreOperation', 'ConnectOperation']

    if (highRisk.includes(type)) return 'HIGH'
    if (mediumRisk.includes(type)) return 'MEDIUM'
    if (node.confidence && node.confidence < 0.7) return 'MEDIUM'
    return 'LOW'
}
