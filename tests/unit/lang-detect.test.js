/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Language Detector — Comprehensive Test Suite
 *  Tests n-gram language detection for 10 languages:
 *  English, Spanish, French, German, Portuguese,
 *  Japanese, Mandarin Chinese, Hindi, Arabic, Korean
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectLanguage, supportedLanguages, getLanguageProfile, LANGUAGE_PROFILES } from '../../src/intent-resolver/lang-detect.js'

// ══════════════════════════════════════
//  API Surface
// ══════════════════════════════════════

describe('LangDetect: API', () => {
    it('exports detectLanguage function', () => {
        assert.equal(typeof detectLanguage, 'function')
    })
    it('exports supportedLanguages function', () => {
        assert.equal(typeof supportedLanguages, 'function')
    })
    it('exports getLanguageProfile function', () => {
        assert.equal(typeof getLanguageProfile, 'function')
    })
    it('exports LANGUAGE_PROFILES array', () => {
        assert.ok(Array.isArray(LANGUAGE_PROFILES))
    })
})

// ══════════════════════════════════════
//  Supported Languages
// ══════════════════════════════════════

describe('LangDetect: supportedLanguages', () => {
    it('returns 10 languages', () => {
        const langs = supportedLanguages()
        assert.equal(langs.length, 10)
    })
    it('includes English', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'en'))
    })
    it('includes Spanish', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'es'))
    })
    it('includes Japanese', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'ja'))
    })
    it('includes Mandarin Chinese', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'zh'))
    })
    it('includes Korean', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'ko'))
    })
    it('includes Arabic', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'ar'))
    })
    it('includes Hindi', () => {
        const langs = supportedLanguages()
        assert.ok(langs.some(l => l.code === 'hi'))
    })
})

// ══════════════════════════════════════
//  getLanguageProfile
// ══════════════════════════════════════

describe('LangDetect: getLanguageProfile', () => {
    it('returns profile for known code', () => {
        const profile = getLanguageProfile('en')
        assert.ok(profile)
        assert.equal(profile.code, 'en')
        assert.equal(profile.name, 'English')
    })
    it('returns null for unknown code', () => {
        assert.equal(getLanguageProfile('xx'), null)
    })
    it('profile has commonWords set', () => {
        const profile = getLanguageProfile('en')
        assert.ok(profile.commonWords instanceof Set)
    })
})

// ══════════════════════════════════════
//  English Detection
// ══════════════════════════════════════

describe('LangDetect: English', () => {
    it('detects English text', () => {
        const result = detectLanguage('the user has been updated and the data is now saved')
        assert.equal(result.code, 'en')
    })
    it('returns high confidence', () => {
        const result = detectLanguage('get the user data from the database and show it')
        assert.ok(result.confidence > 0.3)
    })
    it('defaults to English for empty input', () => {
        const result = detectLanguage('')
        assert.equal(result.code, 'en')
    })
    it('defaults to English for null input', () => {
        const result = detectLanguage(null)
        assert.equal(result.code, 'en')
    })
})

// ══════════════════════════════════════
//  Spanish Detection
// ══════════════════════════════════════

describe('LangDetect: Spanish', () => {
    it('detects Spanish text with accent marks', () => {
        const result = detectLanguage('el usuario está en la página de configuración')
        assert.equal(result.code, 'es')
    })
})

// ══════════════════════════════════════
//  French Detection
// ══════════════════════════════════════

describe('LangDetect: French', () => {
    it('detects French text', () => {
        const result = detectLanguage("l'utilisateur est dans le système avec des données")
        assert.equal(result.code, 'fr')
    })
})

// ══════════════════════════════════════
//  German Detection
// ══════════════════════════════════════

describe('LangDetect: German', () => {
    it('detects German text with umlauts', () => {
        const result = detectLanguage('der Benutzer ist auf der Seite für die Konfiguration')
        assert.equal(result.code, 'de')
    })
})

// ══════════════════════════════════════
//  Japanese Detection (Script)
// ══════════════════════════════════════

describe('LangDetect: Japanese', () => {
    it('detects Japanese hiragana', () => {
        const result = detectLanguage('これはテストです')
        assert.equal(result.code, 'ja')
    })
    it('detects Japanese katakana', () => {
        const result = detectLanguage('ユーザーデータ')
        assert.equal(result.code, 'ja')
    })
})

// ══════════════════════════════════════
//  Chinese Detection (Script)
// ══════════════════════════════════════

describe('LangDetect: Chinese', () => {
    it('detects Mandarin Chinese', () => {
        const result = detectLanguage('获取用户数据并显示在页面上')
        assert.equal(result.code, 'zh')
    })
})

// ══════════════════════════════════════
//  Korean Detection (Script)
// ══════════════════════════════════════

describe('LangDetect: Korean', () => {
    it('detects Korean text', () => {
        const result = detectLanguage('사용자 데이터를 가져오기')
        assert.equal(result.code, 'ko')
    })
})

// ══════════════════════════════════════
//  Arabic Detection (Script)
// ══════════════════════════════════════

describe('LangDetect: Arabic', () => {
    it('detects Arabic text', () => {
        const result = detectLanguage('الحصول على بيانات المستخدم')
        assert.equal(result.code, 'ar')
    })
})

// ══════════════════════════════════════
//  Hindi Detection (Script)
// ══════════════════════════════════════

describe('LangDetect: Hindi', () => {
    it('detects Hindi text', () => {
        const result = detectLanguage('उपयोगकर्ता डेटा प्राप्त करें')
        assert.equal(result.code, 'hi')
    })
})

// ══════════════════════════════════════
//  Return Value Shape
// ══════════════════════════════════════

describe('LangDetect: Return shape', () => {
    it('returns language name', () => {
        const result = detectLanguage('hello world')
        assert.equal(typeof result.language, 'string')
    })
    it('returns language code', () => {
        const result = detectLanguage('hello world')
        assert.equal(typeof result.code, 'string')
    })
    it('returns confidence number', () => {
        const result = detectLanguage('hello world')
        assert.equal(typeof result.confidence, 'number')
    })
    it('confidence is between 0 and 1', () => {
        const result = detectLanguage('the user has data in the database')
        assert.ok(result.confidence >= 0)
        assert.ok(result.confidence <= 1)
    })
})
