/**
 * ═══════════════════════════════════════════════════════════
 *  Lume Standard Library — Comprehensive Test Suite
 *  Tests all stdlib modules: text, math, list, time, convert
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { text, math, list, time, convert, stdlib } from '../../src/stdlib.js'

/* ═══ Text Module ═════════════════════════════════════════ */

describe('Stdlib: text.upper', () => {
    it('uppercases a string', () => assert.equal(text.upper('hello'), 'HELLO'))
    it('handles empty string', () => assert.equal(text.upper(''), ''))
    it('handles numbers via coercion', () => assert.equal(text.upper(42), '42'))
})

describe('Stdlib: text.lower', () => {
    it('lowercases a string', () => assert.equal(text.lower('HELLO'), 'hello'))
    it('handles mixed case', () => assert.equal(text.lower('HeLLo'), 'hello'))
})

describe('Stdlib: text.trim', () => {
    it('strips whitespace', () => assert.equal(text.trim('  hello  '), 'hello'))
    it('strips tabs and newlines', () => assert.equal(text.trim('\thello\n'), 'hello'))
})

describe('Stdlib: text.split', () => {
    it('splits by separator', () => assert.deepEqual(text.split('a,b,c', ','), ['a', 'b', 'c']))
    it('splits by space', () => assert.deepEqual(text.split('hello world', ' '), ['hello', 'world']))
})

describe('Stdlib: text.join', () => {
    it('joins with default separator', () => assert.equal(text.join(['a', 'b', 'c']), 'a, b, c'))
    it('joins with custom separator', () => assert.equal(text.join(['a', 'b'], '-'), 'a-b'))
})

describe('Stdlib: text.replace', () => {
    it('replaces all occurrences', () => assert.equal(text.replace('aaa', 'a', 'b'), 'bbb'))
    it('replaces substring', () => assert.equal(text.replace('hello world', 'world', 'lume'), 'hello lume'))
})

describe('Stdlib: text.contains', () => {
    it('returns true for substring', () => assert.equal(text.contains('hello world', 'world'), true))
    it('returns false for missing', () => assert.equal(text.contains('hello', 'xyz'), false))
})

describe('Stdlib: text.starts_with / ends_with', () => {
    it('starts_with matches prefix', () => assert.equal(text.starts_with('hello', 'hel'), true))
    it('starts_with rejects mismatch', () => assert.equal(text.starts_with('hello', 'xyz'), false))
    it('ends_with matches suffix', () => assert.equal(text.ends_with('hello', 'llo'), true))
    it('ends_with rejects mismatch', () => assert.equal(text.ends_with('hello', 'xyz'), false))
})

describe('Stdlib: text.length', () => {
    it('returns string length', () => assert.equal(text.length('hello'), 5))
    it('returns 0 for empty', () => assert.equal(text.length(''), 0))
})

describe('Stdlib: text.reverse', () => {
    it('reverses a string', () => assert.equal(text.reverse('hello'), 'olleh'))
    it('palindrome stays same', () => assert.equal(text.reverse('aba'), 'aba'))
})

describe('Stdlib: text.repeat', () => {
    it('repeats n times', () => assert.equal(text.repeat('ab', 3), 'ababab'))
    it('repeat 0 gives empty', () => assert.equal(text.repeat('x', 0), ''))
})

describe('Stdlib: text.pad_left / pad_right', () => {
    it('pads left with spaces', () => assert.equal(text.pad_left('5', 3), '  5'))
    it('pads left with custom char', () => assert.equal(text.pad_left('5', 3, '0'), '005'))
    it('pads right with spaces', () => assert.equal(text.pad_right('5', 3), '5  '))
})

describe('Stdlib: text.slice', () => {
    it('slices substring', () => assert.equal(text.slice('hello', 1, 3), 'el'))
    it('slices from start', () => assert.equal(text.slice('hello', 0, 2), 'he'))
})

describe('Stdlib: text.chars', () => {
    it('splits into characters', () => assert.deepEqual(text.chars('abc'), ['a', 'b', 'c']))
})

/* ═══ Math Module ═════════════════════════════════════════ */

describe('Stdlib: math basics', () => {
    it('abs returns absolute', () => assert.equal(math.abs(-5), 5))
    it('ceil rounds up', () => assert.equal(math.ceil(1.1), 2))
    it('floor rounds down', () => assert.equal(math.floor(1.9), 1))
    it('round rounds nearest', () => assert.equal(math.round(1.5), 2))
    it('min finds minimum', () => assert.equal(math.min(1, 2, 3), 1))
    it('max finds maximum', () => assert.equal(math.max(1, 2, 3), 3))
    it('pow computes power', () => assert.equal(math.pow(2, 3), 8))
    it('sqrt computes root', () => assert.equal(math.sqrt(9), 3))
})

describe('Stdlib: math.random', () => {
    it('returns number between 0 and 1', () => {
        const r = math.random()
        assert.ok(r >= 0 && r < 1)
    })
})

describe('Stdlib: math.random_int', () => {
    it('returns integer in range', () => {
        for (let i = 0; i < 20; i++) {
            const r = math.random_int(1, 10)
            assert.ok(r >= 1 && r <= 10)
            assert.equal(r, Math.floor(r))
        }
    })
})

describe('Stdlib: math constants', () => {
    it('pi is ~3.14159', () => assert.ok(Math.abs(math.pi - 3.14159) < 0.001))
    it('e is ~2.71828', () => assert.ok(Math.abs(math.e - 2.71828) < 0.001))
})

describe('Stdlib: math trig', () => {
    it('sin(0) = 0', () => assert.equal(math.sin(0), 0))
    it('cos(0) = 1', () => assert.equal(math.cos(0), 1))
    it('tan(0) = 0', () => assert.equal(math.tan(0), 0))
})

describe('Stdlib: math.clamp', () => {
    it('clamps below min', () => assert.equal(math.clamp(-5, 0, 10), 0))
    it('clamps above max', () => assert.equal(math.clamp(15, 0, 10), 10))
    it('preserves value in range', () => assert.equal(math.clamp(5, 0, 10), 5))
})

describe('Stdlib: math.lerp', () => {
    it('lerp at 0 = start', () => assert.equal(math.lerp(0, 10, 0), 0))
    it('lerp at 1 = end', () => assert.equal(math.lerp(0, 10, 1), 10))
    it('lerp at 0.5 = midpoint', () => assert.equal(math.lerp(0, 10, 0.5), 5))
})

describe('Stdlib: math.sum / average', () => {
    it('sum of array', () => assert.equal(math.sum([1, 2, 3, 4]), 10))
    it('sum of empty', () => assert.equal(math.sum([]), 0))
    it('average of array', () => assert.equal(math.average([2, 4, 6]), 4))
})

describe('Stdlib: math.log', () => {
    it('log(1) = 0', () => assert.equal(math.log(1), 0))
    it('log(e) ≈ 1', () => assert.ok(Math.abs(math.log(Math.E) - 1) < 0.0001))
})

/* ═══ List Module ═════════════════════════════════════════ */

describe('Stdlib: list.first / last / rest', () => {
    it('first returns first element', () => assert.equal(list.first([1, 2, 3]), 1))
    it('last returns last element', () => assert.equal(list.last([1, 2, 3]), 3))
    it('rest returns everything after first', () => assert.deepEqual(list.rest([1, 2, 3]), [2, 3]))
})

describe('Stdlib: list.take / drop', () => {
    it('take first N', () => assert.deepEqual(list.take([1, 2, 3, 4], 2), [1, 2]))
    it('drop first N', () => assert.deepEqual(list.drop([1, 2, 3, 4], 2), [3, 4]))
})

describe('Stdlib: list.map / filter / reduce / find', () => {
    it('map doubles', () => assert.deepEqual(list.map([1, 2, 3], x => x * 2), [2, 4, 6]))
    it('filter evens', () => assert.deepEqual(list.filter([1, 2, 3, 4], x => x % 2 === 0), [2, 4]))
    it('reduce sum', () => assert.equal(list.reduce([1, 2, 3], (a, b) => a + b, 0), 6))
    it('find first match', () => assert.equal(list.find([1, 2, 3], x => x > 1), 2))
})

describe('Stdlib: list.contains / unique / flat', () => {
    it('contains returns true', () => assert.equal(list.contains([1, 2, 3], 2), true))
    it('contains returns false', () => assert.equal(list.contains([1, 2, 3], 5), false))
    it('unique removes duplicates', () => assert.deepEqual(list.unique([1, 2, 2, 3, 3]), [1, 2, 3]))
    it('flat flattens one level', () => assert.deepEqual(list.flat([[1, 2], [3, 4]]), [1, 2, 3, 4]))
})

describe('Stdlib: list.sort / reverse', () => {
    it('sort returns sorted copy', () => {
        const orig = [3, 1, 2]
        const sorted = list.sort(orig)
        assert.deepEqual(sorted, [1, 2, 3])
        assert.deepEqual(orig, [3, 1, 2]) // original unchanged
    })
    it('reverse returns reversed copy', () => {
        const orig = [1, 2, 3]
        assert.deepEqual(list.reverse(orig), [3, 2, 1])
        assert.deepEqual(orig, [1, 2, 3]) // original unchanged
    })
})

describe('Stdlib: list.zip', () => {
    it('zips two arrays', () => assert.deepEqual(list.zip([1, 2], ['a', 'b']), [[1, 'a'], [2, 'b']]))
})

describe('Stdlib: list.range', () => {
    it('generates range', () => assert.deepEqual(list.range(0, 5), [0, 1, 2, 3, 4]))
    it('generates range with step', () => assert.deepEqual(list.range(0, 10, 3), [0, 3, 6, 9]))
    it('empty range when start >= end', () => assert.deepEqual(list.range(5, 5), []))
})

describe('Stdlib: list.chunk', () => {
    it('chunks array', () => assert.deepEqual(list.chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]))
    it('single chunk', () => assert.deepEqual(list.chunk([1, 2], 5), [[1, 2]]))
})

describe('Stdlib: list.group_by', () => {
    it('groups by key function', () => {
        const result = list.group_by([1, 2, 3, 4], x => x % 2 === 0 ? 'even' : 'odd')
        assert.deepEqual(result.even, [2, 4])
        assert.deepEqual(result.odd, [1, 3])
    })
})

describe('Stdlib: list.count / empty', () => {
    it('count returns length', () => assert.equal(list.count([1, 2, 3]), 3))
    it('empty returns true for []', () => assert.equal(list.empty([]), true))
    it('empty returns false for [1]', () => assert.equal(list.empty([1]), false))
})

/* ═══ Time Module ═════════════════════════════════════════ */

describe('Stdlib: time', () => {
    it('now() returns a number', () => assert.equal(typeof time.now(), 'number'))
    it('today() returns YYYY-MM-DD format', () => assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(time.today())))
    it('timestamp() returns ISO string', () => assert.ok(time.timestamp().includes('T')))
    it('format with iso', () => assert.ok(time.format(Date.now(), 'iso').includes('T')))
    it('format with date', () => assert.ok(typeof time.format(Date.now(), 'date') === 'string'))
    it('elapsed calculates difference', () => {
        const start = Date.now() - 1000
        assert.ok(time.elapsed(start) >= 900)
    })
    it('sleep returns a promise', () => assert.ok(time.sleep(1) instanceof Promise))
})

/* ═══ Convert Module ══════════════════════════════════════ */

describe('Stdlib: convert', () => {
    it('to_number from string', () => assert.equal(convert.to_number('42'), 42))
    it('to_number from float string', () => assert.equal(convert.to_number('3.14'), 3.14))
    it('to_text from number', () => assert.equal(convert.to_text(42), '42'))
    it('to_text from boolean', () => assert.equal(convert.to_text(true), 'true'))
    it('to_boolean truthy', () => assert.equal(convert.to_boolean(1), true))
    it('to_boolean falsy', () => assert.equal(convert.to_boolean(0), false))
    it('to_boolean empty string', () => assert.equal(convert.to_boolean(''), false))
    it('to_json formats object', () => {
        const json = convert.to_json({ a: 1 })
        assert.ok(json.includes('"a"'))
    })
    it('from_json parses string', () => {
        const obj = convert.from_json('{"a":1}')
        assert.equal(obj.a, 1)
    })
    it('round-trip json', () => {
        const data = { name: 'lume', version: 1 }
        assert.deepEqual(convert.from_json(convert.to_json(data)), data)
    })
})

/* ═══ Top-Level Exports ═══════════════════════════════════ */

describe('Stdlib: exports', () => {
    it('stdlib has all modules', () => {
        assert.ok(stdlib.text)
        assert.ok(stdlib.math)
        assert.ok(stdlib.list)
        assert.ok(stdlib.time)
        assert.ok(stdlib.convert)
    })
})
