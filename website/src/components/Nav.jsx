import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/authStore'

export default function Nav() {
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()
    const { isAuthenticated, user, logout } = useAuth()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const isActive = (path) => location.pathname === path ? 'active' : ''

    return (
        <>
            <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-inner">
                    <Link to="/" className="nav-brand">
                        <span className="nav-logo">✦</span>
                        <span className="nav-title gradient-wave-text">Lume</span>
                        <span className="nav-version">v0.8</span>
                    </Link>
                    <div className="nav-links">
                        <a href="/#features" className="nav-link">Features</a>
                        <a href="/#code" className="nav-link">Code</a>
                        <a href="/#architecture" className="nav-link">Architecture</a>
                        <Link to="/security" className={`nav-link ${isActive('/security')}`}>Security</Link>
                        <Link to="/pricing" className={`nav-link ${isActive('/pricing')}`}>Pricing</Link>
                        <Link to="/blog" className={`nav-link ${isActive('/blog')}`}>Blog</Link>
                        <Link to="/affiliate" className={`nav-link ${isActive('/affiliate')}`}>Affiliate</Link>
                        <Link to="/playground" className={`nav-link ${isActive('/playground')}`}>Playground</Link>
                    </div>
                    <div className="nav-right">
                        {isAuthenticated ? (
                            <>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 8 }}>
                                    {user?.display_name || user?.email}
                                </span>
                                <button onClick={logout} className="nav-cta" style={{ background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="nav-cta">Sign In</Link>
                        )}
                    </div>
                    <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* Hamburger slide-out panel */}
            <div className={`hamburger-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
            <div className={`hamburger-panel ${menuOpen ? 'open' : ''}`}>
                <div className="hamburger-panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="nav-logo" style={{ width: 28, height: 28, fontSize: 14 }}>✦</span>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>Lume</span>
                    </div>
                    <button className="hamburger-panel-close" onClick={() => setMenuOpen(false)}>✕</button>
                </div>
                <div className="hamburger-panel-body">
                    <div className="hamburger-mission">
                        <span className="hamburger-mission-label gradient-wave-text">Our Mission</span>
                        <p>Lume makes AI a first-class citizen in programming. Every program can think, heal, optimize, and evolve autonomously — part of the Trust Layer ecosystem for authenticated digital creation.</p>
                    </div>
                    <div className="hamburger-section">Navigate</div>
                    <Link to="/" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">🏠</span> Home
                    </Link>
                    <a href="/#features" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">✨</span> Features
                    </a>
                    <a href="/#code" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">💻</span> Code Examples
                    </a>
                    <a href="/#docs" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">📖</span> Documentation
                    </a>
                    <Link to="/blog" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">📝</span> Blog
                    </Link>
                    <Link to="/security" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">🛡️</span> Security
                    </Link>
                    <Link to="/pricing" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">💎</span> Pricing
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
                    {isAuthenticated ? (
                        <>
                            <div className="hamburger-link" style={{ cursor: 'default' }}>
                                <span className="hamburger-link-icon">👤</span> {user?.display_name || user?.email}
                            </div>
                            <button className="hamburger-link" onClick={() => { logout(); setMenuOpen(false) }}
                                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', padding: 'inherit' }}>
                                <span className="hamburger-link-icon">🚪</span> Sign Out
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                            <span className="hamburger-link-icon">🔑</span> Sign In
                        </Link>
                    )}
                    <Link to="/affiliate" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">🤝</span> Affiliate Program
                    </Link>
                    <Link to="/legal" className="hamburger-link" onClick={() => setMenuOpen(false)}>
                        <span className="hamburger-link-icon">⚖️</span> Legal
                    </Link>
                </div>
            </div>
        </>
    )
}

