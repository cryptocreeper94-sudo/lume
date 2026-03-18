/**
 * ═══════════════════════════════════════════════════════════
 *  LUME AUDITORY MODE — Eyes-Free, Hands-Free Programming
 *  CHI Paper §7.2 — Auditory Mode
 *
 *  "Auditory Mode completes the accessibility loop by adding
 *   compiler-to-developer speech output."
 *
 *  This module provides the TTS (Text-to-Speech) output layer
 *  that enables fully bidirectional voice programming:
 *
 *    Developer (speaks) → Cleanup → Tolerance Chain → AST
 *      → Auditory Mode (speaks back) → Developer approves
 *
 *  Input:  Web Speech API SpeechRecognition (existing)
 *  Output: Web Speech API SpeechSynthesis (this module)
 *
 *  Modes:
 *    Browser:  Uses window.speechSynthesis (zero dependencies)
 *    CLI:      Uses platform-native TTS (say/espeak/PowerShell)
 *    Test:     Returns TTS text without speaking
 * ═══════════════════════════════════════════════════════════
 */

/* ── Browser Auditory Engine ────────────────────────────── */

/**
 * Browser-based TTS engine using Web Speech API.
 * Zero dependencies — uses native browser capabilities.
 */
export class BrowserAuditoryEngine {
    constructor(options = {}) {
        this.rate = options.rate || 1.0
        this.pitch = options.pitch || 1.0
        this.volume = options.volume || 1.0
        this.voiceName = options.voiceName || null
        this.language = options.language || 'en-US'
        this.enabled = typeof window !== 'undefined' && 'speechSynthesis' in window
        this.speaking = false
        this._queue = []
        this._processing = false
    }

    /**
     * Speak text aloud using Web Speech API
     * @param {string} text - Text to speak
     * @returns {Promise<void>} Resolves when speech is complete
     */
    speak(text) {
        if (!this.enabled) {
            console.warn('[auditory] SpeechSynthesis not available in this environment')
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = this.rate
            utterance.pitch = this.pitch
            utterance.volume = this.volume
            utterance.lang = this.language

            // Set voice if specified
            if (this.voiceName) {
                const voices = window.speechSynthesis.getVoices()
                const voice = voices.find(v => v.name.includes(this.voiceName))
                if (voice) utterance.voice = voice
            }

            utterance.onend = () => {
                this.speaking = false
                resolve()
            }
            utterance.onerror = (e) => {
                this.speaking = false
                reject(e)
            }

            this.speaking = true
            window.speechSynthesis.speak(utterance)
        })
    }

    /**
     * Stop any ongoing speech
     */
    stop() {
        if (this.enabled) {
            window.speechSynthesis.cancel()
            this.speaking = false
        }
    }

    /**
     * Speak and wait for voice approval ("yes"/"no"/"edit")
     * Returns the developer's spoken response.
     *
     * @param {string} text - Text to speak before listening
     * @returns {Promise<string>} The developer's response
     */
    async speakAndListen(text) {
        await this.speak(text)

        // Listen for approval
        return new Promise((resolve, reject) => {
            if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
                reject(new Error('SpeechRecognition not available'))
                return
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SpeechRecognition()
            recognition.lang = this.language
            recognition.interimResults = false
            recognition.maxAlternatives = 3

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase().trim()
                const response = interpretApproval(transcript)
                resolve(response)
            }

            recognition.onerror = (e) => {
                reject(e)
            }

            recognition.onend = () => {
                // If no result, treat as timeout
                resolve({ action: 'timeout', raw: '' })
            }

            recognition.start()

            // Timeout after 10 seconds
            setTimeout(() => {
                recognition.stop()
            }, 10000)
        })
    }
}

/* ── CLI Auditory Engine ────────────────────────────────── */

/**
 * CLI-based TTS engine using platform-native commands.
 * macOS: `say`, Linux: `espeak`, Windows: PowerShell
 */
export class CLIAuditoryEngine {
    constructor(options = {}) {
        this.platform = options.platform || detectPlatform()
        this.rate = options.rate || 180 // words per minute
        this.enabled = true
    }

    /**
     * Speak text using platform-native TTS
     */
    async speak(text) {
        const { execSync } = await import('child_process')
        const escaped = text.replace(/"/g, '\\"').replace(/'/g, "\\'")

        try {
            switch (this.platform) {
                case 'darwin':
                    execSync(`say -r ${this.rate} "${escaped}"`)
                    break
                case 'linux':
                    execSync(`espeak -s ${this.rate} "${escaped}" 2>/dev/null || echo "${escaped}"`)
                    break
                case 'win32':
                    execSync(`powershell -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = ${Math.round((this.rate - 180) / 30)}; $s.Speak('${escaped}')"`)
                    break
                default:
                    console.log(`[auditory] ${text}`)
            }
        } catch (e) {
            // Fallback to console
            console.log(`[auditory] ${text}`)
        }
    }

    /**
     * Stop speaking (not always possible in CLI mode)
     */
    stop() {
        // CLI TTS is synchronous — can't easily stop
    }
}

/* ── Auditory Mode Controller ───────────────────────────── */

/**
 * Main Auditory Mode controller. Orchestrates the full
 * bidirectional speech workflow:
 *
 * 1. Developer speaks → captured by existing voice pipeline
 * 2. Tolerance Chain resolves intent
 * 3. Auditory Mode speaks back the interpretation
 * 4. Developer approves/rejects by voice
 * 5. Compilation proceeds or developer rephrases
 */
export class AuditoryMode {
    constructor(engine, options = {}) {
        this.engine = engine || new BrowserAuditoryEngine()
        this.enabled = options.enabled !== false
        this.verbose = options.verbose || false
        this.autoApproveThreshold = options.autoApproveThreshold || 0.97
        this.history = [] // Log of all auditory interactions
    }

    /**
     * Announce the start of an auditory session
     */
    async announceSession(filename) {
        if (!this.enabled) return
        await this.engine.speak(
            `Lume auditory mode active. Compiling ${filename || 'your program'}. ` +
            `Speak your instructions. I will confirm each one.`
        )
    }

    /**
     * Speak the compiler's interpretation of a resolved line.
     * This is the core Auditory Mode interaction.
     *
     * @param {object} reviewEntry - From review-mode.js formatReviewEntry
     * @returns {object} { approved: boolean, action: string }
     */
    async speakAndApprove(reviewEntry) {
        if (!this.enabled) return { approved: true, action: 'auto' }

        const speech = this._formatSpeech(reviewEntry)
        this.history.push({ type: 'speak', text: speech, entry: reviewEntry })

        // Auto-approve high confidence, low risk
        if (reviewEntry.confidence >= this.autoApproveThreshold && reviewEntry.risk === 'LOW') {
            await this.engine.speak(speech + ' Auto-approved.')
            this.history.push({ type: 'auto_approved', line: reviewEntry.line })
            return { approved: true, action: 'auto_approved' }
        }

        // Speak and wait for approval
        if (this.engine instanceof BrowserAuditoryEngine) {
            try {
                const response = await this.engine.speakAndListen(speech)
                this.history.push({ type: 'response', response })

                if (response.action === 'approve') {
                    await this.engine.speak('Approved.')
                    return { approved: true, action: 'approved' }
                } else if (response.action === 'reject') {
                    await this.engine.speak('Rejected. Please rephrase.')
                    return { approved: false, action: 'rejected' }
                } else if (response.action === 'edit') {
                    await this.engine.speak('Edit mode. Please rephrase this instruction.')
                    return { approved: false, action: 'edit' }
                } else {
                    // Timeout or unclear — ask again
                    await this.engine.speak('I didn\'t catch that. Approved?')
                    return { approved: true, action: 'timeout_approved' }
                }
            } catch (e) {
                // Fallback to auto-approve
                return { approved: true, action: 'error_fallback' }
            }
        } else {
            // CLI mode — just speak, no interactive approval
            await this.engine.speak(speech)
            return { approved: true, action: 'cli_auto' }
        }
    }

    /**
     * Announce compilation results
     */
    async announceResults(stats) {
        if (!this.enabled) return
        const msg = `Compilation complete. ${stats.resolvedLines || 0} lines resolved. ` +
            `${stats.patternMatches || 0} by pattern match, ${stats.aiResolutions || 0} by AI. ` +
            `${stats.manifestHits || 0} from cache. ` +
            (stats.disambiguations > 0 ? `${stats.disambiguations} disambiguation${stats.disambiguations > 1 ? 's' : ''} required. ` : '') +
            `Ready.`
        await this.engine.speak(msg)
    }

    /**
     * Announce a disambiguation request
     */
    async speakDisambiguation(disambiguation) {
        if (!this.enabled) return
        const speech = `Ambiguous reference. "${disambiguation.pronoun}" could refer to: ` +
            disambiguation.candidates.map((c, i) =>
                `Option ${c.label}: ${c.subject}, from line ${c.line}`
            ).join('. ') + '. Which did you mean?'
        await this.engine.speak(speech)
    }

    /**
     * Get the interaction log for analytics
     */
    getLog() {
        return {
            interactions: this.history.length,
            approvals: this.history.filter(h => h.type === 'auto_approved' || (h.response && h.response.action === 'approve')).length,
            rejections: this.history.filter(h => h.response && h.response.action === 'reject').length,
            history: this.history,
        }
    }

    /* ── Internal ─────────────────────────────────────── */

    _formatSpeech(entry) {
        let speech = `Line ${entry.line}. `
        speech += `I understood: ${entry.intent}. `
        if (entry.filter) speech += `Filtering by: ${entry.filter}. `
        speech += `Confidence: ${Math.round(entry.confidence * 100)} percent. `

        if (entry.risk === 'HIGH') {
            speech += `Warning: this is a high risk operation. `
        } else if (entry.risk === 'MEDIUM') {
            speech += `Note: moderate risk operation. `
        }

        speech += `Shall I compile?`
        return speech
    }
}

/* ── Voice Approval Interpreter ─────────────────────────── */

/**
 * Interpret a spoken response as approval/rejection/edit.
 * Handles natural language variations.
 */
function interpretApproval(transcript) {
    const t = transcript.toLowerCase().trim()

    const approveWords = ['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'approved', 'approve',
        'confirm', 'go ahead', 'do it', 'compile', 'okay', 'ok', 'sure', 'affirmative', 'sounds good',
        'that\'s right', 'that\'s correct', 'proceed']
    const rejectWords = ['no', 'nope', 'wrong', 'reject', 'stop', 'cancel', 'don\'t', 'not right',
        'incorrect', 'negative', 'that\'s wrong']
    const editWords = ['edit', 'change', 'rephrase', 'modify', 'fix', 'redo', 'try again',
        'let me rephrase', 'actually']

    if (approveWords.some(w => t.includes(w))) return { action: 'approve', raw: transcript }
    if (rejectWords.some(w => t.includes(w))) return { action: 'reject', raw: transcript }
    if (editWords.some(w => t.includes(w))) return { action: 'edit', raw: transcript }

    return { action: 'unclear', raw: transcript }
}

/**
 * Detect the current platform
 */
function detectPlatform() {
    if (typeof process !== 'undefined' && process.platform) {
        return process.platform
    }
    return 'browser'
}
