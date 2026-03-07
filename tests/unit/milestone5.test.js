/**
 * ====== Lume Unit Tests — Milestone 5: Tooling & IDE ======
 * Tests formatter, linter, source maps, and CLI features.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { format } from '../../src/formatter.js'
import { lint, formatFindings } from '../../src/linter.js'
import { SourceMap, generateSourceMap } from '../../src/sourcemap.js'
import { tokenize } from '../../src/lexer.js'
import { parse } from '../../src/parser.js'
import { transpile } from '../../src/transpiler.js'

// ════════════════════════════════════════
// FORMATTER
// ════════════════════════════════════════
describe('Formatter', () => {
    it('removes trailing whitespace', () => {
        const result = format('let x = 42   \nlet y = 10  \n')
        assert.ok(!result.match(/\s+\n/), 'Should not have trailing spaces')
    })

    it('normalizes tabs to spaces', () => {
        const result = format('\tlet x = 42\n')
        assert.ok(!result.includes('\t'))
        assert.ok(result.includes('    let x = 42'))
    })

    it('limits consecutive blank lines to one', () => {
        const result = format('let x = 1\n\n\n\n\nlet y = 2\n')
        const blankRuns = result.match(/\n{3,}/g)
        assert.equal(blankRuns, null, 'Should not have more than one blank line')
    })

    it('ensures single trailing newline', () => {
        const result = format('let x = 42\n\n\n')
        assert.ok(result.endsWith('\n'))
        assert.ok(!result.endsWith('\n\n'))
    })

    it('adds blank lines between top-level declarations', () => {
        const result = format('to foo():\n    show "hi"\nto bar():\n    show "hey"\n')
        // There should be a blank line between the end of foo and start of bar
        assert.ok(result.includes('\n\nto bar'))
    })

    it('preserves correct indentation', () => {
        const input = 'if true:\n    show "yes"\n'
        const result = format(input)
        assert.ok(result.includes('    show'))
    })
})

// ════════════════════════════════════════
// LINTER
// ════════════════════════════════════════
describe('Linter', () => {
    it('detects trailing whitespace', () => {
        const findings = lint('let x = 42   ', 'test.lume')
        const trailingWS = findings.find(f => f.code === 'L003')
        assert.ok(trailingWS, 'Should find trailing whitespace')
    })

    it('detects odd indentation', () => {
        const findings = lint('if true:\n   show "bad"\n', 'test.lume')
        const oddIndent = findings.find(f => f.code === 'L002')
        assert.ok(oddIndent, 'Should detect 3-space indent')
    })

    it('suggests snake_case for functions', () => {
        const findings = lint('to myFunction():\n    show "hi"\n', 'test.lume')
        const naming = findings.find(f => f.code === 'L010')
        assert.ok(naming, 'Should suggest snake_case')
        assert.ok(naming.suggestion.includes('my_function'))
    })

    it('detects unused variables', () => {
        const findings = lint('let unused_var = 42\nshow "hello"\n', 'test.lume')
        const unused = findings.find(f => f.code === 'L020')
        assert.ok(unused, 'Should detect unused variable')
    })

    it('warns about short AI prompts', () => {
        const findings = lint('let x = ask "hi"\n', 'test.lume')
        const shortPrompt = findings.find(f => f.code === 'L031')
        assert.ok(shortPrompt, 'Should warn about short prompt')
    })

    it('warns about long lines', () => {
        const longLine = 'let x = "' + 'a'.repeat(200) + '"'
        const findings = lint(longLine, 'test.lume')
        const lineTooLong = findings.find(f => f.code === 'L040')
        assert.ok(lineTooLong, 'Should detect long line')
    })

    it('returns no findings for clean code', () => {
        const clean = 'let name = "Lume"\nshow "Hello {name}"\n'
        const findings = lint(clean, 'test.lume')
        const errors = findings.filter(f => f.severity === 'error')
        assert.equal(errors.length, 0, 'No errors in clean code')
    })

    it('formats findings as string', () => {
        const findings = lint('let x = 42   ', 'test.lume')
        const output = formatFindings(findings)
        assert.ok(typeof output === 'string')
        assert.ok(output.includes('L003') || output.includes('L020'))
    })

    it('shows no issues message for empty findings', () => {
        const output = formatFindings([])
        assert.ok(output.includes('No issues found'))
    })
})

// ════════════════════════════════════════
// SOURCE MAP
// ════════════════════════════════════════
describe('Source Map', () => {
    it('creates and resolves mappings', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1, 'let x')
        sm.addMapping(3, 2, 'show')
        const resolved = sm.resolve(3)
        assert.equal(resolved.lumeLine, 2)
    })

    it('resolves closest preceding mapping', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        sm.addMapping(5, 3)
        sm.addMapping(10, 7)
        const resolved = sm.resolve(8)
        assert.equal(resolved.lumeLine, 3)
    })

    it('exports to JSON', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        const json = sm.toJSON()
        assert.equal(json.file, 'test.lume')
        assert.ok(Array.isArray(json.mappings))
    })

    it('generates inline source map comment', () => {
        const sm = new SourceMap('test.lume')
        sm.addMapping(1, 1)
        const comment = sm.toComment()
        assert.ok(comment.startsWith('//# sourceMappingURL='))
        assert.ok(comment.includes('base64'))
    })

    it('generates source map from Lume + JS', () => {
        const lume = 'let x = 42\nshow x\n'
        const js = transpile(parse(tokenize(lume, 'test.lume'), 'test.lume'), 'test.lume')
        const sm = generateSourceMap(lume, js, 'test.lume')
        assert.ok(sm.mappings.length > 0)
    })
})

// ════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ════════════════════════════════════════
describe('M5: No Regression', () => {
    it('basic compilation still works', () => {
        const source = 'let x = 42\nshow x'
        const tokens = tokenize(source, 'test.lume')
        const ast = parse(tokens, 'test.lume')
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('let x = 42'))
        assert.ok(js.includes('console.log'))
    })

    it('AI compilation still works', () => {
        const source = 'let answer = ask claude.sonnet "Hello"'
        const tokens = tokenize(source, 'test.lume')
        const ast = parse(tokens, 'test.lume')
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('__lume_ask'))
        assert.ok(js.includes('"claude.sonnet"'))
    })

    it('pipe still works', () => {
        const source = 'let x = 42 |> double'
        const tokens = tokenize(source, 'test.lume')
        const ast = parse(tokens, 'test.lume')
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('double(42)'))
    })

    it('fetch still works', () => {
        const source = 'let data = fetch "https://api.example.com" as json'
        const tokens = tokenize(source, 'test.lume')
        const ast = parse(tokens, 'test.lume')
        const js = transpile(ast, 'test.lume')
        assert.ok(js.includes('await fetch'))
    })
})
