/**
 * ═══════════════════════════════════════════════════════════
 *  LUME VOICE CONFIG LOADER
 *  Reads .lume/voice-config.json for voice session settings.
 * ═══════════════════════════════════════════════════════════
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULTS = {
    voice: {
        enabled: true,
        engine: 'system',
        language: 'en-US',
        pause_threshold_ms: 1500,
        filler_words: ['um', 'uh', 'like', 'you know', 'basically', 'actually'],
        compile_commands: ['compile', 'compile that', 'done', 'build it', 'run it'],
        cancel_commands: ['start over', 'clear', 'reset'],
        undo_commands: ['delete last', 'undo', 'scratch that', 'remove last'],
        readback_commands: ['read it back', 'read back', 'what do I have'],
        pause_commands: ['pause', 'hold on', 'stop listening'],
        resume_commands: ['continue', 'resume', 'keep going'],
        read_back: true,
        confirmation_beep: true,
    }
}

/**
 * Load voice configuration from .lume/voice-config.json
 * Falls back to defaults if file doesn't exist.
 *
 * @param {string} [projectRoot] - Project root directory (defaults to cwd)
 * @returns {object} Voice configuration
 */
export function loadVoiceConfig(projectRoot) {
    const root = projectRoot || process.cwd()
    const configPath = resolve(root, '.lume', 'voice-config.json')

    if (existsSync(configPath)) {
        try {
            const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
            // Deep merge with defaults
            return {
                voice: {
                    ...DEFAULTS.voice,
                    ...(userConfig.voice || {}),
                }
            }
        } catch {
            // Corrupt config — use defaults
        }
    }
    return { ...DEFAULTS }
}

/**
 * Check if a spoken phrase matches a voice command category.
 *
 * @param {string} phrase - Transcribed phrase
 * @param {string[]} commands - List of command phrases to match
 * @returns {boolean}
 */
export function matchesVoiceCommand(phrase, commands) {
    const normalized = phrase.trim().toLowerCase().replace(/[.,!?]/g, '')
    return commands.some(cmd => normalized === cmd || normalized.endsWith(cmd))
}
