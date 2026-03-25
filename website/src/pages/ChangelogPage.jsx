import '../styles/responsive-pages.css'

const releases = [
    {
        version: '0.9.0', date: '2026-03-25', tag: 'latest',
        highlights: ['Strict Deterministic Fallback', 'Zod Runtime Validation', 'AST Cost Estimators', 'Healer AST Auto-Rewrite'],
        changes: [
            { type: 'added', items: ['Resolution Manifest (lume.lock) for deterministic offline builds', 'Zod schema injection for all generate/ask type constraints', 'Static compile-time token budget analysis via --budget CLI', 'True @auto-rewrite AST mutation for heal blocks via child process'] },
            { type: 'improved', items: ['Tolerance Chain strictly locks all high-confidence resolutions', 'DWSC ecosystem integration complete'] },
        ]
    },
    {
        version: '0.8.1', date: '2026-03-16', tag: '',
        highlights: ['2,149 tests — all passing', '38 example programs', '100% module coverage'],
        changes: [
            { type: 'added', items: ['33 new test files covering every intent-resolver module', 'ast-differ, bundler, module-resolver, ui-registry tests', 'pattern-library-i18n, pattern-versioning tests', 'voice-config, voice-input, ai-resolver tests', 'app-generator, package-registry tests', '14 new example programs (router, observable-store, matrix-math, etc.)'] },
            { type: 'improved', items: ['Test count: 1,040 → 2,149 (+101%)', 'Test suites: 200 → 505 (+153%)', 'Test files: 18 → 51 (+33 new)', 'Example programs: 24 → 38 (+14 new)'] },
        ]
    },
    {
        version: '0.8.0', date: '2026-03-15', tag: '',
        highlights: ['1,040 tests — all passing', '25 example programs', '13 documentation files'],
        changes: [
            { type: 'added', items: ['lexer.test.js — 152 comprehensive lexer tests', 'stdlib.test.js — 100 tests across all 5 modules', 'voice.test.js — 71 voice pipeline tests', 'security.test.js — 65 security layer tests', 'linter.test.js — 55 lint rule tests', 'runtime.test.js — 29 monitor/runtime tests', 'error-formatter.test.js — 16 error formatting tests'] },
            { type: 'added', items: ['chatbot.lume — AI chatbot with conversation history', 'rest-api.lume — Full CRUD REST API', 'game-logic.lume — Turn-based RPG engine', 'dashboard.lume — Real-time monitoring dashboard', 'auth-system.lume — JWT auth + RBAC', 'self-healing.lume — Self-sustaining runtime demo', 'data-pipeline.lume — ETL pipeline', 'cli-tool.lume — CLI argument parser'] },
            { type: 'added', items: ['syntax-reference.md — Complete language syntax', 'english-mode.md — All NL patterns', 'stdlib-reference.md — Full stdlib API', 'error-codes.md — Error catalog', 'security.md — Security model docs', 'self-sustaining.md — Runtime architecture'] },
        ]
    },
    {
        version: '0.7.5', date: '2024-03-10', tag: '',
        highlights: ['Playground IDE with sandbox execution', 'Build Approval gate', 'Security scanning tab'],
        changes: [
            { type: 'added', items: ['Playground sandbox engine with iframe isolation', 'Build Approval — review AI interpretation before compile', 'Security Scanner tab showing threats in real-time', 'Code, Preview, and Approval panel layout'] },
            { type: 'improved', items: ['Compiler output now includes LUME SECURITY CERTIFIED header', 'Error messages include "Did you mean?" suggestions'] },
        ]
    },
    {
        version: '0.7.0', date: '2024-02-28', tag: '',
        highlights: ['Voice-to-Code pipeline', '10 homophone pairs', 'Spoken punctuation support'],
        changes: [
            { type: 'added', items: ['Voice input pipeline (Milestone 8)', '10 homophone resolution rules (write/right, for/four, etc.)', 'Spoken punctuation — "period", "comma", "new line"', 'Stutter/repeat collapse', 'Correction phrases — "scratch that", "no I mean"', 'Number word conversion — "twenty three" → 23'] },
            { type: 'improved', items: ['Intent Resolver pattern matching accuracy', 'Run-on sentence splitting'] },
        ]
    },
    {
        version: '0.6.0', date: '2024-02-15', tag: '',
        highlights: ['Guardian Scanner', '11 threat categories', 'Certified-at-Birth'],
        changes: [
            { type: 'added', items: ['Guardian Scanner — 3-layer security architecture', '11 threat categories (file destruction, credential exposure, NL injection, etc.)', 'Certified-at-Birth — security certificates in compiled output', 'AI rate limiting (configurable per file)', 'Prompt injection defense (8 attack categories)'] },
            { type: 'added', items: ['Output scanner for compiled JavaScript', 'AST node scanning for dangerous operations'] },
        ]
    },
    {
        version: '0.5.0', date: '2024-02-01', tag: '',
        highlights: ['Self-Sustaining Runtime', '4-layer architecture', 'Monitor dashboard'],
        changes: [
            { type: 'added', items: ['Monitor — execution time, call count, error rate tracking', 'Heal — @healable decorator, auto-retry, circuit breakers', 'Optimize — memoization, bottleneck detection', 'Evolve — adaptive retry intervals, suggestion engine', 'Terminal + HTML dashboards'] },
        ]
    },
    {
        version: '0.4.0', date: '2024-01-20', tag: '',
        highlights: ['English Mode', '102 deterministic patterns', '7-layer Tolerance Chain'],
        changes: [
            { type: 'added', items: ['English Mode — write code in natural sentences', 'Intent Resolver with 102 deterministic patterns', '7-layer Tolerance Chain (exact → fuzzy → context → AI)', 'Canonical verb system', 'English Mode linter rules (LUME-L001 through LUME-L007)'] },
        ]
    },
]

const typeColors = { added: '#4ade80', improved: '#60a5fa', fixed: '#fbbf24', removed: '#f87171' }
const typeLabels = { added: 'Added', improved: 'Improved', fixed: 'Fixed', removed: 'Removed' }

export default function ChangelogPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e0e0ff', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Hero */}
            <div className="lume-hero" style={{ padding: '4rem 2rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>
                    <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Changelog</span>
                </h1>
                <p style={{ color: '#a0a0c0', fontSize: '1.2rem' }}>What's new in Lume</p>
            </div>

            <div className="lume-container" style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
                {releases.map((release, ri) => (
                    <div key={ri} className="changelog-release" style={{ marginBottom: '3rem', position: 'relative', paddingLeft: '2rem', borderLeft: `2px solid ${ri === 0 ? '#c084fc' : '#2a2a4e'}` }}>
                        {/* Version dot */}
                        <div style={{
                            position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%',
                            background: ri === 0 ? '#c084fc' : '#2a2a4e', border: '2px solid #0a0a1a'
                        }} />

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>v{release.version}</h2>
                            <span style={{ color: '#a0a0c0', fontSize: '0.9rem' }}>{release.date}</span>
                            {release.tag && (
                                <span style={{ background: '#4ade8020', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{release.tag}</span>
                            )}
                        </div>

                        {/* Highlights */}
                        <div className="changelog-highlights" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {release.highlights.map((h, hi) => (
                                <span key={hi} style={{ background: '#2a2a4e', padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '0.85rem' }}>✦ {h}</span>
                            ))}
                        </div>

                        {/* Changes */}
                        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '1.5rem', border: '1px solid #2a2a4e' }}>
                            {release.changes.map((change, ci) => (
                                <div key={ci} style={{ marginBottom: ci < release.changes.length - 1 ? '1rem' : 0 }}>
                                    <div style={{ color: typeColors[change.type], fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                        {typeLabels[change.type]}
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                        {change.items.map((item, ii) => (
                                            <li key={ii} style={{ color: '#b0b0d0', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.2rem' }}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
