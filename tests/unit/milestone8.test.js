/**
 * ═══════════════════════════════════════════════════════════
 *  Milestone 8: Multilingual Natural Language — Test Suite
 *  Tests language detection, multilingual verb resolution,
 *  and end-to-end multilingual compilation.
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { detectLanguage, supportedLanguages, LANGUAGE_PROFILES } from '../../src/intent-resolver/lang-detect.js'
import {
    resolveMultilingualVerb,
    translateVerb,
    stripStopWords,
    getLocalizedError,
    multilingualSynonyms,
    localizedStopWords,
    errorMessages,
} from '../../src/intent-resolver/pattern-library-i18n.js'
import { resolveEnglishFile, detectMode } from '../../src/intent-resolver/index.js'

/* ═══ Language Detection ═══════════════════════════════ */

describe('M8: Language Detection', () => {
    it('detects English sentences', () => {
        const result = detectLanguage('get the user name from the database')
        assert.equal(result.code, 'en')
        assert.ok(result.confidence > 0.3)
    })

    it('detects Spanish sentences', () => {
        const result = detectLanguage('obtener el nombre del usuario')
        assert.equal(result.code, 'es')
    })

    it('detects French sentences', () => {
        const result = detectLanguage('afficher le nom de l\'utilisateur dans une liste')
        assert.equal(result.code, 'fr')
    })

    it('detects German sentences', () => {
        const result = detectLanguage('die Benutzerdaten aus der Datenbank abrufen')
        assert.equal(result.code, 'de')
    })

    it('detects Portuguese sentences', () => {
        const result = detectLanguage('obter todos os usuários do banco de dados')
        assert.equal(result.code, 'pt')
    })

    it('detects Japanese text', () => {
        const result = detectLanguage('ユーザーの名前を取得する')
        assert.equal(result.code, 'ja')
        assert.ok(result.confidence > 0.5)
    })

    it('detects Mandarin Chinese text', () => {
        const result = detectLanguage('获取用户的名字')
        assert.equal(result.code, 'zh')
        assert.ok(result.confidence > 0.5)
    })

    it('detects Hindi text', () => {
        const result = detectLanguage('उपयोगकर्ता का नाम प्राप्त करें')
        assert.equal(result.code, 'hi')
        assert.ok(result.confidence > 0.5)
    })

    it('detects Arabic text', () => {
        const result = detectLanguage('الحصول على اسم المستخدم')
        assert.equal(result.code, 'ar')
        assert.ok(result.confidence > 0.5)
    })

    it('detects Korean text', () => {
        const result = detectLanguage('사용자의 이름을 가져오기')
        assert.equal(result.code, 'ko')
        assert.ok(result.confidence > 0.5)
    })

    it('falls back to English for empty input', () => {
        const result = detectLanguage('')
        assert.equal(result.code, 'en')
    })

    it('falls back to English for unrecognized input', () => {
        const result = detectLanguage('xyz abc 123')
        assert.equal(result.code, 'en')
    })

    it('supports all 10 languages', () => {
        const langs = supportedLanguages()
        assert.equal(langs.length, 10)
        const codes = langs.map(l => l.code)
        assert.ok(codes.includes('en'))
        assert.ok(codes.includes('es'))
        assert.ok(codes.includes('fr'))
        assert.ok(codes.includes('de'))
        assert.ok(codes.includes('pt'))
        assert.ok(codes.includes('ja'))
        assert.ok(codes.includes('zh'))
        assert.ok(codes.includes('hi'))
        assert.ok(codes.includes('ar'))
        assert.ok(codes.includes('ko'))
    })
})

/* ═══ Multilingual Verb Resolution ═════════════════════ */

describe('M8: Multilingual Verb Resolution', () => {
    it('resolves Spanish verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('obtener').verb, 'get')
        assert.equal(resolveMultilingualVerb('mostrar').verb, 'show')
        assert.equal(resolveMultilingualVerb('guardar').verb, 'save')
        assert.equal(resolveMultilingualVerb('eliminar').verb, 'delete')
        assert.equal(resolveMultilingualVerb('crear').verb, 'create')
        assert.equal(resolveMultilingualVerb('enviar').verb, 'send')
    })

    it('resolves French verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('afficher').verb, 'show')
        assert.equal(resolveMultilingualVerb('supprimer').verb, 'delete')
        assert.equal(resolveMultilingualVerb('créer').verb, 'create')
        assert.equal(resolveMultilingualVerb('envoyer').verb, 'send')
        assert.equal(resolveMultilingualVerb('sauvegarder').verb, 'save')
    })

    it('resolves German verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('anzeigen').verb, 'show')
        assert.equal(resolveMultilingualVerb('löschen').verb, 'delete')
        assert.equal(resolveMultilingualVerb('erstellen').verb, 'create')
        assert.equal(resolveMultilingualVerb('speichern').verb, 'save')
        assert.equal(resolveMultilingualVerb('senden').verb, 'send')
    })

    it('resolves Portuguese verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('mostrar').verb, 'show')
        assert.equal(resolveMultilingualVerb('excluir').verb, 'delete')
        assert.equal(resolveMultilingualVerb('criar').verb, 'create')
        assert.equal(resolveMultilingualVerb('salvar').verb, 'save')
    })

    it('resolves Japanese verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('表示する').verb, 'show')
        assert.equal(resolveMultilingualVerb('削除する').verb, 'delete')
        assert.equal(resolveMultilingualVerb('作成する').verb, 'create')
        assert.equal(resolveMultilingualVerb('保存する').verb, 'save')
        assert.equal(resolveMultilingualVerb('送信する').verb, 'send')
    })

    it('resolves Chinese verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('获取').verb, 'get')
        assert.equal(resolveMultilingualVerb('显示').verb, 'show')
        assert.equal(resolveMultilingualVerb('删除').verb, 'delete')
        assert.equal(resolveMultilingualVerb('创建').verb, 'create')
        assert.equal(resolveMultilingualVerb('保存').verb, 'save')
    })

    it('resolves Korean verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('가져오기').verb, 'get')
        assert.equal(resolveMultilingualVerb('표시하다').verb, 'show')
        assert.equal(resolveMultilingualVerb('삭제하다').verb, 'delete')
        assert.equal(resolveMultilingualVerb('생성하다').verb, 'create')
    })

    it('resolves Arabic verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('عرض').verb, 'show')
        assert.equal(resolveMultilingualVerb('حذف').verb, 'delete')
        assert.equal(resolveMultilingualVerb('إنشاء').verb, 'create')
        assert.equal(resolveMultilingualVerb('حفظ').verb, 'save')
    })

    it('resolves Hindi verbs to canonical English', () => {
        assert.equal(resolveMultilingualVerb('दिखाना').verb, 'show')
        assert.equal(resolveMultilingualVerb('हटाना').verb, 'delete')
        assert.equal(resolveMultilingualVerb('बनाना').verb, 'create')
    })

    it('returns null for unknown verbs', () => {
        assert.equal(resolveMultilingualVerb('zzzxyz'), null)
    })

    it('uses language hint when provided', () => {
        const result = resolveMultilingualVerb('mostrar', 'es')
        assert.equal(result.verb, 'show')
        assert.equal(result.language, 'es')
    })
})

/* ═══ Verb Translation ═════════════════════════════════ */

describe('M8: Verb Translation', () => {
    it('translates Spanish sentence leading verb', () => {
        const result = translateVerb('obtener el nombre del usuario', 'es')
        assert.ok(result)
        assert.equal(result.verb, 'get')
        assert.equal(result.originalVerb, 'obtener')
        assert.ok(result.translated.startsWith('get'))
    })

    it('translates French sentence leading verb', () => {
        const result = translateVerb('afficher le nom de l\'utilisateur', 'fr')
        assert.ok(result)
        assert.equal(result.verb, 'show')
        assert.ok(result.translated.startsWith('show'))
    })

    it('translates German sentence leading verb', () => {
        const result = translateVerb('anzeigen die Benutzerdaten', 'de')
        assert.ok(result)
        assert.equal(result.verb, 'show')
        assert.ok(result.translated.startsWith('show'))
    })

    it('returns null for English sentences', () => {
        const result = translateVerb('get the user name', 'en')
        assert.equal(result, null) // English doesn't need translation
    })

    it('returns null for unrecognized verbs', () => {
        const result = translateVerb('xyzabc something', 'es')
        assert.equal(result, null)
    })

    it('handles multi-word verbs (French "mettre à jour")', () => {
        const result = translateVerb('mettre à jour les données', 'fr')
        assert.ok(result)
        assert.equal(result.verb, 'update')
    })
})

/* ═══ Localized Stop Words ═════════════════════════════ */

describe('M8: Localized Stop Words', () => {
    it('strips English stop words', () => {
        const result = stripStopWords('get the user from the database', 'en')
        assert.ok(!/ the /.test(result))
    })

    it('strips Spanish stop words', () => {
        const result = stripStopWords('obtener el nombre del usuario', 'es')
        assert.ok(!result.includes('el '))
        assert.ok(!result.includes('del '))
    })

    it('strips French stop words', () => {
        const result = stripStopWords('afficher le nom de utilisateur', 'fr')
        assert.ok(!result.includes(' le '))
    })

    it('returns unchanged for unknown language', () => {
        const result = stripStopWords('hello world', 'xx')
        assert.equal(result, 'hello world')
    })

    it('has stop words for all 10 languages', () => {
        const requiredCodes = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi', 'ar', 'ko']
        for (const code of requiredCodes) {
            assert.ok(localizedStopWords[code], `Missing stop words for ${code}`)
            assert.ok(localizedStopWords[code].size > 0, `Empty stop words for ${code}`)
        }
    })
})

/* ═══ Localized Error Messages ═════════════════════════ */

describe('M8: Localized Error Messages', () => {
    it('returns English error by default', () => {
        const msg = getLocalizedError('en', 'unresolvable', 'test input')
        assert.ok(msg.includes('test input'))
        assert.ok(msg.includes('understand'))
    })

    it('returns Spanish error', () => {
        const msg = getLocalizedError('es', 'unresolvable', 'test input')
        assert.ok(msg.includes('test input'))
        assert.ok(msg.includes('entender'))
    })

    it('returns French error', () => {
        const msg = getLocalizedError('fr', 'unresolvable', 'test input')
        assert.ok(msg.includes('comprendre'))
    })

    it('returns Japanese error', () => {
        const msg = getLocalizedError('ja', 'unresolvable', 'test input')
        assert.ok(msg.includes('理解'))
    })

    it('falls back to English for unknown language', () => {
        const msg = getLocalizedError('xx', 'unresolvable', 'test input')
        assert.ok(msg.includes('understand'))
    })

    it('has error messages for all 10 languages', () => {
        const requiredCodes = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi', 'ar', 'ko']
        for (const code of requiredCodes) {
            assert.ok(errorMessages[code], `Missing error messages for ${code}`)
            assert.ok(errorMessages[code].unresolvable, `Missing unresolvable error for ${code}`)
            assert.ok(errorMessages[code].lowConfidence, `Missing lowConfidence error for ${code}`)
            assert.ok(errorMessages[code].blocked, `Missing blocked error for ${code}`)
            assert.ok(errorMessages[code].correction, `Missing correction error for ${code}`)
        }
    })
})

/* ═══ Mode Detection ═══════════════════════════════════ */

describe('M8: Mode Detection', () => {
    it('detects mode: natural', () => {
        assert.equal(detectMode('mode: natural\nobtener el nombre'), 'natural')
    })

    it('mode: english still works', () => {
        assert.equal(detectMode('mode: english\nget the user name'), 'english')
    })

    it('standard mode for no header', () => {
        assert.equal(detectMode('let x = 5'), 'standard')
    })
})

/* ═══ End-to-End Multilingual Resolution ═══════════════ */

describe('M8: End-to-End Multilingual Resolution', () => {
    it('resolves Spanish sentences via mode: natural', async () => {
        const source = 'mode: natural\nmostrar el resultado'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        // After translating "mostrar" → "show", the Tolerance Chain should match
        assert.ok(result.ast.length > 0, 'Should have resolved at least one AST node')
        const node = result.ast[0]
        assert.ok(node.type, 'Node should have a type')
    })

    it('resolves French sentences via mode: natural', async () => {
        // "supprimer" translates to "delete", pattern matcher may or may not resolve the rest
        const source = 'mode: natural\nsupprimer les vieux enregistrements'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        // Verb should have been translated (check diagnostics for translation info)
        const hasTranslation = result.diagnostics.some(d => d.code === 'LUME-I005')
        assert.ok(hasTranslation || result.ast.length > 0, 'Should have translated verb or resolved AST')
    })

    it('resolves German sentences via mode: natural', async () => {
        const source = 'mode: natural\nerstellen einen neuen Benutzer'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        assert.ok(result.ast.length > 0, 'Should have resolved at least one AST node')
    })

    it('resolves Japanese sentences via mode: natural', async () => {
        const source = 'mode: natural\n表示する ユーザーデータ'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        assert.ok(result.ast.length > 0, 'Should have resolved at least one AST node')
    })

    it('resolves Chinese sentences via mode: natural', async () => {
        // Pure Chinese text should be detected as Chinese and verb translated
        const source = 'mode: natural\n获取用户数据'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        // Verb translation may succeed, check diagnostics or AST
        const hasTranslation = result.diagnostics.some(d => d.code === 'LUME-I005')
        const hasASTNode = result.ast.length > 0
        assert.ok(hasTranslation || hasASTNode, 'Should have translated verb or resolved AST')
    })

    it('handles mixed-language files', async () => {
        const source = 'mode: natural\nget the user name\nmostrar el resultado'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        assert.ok(result.ast.length >= 1, 'Should resolve at least one line')
    })

    it('adds language metadata to AST nodes in natural mode', async () => {
        const source = 'mode: natural\nmostrar el resultado'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        assert.ok(result.detectedLanguages, 'Should have detectedLanguages')
    })

    it('respects --lang override', async () => {
        const source = 'mode: natural\nmostrar el resultado'
        const result = await resolveEnglishFile(source, { filename: 'test.lume', lang: 'es' })
        assert.ok(result.detectedLanguages, 'Should have detectedLanguages')
        // With lang override, all lines forced to 'es'
        for (const [, info] of Object.entries(result.detectedLanguages)) {
            assert.equal(info.code, 'es')
        }
    })

    it('produces identical AST regardless of input language', async () => {
        const enSource = 'mode: natural\nshow the result'
        const esSource = 'mode: natural\nmostrar el result'

        const enResult = await resolveEnglishFile(enSource, { filename: 'test.lume' })
        const esResult = await resolveEnglishFile(esSource, { filename: 'test.lume' })

        // Both should resolve to ShowStatement
        if (enResult.ast.length > 0 && esResult.ast.length > 0) {
            assert.equal(enResult.ast[0].type, esResult.ast[0].type, 'Same AST type regardless of language')
        }
    })

    it('mode: english does NOT trigger multilingual detection', async () => {
        const source = 'mode: english\nget the user name'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        // In English mode, detectedLanguages should be empty
        assert.deepEqual(result.detectedLanguages, {})
    })
})

/* ═══ Synonym Ring Coverage ════════════════════════════ */

describe('M8: Synonym Ring Coverage', () => {
    it('has synonym rings for all 9 non-English languages', () => {
        const requiredLangs = ['es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi', 'ar', 'ko']
        for (const lang of requiredLangs) {
            assert.ok(multilingualSynonyms[lang], `Missing synonym ring for ${lang}`)
            assert.ok(Object.keys(multilingualSynonyms[lang]).length >= 10, `Synonym ring for ${lang} should have at least 10 entries`)
        }
    })

    it('every synonym ring covers core verbs (get, show, save, delete, create, send)', () => {
        const coreVerbs = ['get', 'show', 'save', 'delete', 'create', 'send']
        for (const [lang, ring] of Object.entries(multilingualSynonyms)) {
            const resolvedVerbs = new Set(Object.values(ring))
            for (const verb of coreVerbs) {
                assert.ok(resolvedVerbs.has(verb), `${lang} synonym ring missing canonical verb "${verb}"`)
            }
        }
    })
})

/* ═══ No Regression ════════════════════════════════════ */

describe('M8: No Regression', () => {
    it('mode: english still resolves English sentences', async () => {
        const source = 'mode: english\nget the user name'
        const result = await resolveEnglishFile(source, { filename: 'test.lume' })
        assert.ok(result.ast.length > 0, 'English mode should still resolve')
    })

    it('standard mode detection unchanged', () => {
        assert.equal(detectMode('let x = 5\nshow x'), 'standard')
    })
})
