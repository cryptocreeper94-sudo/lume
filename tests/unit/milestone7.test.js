/**
 * ════════════════════════════════════════════════════════════════
 *  Lume Unit Tests — Milestone 7: English Mode & Intent Resolver
 *  Tests the full pipeline: Auto-Correct → Sentence Split → 
 *  Tolerance Chain → Security Layer → AST → Transpile
 * ════════════════════════════════════════════════════════════════
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize, TokenType } from '../../src/lexer.js'
import { parse, NodeType } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'

// Intent Resolver modules
import { matchPattern, patterns } from '../../src/intent-resolver/pattern-library.js'
import { levenshtein, similarity, wordBagSimilarity, soundex, correctSentence } from '../../src/intent-resolver/fuzzy-matcher.js'
import { autoCorrect, formatCorrections } from '../../src/intent-resolver/auto-correct.js'
import { splitSentence } from '../../src/intent-resolver/sentence-splitter.js'
import { resolveTemporal, hasTemporalExpression } from '../../src/intent-resolver/temporal-resolver.js'
import { checkSecurity, scanASTNode, THREAT_CATEGORIES, generateCertificate, formatThreat } from '../../src/intent-resolver/security-layer.js'
import { resetFileScope, registerVariable, registerDataModel, registerFunction, updateMemory, resolvePronoun, getAIContext, getAutocorrectContext, scanProject } from '../../src/intent-resolver/context-engine.js'
import { detectMode, resolveEnglishFile } from '../../src/intent-resolver/index.js'

// ── Helpers ──
function compileToJS(source) {
    const tokens = tokenize(source, 'test.lume')
    const ast = parse(tokens, 'test.lume')
    return transpile(ast, 'test.lume')
}

// ════════════════════════════════════════════════════
// 1. PATTERN LIBRARY (Layer A)
// ════════════════════════════════════════════════════
describe('M7: Pattern Library', () => {
    it('matches "get the user" as VariableAccess', () => {
        const result = matchPattern('get the user')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'VariableAccess')
        assert.equal(result.ast.target, 'user')
    })

    it('matches "fetch all records" as VariableAccess', () => {
        const result = matchPattern('fetch all records')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'VariableAccess')
    })

    it('matches "show X on screen" as ShowStatement', () => {
        const result = matchPattern('show the result on screen')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'ShowStatement')
    })

    it('matches "display X" as ShowStatement', () => {
        const result = matchPattern('display the output')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'ShowStatement')
    })

    it('matches "save X to database" as StoreOperation', () => {
        const result = matchPattern('save the data to the database')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'StoreOperation')
    })

    it('matches "store X" as StoreOperation', () => {
        const result = matchPattern('store the results')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'StoreOperation')
    })

    it('matches "delete X from Y" as DeleteOperation', () => {
        const result = matchPattern('delete the record from database')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'DeleteOperation')
    })

    it('matches "remove X" as DeleteOperation', () => {
        const result = matchPattern('remove the item')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'DeleteOperation')
    })

    it('matches "create a new X" as CreateOperation', () => {
        const result = matchPattern('create a new user')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'CreateOperation')
    })

    it('matches "send X to Y" as SendOperation', () => {
        const result = matchPattern('send the response to the client')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'SendOperation')
    })

    it('matches "filter X where Y" as FilterOperation', () => {
        const result = matchPattern('filter users where age is greater than 18')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'FilterOperation')
    })

    it('matches "sort X by Y" as SortOperation', () => {
        const result = matchPattern('sort users by name')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'SortOperation')
    })

    it('matches "connect to X" as ConnectionSetup', () => {
        const result = matchPattern('connect to the database')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'ConnectionSetup')
    })

    it('matches "wait X seconds" as DelayStatement', () => {
        const result = matchPattern('wait 5 seconds')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'DelayStatement')
        assert.equal(result.ast.duration, 5000)
    })

    it('matches "update X" as UpdateOperation', () => {
        const result = matchPattern('update the profile')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'UpdateOperation')
    })

    it('matches "navigate to X" as NavigateOperation', () => {
        const result = matchPattern('navigate to /dashboard')
        assert.equal(result.matched, true)
        assert.equal(result.ast.type, 'NavigateOperation')
    })

    it('handles unmatched input gracefully', () => {
        const result = matchPattern('this is completely random gibberish xyz')
        assert.equal(result.matched, false)
    })

    it('has at least 30 patterns defined', () => {
        assert.ok(patterns.length >= 30, `Expected 30+ patterns, got ${patterns.length}`)
    })
})

// ════════════════════════════════════════════════════
// 2. FUZZY MATCHER
// ════════════════════════════════════════════════════
describe('M7: Fuzzy Matcher', () => {
    it('calculates Levenshtein distance correctly', () => {
        assert.equal(levenshtein('kitten', 'sitting'), 3)
        assert.equal(levenshtein('', 'abc'), 3)
        assert.equal(levenshtein('abc', 'abc'), 0)
    })

    it('calculates similarity correctly', () => {
        assert.ok(similarity('hello', 'hello') === 1.0)
        assert.ok(similarity('hello', 'helo') > 0.7)
        assert.ok(similarity('abc', 'xyz') < 0.5)
    })

    it('word-bag similarity works', () => {
        assert.ok(wordBagSimilarity('get the user name', 'fetch the user name') > 0.6)
        assert.ok(wordBagSimilarity('get', 'bicycle pump for sale') < 0.3)
    })

    it('soundex encoding works', () => {
        assert.equal(soundex('Robert'), soundex('Rupert'))
        assert.notEqual(soundex('Robert'), soundex('Smith'))
    })

    it('corrects common misspellings', () => {
        const { corrected, corrections } = correctSentence('recieve the respons')
        assert.ok(corrected.includes('receive') || corrections.length > 0)
    })
})

// ════════════════════════════════════════════════════
// 3. AUTO-CORRECT
// ════════════════════════════════════════════════════
describe('M7: Auto-Correct', () => {
    it('strips filler words', () => {
        const result = autoCorrect('um like get the user')
        assert.ok(!result.corrected.includes('um'))
        assert.ok(result.wasModified)
    })

    it('handles self-corrections (no, I mean...)', () => {
        const result = autoCorrect('get the user, no, I mean get the admin')
        // Should use the corrected part
        assert.ok(result.corrections.some(c => c.type === 'self-correction'))
    })

    it('converts number words to digits', () => {
        const result = autoCorrect('wait five seconds')
        assert.ok(result.corrected.includes('5'))
    })

    it('fixes voice phonetic errors', () => {
        const result = autoCorrect('connect to the sequel database')
        assert.ok(result.corrected.includes('SQL'))
    })

    it('respects noAutocorrect flag', () => {
        const result = autoCorrect('um like get the user', {}, { noAutocorrect: true })
        assert.equal(result.wasModified, false)
    })

    it('formats corrections for output', () => {
        const corrections = [{ type: 'filler', original: 'um', fixed: '' }]
        const formatted = formatCorrections(corrections, 1)
        assert.ok(formatted[0].includes('Line 1'))
    })
})

// ════════════════════════════════════════════════════
// 4. SENTENCE SPLITTER
// ════════════════════════════════════════════════════
describe('M7: Sentence Splitter', () => {
    it('splits on "then" (sequential)', () => {
        const ops = splitSentence('get the data then show it')
        assert.equal(ops.length, 2)
        assert.equal(ops[0].relation, 'root')
        assert.equal(ops[1].relation, 'sequential')
    })

    it('splits on "also" (parallel)', () => {
        const ops = splitSentence('get the data, also send it')
        assert.equal(ops.length, 2)
        assert.equal(ops[1].relation, 'parallel')
    })

    it('splits verb-AND-verb (get the user and show the name)', () => {
        const ops = splitSentence('get the user and show the name')
        assert.equal(ops.length, 2)
    })

    it('does NOT split noun-AND-noun (get the name and email)', () => {
        const ops = splitSentence('get the name and email')
        assert.equal(ops.length, 1)
    })

    it('returns single op for simple sentence', () => {
        const ops = splitSentence('get the user')
        assert.equal(ops.length, 1)
        assert.equal(ops[0].relation, 'root')
    })

    it('handles empty input', () => {
        assert.deepEqual(splitSentence(''), [])
    })
})

// ════════════════════════════════════════════════════
// 5. TEMPORAL RESOLVER
// ════════════════════════════════════════════════════
describe('M7: Temporal Resolver', () => {
    it('detects "today"', () => {
        const result = resolveTemporal('get records from today')
        assert.equal(result.hasTemporalRef, true)
        assert.ok(result.expressions[0].resolved.includes('new Date'))
    })

    it('detects "yesterday"', () => {
        const result = resolveTemporal('delete records from yesterday')
        assert.equal(result.hasTemporalRef, true)
    })

    it('detects "N days ago"', () => {
        const result = resolveTemporal('get data from 30 days ago')
        assert.equal(result.hasTemporalRef, true)
        assert.ok(result.expressions[0].resolved.includes('86400000'))
    })

    it('detects "in N hours"', () => {
        const result = resolveTemporal('schedule task in 2 hours')
        assert.equal(result.hasTemporalRef, true)
        assert.ok(result.expressions[0].resolved.includes('3600000'))
    })

    it('returns false for non-temporal', () => {
        assert.equal(hasTemporalExpression('get the user name'), false)
    })
})

// ════════════════════════════════════════════════════
// 6. SECURITY LAYER
// ════════════════════════════════════════════════════
describe('M7: Security Layer — Input Scanning', () => {
    it('blocks "delete all"', () => {
        const result = checkSecurity('delete all records')
        assert.equal(result.safe, false)
        assert.equal(result.blocked, true)
        assert.ok(result.threats.some(t => t.category === 'FILE_DESTRUCTION'))
    })

    it('blocks credential exposure', () => {
        const result = checkSecurity('show the api key')
        assert.equal(result.safe, false)
        assert.equal(result.blocked, true)
    })

    it('blocks system commands', () => {
        const result = checkSecurity('run a shell command')
        assert.equal(result.safe, false)
    })

    it('warns about mass operations', () => {
        const result = checkSecurity('send email to every user')
        assert.equal(result.safe, false)
        assert.ok(result.threats.some(t => t.category === 'MASS_OPERATIONS'))
    })

    it('warns about infinite operations', () => {
        const result = checkSecurity('repeat forever')
        assert.equal(result.safe, false)
    })

    it('passes safe input', () => {
        const result = checkSecurity('get the user name')
        assert.equal(result.safe, true)
        assert.equal(result.threats.length, 0)
    })

    it('respects unsafeMode config', () => {
        const result = checkSecurity('delete all records', { unsafeMode: true })
        assert.equal(result.safe, true)
    })

    it('has all 11 threat categories defined', () => {
        assert.equal(Object.keys(THREAT_CATEGORIES).length, 11)
    })
})

describe('M7: Security Layer — AST Scanning (Guardian)', () => {
    it('flags unfiltered delete', () => {
        const result = scanASTNode({ type: 'DeleteOperation', target: 'users' })
        assert.equal(result.safe, false)
    })

    it('passes filtered delete', () => {
        const result = scanASTNode({ type: 'DeleteOperation', target: 'users', filter: 'id = 5' })
        assert.equal(result.safe, true)
    })

    it('flags undeclared network domains', () => {
        const result = scanASTNode({ type: 'SendOperation', target: 'https://evil.com' })
        assert.equal(result.safe, false)
    })

    it('passes allowed domains', () => {
        const result = scanASTNode({ type: 'SendOperation', target: 'https://localhost:3000/api' }, { allowedDomains: ['localhost'] })
        assert.equal(result.safe, true)
    })
})

describe('M7: Security Certificates', () => {
    it('generates certificate header', () => {
        const cert = generateCertificate('test.lume', 10, 2, 'standard', 'abc123')
        assert.ok(cert.includes('LUME SECURITY CERTIFIED'))
        assert.ok(cert.includes('test.lume'))
        assert.ok(cert.includes('abc123'))
    })

    it('formats threats correctly', () => {
        const threat = { level: 'BLOCK', label: 'Test Threat', message: 'Test message' }
        const formatted = formatThreat(threat, 5)
        assert.ok(formatted.includes('Line 5'))
        assert.ok(formatted.includes('BLOCKED'))
    })
})

// ════════════════════════════════════════════════════
// 7. CONTEXT ENGINE
// ════════════════════════════════════════════════════
describe('M7: Context Engine', () => {
    before(() => {
        resetFileScope()
    })

    it('registers variables', () => {
        registerVariable('username', 'text', 1)
        const ctx = getAutocorrectContext()
        assert.ok(ctx.variables.includes('username'))
    })

    it('registers data models', () => {
        registerDataModel('users', ['name', 'email', 'age'])
        const ctx = getAIContext()
        assert.ok(ctx.tables.includes('users'))
        assert.deepEqual(ctx.dataModels.users.fields, ['name', 'email', 'age'])
    })

    it('registers functions', () => {
        registerFunction('sendEmail', ['to', 'subject', 'body'])
        const ctx = getAIContext()
        assert.ok(ctx.functions.includes('sendEmail'))
    })

    it('resolves pronoun "it" to last subject', () => {
        updateMemory(1, 'user', 'get', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 2)
        assert.equal(result.resolved, true)
        assert.equal(result.value, 'user')
    })

    it('resolves pronoun "they" to last subject', () => {
        updateMemory(3, 'records', 'filter', { type: 'FilterOperation' })
        const result = resolvePronoun('they', 4)
        assert.equal(result.resolved, true)
        assert.equal(result.value, 'records')
    })

    it('warns when pronoun referent is far away', () => {
        updateMemory(1, 'data', 'get', { type: 'VariableAccess' })
        const result = resolvePronoun('it', 30)
        assert.equal(result.resolved, true)
        assert.ok(result.warning)
        assert.ok(result.warning.includes('LUME-W002'))
    })

    it('returns warning when no referent exists', () => {
        resetFileScope()
        const result = resolvePronoun('it', 1)
        assert.equal(result.resolved, false)
        assert.ok(result.warning)
    })
})

// ════════════════════════════════════════════════════
// 8. MODE DETECTION
// ════════════════════════════════════════════════════
describe('M7: Mode Detection', () => {
    it('detects english mode', () => {
        assert.equal(detectMode('mode: english\nget the user'), 'english')
    })

    it('detects natural mode', () => {
        assert.equal(detectMode('mode: natural\nget the user'), 'natural')
    })

    it('detects standard mode', () => {
        assert.equal(detectMode('let x = 5'), 'standard')
    })
})

// ════════════════════════════════════════════════════
// 9. TRANSPILER: English Mode Node Emission
// ════════════════════════════════════════════════════
describe('M7: Transpiler — English Mode Nodes', () => {
    it('emits VariableAccess', () => {
        const ast = { type: 'Program', body: [{ type: 'VariableAccess', target: 'user' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('user'))
    })

    it('emits StoreOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'StoreOperation', value: 'data', target: 'database' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('insert'))
    })

    it('emits DeleteOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'DeleteOperation', target: 'record' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('delete'))
    })

    it('emits CreateOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'CreateOperation', target: 'user' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('create'))
    })

    it('emits SendOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'SendOperation', payload: 'data', target: 'https://api.example.com' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('fetch'))
        assert.ok(js.includes('POST'))
    })

    it('emits FilterOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'FilterOperation', target: 'users', condition: 'age > 18' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('filter'))
    })

    it('emits SortOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'SortOperation', target: 'users', by: 'name' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('sort'))
    })

    it('emits DelayStatement', () => {
        const ast = { type: 'Program', body: [{ type: 'DelayStatement', duration: 3000 }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('setTimeout'))
        assert.ok(js.includes('3000'))
    })

    it('emits RawBlock', () => {
        const ast = { type: 'Program', body: [{ type: 'RawBlock', code: 'console.log("raw")' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('console.log("raw")'))
    })

    it('emits ConnectionSetup', () => {
        const ast = { type: 'Program', body: [{ type: 'ConnectionSetup', target: 'postgresql://localhost' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('connect'))
    })

    it('emits NavigateOperation', () => {
        const ast = { type: 'Program', body: [{ type: 'NavigateOperation', target: '/dashboard' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('/dashboard'))
    })

    it('emits EventListener', () => {
        const ast = { type: 'Program', body: [{ type: 'EventListener', element: 'button', event: 'click' }] }
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('addEventListener'))
        assert.ok(js.includes('click'))
    })
})

// ════════════════════════════════════════════════════
// 10. NodeType ENUM
// ════════════════════════════════════════════════════
describe('M7: NodeType Enum', () => {
    it('includes all English Mode types', () => {
        assert.equal(NodeType.VariableAccess, 'VariableAccess')
        assert.equal(NodeType.StoreOperation, 'StoreOperation')
        assert.equal(NodeType.DeleteOperation, 'DeleteOperation')
        assert.equal(NodeType.CreateOperation, 'CreateOperation')
        assert.equal(NodeType.UpdateOperation, 'UpdateOperation')
        assert.equal(NodeType.SendOperation, 'SendOperation')
        assert.equal(NodeType.FilterOperation, 'FilterOperation')
        assert.equal(NodeType.SortOperation, 'SortOperation')
        assert.equal(NodeType.ConnectionSetup, 'ConnectionSetup')
        assert.equal(NodeType.EventListener, 'EventListener')
        assert.equal(NodeType.NavigateOperation, 'NavigateOperation')
        assert.equal(NodeType.DelayStatement, 'DelayStatement')
        assert.equal(NodeType.RawBlock, 'RawBlock')
        assert.equal(NodeType.HealableDecorator, 'HealableDecorator')
    })
})

// ════════════════════════════════════════════════════
// 11. BACKWARD COMPATIBILITY
// ════════════════════════════════════════════════════
describe('M7: No Regression', () => {
    it('standard mode still compiles hello.lume', () => {
        const js = compileToJS('show "Hello from Lume"')
        assert.ok(js.includes('console.log'))
    })

    it('standard mode AI calls still work', () => {
        const js = compileToJS('let x = ask "What is 2+2?"')
        assert.ok(js.includes('__lume_ask'))
    })

    it('standard mode pipe still works', () => {
        const js = compileToJS('let x = 42 |> double')
        assert.ok(js.includes('double(42)'))
    })

    it('standard mode functions still work', () => {
        const js = compileToJS('to double(n: number) -> n * 2\nshow 5 |> double')
        const output = []
        const origLog = console.log
        console.log = (...args) => output.push(args.join(' '))
        try { new Function(js)() } finally { console.log = origLog }
        assert.equal(output[0], '10')
    })

    it('M6 monitor block still parses', () => {
        const js = compileToJS('monitor:\n    dashboard: true\n')
        assert.ok(js.includes('monitor'))
    })

    it('M6 heal block still parses', () => {
        const js = compileToJS('heal:\n    retries: 3\n')
        assert.ok(js.includes('healer'))
    })
})
