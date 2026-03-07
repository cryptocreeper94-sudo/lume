import { useState, useEffect } from 'react'

const PIN = '0424'

/* ── Ecosystem Apps ── */
const apps = [
    { name: 'Lume', url: 'lume-lang.org', status: 'live', stack: 'Vite+React', hosting: 'Vercel' },
    { name: 'Trust Layer', url: 'dwtl.io', status: 'live', stack: 'Node/Express', hosting: 'Render' },
    { name: 'TrustGen 3D', url: 'trustgen.tlid.io', status: 'live', stack: 'React+Three.js', hosting: 'Vercel' },
    { name: 'Bomber 3D', url: 'bomber.tlid.io', status: 'live', stack: 'React+Three.js', hosting: 'Vercel' },
    { name: 'Signal Chat', url: 'signalchat.tlid.io', status: 'live', stack: 'Node/WS', hosting: 'Render' },
    { name: 'DarkWave Studio', url: 'studio.tlid.io', status: 'dev', stack: 'React', hosting: 'Vercel' },
    { name: 'DarkWave Academy', url: 'academy.tlid.io', status: 'planned', stack: 'React', hosting: 'Vercel' },
    { name: 'Trust Hub', url: 'trusthub.tlid.io', status: 'dev', stack: 'React', hosting: 'Vercel' },
    { name: 'Arbora', url: 'arbora.tlid.io', status: 'live', stack: 'React', hosting: 'Vercel' },
    { name: 'Chronicles', url: 'yourlegacy.io', status: 'live', stack: 'React', hosting: 'Vercel' },
    { name: 'The Arcade', url: 'darkwavegames.io', status: 'live', stack: 'React', hosting: 'Vercel' },
    { name: 'THE VOID', url: 'intothevoid.app', status: 'live', stack: 'React', hosting: 'Vercel' },
]

/* ── API Integrations ── */
const apis = [
    { name: 'Trust Layer SSO', endpoint: 'dwtl.io', type: 'Auth', status: 'connected', key: 'TRUSTLAYER_API_KEY' },
    { name: 'Resend (Email)', endpoint: 'api.resend.com', type: 'Email', status: 'connected', key: 'RESEND_API_KEY' },
    { name: 'Twilio (SMS)', endpoint: 'api.twilio.com', type: 'SMS/2FA', status: 'connected', key: 'TWILIO_ACCOUNT_SID' },
    { name: 'Stripe', endpoint: 'api.stripe.com', type: 'Billing', status: 'connected', key: 'STRIPE_SECRET_KEY' },
    { name: 'Signal Chat WS', endpoint: 'wss://dwtl.io/ws/chat', type: 'Realtime', status: 'connected', key: 'JWT' },
    { name: 'Hallmark Chain', endpoint: 'dwtl.io/api/hallmark', type: 'Blockchain', status: 'ready', key: 'TL_API' },
]

/* ── Lume Codebase Reference ── */
const codebase = [
    { module: 'Lexer', file: 'src/lexer.js', loc: 780, desc: 'Tokenizes .lume source into a token stream. Handles keywords (let, define, to, if, when, ask, think, generate, fetch, pipe, monitor, heal, optimize, evolve), operators, strings with interpolation, numbers, and indentation.' },
    { module: 'Parser', file: 'src/parser.js', loc: 1240, desc: 'Recursive descent parser converting token stream into AST. Supports variable declarations, functions, control flow (if/else, when/is, repeat, for-each), AI expressions, pipe operator, fetch/read/write, and M6 config blocks (monitor/heal/optimize/evolve).' },
    { module: 'Transpiler', file: 'src/transpiler.js', loc: 980, desc: 'Walks AST and emits valid JavaScript. Injects runtime imports for AI (openai/anthropic/google), self-sustaining layers, and Node built-ins (fs, fetch). Handles @healable decorator wrapping.' },
    { module: 'Runtime', file: 'src/runtime.js', loc: 320, desc: 'Core runtime providing ask(), think(), generate() functions. Routes AI calls to OpenAI, Anthropic, or Google based on model name. Implements Result type (ok/err pattern matching).' },
    { module: 'Monitor (L1)', file: 'src/runtime/monitor.js', loc: 310, desc: 'Layer 1: Self-Monitoring. Tracks function metrics (call count, execution time, error rate), AI call stats (latency, cost, tokens), HTTP stats, memory snapshots. Terminal + web dashboards with threshold alerting.' },
    { module: 'Healer (L2)', file: 'src/runtime/healer.js', loc: 260, desc: 'Layer 2: Self-Healing. Retry with exponential/linear/fixed backoff + jitter. Circuit breaker pattern (CLOSED→OPEN→HALF-OPEN). AI model fallback chains. The healable() wrapper combines all three.' },
    { module: 'Optimizer (L3)', file: 'src/runtime/optimizer.js', loc: 280, desc: 'Layer 3: Self-Optimizing. Analyzes monitoring data to detect slow functions (>200ms), high error rates (>10%), unused functions, expensive AI calls. MutationLog with rollback capability.' },
    { module: 'Evolver (L4)', file: 'src/runtime/evolver.js', loc: 310, desc: 'Layer 4: Self-Evolving. Dependency monitoring, AI model benchmarking, cost analysis, pattern learning (hot paths, time-based). Evolution decisions with approve/reject/auto-apply workflow.' },
    { module: 'Formatter', file: 'src/formatter.js', loc: 140, desc: 'Auto-formats .lume source: tabs→spaces, trailing whitespace, blank line limiting, consistent indentation, operator spacing.' },
    { module: 'Linter', file: 'src/linter.js', loc: 260, desc: '15 lint rules across error, warning, style, and perf categories. Suggested auto-fixes. Checks naming conventions, AI prompt quality, line length, etc.' },
    { module: 'REPL', file: 'src/repl.js', loc: 220, desc: 'Interactive Read-Eval-Print-Loop with multi-line block support, persistent scope, colored output, history, and special commands (.help, .ast, .tokens).' },
    { module: 'Stdlib', file: 'src/stdlib.js', loc: 240, desc: '5 modules (text, math, list, time, convert) with 67 utility functions. Exposed via use text, use math, etc.' },
    { module: 'CLI', file: 'bin/lume.js', loc: 347, desc: 'Command-line interface: run, build, test, fmt, lint, repl, watch, ast, tokens. Version 0.6.0.' },
]

/* ── Talking Points ── */
const talkingPoints = [
    { q: 'What is Lume?', a: 'Lume is the first programming language where AI is a syntax primitive, not a library. You write "ask gpt4" the same way you\'d write "if" or "for" — it\'s a keyword in the language itself. No SDK, no boilerplate, no configuration.' },
    { q: 'How is it different from Python + OpenAI?', a: '90% less code. In Python you need 11 lines of SDK setup to make one AI call. In Lume it\'s one line: let answer = ask gpt4 "Summarize this". And Lume programs can heal themselves, optimize themselves, and evolve autonomously — Python can\'t do any of that.' },
    { q: 'What is the self-sustaining runtime?', a: 'Four layers that make Lume programs autonomous. Layer 1 monitors performance in real-time. Layer 2 heals errors automatically with retry and circuit breakers. Layer 3 optimizes bottlenecks. Layer 4 evolves the program over time — learning patterns, benchmarking AI models, reducing costs. Your code takes care of itself.' },
    { q: 'How does hallmarking work?', a: 'Every Lume program can be stamped on Trust Layer\'s blockchain with a unique TN-XXXXXXX identifier. This gives cryptographic proof of who wrote it and when. It\'s provenance for code — like a digital signature that can\'t be forged.' },
    { q: 'What\'s the tech stack?', a: 'The language is built in JavaScript (Node.js) — a lexer tokenizes source, a parser builds an AST, and a transpiler emits JavaScript. The website is Vite + React with our ecosystem design system. 219 tests across 6 milestones. Everything is MIT licensed.' },
    { q: 'What is Signal?', a: 'Signal is our native digital asset. It\'s a signal — not a coin, not a token, not a cryptocurrency. We\'re changing the language in this space. You earn Signal through referrals, hallmarking, and ecosystem contributions.' },
    { q: 'How does it fit in the ecosystem?', a: 'Lume is part of the Trust Layer ecosystem. SSO authentication via dwtl.io. Real-time chat via Signal Chat. 3D creation via TrustGen. Gaming via Bomber 3D. All connected through shared identity and shared design language.' },
]

function StatusDot({ status }) {
    const colors = { live: '#00b894', connected: '#00b894', dev: '#fdcb6e', planned: '#636e72', ready: '#74b9ff' }
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || '#636e72', display: 'inline-block', boxShadow: `0 0 6px ${colors[status] || '#636e72'}` }} />
}

export default function DevPortal() {
    const [authenticated, setAuthenticated] = useState(false)
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    const [openRef, setOpenRef] = useState(null)
    const [openTp, setOpenTp] = useState(null)

    const handlePin = (e) => {
        e.preventDefault()
        if (pin === PIN) {
            setAuthenticated(true)
            setError(false)
        } else {
            setError(true)
            setPin('')
        }
    }

    if (!authenticated) {
        return (
            <div className="login-page">
                <div className="orb orb-1" /><div className="orb orb-2" />
                <div className="login-card" style={{ maxWidth: 360 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
                        <h2 style={{ fontSize: 20, color: 'var(--text-bright)' }}>Owner Access</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Enter PIN to continue</p>
                    </div>
                    <form onSubmit={handlePin}>
                        <input
                            className="form-input"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            style={{ textAlign: 'center', fontSize: 28, letterSpacing: 12, fontFamily: 'var(--font-mono)' }}
                            autoFocus
                        />
                        {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>Incorrect PIN</p>}
                        <button type="submit" className="btn-primary-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>Unlock</button>
                    </form>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'overview', label: '◈ Overview', icon: '◈' },
        { id: 'apps', label: '🌐 Apps', icon: '🌐' },
        { id: 'apis', label: '🔌 APIs', icon: '🔌' },
        { id: 'codebase', label: '📦 Codebase', icon: '📦' },
        { id: 'talking', label: '🎤 Talking Points', icon: '🎤' },
    ]

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80 }}>
            <div className="orb orb-1" /><div className="orb orb-3" />

            {/* Header */}
            <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                        <span className="section-label">Owner Portal</span>
                        <h1 className="section-title" style={{ marginTop: 12 }}>Command <span className="gradient-wave-text">Center</span></h1>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DarkWave Studios</div>
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 4, background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 4, overflowX: 'auto' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            padding: '10px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
                            background: activeTab === t.id ? 'var(--bg-active)' : 'transparent',
                            border: activeTab === t.id ? '1px solid var(--border-active)' : '1px solid transparent',
                            borderRadius: 'var(--radius-sm)', color: activeTab === t.id ? 'var(--accent-glow)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                        }}>{t.label}</button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {/* Quick Stats */}
                        <div className="bento-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Lume Language</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>219</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tests Passing</div></div>
                                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>6</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Milestones</div></div>
                                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>12.2K</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lines of Code</div></div>
                                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>41</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Source Files</div></div>
                            </div>
                        </div>

                        {/* Ecosystem Health */}
                        <div className="bento-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Ecosystem Health</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {apps.slice(0, 6).map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <StatusDot status={a.status} />
                                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.name}</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* API Status */}
                        <div className="bento-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>API Connections</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {apis.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <StatusDot status={a.status} />
                                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.name}</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bento-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Quick Links</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { label: 'GitHub Repo', url: 'https://github.com/cryptocreeper94-sudo/lume' },
                                    { label: 'Vercel Dashboard', url: 'https://vercel.com/darkwavestudios/lume' },
                                    { label: 'Trust Layer Admin', url: 'https://dwtl.io/admin' },
                                    { label: 'Resend Dashboard', url: 'https://resend.com/dashboard' },
                                    { label: 'Twilio Console', url: 'https://console.twilio.com' },
                                    { label: 'Stripe Dashboard', url: 'https://dashboard.stripe.com' },
                                ].map((l, i) => (
                                    <a key={i} href={l.url} target="_blank" rel="noopener" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {l.label} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Domains */}
                        <div className="bento-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Domains</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { domain: 'lume-lang.org', role: 'Primary', status: '✅' },
                                    { domain: 'lume-lang.com', role: '→ .org redirect', status: '✅' },
                                    { domain: 'lume-five-kappa.vercel.app', role: 'Vercel fallback', status: '✅' },
                                ].map((d, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.domain}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.status} {d.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Analytics placeholder */}
                        <div className="bento-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📊</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Analytics</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Awaiting handoff integration</div>
                        </div>
                    </div>
                )}

                {/* ═══ APPS TAB ═══ */}
                {activeTab === 'apps' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {apps.map((a, i) => (
                            <div key={i} className="bento-card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-bright)' }}>{a.name}</div>
                                        <a href={`https://${a.url}`} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>{a.url}</a>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: a.status === 'live' ? 'rgba(0,184,148,0.1)' : 'rgba(99,110,114,0.1)', borderRadius: 999, border: `1px solid ${a.status === 'live' ? 'rgba(0,184,148,0.3)' : 'rgba(99,110,114,0.2)'}` }}>
                                        <StatusDot status={a.status} />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: a.status === 'live' ? '#00b894' : '#636e72' }}>{a.status.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                                    <span>Stack: <span style={{ color: 'var(--text-secondary)' }}>{a.stack}</span></span>
                                    <span>Host: <span style={{ color: 'var(--text-secondary)' }}>{a.hosting}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ APIS TAB ═══ */}
                {activeTab === 'apis' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {apis.map((a, i) => (
                            <div key={i} className="bento-card" style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-bright)' }}>{a.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.endpoint}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{a.type}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Env Key</div>
                                    <div style={{ fontSize: 12, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.key}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(0,184,148,0.1)', borderRadius: 999, border: '1px solid rgba(0,184,148,0.3)' }}>
                                    <StatusDot status={a.status} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#00b894' }}>{a.status.toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ CODEBASE TAB ═══ */}
                {activeTab === 'codebase' && (
                    <div className="accordion-group">
                        {codebase.map((c, i) => (
                            <div key={i} className={`accordion ${openRef === i ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => setOpenRef(openRef === i ? null : i)}>
                                    <span className="accordion-icon">📦</span>
                                    <span className="accordion-title" style={{ flex: 1, textAlign: 'left' }}>
                                        {c.module}
                                        <span style={{ marginLeft: 12, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.file}</span>
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginRight: 12 }}>{c.loc} LOC</span>
                                    <span className="accordion-arrow">▼</span>
                                </button>
                                <div className="accordion-body">
                                    <div className="accordion-content">
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{c.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ TALKING POINTS TAB ═══ */}
                {activeTab === 'talking' && (
                    <div className="accordion-group">
                        {talkingPoints.map((t, i) => (
                            <div key={i} className={`accordion ${openTp === i ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => setOpenTp(openTp === i ? null : i)}>
                                    <span className="accordion-icon">🎤</span>
                                    <span className="accordion-title" style={{ flex: 1, textAlign: 'left' }}>{t.q}</span>
                                    <span className="accordion-arrow">▼</span>
                                </button>
                                <div className="accordion-body">
                                    <div className="accordion-content">
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{t.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
