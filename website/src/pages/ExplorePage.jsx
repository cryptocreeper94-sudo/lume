import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import HeroCarousel from '../components/HeroCarousel'
import PresentationPage from './PresentationPage'

/* ─── Feature Cards ─── */
const features = [
    { title: '🎤 Voice-to-Code', text: 'Speak your code. The compiler understands natural speech — filler words, stuttering, homophones — and compiles it. No typing required.', code: '"get the users name" → VariableAccess { target: "user_name" }' },
    { title: '🔒 Certified at Birth', text: 'Every instruction is security-scanned at the AST level during compilation. Output includes a tamper-evident SHA-256 certificate.', code: 'LUME SECURITY CERTIFIED ✓\nHash: a3f8b2c1e9d4...' },
    { title: '🧠 English Mode', text: '"Get the user\'s name from the database" compiles directly to JavaScript. Not a prompt. Not AI-generated. The compiler resolves intent.', code: 'mode: english\nget the users name from the database\nshow it on the screen' },
    { title: '🔗 7-Layer Tolerance', text: 'Misspelled? Ambiguous? Informal? The compiler tries 7 resolution layers before giving up — exact match, fuzzy, auto-correct, context, temporal, i18n, AI.', code: '"git teh usrs naem" → auto-corrected → VariableAccess' },
    { title: '⚡ AI as Syntax', text: 'ask, think, and generate are language primitives. Call any model with one keyword — no SDK, no boilerplate.', code: 'let summary = ask claude.sonnet "Summarize this"' },
    { title: '🛡️ Self-Healing Functions', text: 'Automatic retry with exponential backoff, circuit breakers, and AI model fallback chains built-in.', code: '@healable\nto fetch_data(url: text):\n    return fetch url as json' },
    { title: '📊 Self-Sustaining Runtime', text: 'Monitor, Heal, Optimize, Evolve — four layers that make your software alive and self-managing.', code: 'monitor:\n    dashboard: true\n    alert_on: error_rate > 0.05' },
]

/* ─── Code Comparison Slides ─── */
const codeSlides = [
    {
        title: 'AI Integration',
        old: { label: 'Traditional (Python)', code: `import openai\n\nclient = openai.OpenAI()\nresponse = client.chat.completions.create(\n    model="gpt-4",\n    messages=[{\n        "role": "user",\n        "content": "Summarize this"\n    }]\n)\nanswer = response.choices[0].message.content` },
        lume: { label: 'Lume', code: `let answer = ask gpt4 "Summarize this"` },
        savings: '90% less code for the same result'
    },
    {
        title: 'Self-Healing',
        old: { label: 'Traditional Error Handling', code: `const MAX = 3; let attempt = 0;\nwhile (attempt < MAX) {\n  try {\n    const res = await fetch(url);\n    if (!res.ok) throw new Error();\n    return await res.json();\n  } catch (e) {\n    attempt++;\n    if (attempt >= MAX) throw e;\n    await sleep(1000 * attempt);\n  }\n}` },
        lume: { label: 'Lume', code: `@healable\nto fetch_data(url: text):\n    return fetch url as json` },
        savings: 'One decorator replaces 15 lines of retry logic'
    },
    {
        title: 'Monitoring',
        old: { label: 'Traditional Setup', code: `const prom = require('prom-client');\nconst histogram = new prom.Histogram({\n  name: 'http_request_duration_ms',\n  help: 'Duration of HTTP requests',\n  labelNames: ['method', 'route'],\n  buckets: [5, 10, 25, 50, 100, 250]\n});\n// ... 50+ more lines of setup` },
        lume: { label: 'Lume', code: `monitor:\n    dashboard: true\n    alert_on:\n        error_rate > 0.05\n        latency > 200ms` },
        savings: '5 lines replace an entire monitoring stack'
    },
]

/* ─── Layers ─── */
const layers = [
    { n: 4, name: 'Self-Evolving', desc: 'Anticipates problems, adapts behavior, learns patterns, evolves autonomously.', kw: ['evolve', 'suggest', 'daemon'] },
    { n: 3, name: 'Self-Optimizing', desc: 'Analyzes metrics, detects bottlenecks, suggests or auto-applies performance fixes.', kw: ['optimize', 'rollback'] },
    { n: 2, name: 'Self-Healing', desc: 'Retries with backoff, circuit breakers, model fallback chains — automatic recovery.', kw: ['heal', '@healable'] },
    { n: 1, name: 'Self-Monitoring', desc: 'Tracks functions, AI calls, HTTP, memory. Terminal/web dashboards with alerting.', kw: ['monitor', 'dashboard'] },
]

/* ─── Milestones ─── */
const milestones = [
    { n: 1, title: 'Hello World', desc: 'Lexer, Parser, Transpiler, CLI.', tests: 32 },
    { n: 2, title: 'Core Language', desc: 'if/else, functions, loops, types, modules.', tests: 64 },
    { n: 3, title: 'AI Integration', desc: 'ask/think/generate — 12 models, 3 providers.', tests: 94 },
    { n: 4, title: 'Interoperability', desc: 'fetch, pipe, read/write, stdlib (67 fns).', tests: 135 },
    { n: 5, title: 'Tooling & IDE', desc: 'Formatter, linter, REPL, watcher, source maps.', tests: 159 },
    { n: 6, title: 'Self-Sustaining', desc: 'Monitor, Heal, Optimize, Evolve.', tests: 219 },
    { n: 7, title: 'English Mode', desc: 'Intent Resolver, Pattern Library, Auto-Correct.', tests: 280 },
    { n: 8, title: 'Auto-Correct', desc: '500-term dictionary, fuzzy matching.', tests: 295 },
    { n: 9, title: 'Tolerance Chain', desc: '7-layer fallback with confidence scoring.', tests: 310 },
    { n: 10, title: 'Security Layer', desc: 'AST scanning, certificates, 11 threat categories.', tests: 330 },
    { n: 11, title: 'Voice Input', desc: 'Transcription cleanup, homophones, stutter collapse.', tests: 345 },
    { n: 12, title: 'Voice CLI', desc: 'lume voice with commands, flags, config.', tests: 355 },
    { n: 13, title: 'Playground', desc: 'Sandbox IDE, mic button, security tab.', tests: 366 },
    { n: 14, title: 'IDE Upgrade', desc: 'Menu bar, terminal, find/replace, command palette, tabs, status bar.', tests: 1200 },
    { n: 15, title: 'DarkWave Integration', desc: 'DarkWave Studio API wiring, Lume project management.', tests: 2093, active: true },
]

/* ─── Docs ─── */
const docs = [
    { icon: '📄', title: 'Declarations & Types', code: `let name = "Lume"        // mutable variable\ndefine PI = 3.14159      // immutable constant\nlet items = [1, 2, 3]    // list literal\n\ntype User:\n    name: text\n    age: number\n    role: text = "member"` },
    { icon: '🧠', title: 'AI Keywords', code: `let summary = ask claude.sonnet "Summarize this"\nlet plan = think gpt4 "Design API for {project}"\nlet schema = generate gemini "TS interface for User"` },
    { icon: '🔁', title: 'Control Flow', code: `when status is:\n    "active"  -> process(data)\n    "paused"  -> queue(data)\n    _         -> log("Unknown")\n\nrepeat 5 times:\n    log("Iteration {i}")` },
    { icon: '🔗', title: 'Interop & Pipe', code: `let result = raw |> parse |> validate |> save\nlet data = fetch "api.com/users" as json\nwrite "output.json" from result` },
    { icon: '🛡️', title: 'Self-Sustaining', code: `@healable\nto fetch_data(url: text):\n    return fetch url as json\n\nmonitor:\n    dashboard: true\n    alert_on: error_rate > 0.05` },
]

/* ─── Ecosystem ─── */
const ecosystem = [
    { icon: '🔐', title: 'Trust Layer', desc: 'Single sign-on across all ecosystem apps. One identity, one session.', url: 'dwtl.io', img: '/ecosystem/sso.png' },
    { icon: '💬', title: 'Signal Chat', desc: 'Real-time messaging built into every app. Community and support.', url: 'signalchat.tlid.io', img: '/ecosystem/signal-chat.png' },
    { icon: '🎨', title: 'TrustGen 3D', desc: 'AI-powered 3D creation with blockchain provenance.', url: 'trustgen.tlid.io', img: '/ecosystem/trustgen.png' },
    { icon: '🏌️', title: 'Bomber 3D', desc: 'Long-drive golf with Mixamo avatars and real physics.', url: 'bomber.tlid.io', img: '/ecosystem/bomber.png' },
    { icon: '🛠️', title: 'DarkWave Studio', desc: 'Ecosystem IDE for building and deploying Trust Layer apps.', url: 'studio.tlid.io', img: '/ecosystem/analytics.png' },
    { icon: '🏢', title: 'Trust Hub', desc: 'Central hub for the Trust Layer ecosystem and connected apps.', url: 'trusthub.tlid.io', img: '/ecosystem/blockchain.png' },
]

/* ─── Reusable Carousel Hook ─── */
function useCarousel(items, autoMs = 0) {
    const [idx, setIdx] = useState(0)
    const len = items.length
    const prev = useCallback(() => setIdx(i => (i - 1 + len) % len), [len])
    const next = useCallback(() => setIdx(i => (i + 1) % len), [len])
    useEffect(() => {
        if (!autoMs) return
        const t = setInterval(next, autoMs)
        return () => clearInterval(t)
    }, [autoMs, next])
    return { idx, setIdx, prev, next }
}

/* ─── Feature Carousel ─── */
function FeatureCarousel() {
    const { idx, prev, next, setIdx } = useCarousel(features, 8000)
    const f = features[idx]
    return (
        <div className="bento-card" style={{ maxWidth: 900, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 0' }}>
                <div style={{ flex: 1 }}>
                    <div className="fc-counter">{String(idx + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</div>
                    <h3 className="fc-title" style={{ fontSize: 22 }}>{f.title}</h3>
                    <p className="fc-text">{f.text}</p>
                </div>
            </div>
            {f.code && <pre style={{ margin: '16px 24px 24px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00b894', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{f.code}</pre>}
            <div className="fc-nav" style={{ padding: '0 24px 20px' }}>
                <button className="carousel-btn" onClick={prev}>←</button>
                <div className="carousel-dots">
                    {features.map((_, i) => <button key={i} className={`carousel-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />)}
                </div>
                <button className="carousel-btn" onClick={next}>→</button>
            </div>
        </div>
    )
}

/* ─── Ecosystem Carousel ─── */
function EcoCarousel() {
    const { idx, prev, next, setIdx } = useCarousel(ecosystem, 8000)
    const e = ecosystem[idx]
    return (
        <div className="full-carousel eco-carousel">
            <div className="fc-image-side">
                <img src={e.img} alt={e.title} key={idx} />
                <div className="fc-overlay" />
            </div>
            <div className="fc-content-side">
                <div className="fc-counter">{String(idx + 1).padStart(2, '0')} / {String(ecosystem.length).padStart(2, '0')}</div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{e.icon}</div>
                <h3 className="fc-title">{e.title}</h3>
                <p className="fc-text">{e.desc}</p>
                <span className="eco-url">{e.url}</span>
                <div className="fc-nav" style={{ marginTop: 20 }}>
                    <button className="carousel-btn" onClick={prev}>←</button>
                    <div className="carousel-dots">
                        {ecosystem.map((_, i) => <button key={i} className={`carousel-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />)}
                    </div>
                    <button className="carousel-btn" onClick={next}>→</button>
                </div>
            </div>
        </div>
    )
}

/* ─── Milestone Carousel ─── */
function MilestoneCarousel() {
    const { idx, prev, next, setIdx } = useCarousel(milestones, 8000)
    const m = milestones[idx]
    const imgs = ['/features/ai-syntax.png', '/features/pipe.png', '/features/ai-syntax.png', '/features/http.png', '/features/monitoring.png', '/features/evolving.png', '/features/ai-syntax.png', '/features/self-healing.png', '/features/monitoring.png', '/features/http.png', '/features/pipe.png', '/features/evolving.png', '/features/monitoring.png', '/features/ai-syntax.png', '/features/evolving.png']
    return (
        <div className="full-carousel milestone-carousel">
            <div className="fc-image-side">
                <img src={imgs[idx]} alt={m.title} key={idx} />
                <div className="fc-overlay" />
                <div className="milestone-badge">{m.tests} tests passing</div>
            </div>
            <div className="fc-content-side">
                <div className="fc-counter">Milestone {m.n}</div>
                <h3 className="fc-title">{m.title}</h3>
                <p className="fc-text">{m.desc}</p>
                <div className="milestone-progress">
                    <div className="milestone-bar" style={{ width: `${(m.tests / 2093) * 100}%` }} />
                </div>
                <div className="fc-nav" style={{ marginTop: 20 }}>
                    <button className="carousel-btn" onClick={prev}>←</button>
                    <div className="carousel-dots">
                        {milestones.map((_, i) => <button key={i} className={`carousel-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />)}
                    </div>
                    <button className="carousel-btn" onClick={next}>→</button>
                </div>
            </div>
        </div>
    )
}

export default function ExplorePage() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [openAccordion, setOpenAccordion] = useState(null)
    const [searchParams] = useSearchParams()
    const [showPresentation, setShowPresentation] = useState(() => {
        // Show presentation on first visit per session, or if ?presentation param exists
        if (searchParams.has('presentation')) return true
        if (sessionStorage.getItem('lume-pres-seen')) return false
        return true
    })

    const dismissPresentation = () => {
        setShowPresentation(false)
        sessionStorage.setItem('lume-pres-seen', '1')
    }

    const goSlide = (i) => setCurrentSlide(i)
    const prevSlide = () => goSlide(currentSlide > 0 ? currentSlide - 1 : codeSlides.length - 1)
    const nextSlide = () => goSlide(currentSlide < codeSlides.length - 1 ? currentSlide + 1 : 0)

    useEffect(() => {
        const els = document.querySelectorAll('[data-reveal]')
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 80); obs.unobserve(e.target) } })
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
        els.forEach(el => obs.observe(el))
        return () => obs.disconnect()
    }, [])

    return (
        <>
            {/* Enterprise Presentation Overlay */}
            {showPresentation && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#020617' }}>
                    <PresentationPage onDismiss={dismissPresentation} embedded />
                    <button
                        onClick={dismissPresentation}
                        style={{
                            position: 'fixed', top: 16, right: 16, zIndex: 10000,
                            background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
                            color: '#06b6d4', padding: '8px 20px', borderRadius: 999,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        Skip to Site →
                    </button>
                </div>
            )}

            <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

            {/* Hero Slideshow */}
            <HeroCarousel />

            {/* ── Cognitive Distance ── */}
            <section className="section-full section-dark" data-reveal style={{ padding: '80px 24px' }}>
                <div className="section-header">
                    <span className="section-label">Core Concept</span>
                    <h2 className="section-title" style={{ maxWidth: 700 }}>
                        Eliminating <span className="gradient-wave-text">Cognitive Distance</span>
                    </h2>
                    <p className="section-subtitle" style={{ maxWidth: 600, margin: '12px auto 0' }}>
                        Every programming language creates cognitive dissonance — you think in human language but write in machine language. Lume eliminates the distance between the two.
                    </p>
                </div>
                <div style={{ maxWidth: 760, margin: '40px auto 0' }}>
                    <div className="bento-card" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Era</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Language</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Distance</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'none' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { era: '1950s', lang: 'Assembly', dist: 'Maximum', bar: 10, what: '"Add two numbers" → MOV AX, 5 / ADD AX, 3' },
                                    { era: '1970s', lang: 'C', dist: 'High', bar: 7.5, what: '"Add two numbers" → int result = a + b;' },
                                    { era: '1990s', lang: 'Python', dist: 'Medium', bar: 5, what: '"Add two numbers" → result = a + b' },
                                    { era: '2020s', lang: 'AI Agents', dist: 'Medium-High', bar: 6.5, what: 'Ask AI → AI writes code → you review → you run' },
                                    { era: '2026', lang: 'Lume', dist: 'Near-Zero', bar: 0.5, what: '"Add two numbers" → add two numbers', highlight: true },
                                ].map((r, i) => (
                                    <tr key={i} style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none', background: r.highlight ? 'rgba(6,182,212,0.06)' : 'transparent' }}>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.era}</td>
                                        <td style={{ padding: '14px 16px', color: r.highlight ? 'var(--accent-glow)' : 'var(--text-bright)', fontWeight: r.highlight ? 700 : 500 }}>{r.lang}</td>
                                        <td style={{ padding: '14px 16px', minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                                    <div style={{ width: `${r.bar * 10}%`, height: '100%', borderRadius: 99, background: r.highlight ? 'var(--accent-glow)' : 'var(--text-muted)', transition: 'width 1s ease' }} />
                                                </div>
                                                <span style={{ fontSize: 11, color: r.highlight ? 'var(--accent-glow)' : 'var(--text-muted)', fontWeight: 600, minWidth: 85, textAlign: 'right' }}>{r.dist}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bento-card" style={{ padding: '28px 24px', marginTop: 16, textAlign: 'center', background: 'linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(20,184,166,0.05) 100%)' }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-bright)', lineHeight: 1.7, margin: 0 }}>
                            "Other tools add an AI between you and your code.<br />
                            <span className="gradient-wave-text">Lume removes the code between you and your machine.</span>"
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Voice-to-Code ── */}
            <section id="voice" className="section-full section-dark" data-reveal style={{ padding: '80px 24px' }}>
                <div className="section-header">
                    <span className="section-label">New Technology</span>
                    <h2 className="section-title" style={{ maxWidth: 800 }}>
                        The First Language You Can <span className="gradient-wave-text">Speak</span>
                    </h2>
                    <p className="section-subtitle" style={{ maxWidth: 650, margin: '12px auto 0' }}>
                        Not voice commands. Not dictation to a text editor. Not AI-generated code.
                        Your voice enters the compiler directly. The compiler understands you.
                    </p>
                </div>
                <div className="voice-grid" style={{ maxWidth: 900, margin: '40px auto 0' }}>
                    <div className="bento-card" style={{ padding: '24px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                            🎤 You Say
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-bright)', lineHeight: 2.2 }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(6,182,212,0.08)', borderRadius: 6, marginBottom: 4 }}>"um get the users name from the database"</div>
                            <div style={{ padding: '6px 12px', background: 'rgba(6,182,212,0.08)', borderRadius: 6, marginBottom: 4 }}>"and then show it on the screen"</div>
                            <div style={{ padding: '6px 12px', background: 'rgba(6,182,212,0.08)', borderRadius: 6 }}>"if the name is empty show please enter your name"</div>
                        </div>
                    </div>
                    <div className="bento-card" style={{ padding: '24px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#00b894', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                            ✓ Compiler Receives
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#00b894', lineHeight: 2.2 }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(0,184,148,0.08)', borderRadius: 6, marginBottom: 4 }}>get the users name from the database</div>
                            <div style={{ padding: '6px 12px', background: 'rgba(0,184,148,0.08)', borderRadius: 6, marginBottom: 4 }}>show it on the screen</div>
                            <div style={{ padding: '6px 12px', background: 'rgba(0,184,148,0.08)', borderRadius: 6 }}>if the name is empty show please enter your name</div>
                        </div>
                    </div>
                </div>
                <div className="voice-pills" style={{ maxWidth: 900, margin: '16px auto 0' }}>
                    {[
                        { icon: '🔇', label: 'Filler Stripping', desc: '"um", "uh", "like" removed' },
                        { icon: '🔁', label: 'Stutter Collapse', desc: '"get get" → "get"' },
                        { icon: '🌐', label: 'Homophones', desc: '"write" vs "right" resolved' },
                        { icon: '✂️', label: 'Run-on Splitting', desc: '"and then" → new line' },
                    ].map((f, i) => (
                        <div key={i} className="bento-card" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>{f.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── English Mode Demo ── */}
            <section id="english-mode" className="section-full" data-reveal style={{ padding: '80px 24px' }}>
                <div className="section-header">
                    <span className="section-label">Compiler Innovation</span>
                    <h2 className="section-title" style={{ maxWidth: 800 }}>
                        English <span className="gradient-wave-text">Compiles Directly</span>
                    </h2>
                    <p className="section-subtitle" style={{ maxWidth: 650, margin: '12px auto 0' }}>
                        Not AI-generated code. Not a prompt to an LLM. The compiler reads English instructions and
                        resolves them through a 7-layer Tolerance Chain into Abstract Syntax Tree nodes.
                    </p>
                </div>
                <div style={{ maxWidth: 900, margin: '40px auto 0' }}>
                    <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="english-grid">
                            <div style={{ padding: '24px', borderRight: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                                    ✍️ You Write (English)
                                </div>
                                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-bright)', lineHeight: 2, margin: 0, whiteSpace: 'pre-wrap' }}>{`mode: english

get the user's name from the database
show it on the screen
if the name is empty
  show "Please enter your name"
save the result to the profile`}</pre>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#00b894', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                                    ⚙️ Compiler Produces (JavaScript)
                                </div>
                                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00b894', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{`const user_name = await db.get("user_name");
console.log(user_name);
if (!user_name) {
  console.log("Please enter your name");
}
await db.save("profile", result);`}</pre>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                        <div className="bento-card" style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>34+</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pattern Library patterns</div>
                        </div>
                        <div className="bento-card" style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>7</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Tolerance Chain layers</div>
                        </div>
                        <div className="bento-card" style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>0.85</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Confidence threshold</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Security — Certified at Birth ── */}
            <section id="security-home" className="section-full section-dark" data-reveal style={{ padding: '80px 24px' }}>
                <div className="section-header">
                    <span className="section-label">Security Architecture</span>
                    <h2 className="section-title" style={{ maxWidth: 800 }}>
                        Certified at <span className="gradient-wave-text">Birth</span>
                    </h2>
                    <p className="section-subtitle" style={{ maxWidth: 650, margin: '12px auto 0' }}>
                        No existing language scans for security during compilation.
                        Lume checks every instruction against 11 threat categories in real-time at the AST level —
                        before a single line of JavaScript is generated.
                    </p>
                </div>
                <div className="security-grid" style={{ maxWidth: 900, margin: '40px auto 0' }}>
                    <div className="bento-card" style={{ padding: '24px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#00b894', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                            🔒 3-Layer Security Model
                        </div>
                        {[
                            { n: '1', name: 'Input Security', desc: 'Pre-compilation: scans English instructions for 11 threat categories', color: '#fdcb6e' },
                            { n: '2', name: 'Guardian Scanner', desc: 'During compilation: scans each AST node in real-time as it is created', color: '#00b894' },
                            { n: '3', name: 'Sandbox Mode', desc: 'Pre-execution: shows everything the program WOULD do before it runs', color: '#74b9ff' },
                        ].map((l, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `${l.color}22`, border: `1px solid ${l.color}44`, color: l.color,
                                    fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', flexShrink: 0,
                                }}>{l.n}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{l.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{l.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bento-card" style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#00b894', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                            ✓ Security Certificate
                        </div>
                        <pre style={{ fontSize: 11, color: 'var(--text-bright)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8 }}>{`/**
 * LUME SECURITY CERTIFIED ✓
 * Source: app.lume (mode: english, 47 lines)
 * AST nodes scanned: 47/47 passed
 * Raw blocks scanned: 2/2 passed
 * Input method: voice
 * Compiled: 2026-09-15T14:30:00Z
 * Hash: a3f8b2c1e9d4...
 * Verify: lume verify --hash a3f8b2c1e9d4
 */`}</pre>
                    </div>
                </div>
                <div className="bento-card" style={{ maxWidth: 900, margin: '16px auto 0', padding: '20px 24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,184,148,0.06) 0%, rgba(6,182,212,0.06) 100%)' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-bright)', lineHeight: 1.7, margin: 0 }}>
                        "ESLint, SonarQube, and Snyk scan <em>after</em> compilation. They see code, not intent.<br />
                        <span className="gradient-wave-text">Lume scans during compilation. It sees intent.</span>"
                    </p>
                </div>
            </section>

            {/* ── Features — Full-width Carousel ── */}
            <section id="features" className="section-full" data-reveal>
                <div className="section-header">
                    <span className="section-label">Features</span>
                    <h2 className="section-title">Everything You Need, <span className="gradient-wave-text">Nothing You Don't</span></h2>
                </div>
                <FeatureCarousel />
            </section>

            {/* ── Code Comparison — Carousel ── */}
            <section id="code" className="section-full section-dark" data-reveal>
                <div className="section-header">
                    <span className="section-label">Syntax</span>
                    <h2 className="section-title">See the <span className="gradient-wave-text">Difference</span></h2>
                </div>
                <div className="carousel" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
                    <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {codeSlides.map((s, i) => (
                            <div key={i} className="carousel-slide">
                                <div className="code-comparison">
                                    <div className="code-panel">
                                        <div className="code-panel-header"><span className="code-panel-dot red" />{s.old.label}</div>
                                        <pre>{s.old.code}</pre>
                                    </div>
                                    <div className="code-panel code-panel-new">
                                        <div className="code-panel-header"><span className="code-panel-dot cyan" />{s.lume.label}</div>
                                        <pre>{s.lume.code}</pre>
                                        <div className="code-savings">✦ {s.savings}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="carousel-controls">
                        <button className="carousel-btn" onClick={prevSlide}>←</button>
                        <div className="carousel-dots">{codeSlides.map((_, i) => <button key={i} className={`carousel-dot ${i === currentSlide ? 'active' : ''}`} onClick={() => goSlide(i)} />)}</div>
                        <button className="carousel-btn" onClick={nextSlide}>→</button>
                    </div>
                </div>
            </section>

            {/* ── Architecture — Stacking cards (kept tight, no whitespace) ── */}
            <section id="architecture" className="section-full" data-reveal>
                <div className="section-header">
                    <span className="section-label">Runtime</span>
                    <h2 className="section-title">Software That <span className="gradient-wave-text">Takes Care of Itself</span></h2>
                </div>
                <div className="layers-stack">
                    {layers.map((l, i) => (
                        <div key={i} className="layer-card" data-reveal>
                            <span className="layer-number">{l.n}</span>
                            <div>
                                <h3 className="layer-name">{l.name}</h3>
                                <p className="layer-desc">{l.desc}</p>
                                <div className="layer-keywords">{l.kw.map(k => <span key={k} className="keyword-tag">{k}</span>)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Milestones — Full-width Carousel ── */}
            <section id="milestones" className="section-full section-dark" data-reveal>
                <div className="section-header">
                    <span className="section-label">Journey</span>
                    <h2 className="section-title">15 <span className="gradient-wave-text">Milestones</span> · 2,093 Tests</h2>
                </div>
                <MilestoneCarousel />
            </section>

            {/* ── Docs Accordion ── */}
            <section id="docs" className="section-full" data-reveal>
                <div className="section-header">
                    <span className="section-label">Documentation</span>
                    <h2 className="section-title">Quick <span className="gradient-wave-text">Reference</span></h2>
                </div>
                <div className="accordion-group">
                    {docs.map((d, i) => (
                        <div key={i} className={`accordion ${openAccordion === i ? 'open' : ''}`}>
                            <button className="accordion-header" onClick={() => setOpenAccordion(openAccordion === i ? null : i)}>
                                <span className="accordion-icon">{d.icon}</span>
                                <span className="accordion-title">{d.title}</span>
                                <span className="accordion-arrow">▼</span>
                            </button>
                            <div className="accordion-body"><div className="accordion-content"><pre className="doc-code">{d.code}</pre></div></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Ecosystem — Full-width Carousel ── */}
            <section id="ecosystem" className="section-full section-dark" data-reveal>
                <div className="section-header">
                    <span className="section-label">Ecosystem</span>
                    <h2 className="section-title">Part of the <span className="gradient-wave-text">Trust Layer</span></h2>
                </div>
                <EcoCarousel />
            </section>

            {/* ── Get Started ── */}
            <section id="get-started" className="section-full" data-reveal>
                <div className="section-header">
                    <span className="section-label">Quick Start</span>
                    <h2 className="section-title">Start in <span className="gradient-wave-text">30 Seconds</span></h2>
                </div>
                <div className="get-started-strip">
                    <div className="gs-step">
                        <div className="step-number">1</div>
                        <h4>Install</h4>
                        <pre className="step-code">{`npm install -g lume-lang\nlume --version`}</pre>
                    </div>
                    <div className="gs-divider">→</div>
                    <div className="gs-step">
                        <div className="step-number">2</div>
                        <h4>Write</h4>
                        <pre className="step-code">{`let greeting = ask gpt4 "Say hello"\nlog(greeting)`}</pre>
                    </div>
                    <div className="gs-divider">→</div>
                    <div className="gs-step">
                        <div className="step-number">3</div>
                        <h4>Run</h4>
                        <pre className="step-code">{`lume run hello.lume\n\n> Hello from Lume! 🚀`}</pre>
                    </div>
                </div>
            </section>
        </>
    )
}
