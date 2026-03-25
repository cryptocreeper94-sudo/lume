/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — AI Resolver (Layer B)
 *  LLM-powered resolution for complex/ambiguous input
 *  Called when Layer A (pattern matching) fails
 * ═══════════════════════════════════════════════════════════
 */

import { getAIContext } from './context-engine.js'

/* ── Valid AST Node Types (from Milestones 1-6) ──────── */
const VALID_AST_TYPES = [
    'VariableDeclaration', 'ConstantDeclaration', 'FunctionDeclaration',
    'IfStatement', 'ForLoop', 'WhileLoop', 'RepeatLoop', 'ForEachLoop',
    'AskExpression', 'ThinkExpression', 'GenerateExpression',
    'ShowStatement', 'ReturnStatement',
    'UseStatement', 'ExposeStatement',
    'IntentBlock', 'MonitorBlock', 'HealBlock', 'OptimizeBlock', 'EvolveBlock',
    'MutateStatement', 'RollbackStatement',
    'HealableDecorator', 'CriticalDecorator', 'ExperimentalDecorator',
    // English Mode additions
    'VariableAccess', 'StoreOperation', 'DeleteOperation', 'CreateOperation',
    'UpdateOperation', 'SendOperation', 'FilterOperation', 'SortOperation',
    'ConnectionSetup', 'EventListener', 'NavigateOperation', 'DelayStatement',
    'RawBlock',
]

/**
 * Build the prompt for the AI resolver
 */
function buildPrompt(input, context, lines = []) {
    return {
        system: `You are the Lume compiler's Intent Resolver (Layer B). Your job is to convert a natural language sentence into a Lume AST node.

RULES:
1. Return ONLY a valid JSON AST node. No JavaScript code, no Lume source code — just AST nodes.
2. The "type" field MUST be one of: ${VALID_AST_TYPES.join(', ')}
3. Include a "confidence" field (0.0 to 1.0) indicating how sure you are.
4. If the sentence contains a pronoun (it, they, their), resolve it using the lastSubject from context.
5. If you cannot determine the intent with >50% confidence, set confidence below 0.5.

PROJECT CONTEXT:
${JSON.stringify(context, null, 2)}

RESPOND WITH ONLY VALID JSON. No markdown, no explanation, just the AST node.`,

        user: `Convert this English sentence to a Lume AST node:
"${input}"

${lines.length > 0 ? `Previous lines in this file:\n${lines.map((l, i) => `  Line ${i + 1}: "${l}"`).join('\n')}` : ''}`
    }
}

/**
 * Resolve a single line using AI (Layer B)
 * Returns { resolved, ast, confidence, cached }
 */
export async function aiResolve(input, options = {}) {
    const context = getAIContext()
    const prompt = buildPrompt(input, context, options.previousLines || [])

    try {
        // Check cache first (compile lock)
        if (options.lockCache) {
            const cached = options.lockCache[input]
            if (cached) return { resolved: true, ast: cached.ast, confidence: cached.confidence, cached: true }
        }

        // Apply strict mode guard
        if (options.strict) {
            console.error(`\x1b[31m  ✖ Strict Mode Error: Unrecognized syntax pattern\x1b[0m\n    Line: "${input}"\n    (Layer B AI resolution is disabled by --strict-english)`)
            return { resolved: false, error: 'Strict mode: Layer A pattern match failed.', confidence: 0 }
        }

        // Add explicit console warning to standard mode
        if (!options.quiet) {
            console.warn(`\x1b[33m  ⚠ Warning: Line dropped to Layer B (AI) — execution may be non-deterministic:\x1b[0m\n    "${input}"`)
        }

        // Call the AI model
        const response = await callAI(prompt, options.model || 'gpt-4o-mini')

        // Parse the response
        const ast = JSON.parse(response)

        // Validate the response
        if (!ast.type || !VALID_AST_TYPES.includes(ast.type)) {
            return { resolved: false, error: 'AI returned invalid AST type', confidence: 0 }
        }

        const confidence = ast.confidence || 0.5
        delete ast.confidence

        return { resolved: true, ast, confidence, cached: false }
    } catch (err) {
        return { resolved: false, error: err.message, confidence: 0 }
    }
}

/**
 * Batch-resolve multiple lines in one AI call
 * Batching minimizes API calls and compile time
 */
export async function batchResolve(lines, options = {}) {
    const context = getAIContext()

    const prompt = {
        system: `You are the Lume compiler's Intent Resolver (Layer B). Convert MULTIPLE natural language sentences into Lume AST nodes.

RULES:
1. Return a JSON ARRAY of AST nodes, one per input line.
2. Each node must have: "type" (from valid types), "confidence" (0.0-1.0), and "lineIndex" (which input line it corresponds to).
3. Valid types: ${VALID_AST_TYPES.join(', ')}
4. Resolve pronouns using context.
5. RESPOND WITH ONLY VALID JSON ARRAY.

PROJECT CONTEXT:
${JSON.stringify(context, null, 2)}`,

        user: `Convert these English sentences to Lume AST nodes:\n${lines.map((l, i) => `  [${i}]: "${l}"`).join('\n')}`
    }

    try {
        // Apply strict mode guard
        if (options.strict) {
            console.error(`\x1b[31m  ✖ Strict Mode Error: Batch contains unrecognized syntax patterns\x1b[0m\n    (Layer B AI resolution is disabled by --strict-english)`)
            throw new Error('Strict mode: Layer A pattern match failed for batch intent.')
        }

        // Add explicit console warning to standard mode
        if (!options.quiet) {
            console.warn(`\x1b[33m  ⚠ Warning: Batch dropped to Layer B (AI) — execution may be non-deterministic:\x1b[0m\n    Lines: ${lines.length}`)
        }

        const response = await callAI(prompt, options.model || 'gpt-4o-mini')
        const results = JSON.parse(response)

        if (!Array.isArray(results)) throw new Error('AI did not return an array')

        return results.map((r, i) => ({
            lineIndex: r.lineIndex ?? i,
            resolved: r.type && VALID_AST_TYPES.includes(r.type),
            ast: r.type ? { ...r, confidence: undefined, lineIndex: undefined } : null,
            confidence: r.confidence || 0.5,
        }))
    } catch (err) {
        return lines.map((_, i) => ({
            lineIndex: i,
            resolved: false,
            ast: null,
            confidence: 0,
            error: err.message,
        }))
    }
}

/* ── AI Model Call ───────────────────────────────────── */

/**
 * Call the AI model. Uses OpenAI-compatible API.
 * Can be swapped for local Ollama/Llama for offline mode.
 */
async function callAI(prompt, model = 'gpt-4o-mini') {
    const apiKey = process.env.OPENAI_API_KEY || process.env.LUME_AI_KEY
    if (!apiKey) {
        // Graceful degradation: no API key → return a structured hint
        return JSON.stringify({
            type: 'IntentBlock',
            intent: 'unresolved',
            confidence: 0,
            _hint: 'No AI API key configured. Set OPENAI_API_KEY or LUME_AI_KEY. Try rephrasing with simpler patterns: get X, show X, save X to Y, create a new X.'
        })
    }

    const baseUrl = process.env.LUME_AI_URL || 'https://api.openai.com/v1'

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user },
            ],
            temperature: 0.1, // Low temperature for deterministic output
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`AI API error (${response.status}): ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
}

/**
 * Local AI fallback (Ollama) for offline mode
 */
export async function localAIResolve(input, options = {}) {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: options.localModel || 'llama3',
                prompt: `Convert this English sentence to a JSON AST node for the Lume programming language: "${input}"\nReturn ONLY valid JSON.`,
                stream: false,
            }),
        })

        if (!response.ok) throw new Error('Local AI unavailable')

        const data = await response.json()
        const ast = JSON.parse(data.response)
        return { resolved: true, ast, confidence: 0.7, cached: false, local: true }
    } catch {
        return { resolved: false, error: 'Offline — local AI unavailable. Line queued for resolution when connected.', confidence: 0, pending: true }
    }
}
