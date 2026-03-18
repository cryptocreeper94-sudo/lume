import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ─── Data ─── */
const DIMENSIONS = [
    { sym: 'T₁', name: 'Lexical', desc: 'Natural words → keywords/operators', ex: '"add" → +' },
    { sym: 'T₂', name: 'Syntactic', desc: 'Brackets, semicolons, indentation', ex: 'Knowing where { } ; go' },
    { sym: 'T₃', name: 'Structural', desc: 'Functions, classes, modules', ex: 'Wrapping in function/class' },
    { sym: 'T₄', name: 'Semantic', desc: 'Types, data structures, APIs', ex: '"list of names" → string[]' },
    { sym: 'T₅', name: 'Representational', desc: 'Modality conversion', ex: 'Voice → typed characters' },
    { sym: 'T₆', name: 'Meta-cognitive', desc: 'Debugging the translation itself', ex: 'Finding a missing semicolon' },
]

const LANGUAGES = [
    { name: 'Assembly', year: '1950s', scores: [5,5,5,5,1,5], color: '#ef4444' },
    { name: 'C', year: '1978', scores: [4,4,4,4,1,4], color: '#f97316' },
    { name: 'Python', year: '1991', scores: [2,2,3,3,1,2], color: '#eab308' },
    { name: 'JavaScript', year: '2015', scores: [3,3,3,3,1,3], color: '#a3e635' },
    { name: 'AI Agent', year: '2024', scores: [1,0,1,2,2,3], color: '#818cf8' },
    { name: 'Lume Text', year: '2026', scores: [0,0,0,1,1,0], color: '#06b6d4' },
    { name: 'Lume Voice', year: '2026', scores: [0,0,0,1,0,0], color: '#22d3ee' },
]

const CHAIN_STEPS = [
    { label: 'Traditional', nodes: ['Developer', 'Compiler'], hops: 1, color: 'var(--text-muted)' },
    { label: 'AI-Assisted', nodes: ['Developer', 'AI', 'Review', 'Compiler'], hops: 3, color: '#818cf8' },
    { label: 'Lume', nodes: ['Developer', 'Compiler'], hops: 1, color: 'var(--accent-glow)', glow: true },
]

const TOLERANCE_MAP = [
    { layer: 'Exact Pattern Match', absorbs: 'T₁ Lexical', desc: 'Maps natural verbs → AST operations' },
    { layer: 'Fuzzy Match', absorbs: 'T₁ Lexical', desc: 'Tolerates misspelling, word variation' },
    { layer: 'Auto-Correct', absorbs: 'T₂ Syntactic', desc: 'Fixes mechanical errors' },
    { layer: 'Context Engine', absorbs: 'T₄ Semantic', desc: 'Resolves pronouns, infers types' },
    { layer: 'Temporal Resolver', absorbs: 'T₄ Semantic', desc: 'Resolves relative references' },
    { layer: 'i18n Library', absorbs: 'T₁ + T₅', desc: 'Accepts non-English input' },
    { layer: 'AI Resolver', absorbs: 'T₁–T₄', desc: 'Final fallback for all deterministic dims' },
]

const KEY_CLAIMS = [
    'First language where voice-to-code is architecturally native',
    'Deterministic compilation of non-deterministic natural language input',
    'Compiler-level security scanning with AST-level intent awareness',
    'Certified-at-birth compiled output with tamper-evident certificates',
    'Cognitive distance as an explicit, measurable design objective',
    'AI agents increase translation chain length — Lume eliminates the middleman',
    '2,149+ tests, 0 failures, 12,000+ lines of compiler code',
]

const VENUES = [
    { name: 'CHI', full: 'ACM Conference on Human Factors in Computing Systems', angle: 'Cognitive distance + dissonance framework', icon: '🧠' },
    { name: 'OOPSLA', full: 'Object-Oriented Programming, Systems, Languages, Applications', angle: 'Tolerance Chain compiler architecture', icon: '⚙️' },
    { name: 'PLDI', full: 'Programming Language Design & Implementation', angle: 'Deterministic NL compilation', icon: '📐' },
    { name: 'arXiv', full: 'Open-access preprint repository', angle: 'Immediate visibility while peer review is pending', icon: '📄' },
]

const CODE_EXAMPLES = [
    { lang: 'Assembly', code: 'section .data\n    query db "SELECT name FROM users",0\nsection .text\n    mov eax, 4\n    int 0x80\n    ; ... 40+ more lines', cd: 26 },
    { lang: 'C', code: 'char* query = "SELECT name FROM users \\\n  WHERE created_at >= ...";\nmysql_query(conn, query);\nMYSQL_RES *res = mysql_store_result(conn);\nwhile ((row = mysql_fetch_row(res)))\n  printf("%s\\n", row[0]);', cd: 21 },
    { lang: 'Python', code: 'from datetime import date\nusers = db.execute(\n  "SELECT name FROM users "\n  "WHERE created_at >= %s",\n  [date.today().replace(day=1)]\n)\nfor u in users:\n  print(u.name)', cd: 13 },
    { lang: 'JavaScript', code: 'const users = await db.query(\n  `SELECT name FROM users\n   WHERE created_at >= \n   DATE_TRUNC(\'month\', NOW())`\n);\nusers.rows.forEach(u =>\n  console.log(u.name)\n);', cd: 16 },
    { lang: 'AI Agent', code: '// Prompt: "get all users who signed\n// up this month and show their names"\n// → AI generates code\n// → You review it\n// → You fix edge cases\n// → You run it\n// 3 hops. More room for error.', cd: 9 },
    { lang: 'Lume', code: 'mode: english\n\nget all users who signed up this month\nshow their names', cd: 1 },
]

/* ─── Animated Counter ─── */
function AnimatedNumber({ target, duration = 1200 }) {
    const [val, setVal] = useState(0)
    const ref = useRef(null)
    const started = useRef(false)

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true
                const start = performance.now()
                const tick = (now) => {
                    const p = Math.min((now - start) / duration, 1)
                    setVal(Math.round(p * target))
                    if (p < 1) requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
            }
        }, { threshold: 0.3 })
        if (ref.current) obs.observe(ref.current)
        return () => obs.disconnect()
    }, [target, duration])

    return <span ref={ref}>{val}</span>
}

/* ─── Bar Chart Row ─── */
function BarRow({ lang, maxCD = 26 }) {
    const cd = lang.scores.reduce((a, b) => a + b, 0)
    const pct = (cd / maxCD) * 100
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {lang.name}
            </div>
            <div style={{ flex: 1, height: 28, background: 'var(--bg-secondary)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${lang.color}88, ${lang.color})`,
                    borderRadius: 6, transition: 'width 1.2s var(--ease-out)', display: 'flex', alignItems: 'center', paddingLeft: 10,
                    boxShadow: cd <= 2 ? `0 0 16px ${lang.color}44` : 'none'
                }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{cd}</span>
                </div>
            </div>
            <div style={{ width: 36, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0 }}>
                {lang.year}
            </div>
        </div>
    )
}

/* ─── Main Page ─── */
export default function ResearchPage() {
    const [activeExample, setActiveExample] = useState(5) // Start on Lume
    const [hoveredDim, setHoveredDim] = useState(null)

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80 }}>
            <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

            {/* ════ HERO ════ */}
            <div className="hero-section" style={{ minHeight: 'auto', padding: '80px 24px 60px', textAlign: 'center' }}>
                <span className="section-label">Academic Research</span>
                <h1 className="section-title" style={{ marginTop: 16, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                    Eliminating <span className="gradient-wave-text">Cognitive Distance.</span>
                </h1>
                <p className="section-subtitle" style={{ maxWidth: 700, margin: '16px auto 32px', fontSize: 17, lineHeight: 1.8 }}>
                    The first programming language designed from the ground up to accept natural English as source code — with voice input, deterministic compilation, and certified-at-birth security.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/playground" className="btn-primary-lg">
                        Try It Live <span className="btn-arrow">→</span>
                    </Link>
                    <a href="https://github.com/cryptocreeper94-sudo/lume" target="_blank" rel="noreferrer" className="btn-glass-lg">
                        View Source ↗
                    </a>
                </div>

                {/* Stats bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
                    <div className="hero-stats" style={{ flexWrap: 'wrap', gap: '16px 28px' }}>
                        <div className="stat"><span className="stat-value"><AnimatedNumber target={2149} /></span><span className="stat-label">Tests Passing</span></div>
                        <div className="stat-divider" style={{ display: 'none' }} /><div className="stat-divider" />
                        <div className="stat"><span className="stat-value"><AnimatedNumber target={12000} /></span><span className="stat-label">Lines of Compiler</span></div>
                        <div className="stat-divider" />
                        <div className="stat"><span className="stat-value"><AnimatedNumber target={102} /></span><span className="stat-label">NL Patterns</span></div>
                        <div className="stat-divider" />
                        <div className="stat"><span className="stat-value">3</span><span className="stat-label">Security Layers</span></div>
                    </div>
                </div>
            </div>

            {/* ════ THE MIDDLEMAN PARADOX ════ */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <span className="section-label">The Core Insight</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        The <span className="gradient-wave-text">Middleman Paradox</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 640, margin: '12px auto 0', lineHeight: 1.7 }}>
                        AI coding agents reduced syntax work — but added a new translation layer. The chain got <em>longer</em>, not shorter. Lume eliminates the middleman entirely.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {CHAIN_STEPS.map((chain, i) => (
                        <div key={i} className="bento-card" style={{
                            padding: '24px 28px',
                            borderColor: chain.glow ? 'var(--border-active)' : undefined,
                            background: chain.glow ? 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(34,211,238,0.04))' : undefined,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: chain.color, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{chain.label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{chain.hops} hop{chain.hops > 1 ? 's' : ''}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 16, flexWrap: 'wrap' }}>
                                {chain.nodes.map((node, j) => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                            background: chain.glow && (j === 0 || j === chain.nodes.length - 1) ? 'var(--bg-active)' : 'var(--bg-secondary)',
                                            border: `1px solid ${chain.glow ? 'var(--border-active)' : 'var(--border)'}`,
                                            color: chain.glow ? 'var(--accent-glow)' : 'var(--text-secondary)',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {node}
                                        </div>
                                        {j < chain.nodes.length - 1 && (
                                            <div style={{ padding: '0 8px', fontSize: 16, color: chain.color }}>→</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ════ COGNITIVE DISTANCE EXPLORER ════ */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <span className="section-label">Formal Metric</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        Cognitive Distance <span className="gradient-wave-text">Explorer</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 640, margin: '12px auto 0', lineHeight: 1.7 }}>
                        How many conceptual transformations does the same idea require across different languages?
                    </p>
                </div>

                {/* Formula */}
                <div className="bento-card" style={{ padding: '24px 32px', textAlign: 'center', marginBottom: 32, background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(20,184,166,0.04))' }}>
                    <div style={{ fontSize: 'clamp(18px, 3vw, 28px)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-glow)', letterSpacing: 1 }}>
                        CD(L, I) = Σ wᵢ · Tᵢ(L, I)
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                        Cognitive Distance = weighted sum of transformation dimensions across 6 axes
                    </p>
                </div>

                {/* 6 Dimensions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 32 }}>
                    {DIMENSIONS.map((d, i) => (
                        <div key={i} className="bento-card"
                            onMouseEnter={() => setHoveredDim(i)} onMouseLeave={() => setHoveredDim(null)}
                            style={{
                                padding: '16px 20px', cursor: 'default',
                                borderColor: hoveredDim === i ? 'var(--border-active)' : undefined,
                                transition: 'border-color 0.2s ease',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-glow)' }}>{d.sym}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)' }}>{d.name}</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>{d.desc}</p>
                            <code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.ex}</code>
                        </div>
                    ))}
                </div>

                {/* Bar Chart */}
                <div className="bento-card" style={{ padding: '28px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>
                        Intent: <span style={{ color: 'var(--accent-glow)' }}>"get all users who signed up this month and show their names"</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>CD score = unweighted sum of T₁–T₆ (0–5 scale each)</p>
                    {LANGUAGES.map((l, i) => <BarRow key={i} lang={l} />)}
                </div>
            </div>

            {/* ════ CODE COMPARISON ════ */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <span className="section-label">Side by Side</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        Same Intent. <span className="gradient-wave-text">Different Distance.</span>
                    </h2>
                </div>

                {/* Tab buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {CODE_EXAMPLES.map((ex, i) => (
                        <button key={i} onClick={() => setActiveExample(i)} style={{
                            padding: '6px 16px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                            background: activeExample === i ? 'var(--bg-active)' : 'var(--bg-secondary)',
                            border: `1px solid ${activeExample === i ? 'var(--border-active)' : 'var(--border)'}`,
                            borderRadius: 999, color: activeExample === i ? 'var(--accent-glow)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                        }}>
                            {ex.lang}
                        </button>
                    ))}
                </div>

                {/* Code block */}
                <div className="bento-card" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{CODE_EXAMPLES[activeExample].lang}</span>
                        <span style={{
                            fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            padding: '3px 10px', borderRadius: 999,
                            background: CODE_EXAMPLES[activeExample].cd <= 2 ? 'rgba(6,182,212,0.15)' : CODE_EXAMPLES[activeExample].cd <= 13 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                            color: CODE_EXAMPLES[activeExample].cd <= 2 ? 'var(--accent-glow)' : CODE_EXAMPLES[activeExample].cd <= 13 ? '#eab308' : '#ef4444',
                        }}>
                            CD = {CODE_EXAMPLES[activeExample].cd}
                        </span>
                    </div>
                    <pre style={{
                        padding: 24, margin: 0, fontSize: 13, fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)', lineHeight: 1.8, overflowX: 'auto',
                        background: 'var(--bg-primary)', minHeight: 180,
                    }}>
                        {CODE_EXAMPLES[activeExample].code}
                    </pre>
                </div>
            </div>

            {/* ════ THE DISSONANCE HYPOTHESIS ════ */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
                <div className="bento-card" style={{ padding: '40px 32px', background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(20,184,166,0.06) 100%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                        The Dissonance Hypothesis
                    </div>
                    <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 700, color: 'var(--text-bright)', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "The cognitive dissonance experienced during programming is proportional to cognitive distance.<br />
                        As CD → 0, dissonance → 0."
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
                        Festinger, 1957 — adapted for programming language theory
                    </p>
                </div>
            </div>

            {/* ════ TOLERANCE CHAIN ↔ TRANSFORMATIONS ════ */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <span className="section-label">Architecture → Metric</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        How the <span className="gradient-wave-text">Tolerance Chain</span> Eliminates CD
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 560, margin: '12px auto 0' }}>
                        Each of the 7 compiler layers absorbs a specific class of transformation, driving cognitive distance toward zero.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {TOLERANCE_MAP.map((t, i) => (
                        <div key={i} className="bento-card" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 90px 1fr', gap: 16, alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>Layer {i + 1}: {t.layer}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)', padding: '3px 10px', background: 'var(--bg-active)', borderRadius: 999, border: '1px solid var(--border-active)' }}>
                                    {t.absorbs}
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{t.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ════ KEY CLAIMS ════ */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <span className="section-label">Research Contributions</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        7 <span className="gradient-wave-text">Publishable Claims</span>
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {KEY_CLAIMS.map((claim, i) => (
                        <div key={i} className="bento-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: 'var(--bg-active)', border: '1px solid var(--border-active)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)',
                            }}>
                                {i + 1}
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{claim}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ════ SUBMISSION VENUES ════ */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <span className="section-label">Publication Targets</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        Venue <span className="gradient-wave-text">Strategy</span>
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    {VENUES.map((v, i) => (
                        <div key={i} className="bento-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{v.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>{v.full}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{v.angle}"</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ════ SECURITY CERTIFICATE PREVIEW ════ */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <span className="section-label">Certified at Birth</span>
                    <h2 className="section-title" style={{ marginTop: 16, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                        Every Build. <span className="gradient-wave-text">Every Time.</span>
                    </h2>
                </div>

                <div className="bento-card" style={{ padding: 24 }}>
                    <pre style={{
                        fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-glow)',
                        lineHeight: 1.9, margin: 0, whiteSpace: 'pre-wrap', opacity: 0.9,
                    }}>{`/**
 *  LUME SECURITY CERTIFIED
 *  Source: app.lume (mode: english, 47 lines)
 *  AST nodes scanned: 47/47 passed
 *  Raw blocks scanned: 2/2 passed
 *  Scan level: standard
 *  Input method: voice | text
 *  Compiled: ${new Date().toISOString().split('T')[0]}T14:30:00Z
 *  Certificate hash: a3f8b2c1e9d4f7a6b3c8...
 *  Verify: lume verify --hash a3f8b2c1e9d4...
 */`}</pre>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7, textAlign: 'center' }}>
                    No other programming language in the world produces tamper-evident security certificates at compile time.
                </p>
            </div>

            {/* ════ CTA ════ */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 100px', textAlign: 'center' }}>
                <div className="bento-card" style={{
                    padding: '48px 32px',
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(20,184,166,0.06))',
                    borderColor: 'var(--border-active)',
                }}>
                    <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-bright)', marginBottom: 12 }}>
                        The compiler IS the understanding layer.
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.7 }}>
                        No middleman. No prompt engineering. No review step.<br />
                        Just speak — and the compiler understands.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/playground" className="btn-primary-lg">
                            Try the Playground <span className="btn-arrow">→</span>
                        </Link>
                        <a href="https://github.com/cryptocreeper94-sudo/lume/blob/main/LUME_ACADEMIC_BRIEF.md" target="_blank" rel="noreferrer" className="btn-glass-lg">
                            Read the Full Paper ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
