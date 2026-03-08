/**
 * ═══════════════════════════════════════════════════════════
 *  LUME GAP 1 — Interactive Clarification Mode
 *  When all 7 Tolerance Chain layers fail to reach the
 *  confidence threshold (0.85), the compiler asks the
 *  developer what they meant, caching the answer.
 * ═══════════════════════════════════════════════════════════
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const CONFIDENCE_THRESHOLD = 0.85

/**
 * Cache for developer clarifications (compile-lock.json)
 */
export class ClarificationCache {
    constructor(projectRoot = '.') {
        this.lockPath = join(projectRoot, '.lume', 'compile-lock.json')
        this.cache = this._load()
    }

    _load() {
        try {
            if (existsSync(this.lockPath)) {
                const data = JSON.parse(readFileSync(this.lockPath, 'utf-8'))
                return data.clarifications || {}
            }
        } catch { /* ignore */ }
        return {}
    }

    has(phrase) {
        const key = phrase.toLowerCase().trim()
        return key in this.cache
    }

    get(phrase) {
        const key = phrase.toLowerCase().trim()
        return this.cache[key] || null
    }

    set(phrase, resolution) {
        const key = phrase.toLowerCase().trim()
        this.cache[key] = {
            resolved_as: resolution.resolvedAs,
            resolved_to_ast: resolution.astType,
            clarified_by: 'developer',
            timestamp: new Date().toISOString(),
            original_confidence: resolution.originalConfidence,
            clarification_choice: resolution.choiceIndex,
        }
        this._save()
    }

    clear() {
        this.cache = {}
        this._save()
    }

    _save() {
        const dir = join(this.lockPath, '..')
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        let data = {}
        try {
            if (existsSync(this.lockPath)) {
                data = JSON.parse(readFileSync(this.lockPath, 'utf-8'))
            }
        } catch { /* ignore */ }
        data.clarifications = this.cache
        writeFileSync(this.lockPath, JSON.stringify(data, null, 2), 'utf-8')
    }
}

/**
 * Generate clarification options from AI resolver results.
 * Returns top 4 interpretations ranked by confidence.
 */
export function generateOptions(text, aiResults = []) {
    const defaults = [
        { label: 'Filter/clean the data', astType: 'FilterOperation' },
        { label: 'Transform/convert the data', astType: 'TransformOperation' },
        { label: 'Send the data somewhere', astType: 'SendOperation' },
        { label: 'Analyze/summarize the data', astType: 'AnalyzeOperation' },
    ]

    // If AI returned ranked interpretations, use those
    if (aiResults.length > 0) {
        return aiResults
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
            .slice(0, 4)
            .map((r, i) => ({
                index: i + 1,
                label: r.interpretation || r.text || `Option ${i + 1}`,
                astType: r.ast?.type || 'GenericOperation',
                ast: r.ast,
                confidence: r.confidence || 0,
            }))
    }

    // Fallback: generate options from the instruction's verb
    const verb = text.toLowerCase().split(/\s+/)[0]
    const verbOptions = {
        process: ['Filter/clean the data', 'Transform/convert the data', 'Send the data somewhere', 'Analyze/summarize the data'],
        handle: ['Process/execute the action', 'Catch/manage errors', 'Route to handler', 'Queue for later'],
        manage: ['Create/administer the resource', 'Track/monitor the resource', 'Update the resource', 'Delete/remove the resource'],
        work: ['Process the item', 'Modify the item', 'Analyze the item', 'Display the item'],
    }

    const labels = verbOptions[verb] || defaults.map(d => d.label)
    return labels.map((label, i) => ({
        index: i + 1,
        label,
        astType: defaults[i]?.astType || 'GenericOperation',
        ast: null,
        confidence: 0,
    }))
}

/**
 * Enter Interactive Clarification Mode (terminal).
 * Presents options, gets developer choice, returns resolution.
 */
export async function enterClarificationMode(text, lineNum, bestConfidence, options = {}) {
    const { nonInteractive, aiResults, cache } = options

    // Check cache first
    if (cache && cache.has(text)) {
        const cached = cache.get(text)
        return {
            resolved: true,
            fromCache: true,
            resolvedAs: cached.resolved_as,
            astType: cached.resolved_to_ast,
            ast: { type: cached.resolved_to_ast, value: cached.resolved_as, line: lineNum, resolvedBy: 'clarification_cache' },
        }
    }

    // Non-interactive mode: fail with LUME-E040
    if (nonInteractive) {
        return {
            resolved: false,
            error: {
                type: 'error',
                code: 'LUME-E040',
                line: lineNum,
                message: `Line ${lineNum}: "${text}"\n  Could not resolve with sufficient confidence (best: ${(bestConfidence * 100).toFixed(0)}%).\n  This instruction requires developer clarification.\n  Run \`lume compile\` interactively to resolve, or rephrase the instruction.`,
            },
        }
    }

    // Generate options
    const choices = generateOptions(text, aiResults || [])

    // Terminal prompt
    console.log()
    console.log(`  Line ${lineNum}: "${text}"`)
    console.log(`  [lume] I'm not confident I understand this instruction (best confidence: ${(bestConfidence * 100).toFixed(0)}%).`)
    console.log(`  What do you mean by "${text.split(/\s+/)[0]}"?`)
    choices.forEach(c => console.log(`    ${c.index}. ${c.label}`))
    console.log(`    ${choices.length + 1}. Let me rephrase this`)

    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve => {
        rl.question('  > ', ans => { rl.close(); resolve(ans.trim()) })
    })

    const choiceNum = parseInt(answer)

    // Rephrase option
    if (choiceNum === choices.length + 1 || isNaN(choiceNum)) {
        const rephrase = isNaN(choiceNum) ? answer : null
        if (rephrase) {
            return { resolved: true, rephrased: true, newText: rephrase, ast: null }
        }
        const rl2 = createInterface({ input: process.stdin, output: process.stdout })
        const newText = await new Promise(resolve => {
            rl2.question('  Rephrase: ', ans => { rl2.close(); resolve(ans.trim()) })
        })
        return { resolved: true, rephrased: true, newText, ast: null }
    }

    // Valid choice
    const chosen = choices[choiceNum - 1]
    if (!chosen) return { resolved: false, error: { type: 'error', code: 'LUME-E040', line: lineNum, message: `Invalid choice: ${answer}` } }

    console.log(`  [lume] Resolving as: ${chosen.label}`)

    const resolution = {
        resolved: true,
        fromCache: false,
        resolvedAs: chosen.label,
        astType: chosen.astType,
        choiceIndex: choiceNum,
        originalConfidence: bestConfidence,
        ast: chosen.ast || { type: chosen.astType, value: chosen.label, line: lineNum, resolvedBy: 'clarification_interactive', confidence: 1.0 },
    }

    // Cache the clarification
    if (cache) {
        cache.set(text, {
            resolvedAs: chosen.label,
            astType: chosen.astType,
            originalConfidence: bestConfidence,
            choiceIndex: choiceNum,
        })
    }

    return resolution
}

/**
 * Voice mode clarification — spoken prompt.
 */
export function formatVoiceClarification(text, bestConfidence, choices) {
    const optionList = choices.map(c => c.label.toLowerCase()).join(', ')
    return `I'm not sure what you mean by "${text}." Did you mean ${optionList}? Or you can rephrase.`
}

/**
 * Web playground clarification — returns data for modal dialog.
 */
export function formatPlaygroundClarification(text, lineNum, bestConfidence, aiResults = []) {
    const choices = generateOptions(text, aiResults)
    return {
        type: 'clarification',
        line: lineNum,
        instruction: text,
        confidence: bestConfidence,
        options: choices,
        rephraseOption: true,
    }
}
