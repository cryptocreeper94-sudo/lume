import { useState } from 'react'
import '../styles/responsive-pages.css'

const docSections = [
    {
        title: 'Getting Started',
        icon: '🚀',
        docs: [
            { name: 'Getting Started', file: 'getting-started', desc: 'Install, configure, and write your first Lume program.' },
            { name: 'CLI Reference', file: 'cli', desc: 'All lume CLI commands: run, build, lint, test, watch.' },
        ]
    },
    {
        title: 'Language',
        icon: '📖',
        docs: [
            { name: 'Syntax Reference', file: 'syntax-reference', desc: 'Complete language syntax: variables, functions, types, control flow.' },
            { name: 'English Mode', file: 'english-mode', desc: 'Write code in natural English — all patterns and canonical verbs.' },
            { name: 'Patterns Library', file: 'patterns', desc: 'The 102 deterministic intent patterns used by English Mode.' },
        ]
    },
    {
        title: 'Standard Library',
        icon: '📦',
        docs: [
            { name: 'Stdlib Reference', file: 'stdlib-reference', desc: 'All 5 modules: text, math, list, time, convert.' },
            { name: 'API Reference', file: 'api', desc: 'Compiler and runtime API for tool authors.' },
        ]
    },
    {
        title: 'Advanced',
        icon: '⚡',
        docs: [
            { name: 'Security Model', file: 'security', desc: 'Guardian Scanner, 11 threat categories, Certified-at-Birth.' },
            { name: 'Self-Sustaining Runtime', file: 'self-sustaining', desc: 'Monitor, Heal, Optimize, Evolve — the 4-layer architecture.' },
            { name: 'Voice-to-Code', file: 'voice', desc: 'Voice input pipeline: homophones, fillers, corrections.' },
            { name: 'Error Codes', file: 'error-codes', desc: 'All E/W/L/LUME-L error codes with fixes.' },
        ]
    },
    {
        title: 'Community',
        icon: '🤝',
        docs: [
            { name: 'Examples Guide', file: 'examples', desc: 'Walkthrough of all 25 example programs.' },
            { name: 'Contributing', file: 'contributing', desc: 'How to contribute code, tests, and documentation.' },
        ]
    },
]

export default function DocsPage() {
    const [search, setSearch] = useState('')

    const allDocs = docSections.flatMap(s => s.docs.map(d => ({ ...d, section: s.title })))
    const filtered = search
        ? allDocs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.desc.toLowerCase().includes(search.toLowerCase()))
        : null

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e0e0ff', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Hero */}
            <div className="lume-hero" style={{ padding: '4rem 2rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0 }}>
                    <span style={{ background: 'linear-gradient(135deg, #c084fc, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Documentation</span>
                </h1>
                <p style={{ color: '#a0a0c0', fontSize: '1.2rem', marginTop: '0.5rem' }}>Everything you need to build with Lume</p>

                {/* Search */}
                <div style={{ maxWidth: 500, margin: '2rem auto 0' }}>
                    <input
                        type="text"
                        placeholder="Search documentation..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '0.8rem 1.2rem', fontSize: '1rem',
                            background: '#1a1a2e', border: '1px solid #3a3a5e', borderRadius: 12,
                            color: '#e0e0ff', outline: 'none', boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Search Results */}
            {filtered && (
                <div className="lume-container" style={{ maxWidth: 800, margin: '2rem auto', padding: '0 2rem' }}>
                    <p style={{ color: '#a0a0c0', marginBottom: '1rem' }}>{filtered.length} results for "{search}"</p>
                    {filtered.map((doc, i) => (
                        <div key={i} className="lume-touch-target" style={{
                            background: '#1a1a2e', borderRadius: 12, padding: '1.2rem', marginBottom: '0.8rem',
                            border: '1px solid #2a2a4e', cursor: 'pointer', transition: 'border-color 0.2s'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{doc.name}</div>
                            <div style={{ color: '#a0a0c0', fontSize: '0.9rem', marginTop: '0.3rem' }}>{doc.desc}</div>
                            <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: '0.3rem' }}>{doc.section}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sections Grid */}
            {!filtered && (
                <div className="lume-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
                    {docSections.map((section, si) => (
                        <div key={si} style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#c084fc' }}>
                                {section.icon} {section.title}
                            </h2>
                            <div className="docs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {section.docs.map((doc, di) => (
                                    <div key={di} className="lume-touch-target" style={{
                                        background: '#1a1a2e', borderRadius: 16, padding: '1.5rem',
                                        border: '1px solid #2a2a4e', cursor: 'pointer',
                                        transition: 'transform 0.2s, border-color 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#c084fc' }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#2a2a4e' }}
                                    >
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{doc.name}</h3>
                                        <p style={{ color: '#a0a0c0', fontSize: '0.9rem', lineHeight: 1.5 }}>{doc.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
