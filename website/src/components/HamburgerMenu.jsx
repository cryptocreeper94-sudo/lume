import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function HamburgerMenu() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
                <span /><span /><span />
            </button>
            <div className={`hamburger-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
            <div className={`hamburger-panel ${open ? 'open' : ''}`}>
                <div className="hamburger-panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="nav-logo" style={{ width: 28, height: 28, fontSize: 14 }}>✦</span>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>Lume</span>
                    </div>
                    <button className="hamburger-panel-close" onClick={() => setOpen(false)}>✕</button>
                </div>
                <div className="hamburger-panel-body">
                    <div className="hamburger-mission">
                        <span className="hamburger-mission-label gradient-wave-text">Our Mission</span>
                        <p>Lume makes AI a first-class citizen in programming. Every program can think, heal, optimize, and evolve autonomously — part of the Trust Layer ecosystem for authenticated digital creation.</p>
                    </div>
                    <div className="hamburger-section">Navigate</div>
                    <Link to="/" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">🏠</span> Home
                    </Link>
                    <a href="/#features" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">✨</span> Features
                    </a>
                    <a href="/#code" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">💻</span> Code Examples
                    </a>
                    <a href="/#docs" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">📖</span> Documentation
                    </a>
                    <Link to="/blog" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">📝</span> Blog
                    </Link>
                    <div className="hamburger-section">Ecosystem</div>
                    <a href="https://dwtl.io" target="_blank" rel="noopener" className="hamburger-link">
                        <span className="hamburger-link-icon">🔐</span> Trust Layer (SSO)
                    </a>
                    <a href="https://signalchat.tlid.io" target="_blank" rel="noopener" className="hamburger-link">
                        <span className="hamburger-link-icon">💬</span> Signal Chat
                    </a>
                    <a href="https://trustgen.tlid.io" target="_blank" rel="noopener" className="hamburger-link">
                        <span className="hamburger-link-icon">🎨</span> TrustGen 3D
                    </a>
                    <div className="hamburger-section">Account</div>
                    <Link to="/login" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">🔑</span> Sign In
                    </Link>
                    <Link to="/affiliate" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">🤝</span> Affiliate Program
                    </Link>
                    <Link to="/legal" className="hamburger-link" onClick={() => setOpen(false)}>
                        <span className="hamburger-link-icon">⚖️</span> Legal
                    </Link>
                </div>
            </div>
        </>
    )
}
