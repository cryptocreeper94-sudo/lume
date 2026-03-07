import { useState, useEffect, useRef, useCallback } from 'react'
import HeroCarousel from '../components/HeroCarousel'

/* ─── Feature Cards ─── */
const features = [
    { title: 'AI as Syntax', text: 'ask, think, and generate are language primitives. Call any model with one keyword — no SDK, no boilerplate.', code: 'let summary = ask claude.sonnet "Summarize this"', img: '/features/ai-syntax.png' },
    { title: 'Self-Healing Functions', text: 'Automatic retry with exponential backoff, circuit breakers, and AI model fallback chains built-in.', img: '/features/self-healing.png', code: '@healable\nto fetch_data(url: text):\n    return fetch url as json' },
    { title: 'Real-Time Monitoring', text: 'Built-in dashboards tracking function performance, errors, latency, AI costs, and memory — live.', img: '/features/monitoring.png', code: 'monitor:\n    dashboard: true\n    alert_on: error_rate > 0.05' },
    { title: 'Self-Optimizing Runtime', text: 'Detects slow functions, high error rates, and expensive AI calls — then suggests or auto-applies fixes.', img: '/features/optimizing.png' },
    { title: 'Pipe Operator', text: 'Chain operations elegantly: data flows left-to-right through typed transformations.', code: 'let result = data |> parse |> validate |> save', img: '/features/pipe.png' },
    { title: 'Native HTTP & I/O', text: 'First-class fetch with automatic JSON parsing. Read/write files as language keywords.', img: '/features/http.png', code: 'let data = fetch "api.com/users" as json' },
    { title: 'Self-Evolving Runtime', text: 'Learns usage patterns, benchmarks AI models, analyzes costs, and evolves autonomously.', img: '/features/evolving.png' },
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
    { n: 6, title: 'Self-Sustaining', desc: 'Monitor, Heal, Optimize, Evolve.', tests: 219, active: true },
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
        <div className="full-carousel">
            <div className="fc-image-side">
                <img src={f.img} alt={f.title} key={idx} />
                <div className="fc-overlay" />
            </div>
            <div className="fc-content-side">
                <div className="fc-counter">{String(idx + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</div>
                <h3 className="fc-title">{f.title}</h3>
                <p className="fc-text">{f.text}</p>
                {f.code && <pre className="fc-code"><code>{f.code}</code></pre>}
                <div className="fc-nav">
                    <button className="carousel-btn" onClick={prev}>←</button>
                    <div className="carousel-dots">
                        {features.map((_, i) => <button key={i} className={`carousel-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />)}
                    </div>
                    <button className="carousel-btn" onClick={next}>→</button>
                </div>
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
    const imgs = ['/features/ai-syntax.png', '/features/pipe.png', '/features/ai-syntax.png', '/features/http.png', '/features/monitoring.png', '/features/evolving.png']
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
                    <div className="milestone-bar" style={{ width: `${(m.tests / 219) * 100}%` }} />
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
            <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

            {/* Hero Slideshow */}
            <HeroCarousel />

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
                    <h2 className="section-title">6 <span className="gradient-wave-text">Milestones</span> · 219 Tests</h2>
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
