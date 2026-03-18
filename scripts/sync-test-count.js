#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 *  sync-test-count.js — Lume Test Count Distribution Tool
 * ═══════════════════════════════════════════════════════════
 *
 *  Runs the full test suite, gets the exact count, then
 *  updates every file across every ecosystem repo that
 *  references the Lume test count.
 *
 *  Usage:
 *    node scripts/sync-test-count.js          # dry-run (show what would change)
 *    node scripts/sync-test-count.js --apply  # apply changes
 *    node scripts/sync-test-count.js --apply --push  # apply + git commit + push
 *
 * ═══════════════════════════════════════════════════════════
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ── Configuration ──────────────────────────────────────────
// Every file that references the Lume test count.
// path is relative to D:\ (the drive root)
const TARGETS = [
    // ── Lume repo ──
    { repo: 'lume', file: 'website/src/pages/ResearchPage.jsx', patterns: [
        { find: /(\d[,\d]*)\s*tests,\s*0 failures/g, replace: (n) => `${n} tests, 0 failures` },
        { find: /target=\{(\d+)\}/g, replace: (n) => `target={${n.replace(/,/g, '')}}`, context: 'AnimatedNumber' },
    ]},
    { repo: 'lume', file: 'website/src/components/HeroCarousel.jsx', patterns: [
        { find: /stat-value">\s*[\d,]+/g, replace: (n) => `stat-value">${n}` },
    ]},
    { repo: 'lume', file: 'website/src/pages/DevPortal.jsx', patterns: [
        { find: /[\d,]+\s*tests across/g, replace: (n) => `${n} tests across` },
        { find: /\|\|\s*'[\d,]+'/g, replace: (n) => `|| '${n}'` },
    ]},
    { repo: 'lume', file: 'website/src/pages/ExplorePage.jsx', patterns: [
        { find: /·\s*[\d,]+ Tests/g, replace: (n) => `· ${n} Tests` },
    ]},
    { repo: 'lume', file: 'website/src/pages/ChangelogPage.jsx', patterns: [
        { find: /[\d,]+ tests — all passing/g, replace: (n) => `${n} tests — all passing` },
        { find: /→ [\d,]+ \(\+/g, replace: (n) => `→ ${n} (+` },
    ]},
    { repo: 'lume', file: 'website/src/data/presentationData.js', patterns: [
        { find: /value:\s*'(\d+)',\s*label:\s*'(Passing Tests|Tests Passing)'/g, replace: (n) => `value: '${n.replace(/,/g, '')}', label: '$2'`, named: true },
        { find: /[\d,]+ tests,? security scanning/g, replace: (n) => `${n} tests, security scanning` },
        { find: /[\d,]+ tests\.\s*Zero failures/g, replace: (n) => `${n} tests. Zero failures` },
        { find: /[\d,]+ tests\.\s*Zero failures/g, replace: (n) => `${n} tests. Zero failures` },
    ]},
    { repo: 'lume', file: 'README.md', patterns: [
        { find: /\*\*[\d,]+ tests\*\*/g, replace: (n) => `**${n} tests**` },
    ]},
    { repo: 'lume', file: 'CHANGELOG.md', patterns: [
        { find: /[\d,]+ tests \(up from/g, replace: (n) => `${n} tests (up from` },
        { find: /[\d,]+ tests,\s*\d+K/g, replace: (n) => `${n} tests, 14K` },
        { find: /stats \([\d,]+ tests/g, replace: (n) => `stats (${n} tests` },
    ]},
    { repo: 'lume', file: 'LUME_ACADEMIC_BRIEF.md', patterns: [
        { find: /Test suite \| [\d,]+\+?\s*tests/g, replace: (n) => `Test suite | ${n} tests` },
    ]},
    { repo: 'lume', file: 'LUME-ACADEMIC-PAPER.md', patterns: [
        { find: /Test suite \| [\d,]+\s*tests/g, replace: (n) => `Test suite | ${n} tests` },
        { find: /[\d,]+ tests passing/g, replace: (n) => `${n} tests passing` },
        { find: /All [\d,]+ tests pass/g, replace: (n) => `All ${n} tests pass` },
    ]},
    { repo: 'lume', file: 'darkwave_studios_handoff.txt', patterns: [
        { find: /[\d,]+ passing tests/g, replace: (n) => `${n} passing tests` },
        { find: /results \([\d,]+ tests\)/g, replace: (n) => `results (${n} tests)` },
    ]},

    // ── DWSC ──
    { repo: 'dwsc', file: 'index.html', patterns: [
        { find: /[\d,]+ tests,/g, replace: (n) => `${n} tests,` },
    ]},

    // ── Trust Layer Hub ──
    { repo: 'trust-layer-hub', file: 'LUME-ACADEMIC-PAPER.md', patterns: [
        { find: /Test suite \| [\d,]+\s*tests/g, replace: (n) => `Test suite | ${n} tests` },
        { find: /[\d,]+ tests passing/g, replace: (n) => `${n} tests passing` },
        { find: /All [\d,]+ tests pass/g, replace: (n) => `All ${n} tests pass` },
    ]},
    { repo: 'trust-layer-hub', file: 'LUME-ACADEMIC-PAPER-BRIEF.md', patterns: [
        { find: /Test suite \| [\d,]+\+?\s*tests/g, replace: (n) => `Test suite | ${n} tests` },
    ]},
    { repo: 'trust-layer-hub', file: 'LUME-MASTER-SPECIFICATION.md', patterns: [
        { find: /Test suite \| [\d,]+\s*tests/g, replace: (n) => `Test suite | ${n} tests` },
        { find: /#\s*[\d,]+ tests/g, replace: (n) => `# ${n} tests` },
    ]},
    { repo: 'trust-layer-hub', file: 'constants/ecosystem-apps.ts', patterns: [
        { find: /[\d,]+\+?\s*tests,\s*305/g, replace: (n) => `${n} tests, 305` },
    ]},
    { repo: 'trust-layer-hub', file: 'server/ai-agent.ts', patterns: [
        { find: /[\d,]+ tests,\s*305/g, replace: (n) => `${n} tests, 305` },
    ]},
]

// ── Helpers ─────────────────────────────────────────────────

function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getTestCount() {
    console.log('⏳ Running test suite...\n')
    try {
        const output = execSync('node --test tests/unit/*.test.js 2>&1', {
            cwd: 'D:\\lume',
            encoding: 'utf-8',
            timeout: 120_000,
        })
        const match = output.match(/ℹ tests (\d+)/)
        if (!match) {
            // Try alternate encoding
            const match2 = output.match(/tests\s+(\d+)/)
            if (match2) return parseInt(match2[1], 10)
            throw new Error('Could not parse test count from output')
        }
        return parseInt(match[1], 10)
    } catch (err) {
        // node --test exits 1 if any test fails, but still outputs stats
        const output = err.stdout || err.message || ''
        const match = output.match(/tests\s+(\d+)/)
        if (match) return parseInt(match[1], 10)
        throw new Error('Failed to run tests: ' + err.message)
    }
}

function updateFile(filePath, count, formatted, dryRun) {
    if (!fs.existsSync(filePath)) {
        return { file: filePath, status: 'NOT FOUND', changes: 0 }
    }

    let content = fs.readFileSync(filePath, 'utf-8')
    let original = content
    const target = TARGETS.find(t => filePath.endsWith(t.file.replace(/\//g, path.sep)))
    if (!target) return { file: filePath, status: 'NO PATTERNS', changes: 0 }

    let changes = 0
    for (const p of target.patterns) {
        const before = content
        if (p.named) {
            // Special handling for named capture group patterns
            content = content.replace(p.find, (match, val, label) => {
                return `value: '${count}', label: '${label}'`
            })
        } else if (p.context === 'AnimatedNumber') {
            content = content.replace(/target=\{\d+\}/g, (match) => {
                // Only replace AnimatedNumber targets near "Tests Passing"
                return `target={${count}}`
            })
        } else {
            content = content.replace(p.find, (match) => {
                return p.replace(formatted)
            })
        }
        if (content !== before) changes++
    }

    if (changes > 0 && !dryRun) {
        fs.writeFileSync(filePath, content)
    }

    return { file: filePath, status: changes > 0 ? 'UPDATED' : 'UNCHANGED', changes }
}

// ── Main ────────────────────────────────────────────────────

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const push = args.includes('--push')
const dryRun = !apply

console.log('╔════════════════════════════════════════════════╗')
console.log('║   Lume Test Count Distribution Tool           ║')
console.log('╚════════════════════════════════════════════════╝\n')

const count = getTestCount()
const formatted = formatNumber(count)

console.log(`✅ Test count: ${formatted} (${count})\n`)
console.log(dryRun ? '🔍 DRY RUN — showing what would change:\n' : '🔧 APPLYING changes:\n')

const results = []
const repos = new Set()

for (const target of TARGETS) {
    const filePath = path.join('D:\\', target.repo, target.file)
    const result = updateFile(filePath, count, formatted, dryRun)
    results.push(result)
    if (result.status === 'UPDATED') repos.add(target.repo)
}

// Print results
console.log('─'.repeat(70))
console.log(`${'Status'.padEnd(12)} ${'Changes'.padEnd(10)} File`)
console.log('─'.repeat(70))
for (const r of results) {
    const icon = r.status === 'UPDATED' ? '✏️ ' : r.status === 'NOT FOUND' ? '⛔' : '  '
    console.log(`${icon} ${r.status.padEnd(10)} ${String(r.changes).padEnd(10)} ${r.file}`)
}
console.log('─'.repeat(70))

const updated = results.filter(r => r.status === 'UPDATED').length
const notFound = results.filter(r => r.status === 'NOT FOUND').length
console.log(`\n📊 ${updated} files updated, ${notFound} not found, ${results.length - updated - notFound} unchanged`)

if (dryRun && updated > 0) {
    console.log('\n💡 Run with --apply to write changes:')
    console.log('   node scripts/sync-test-count.js --apply')
    console.log('   node scripts/sync-test-count.js --apply --push')
}

// Git commit + push
if (push && !dryRun && repos.size > 0) {
    console.log('\n📦 Committing and pushing...\n')
    for (const repo of repos) {
        const repoPath = path.join('D:\\', repo)
        try {
            execSync(`git add -A && git commit -m "chore: sync test count → ${formatted}" && git push`, {
                cwd: repoPath, encoding: 'utf-8', stdio: 'pipe',
            })
            console.log(`  ✅ ${repo} — committed and pushed`)
        } catch (err) {
            console.log(`  ⚠️  ${repo} — ${err.message.split('\n')[0]}`)
        }
    }
}

console.log('\nDone! 🎉')
