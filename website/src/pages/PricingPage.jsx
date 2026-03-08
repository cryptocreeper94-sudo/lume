import { useState } from 'react'

export default function PricingPage() {
    const [annual, setAnnual] = useState(false)

    const tiers = [
        {
            name: 'Free', price: 0, period: 'forever',
            desc: 'Full compiler, full security. No credit card needed.',
            highlight: false,
            features: [
                { text: 'Compiler (Layer A — pattern matching)', included: true },
                { text: 'All CLI commands (build, run, test, explain)', included: true },
                { text: 'Security Layer — 11 threat categories', included: true },
                { text: 'Guardian Output Scanner', included: true },
                { text: 'Sandbox Mode', included: true },
                { text: 'Source Maps & Debugging', included: true },
                { text: 'Compile Lock (deterministic builds)', included: true },
                { text: 'Offline compilation (Layer A)', included: true },
                { text: 'Community patterns (weekly sync)', included: true },
                { text: '100 AI resolutions / month', included: true },
                { text: 'Community support (GitHub)', included: true },
            ]
        },
        {
            name: 'Pro', price: annual ? 12 : 15, period: annual ? '/mo (billed annually)' : '/mo',
            desc: 'Unlimited AI resolutions + certification access.',
            highlight: true,
            features: [
                { text: 'Everything in Free', included: true },
                { text: 'Unlimited AI resolutions (Layer B)', included: true },
                { text: 'Real-time community pattern sync', included: true },
                { text: 'Full usage analytics & trends', included: true },
                { text: 'CNLD Certification exam access', included: true },
                { text: 'Email support (48h response)', included: true },
            ]
        },
        {
            name: 'Team', price: annual ? 10 : 12, period: annual ? '/seat/mo (billed annually)' : '/seat/mo',
            desc: 'Shared patterns, admin controls, team analytics.',
            highlight: false,
            features: [
                { text: 'Everything in Pro', included: true },
                { text: 'Shared billing — one bill, multiple seats', included: true },
                { text: 'Team-level pattern library', included: true },
                { text: 'Admin security config controls', included: true },
                { text: 'Team-wide analytics dashboard', included: true },
                { text: 'CNLD Certification for all seats', included: true },
                { text: 'Priority support (24h response)', included: true },
            ]
        },
        {
            name: 'Enterprise', price: null, period: 'custom',
            desc: 'On-premise, SLA, dedicated support.',
            highlight: false,
            features: [
                { text: 'Everything in Team', included: true },
                { text: 'On-premise pattern registry', included: true },
                { text: 'Custom security-config templates', included: true },
                { text: 'Compliance auditing', included: true },
                { text: 'Custom training + on-site', included: true },
                { text: 'Dedicated support + SLA (4h response)', included: true },
                { text: 'Custom reporting & analytics', included: true },
            ]
        },
    ]

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80 }}>
            <div className="orb orb-1" /><div className="orb orb-2" />

            {/* Hero */}
            <div className="hero-section" style={{ minHeight: 'auto', padding: '80px 24px 40px' }}>
                <span className="section-label">Pricing</span>
                <h1 className="section-title" style={{ marginTop: 16 }}>
                    Start Free. <span className="gradient-wave-text">Scale When Ready.</span>
                </h1>
                <p className="section-subtitle" style={{ maxWidth: 560, margin: '16px auto 0' }}>
                    The compiler, security, and Guardian Output Scanner are free forever.
                    Upgrade when you need unlimited AI.
                </p>

                {/* Annual toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 }}>
                    <span style={{ fontSize: 13, color: !annual ? 'var(--text-bright)' : 'var(--text-muted)', fontWeight: 600 }}>Monthly</span>
                    <button onClick={() => setAnnual(!annual)} style={{
                        width: 48, height: 26, borderRadius: 999, border: '1px solid var(--border-active)',
                        background: annual ? 'var(--accent)' : 'var(--bg-secondary)', cursor: 'pointer',
                        position: 'relative', transition: 'all 0.2s ease'
                    }}>
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: annual ? 25 : 3, transition: 'left 0.2s ease'
                        }} />
                    </button>
                    <span style={{ fontSize: 13, color: annual ? 'var(--text-bright)' : 'var(--text-muted)', fontWeight: 600 }}>
                        Annual <span style={{ color: 'var(--accent)', fontSize: 11 }}>Save 20%</span>
                    </span>
                </div>
            </div>

            {/* Pricing Cards */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
                    {tiers.map((t, i) => (
                        <div key={i} className="bento-card" style={{
                            padding: 28,
                            border: t.highlight ? '1px solid var(--accent)' : undefined,
                            boxShadow: t.highlight ? '0 0 40px rgba(6,182,212,0.1)' : undefined,
                            position: 'relative'
                        }}>
                            {t.highlight && (
                                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--accent)', padding: '3px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 1 }}>Most Popular</div>
                            )}
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-bright)', marginBottom: 4 }}>{t.name}</div>
                            <div style={{ marginBottom: 12 }}>
                                {t.price !== null ? (
                                    <span style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-glow)' }}>${t.price}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{t.period}</span></span>
                                ) : (
                                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>Contact Us</span>
                                )}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20, minHeight: 40 }}>{t.desc}</p>
                            <button className={t.highlight ? 'btn-primary-lg' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                                {t.price === 0 ? 'Get Started Free' : t.price ? 'Start Pro' : 'Contact Sales'}
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {t.features.map((f, j) => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                                        <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>✓</span>
                                        <span>{f.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Always Free Promise */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
                <div className="bento-card" style={{ padding: '32px 24px' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-bright)', marginBottom: 8 }}>What stays free. Forever.</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        The compiler itself, all CLI commands, the Security Layer, Guardian Output Scanner,
                        sandbox mode, source maps, compile lock files, offline compilation, and the pattern library
                        that ships with each release. <strong style={{ color: 'var(--text-bright)' }}>Anything that runs on your machine is free.</strong>
                    </p>
                </div>
            </div>
        </div>
    )
}
