/**
 * Lume Adaptive Voice Profile
 * 
 * Learns user-specific dialect, colloquialisms, and phrasing patterns
 * over time. Integrates with the Tolerance Chain at Layer 1.5 —
 * checked after exact patterns but before fuzzy match.
 * 
 * The profile is stored per-user and persists across sessions.
 * Every successful resolution trains the profile. After a configurable
 * threshold (default: 5 consistent uses), mappings are auto-promoted
 * from "candidate" to "confirmed."
 * 
 * @module voice-profile
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PROFILE_DIR = path.join(os.homedir(), '.lume', 'profiles');
const DEFAULT_THRESHOLD = 5;

class VoiceProfile {
  constructor(userId = 'default') {
    this.userId = userId;
    this.profilePath = path.join(PROFILE_DIR, `${userId}.json`);
    this.profile = this._load();
  }

  /**
   * Load or initialize a user profile
   */
  _load() {
    try {
      if (fs.existsSync(this.profilePath)) {
        const raw = fs.readFileSync(this.profilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[voice-profile] Could not load profile for ${this.userId}:`, e.message);
    }
    return this._createDefault();
  }

  _createDefault() {
    return {
      userId: this.userId,
      version: 1,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      stats: {
        totalResolutions: 0,
        totalAdaptations: 0,
        dialectConfidence: 0,
      },
      // Confirmed mappings — high confidence, auto-applied
      confirmed: {},
      // Candidate mappings — still being learned
      candidates: {},
      // Phrase shortcuts — full phrase → intent mappings
      phrases: {},
      // Accent artifacts — common transcription errors for this user
      accentCorrections: {},
      // Filler words specific to this user
      fillerWords: [],
    };
  }

  /**
   * Save the profile to disk
   */
  save() {
    try {
      if (!fs.existsSync(PROFILE_DIR)) {
        fs.mkdirSync(PROFILE_DIR, { recursive: true });
      }
      this.profile.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.profilePath, JSON.stringify(this.profile, null, 2));
    } catch (e) {
      console.warn(`[voice-profile] Could not save profile:`, e.message);
    }
  }

  /**
   * Record a successful resolution. If the user's phrasing differs
   * from the canonical pattern, learn it as a candidate mapping.
   * 
   * @param {string} userPhrase - What the user actually said/typed
   * @param {string} canonicalForm - The normalized pattern it resolved to
   * @param {string} resolvedBy - Which layer resolved it
   * @param {number} confidence - Resolution confidence (0-1)
   */
  recordResolution(userPhrase, canonicalForm, resolvedBy, confidence) {
    this.profile.stats.totalResolutions++;

    // If resolved by fuzzy match, auto-correct, or AI — this is a dialect signal
    if (['FuzzyPatternMatch', 'AutoCorrect', 'AIResolver'].includes(resolvedBy)) {
      const key = userPhrase.toLowerCase().trim();
      const value = canonicalForm.toLowerCase().trim();

      // Skip if identical
      if (key === value) return;

      // Already confirmed?
      if (this.profile.confirmed[key]) return;

      // Track as candidate
      if (!this.profile.candidates[key]) {
        this.profile.candidates[key] = {
          target: value,
          count: 0,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          confidence: confidence,
        };
      }

      this.profile.candidates[key].count++;
      this.profile.candidates[key].lastSeen = new Date().toISOString();
      this.profile.candidates[key].confidence = Math.max(
        this.profile.candidates[key].confidence,
        confidence
      );

      // Promote to confirmed after threshold
      if (this.profile.candidates[key].count >= DEFAULT_THRESHOLD) {
        this._promote(key);
      }
    }

    this._updateDialectConfidence();
    this.save();
  }

  /**
   * Promote a candidate mapping to confirmed status
   */
  _promote(key) {
    const candidate = this.profile.candidates[key];
    if (!candidate) return;

    this.profile.confirmed[key] = {
      target: candidate.target,
      promotedAt: new Date().toISOString(),
      uses: candidate.count,
      confidence: candidate.confidence,
    };

    delete this.profile.candidates[key];
    this.profile.stats.totalAdaptations++;

    console.log(
      `[voice-profile] ✦ Adapted: "${key}" → "${candidate.target}" ` +
      `(${candidate.count} consistent uses for user "${this.userId}")`
    );
  }

  /**
   * Record an accent-specific transcription correction
   * e.g., user's accent causes "write" to transcribe as "roit"
   */
  recordAccentCorrection(transcribed, intended) {
    const key = transcribed.toLowerCase().trim();
    this.profile.accentCorrections[key] = intended.toLowerCase().trim();
    this.save();
  }

  /**
   * Record user-specific filler words
   * e.g., "y'know", "basically", "right so"
   */
  addFillerWord(word) {
    const w = word.toLowerCase().trim();
    if (!this.profile.fillerWords.includes(w)) {
      this.profile.fillerWords.push(w);
      this.save();
    }
  }

  /**
   * Attempt to resolve a phrase using the user's profile.
   * Returns null if no mapping found.
   * 
   * Called at Layer 1.5 of the Tolerance Chain —
   * after exact patterns, before fuzzy match.
   * 
   * @param {string} input - The user's input phrase
   * @returns {{ resolved: string, confidence: number, source: string } | null}
   */
  resolve(input) {
    const key = input.toLowerCase().trim();

    // 1. Check accent corrections first
    let corrected = key;
    for (const [from, to] of Object.entries(this.profile.accentCorrections)) {
      corrected = corrected.replace(new RegExp(`\\b${this._escapeRegex(from)}\\b`, 'gi'), to);
    }

    // 2. Strip user-specific filler words
    for (const filler of this.profile.fillerWords) {
      corrected = corrected.replace(new RegExp(`\\b${this._escapeRegex(filler)}\\b`, 'gi'), '').trim();
    }
    corrected = corrected.replace(/\s{2,}/g, ' ').trim();

    // 3. Check confirmed dialect mappings
    if (this.profile.confirmed[corrected]) {
      return {
        resolved: this.profile.confirmed[corrected].target,
        confidence: 0.95,
        source: 'VoiceProfile:Confirmed',
      };
    }

    // 4. Check full phrase shortcuts
    if (this.profile.phrases[corrected]) {
      return {
        resolved: this.profile.phrases[corrected],
        confidence: 0.93,
        source: 'VoiceProfile:Phrase',
      };
    }

    // 5. Check candidate mappings (lower confidence)
    if (this.profile.candidates[corrected] && this.profile.candidates[corrected].count >= 2) {
      return {
        resolved: this.profile.candidates[corrected].target,
        confidence: 0.80 + (this.profile.candidates[corrected].count * 0.02),
        source: 'VoiceProfile:Candidate',
      };
    }

    // 6. If accent correction changed the input, return the corrected version
    if (corrected !== key) {
      return {
        resolved: corrected,
        confidence: 0.88,
        source: 'VoiceProfile:AccentCorrection',
      };
    }

    return null;
  }

  /**
   * Manually add a dialect mapping (e.g., from a config file or UI)
   */
  addMapping(userPhrase, canonicalForm) {
    this.profile.confirmed[userPhrase.toLowerCase().trim()] = {
      target: canonicalForm.toLowerCase().trim(),
      promotedAt: new Date().toISOString(),
      uses: 0,
      confidence: 1.0,
      source: 'manual',
    };
    this.save();
  }

  /**
   * Get profile statistics
   */
  getStats() {
    return {
      userId: this.userId,
      totalResolutions: this.profile.stats.totalResolutions,
      confirmedMappings: Object.keys(this.profile.confirmed).length,
      candidateMappings: Object.keys(this.profile.candidates).length,
      accentCorrections: Object.keys(this.profile.accentCorrections).length,
      fillerWords: this.profile.fillerWords.length,
      dialectConfidence: this.profile.stats.dialectConfidence,
      lastUpdated: this.profile.lastUpdated,
    };
  }

  /**
   * Update the overall dialect confidence score
   * Higher when more confirmed mappings and more total resolutions
   */
  _updateDialectConfidence() {
    const confirmed = Object.keys(this.profile.confirmed).length;
    const total = this.profile.stats.totalResolutions;
    if (total === 0) {
      this.profile.stats.dialectConfidence = 0;
      return;
    }
    // Sigmoid-like growth: starts slow, accelerates, then plateaus
    const raw = 1 - Math.exp(-0.01 * total - 0.1 * confirmed);
    this.profile.stats.dialectConfidence = Math.round(raw * 100) / 100;
  }

  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Export profile as a portable format (for sharing or backup)
   */
  export() {
    return JSON.parse(JSON.stringify(this.profile));
  }

  /**
   * Import a profile (merge with existing)
   */
  import(data) {
    if (data.confirmed) {
      Object.assign(this.profile.confirmed, data.confirmed);
    }
    if (data.accentCorrections) {
      Object.assign(this.profile.accentCorrections, data.accentCorrections);
    }
    if (data.fillerWords) {
      for (const fw of data.fillerWords) {
        this.addFillerWord(fw);
      }
    }
    this.save();
  }
}

module.exports = { VoiceProfile };
