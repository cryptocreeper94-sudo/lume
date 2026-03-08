/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Language Detector
 *  N-gram heuristic language detection for 10 languages.
 *  No external dependencies — uses character frequency + 
 *  common word matching.
 * ═══════════════════════════════════════════════════════════
 */

/* ── Language Profiles ───────────────────────────────── */

/**
 * Each profile has:
 *   code:        ISO 639-1 code
 *   name:        Human-readable name
 *   commonWords: High-frequency words unique to the language
 *   charHints:   Character ranges or specific chars that identify the script
 */
const LANGUAGE_PROFILES = [
    {
        code: 'en',
        name: 'English',
        commonWords: new Set([
            'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'shall', 'may', 'might', 'must',
            'and', 'but', 'or', 'not', 'if', 'then', 'when', 'while',
            'for', 'from', 'with', 'this', 'that', 'these', 'those',
            'get', 'show', 'save', 'delete', 'create', 'update', 'send',
            'user', 'data', 'name', 'all', 'each', 'every',
        ]),
        charHints: null,  // English uses basic Latin — no unique chars
    },
    {
        code: 'es',
        name: 'Spanish',
        commonWords: new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
            'de', 'en', 'con', 'por', 'para', 'del', 'al',
            'es', 'son', 'está', 'están', 'ser', 'estar', 'hay',
            'que', 'no', 'se', 'su', 'sus', 'como', 'pero', 'más',
            'este', 'esta', 'estos', 'estas', 'ese', 'esa',
            'obtener', 'mostrar', 'guardar', 'eliminar', 'crear', 'enviar',
            'usuario', 'datos', 'nombre', 'todos', 'cada',
        ]),
        charHints: /[áéíóúñ¿¡ü]/i,
    },
    {
        code: 'fr',
        name: 'French',
        commonWords: new Set([
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'au', 'aux',
            'de', 'en', 'dans', 'avec', 'pour', 'par', 'sur', 'sous',
            'est', 'sont', 'être', 'avoir', 'fait', 'faire',
            'qui', 'que', 'ne', 'pas', 'se', 'ce', 'cette', 'ces',
            'mais', 'ou', 'et', 'donc', 'car', 'puis', 'aussi',
            'obtenir', 'afficher', 'sauvegarder', 'supprimer', 'créer', 'envoyer',
            'utilisateur', 'données', 'nom', 'tous', 'chaque',
        ]),
        charHints: /[àâçéèêëîïôùûüÿœæ]/i,
    },
    {
        code: 'de',
        name: 'German',
        commonWords: new Set([
            'der', 'die', 'das', 'ein', 'eine', 'den', 'dem', 'des',
            'und', 'oder', 'aber', 'nicht', 'ist', 'sind', 'war', 'hat',
            'von', 'zu', 'mit', 'auf', 'für', 'an', 'in', 'aus',
            'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'es',
            'wenn', 'dann', 'auch', 'noch', 'nur', 'schon', 'alle',
            'abrufen', 'anzeigen', 'speichern', 'löschen', 'erstellen', 'senden',
            'benutzer', 'daten', 'name', 'jeder', 'alle',
        ]),
        charHints: /[äöüß]/i,
    },
    {
        code: 'pt',
        name: 'Portuguese',
        commonWords: new Set([
            'o', 'os', 'as', 'um', 'uma', 'uns', 'umas',
            'de', 'em', 'com', 'por', 'para', 'do', 'da', 'dos', 'das',
            'é', 'são', 'está', 'estão', 'ser', 'estar', 'ter', 'há',
            'que', 'não', 'se', 'seu', 'sua', 'como', 'mas', 'mais',
            'este', 'esta', 'estes', 'estas', 'esse', 'essa',
            'obter', 'mostrar', 'salvar', 'excluir', 'criar', 'enviar',
            'usuário', 'dados', 'nome', 'todos', 'cada',
        ]),
        charHints: /[àáâãçéêíóôõú]/i,
    },
    {
        code: 'ja',
        name: 'Japanese',
        commonWords: new Set([
            'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し',
            'れ', 'さ', 'ある', 'いる', 'する', 'できる', 'なる',
            'この', 'その', 'あの', 'もの', 'こと', 'ため',
            'から', 'まで', 'より', 'について', 'として',
            '取得', '表示', '保存', '削除', '作成', '送信',
            'ユーザー', 'データ', '名前', 'すべて',
        ]),
        charHints: /[\u3040-\u309F\u30A0-\u30FF]/,  // ONLY Hiragana + Katakana (uniquely Japanese)
    },
    {
        code: 'zh',
        name: 'Mandarin Chinese',
        commonWords: new Set([
            '的', '是', '在', '了', '不', '和', '有', '这', '那',
            '我', '他', '她', '它', '们', '你', '会', '能', '要',
            '把', '到', '从', '用', '与', '或', '但', '如果',
            '获取', '显示', '保存', '删除', '创建', '发送',
            '用户', '数据', '名字', '所有', '每个',
        ]),
        charHints: /[\u4E00-\u9FFF\u3400-\u4DBF]/,  // CJK Unified Ideographs
    },
    {
        code: 'hi',
        name: 'Hindi',
        commonWords: new Set([
            'है', 'हैं', 'का', 'के', 'की', 'में', 'से', 'को',
            'और', 'या', 'पर', 'इस', 'उस', 'जो', 'यह', 'वह',
            'कर', 'हो', 'ना', 'था', 'थे', 'एक', 'सब', 'कुछ',
            'प्राप्त', 'दिखाना', 'सहेजना', 'हटाना', 'बनाना', 'भेजना',
            'उपयोगकर्ता', 'डेटा', 'नाम', 'सभी', 'प्रत्येक',
        ]),
        charHints: /[\u0900-\u097F]/,  // Devanagari
    },
    {
        code: 'ar',
        name: 'Arabic',
        commonWords: new Set([
            'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه',
            'أن', 'لا', 'ما', 'هو', 'هي', 'كان', 'كل', 'بين',
            'و', 'أو', 'لكن', 'إذا', 'ثم', 'قد', 'حتى',
            'الحصول', 'عرض', 'حفظ', 'حذف', 'إنشاء', 'إرسال',
            'المستخدم', 'البيانات', 'الاسم', 'الكل', 'كل',
        ]),
        charHints: /[\u0600-\u06FF\u0750-\u077F]/,  // Arabic script
    },
    {
        code: 'ko',
        name: 'Korean',
        commonWords: new Set([
            '의', '에', '를', '이', '가', '은', '는', '에서', '으로',
            '하다', '있다', '되다', '하고', '그', '이것', '그것',
            '와', '또는', '그러나', '만약', '그리고', '모든', '각',
            '가져오기', '표시', '저장', '삭제', '생성', '보내기',
            '사용자', '데이터', '이름', '모두', '각각',
        ]),
        charHints: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,  // Korean Hangul
    },
]

/* ── Main Detection Function ────────────────────────── */

/**
 * Detect the language of a text string.
 * Uses a combination of script detection (for non-Latin) and
 * common word frequency (for Latin-script languages).
 *
 * @param {string} text - The text to detect language for
 * @returns {{ language: string, code: string, confidence: number }}
 */
export function detectLanguage(text) {
    if (!text || text.trim().length === 0) {
        return { language: 'English', code: 'en', confidence: 1.0 }
    }

    const cleaned = text.trim().toLowerCase()

    // ── Phase 1: Script detection (instant for non-Latin) ──
    const scriptResult = detectByScript(cleaned)
    if (scriptResult) return scriptResult

    // ── Phase 2: Common-word frequency for Latin-script languages ──
    return detectByWordFrequency(cleaned)
}

/**
 * Detect language by unique character script (non-Latin).
 * Returns immediately for CJK, Devanagari, Arabic, Korean.
 */
function detectByScript(text) {
    const nonSpace = text.replace(/\s/g, '')
    if (nonSpace.length === 0) return null

    // ── Pass 1: Check for UNIQUE scripts (no overlap) ──
    // Japanese kana is checked BEFORE CJK to prevent Chinese eating Japanese
    const uniqueScriptProfiles = LANGUAGE_PROFILES.filter(p =>
        p.charHints && !['zh'].includes(p.code)
    )
    for (const profile of uniqueScriptProfiles) {
        const allMatches = [...nonSpace].filter(ch => profile.charHints.test(ch))
        const ratio = allMatches.length / nonSpace.length
        if (ratio > 0.15) {
            return { language: profile.name, code: profile.code, confidence: Math.min(0.95, 0.6 + ratio) }
        }
    }

    // ── Pass 2: Check for CJK (Chinese) — only if no kana was found ──
    const chineseProfile = LANGUAGE_PROFILES.find(p => p.code === 'zh')
    if (chineseProfile) {
        const cjkMatches = [...nonSpace].filter(ch => chineseProfile.charHints.test(ch))
        const ratio = cjkMatches.length / nonSpace.length
        if (ratio > 0.3) {
            return { language: chineseProfile.name, code: chineseProfile.code, confidence: Math.min(0.95, 0.6 + ratio) }
        }
    }

    return null
}

/**
 * Detect language by word frequency for Latin-script languages.
 * Scores each language profile and returns the best match.
 */
function detectByWordFrequency(text) {
    const words = text.replace(/[^\w\sáéíóúñüàâçèêëîïôùûüÿœæäöß]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)

    if (words.length === 0) {
        return { language: 'English', code: 'en', confidence: 0.5 }
    }

    const scores = []

    // Only score Latin-script languages (en, es, fr, de, pt)
    const latinProfiles = LANGUAGE_PROFILES.filter(p => ['en', 'es', 'fr', 'de', 'pt'].includes(p.code))

    for (const profile of latinProfiles) {
        let score = 0
        let charHintBonus = 0

        // Word matching
        for (const word of words) {
            if (profile.commonWords.has(word)) {
                score += 1
            }
        }

        // Character hint bonus (accent marks, special chars)
        if (profile.charHints) {
            for (const word of words) {
                if (profile.charHints.test(word)) {
                    charHintBonus += 0.5
                }
            }
        }

        const totalScore = (score + charHintBonus) / words.length
        scores.push({ profile, score: totalScore })
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    const best = scores[0]
    const second = scores[1]

    // Calculate confidence based on margin
    let confidence = Math.min(0.95, best.score * 1.5)
    if (second && best.score > 0 && second.score > 0) {
        const margin = (best.score - second.score) / best.score
        confidence = Math.min(0.95, 0.5 + margin * 0.5)
    }

    // Minimum confidence threshold — fall back to English
    if (confidence < 0.3 || best.score === 0) {
        return { language: 'English', code: 'en', confidence: 0.5 }
    }

    return {
        language: best.profile.name,
        code: best.profile.code,
        confidence: Math.round(confidence * 100) / 100,
    }
}

/**
 * Get all supported language codes
 */
export function supportedLanguages() {
    return LANGUAGE_PROFILES.map(p => ({ code: p.code, name: p.name }))
}

/**
 * Get the profile for a specific language code
 */
export function getLanguageProfile(code) {
    return LANGUAGE_PROFILES.find(p => p.code === code) || null
}

export { LANGUAGE_PROFILES }
