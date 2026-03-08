import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/authStore'

export default function Nav() {
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()
    const { isAuthenticated, user, logout } = useAuth()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const isActive = (path) => location.pathname === path ? 'active' : ''

    return (
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
            </div>
        </nav>
    )
}

