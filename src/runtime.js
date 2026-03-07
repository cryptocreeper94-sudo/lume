/**
 * ====== Lume Runtime ======
 * The AI execution engine for Lume programs.
 * 
 * Provides:
 *   - Multi-provider AI calls (OpenAI, Anthropic, Google)
 *   - Model registry with selector resolution (claude.sonnet → claude-3-5-sonnet-20241022)
 *   - Result type for safe error handling
 *   - lume.config loading
 *   - Output format parsing (json, list, text)
 * 
 * Supported providers:
 *   OpenAI:     gpt.4o, gpt.4, gpt.mini
 *   Anthropic:  claude.sonnet, claude.haiku, claude.opus
 *   Google:     gemini.pro, gemini.flash
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ══════════════════════════
//  RESULT TYPE
// ══════════════════════════

export class Result {
    constructor(ok, value, error) {
        this._ok = ok
        this._value = value
        this._error = error
    }

    static ok(value) { return new Result(true, value, null) }
    static error(error) { return new Result(false, null, error) }

    get isOk() { return this._ok }
    get isError() { return !this._ok }

    unwrap() {
        if (this._ok) return this._value
        throw new Error(`Unwrap called on error Result: ${this._error}`)
    }

    unwrapOr(fallback) { return this._ok ? this._value : fallback }

    match(handlers) {
        if (this._ok && handlers.ok) return handlers.ok(this._value)
        if (!this._ok && handlers.error) return handlers.error(this._error)
    }

    toString() {
        return this._ok ? `Result.ok(${this._value})` : `Result.error(${this._error})`
    }
}

// ══════════════════════════
//  MODEL REGISTRY
// ══════════════════════════

const MODEL_REGISTRY = {
    // OpenAI
    'gpt.4o': { provider: 'openai', model: 'gpt-4o' },
    'gpt.4': { provider: 'openai', model: 'gpt-4-turbo' },
    'gpt.mini': { provider: 'openai', model: 'gpt-4o-mini' },
    'gpt.3': { provider: 'openai', model: 'gpt-3.5-turbo' },
    'o1': { provider: 'openai', model: 'o1' },
    'o1.mini': { provider: 'openai', model: 'o1-mini' },
    'o3.mini': { provider: 'openai', model: 'o3-mini' },

    // Anthropic
    'claude.sonnet': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    'claude.haiku': { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
    'claude.opus': { provider: 'anthropic', model: 'claude-3-opus-20240229' },

    // Google
    'gemini.pro': { provider: 'google', model: 'gemini-2.0-pro' },
    'gemini.flash': { provider: 'google', model: 'gemini-2.0-flash' },
}

const DEFAULT_MODELS = {
    ask: 'gpt.4o',
    think: 'claude.sonnet',
    generate: 'gpt.4o',
}

const TEMPERATURE = {
    ask: 0.7,
    think: 0.3,
    generate: 1.0,
}

const SYSTEM_PROMPTS = {
    ask: null,
    think: 'You are a careful analytical thinker. Reason step by step before answering.',
    generate: 'You are a creative writer. Be imaginative, original, and expressive.',
}

function resolveModel(modelName, callType, config) {
    // Priority: explicit model → config default → built-in default
    const name = modelName || config?.defaultModel || DEFAULT_MODELS[callType]
    const entry = MODEL_REGISTRY[name]
    if (!entry) {
        // Treat as a raw model name (e.g. custom deployments)
        return { provider: 'openai', model: name }
    }
    return entry
}

function getApiKey(provider, config) {
    // Priority: config → environment variable
    if (config?.providers?.[provider]?.apiKey) {
        return config.providers[provider].apiKey
    }
    const envMap = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        google: 'GOOGLE_API_KEY',
    }
    return process.env[envMap[provider]] || null
}

// ══════════════════════════
//  PROVIDER HTTP CALLS
// ══════════════════════════

async function callOpenAI(model, prompt, systemPrompt, temperature, apiKey) {
    const messages = []
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages,
            temperature,
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`OpenAI API error (${response.status}): ${err}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
}

async function callAnthropic(model, prompt, systemPrompt, temperature, apiKey) {
    const body = {
        model: model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        temperature,
    }
    if (systemPrompt) body.system = systemPrompt

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Anthropic API error (${response.status}): ${err}`)
    }

    const data = await response.json()
    return data.content[0].text
}

async function callGoogle(model, prompt, systemPrompt, temperature, apiKey) {
    const contents = [{ parts: [{ text: prompt }] }]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const body = {
        contents,
        generationConfig: { temperature },
    }
    if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] }
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Google API error (${response.status}): ${err}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}

const PROVIDER_HANDLERS = {
    openai: callOpenAI,
    anthropic: callAnthropic,
    google: callGoogle,
}

// ══════════════════════════
//  OUTPUT FORMAT PARSING
// ══════════════════════════

function parseOutput(raw, format) {
    if (!format || format === 'text') return raw

    if (format === 'json') {
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
            const toParse = jsonMatch ? jsonMatch[1] : raw
            return JSON.parse(toParse.trim())
        } catch (e) {
            throw new Error(`Failed to parse AI output as JSON: ${e.message}\nRaw output: ${raw}`)
        }
    }

    if (format === 'list') {
        // Split by newlines, filter empty, trim
        return raw.split('\n')
            .map(line => line.replace(/^[-*•]\s*/, '').trim())
            .filter(line => line.length > 0)
    }

    return raw
}

// ══════════════════════════
//  PUBLIC API: ask / think / generate
// ══════════════════════════

async function __lume_call(callType, { prompt, model, format, config }) {
    const resolved = resolveModel(model, callType, config)
    const apiKey = getApiKey(resolved.provider, config)

    if (!apiKey) {
        return Result.error(
            `No API key found for ${resolved.provider}. ` +
            `Set ${resolved.provider.toUpperCase()}_API_KEY environment variable ` +
            `or add it to lume.config.`
        )
    }

    const handler = PROVIDER_HANDLERS[resolved.provider]
    if (!handler) {
        return Result.error(`Unknown provider: ${resolved.provider}`)
    }

    try {
        const temperature = TEMPERATURE[callType]
        const systemPrompt = SYSTEM_PROMPTS[callType]
        const rawResult = await handler(resolved.model, prompt, systemPrompt, temperature, apiKey)
        const parsed = parseOutput(rawResult, format)
        return Result.ok(parsed)
    } catch (err) {
        return Result.error(err.message)
    }
}

export async function __lume_ask(opts) {
    return __lume_call('ask', opts)
}

export async function __lume_think(opts) {
    return __lume_call('think', opts)
}

export async function __lume_generate(opts) {
    return __lume_call('generate', opts)
}

// ══════════════════════════
//  CONFIG LOADING
// ══════════════════════════

export function __lume_loadConfig() {
    // Search for lume.config in current directory chain
    const configPaths = [
        resolve(process.cwd(), 'lume.config'),
        resolve(process.cwd(), 'lume.config.json'),
    ]

    for (const p of configPaths) {
        if (existsSync(p)) {
            try {
                const raw = readFileSync(p, 'utf-8')
                return JSON.parse(raw)
            } catch (e) {
                console.warn(`Warning: Could not parse ${p}: ${e.message}`)
            }
        }
    }

    // No config file — use defaults
    return {
        defaultModel: 'gpt.4o',
        providers: {},
    }
}

// ══════════════════════════
//  EXPORTS
// ══════════════════════════

export const lume = {
    Result,
    ask: __lume_ask,
    think: __lume_think,
    generate: __lume_generate,
    configure: __lume_loadConfig,
    models: MODEL_REGISTRY,
}

export default lume
