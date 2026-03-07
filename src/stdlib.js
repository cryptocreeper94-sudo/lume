/**
 * ====== Lume Standard Library ======
 * Built-in functions available in all Lume programs.
 * 
 * Modules:
 *   - text:   String manipulation
 *   - math:   Mathematical operations
 *   - list:   Array operations
 *   - time:   Date/time utilities
 *   - convert: Type conversion
 */

// ══════════════════════════
//  TEXT MODULE
// ══════════════════════════

export const text = {
    upper: (s) => String(s).toUpperCase(),
    lower: (s) => String(s).toLowerCase(),
    trim: (s) => String(s).trim(),
    split: (s, sep) => String(s).split(sep),
    join: (arr, sep = ', ') => arr.join(sep),
    replace: (s, from, to) => String(s).replaceAll(from, to),
    contains: (s, sub) => String(s).includes(sub),
    starts_with: (s, prefix) => String(s).startsWith(prefix),
    ends_with: (s, suffix) => String(s).endsWith(suffix),
    length: (s) => String(s).length,
    reverse: (s) => String(s).split('').reverse().join(''),
    repeat: (s, n) => String(s).repeat(n),
    pad_left: (s, n, ch = ' ') => String(s).padStart(n, ch),
    pad_right: (s, n, ch = ' ') => String(s).padEnd(n, ch),
    slice: (s, start, end) => String(s).slice(start, end),
    chars: (s) => String(s).split(''),
}

// ══════════════════════════
//  MATH MODULE
// ══════════════════════════

export const math = {
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    min: (...args) => Math.min(...args),
    max: (...args) => Math.max(...args),
    pow: Math.pow,
    sqrt: Math.sqrt,
    random: () => Math.random(),
    random_int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    pi: Math.PI,
    e: Math.E,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    lerp: (a, b, t) => a + (b - a) * t,
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
}

// ══════════════════════════
//  LIST MODULE
// ══════════════════════════

export const list = {
    first: (arr) => arr[0],
    last: (arr) => arr[arr.length - 1],
    rest: (arr) => arr.slice(1),
    take: (arr, n) => arr.slice(0, n),
    drop: (arr, n) => arr.slice(n),
    map: (arr, fn) => arr.map(fn),
    filter: (arr, fn) => arr.filter(fn),
    reduce: (arr, fn, init) => arr.reduce(fn, init),
    find: (arr, fn) => arr.find(fn),
    contains: (arr, item) => arr.includes(item),
    unique: (arr) => [...new Set(arr)],
    flat: (arr) => arr.flat(),
    sort: (arr, fn) => [...arr].sort(fn),
    reverse: (arr) => [...arr].reverse(),
    zip: (a, b) => a.map((v, i) => [v, b[i]]),
    range: (start, end, step = 1) => {
        const result = []
        for (let i = start; i < end; i += step) result.push(i)
        return result
    },
    chunk: (arr, size) => {
        const chunks = []
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }
        return chunks
    },
    group_by: (arr, fn) => {
        const groups = {}
        for (const item of arr) {
            const key = fn(item)
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        }
        return groups
    },
    count: (arr) => arr.length,
    empty: (arr) => arr.length === 0,
}

// ══════════════════════════
//  TIME MODULE
// ══════════════════════════

export const time = {
    now: () => Date.now(),
    today: () => new Date().toISOString().split('T')[0],
    timestamp: () => new Date().toISOString(),
    format: (ms, fmt = 'iso') => {
        const d = new Date(ms)
        if (fmt === 'iso') return d.toISOString()
        if (fmt === 'date') return d.toLocaleDateString()
        if (fmt === 'time') return d.toLocaleTimeString()
        return d.toString()
    },
    elapsed: (startMs) => Date.now() - startMs,
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
}

// ══════════════════════════
//  CONVERT MODULE
// ══════════════════════════

export const convert = {
    to_number: (v) => Number(v),
    to_text: (v) => String(v),
    to_boolean: (v) => Boolean(v),
    to_json: (v) => JSON.stringify(v, null, 2),
    from_json: (s) => JSON.parse(s),
}

// ══════════════════════════
//  EXPORTS
// ══════════════════════════

export const stdlib = { text, math, list, time, convert }
export default stdlib
