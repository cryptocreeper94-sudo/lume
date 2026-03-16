/**
 * Lume Pattern Library i18n — Test Suite
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { multilingualSynonyms, resolveMultilingualVerb, translateVerb, localizedStopWords, stripStopWords, errorMessages, getLocalizedError } from '../../src/intent-resolver/pattern-library-i18n.js'

describe('I18n: multilingualSynonyms', () => {
    it('has 8+ languages', () => { assert.ok(Object.keys(multilingualSynonyms).length >= 8) })
    it('Spanish: obtener → get', () => { assert.equal(multilingualSynonyms.es['obtener'], 'get') })
    it('French: afficher → show', () => { assert.equal(multilingualSynonyms.fr['afficher'], 'show') })
    it('German: löschen → delete', () => { assert.equal(multilingualSynonyms.de['löschen'], 'delete') })
    it('Japanese: 表示する → show', () => { assert.equal(multilingualSynonyms.ja['表示する'], 'show') })
    it('Chinese: 删除 → delete', () => { assert.equal(multilingualSynonyms.zh['删除'], 'delete') })
    it('Korean: 저장 → save', () => { assert.equal(multilingualSynonyms.ko['저장'], 'save') })
    it('Arabic: إنشاء → create', () => { assert.equal(multilingualSynonyms.ar['إنشاء'], 'create') })
    it('Portuguese: enviar → send', () => { assert.equal(multilingualSynonyms.pt['enviar'], 'send') })
})

describe('I18n: resolveMultilingualVerb', () => {
    it('resolves Spanish verb', () => { const r = resolveMultilingualVerb('mostrar'); assert.equal(r.verb, 'show'); assert.equal(r.language, 'es') })
    it('resolves with language hint', () => { const r = resolveMultilingualVerb('créer', 'fr'); assert.equal(r.verb, 'create') })
    it('returns null for unknown', () => { assert.equal(resolveMultilingualVerb('asdfqwer'), null) })
    it('resolves German verb', () => { const r = resolveMultilingualVerb('speichern'); assert.equal(r.verb, 'save') })
    it('resolves Japanese verb', () => { const r = resolveMultilingualVerb('送信する'); assert.equal(r.verb, 'send') })
})

describe('I18n: translateVerb', () => {
    it('translates Spanish sentence', () => { const r = translateVerb('mostrar los datos', 'es'); assert.ok(r); assert.equal(r.verb, 'show') })
    it('translates French sentence', () => { const r = translateVerb('supprimer les fichiers', 'fr'); assert.ok(r); assert.equal(r.verb, 'delete') })
    it('translates Japanese sentence', () => { const r = translateVerb('表示するデータ', 'ja'); assert.ok(r); assert.equal(r.verb, 'show') })
    it('translates multi-word verb (French)', () => { const r = translateVerb('mettre à jour le profil', 'fr'); assert.ok(r); assert.equal(r.verb, 'update') })
    it('returns null for English', () => { assert.equal(translateVerb('show the data', 'en'), null) })
    it('returns null for unknown language', () => { assert.equal(translateVerb('hello', 'xx'), null) })
})

describe('I18n: localizedStopWords', () => {
    it('has 10 languages', () => { assert.ok(Object.keys(localizedStopWords).length >= 10) })
    it('English includes "the"', () => { assert.ok(localizedStopWords.en.has('the')) })
    it('Spanish includes "el"', () => { assert.ok(localizedStopWords.es.has('el')) })
    it('Japanese includes "の"', () => { assert.ok(localizedStopWords.ja.has('の')) })
})

describe('I18n: stripStopWords', () => {
    it('strips English stop words', () => { const r = stripStopWords('get the user data from the database', 'en'); assert.ok(!r.includes(' the ')); assert.ok(r.includes('user')) })
    it('returns unchanged for unknown lang', () => { assert.equal(stripStopWords('hello world', 'zz'), 'hello world') })
})

describe('I18n: errorMessages', () => {
    it('has 10 languages', () => { assert.ok(Object.keys(errorMessages).length >= 10) })
    it('English: unresolvable', () => { assert.ok(errorMessages.en.unresolvable('test').includes('test')) })
    it('Spanish: blocked', () => { assert.ok(errorMessages.es.blocked('reason').includes('reason')) })
})

describe('I18n: getLocalizedError', () => {
    it('returns English by default', () => { const r = getLocalizedError('en', 'unresolvable', 'test'); assert.ok(r.includes('test')) })
    it('returns French error', () => { const r = getLocalizedError('fr', 'unresolvable', 'test'); assert.ok(r.includes('Impossible')) })
    it('falls back to English for unknown lang', () => { const r = getLocalizedError('zz', 'unresolvable', 'test'); assert.ok(r.includes('Could not')) })
})
