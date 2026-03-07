import { useState } from 'react'

const tiers = [
    { icon: '🥉', name: 'Bronze', rate: '10%', desc: '0–5 referrals', color: '#cd7f32' },
    { icon: '🥈', name: 'Silver', rate: '15%', desc: '6–20 referrals', color: '#a0a0a0' },
    { icon: '🥇', name: 'Gold', rate: '20%', desc: '21–50 referrals', color: '#ffd700' },
    { icon: '💎', name: 'Diamond', rate: '25%', desc: '51+ referrals', color: '#06b6d4' },
]

export default function AffiliatePage() {
    const [copied, setCopied] = useState(false)
    const refLink = 'https://lume-lang.org/?ref=YOUR_CODE'

    const copyLink = () => {
        navigator.clipboard.writeText(refLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <div className="orb orb-1" />
            <div className="orb orb-3" />

            {/* Hero Banner */}
            <div style={{ position: 'relative', height: 320, overflow: 'hidden', marginTop: 64 }}>
                <img src="/affiliate/referral.png" alt="Affiliate Network" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,6,10,0.3), rgba(6,6,10,0.9))' }} />
                <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
                    <span className="section-label">Earn</span>
                    <h1 className="section-title" style={{ marginTop: 12 }}>Affiliate <span className="gradient-wave-text">Program</span></h1>
                    <p className="section-subtitle" style={{ margin: '8px auto 0' }}>Share Lume, earn Signal rewards. Four tiers, unlimited potential.</p>
                </div>
            </div>

            <section className="section" style={{ paddingTop: 60 }}>
                <div className="affiliate-grid">
                    {tiers.map((t, i) => (
                        <div key={i} className="tier-card">
                            <div className="tier-icon">{t.icon}</div>
                            <div className="tier-name">{t.name}</div>
                            <div className="tier-rate" style={{ color: t.color }}>{t.rate}</div>
                            <div className="tier-desc">{t.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="referral-box">
                    <div style={{ flex: '0 0 auto' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Your Referral Link</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sign in to generate your unique code</div>
                    </div>
                    <input readOnly value={refLink} />
                    <button className="btn-copy" onClick={copyLink}>
                        {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                </div>

                {/* How It Works — with images */}
                <div style={{ marginTop: 60 }}>
                    <div className="section-header">
                        <span className="section-label">How It Works</span>
                        <h2 className="section-title">Three Simple <span className="gradient-wave-text">Steps</span></h2>
                    </div>
                    <div className="full-carousel">
                        <div className="fc-image-side">
                            <img src="/affiliate/rewards.png" alt="Signal Rewards" />
                            <div className="fc-overlay" />
                        </div>
                        <div className="fc-content-side">
                            <div className="fc-counter">How It Works</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div className="step-number">1</div>
                                    <div>
                                        <h4 style={{ color: 'var(--text-bright)', marginBottom: 4 }}>Share Your Link</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Share on social media, blogs, or dev communities. 30-day cookie tracking.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div className="step-number">2</div>
                                    <div>
                                        <h4 style={{ color: 'var(--text-bright)', marginBottom: 4 }}>Users Sign Up</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Create a Lume account through your link. Works with SSO and direct signup.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div className="step-number">3</div>
                                    <div>
                                        <h4 style={{ color: 'var(--text-bright)', marginBottom: 4 }}>Earn Signal Rewards</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Earn Signal for every conversion. Higher tiers unlock better rates.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hallmark Section — with images */}
                <div style={{ marginTop: 80 }}>
                    <div className="section-header">
                        <span className="section-label">Provenance</span>
                        <h2 className="section-title">Blockchain <span className="gradient-wave-text">Hallmarks</span></h2>
                        <p className="section-subtitle">Every Lume program can be hallmarked on Trust Layer's blockchain for cryptographic proof of origin.</p>
                    </div>
                    <div className="full-carousel">
                        <div className="fc-image-side">
                            <img src="/affiliate/hallmark.png" alt="Blockchain Hallmark" />
                            <div className="fc-overlay" />
                        </div>
                        <div className="fc-content-side">
                            <div className="fc-counter">Blockchain Provenance</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <h4 style={{ color: 'var(--text-bright)', marginBottom: 6 }}>◈ On-Chain Proof</h4>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Each hallmark generates a unique <code style={{ color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)', background: 'var(--bg-active)', padding: '2px 6px', borderRadius: 4 }}>TN-XXXXXXX</code> ID anchored to Trust Layer.</p>
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--text-bright)', marginBottom: 6 }}>🛡️ Trust Stamps</h4>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Verify authorship and integrity. Every creation has a verifiable provenance chain.</p>
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--text-bright)', marginBottom: 6 }}>✦ Signal Rewards</h4>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Earn Signal for hallmarking and ecosystem contributions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
