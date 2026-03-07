import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()

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
                    <span className="nav-version">v0.6</span>
                </Link>
                <div className="nav-links">
                    <a href="/#features" className="nav-link">Features</a>
                    <a href="/#code" className="nav-link">Code</a>
                    <a href="/#architecture" className="nav-link">Architecture</a>
                    <Link to="/blog" className={`nav-link ${isActive('/blog')}`}>Blog</Link>
                    <a href="/#docs" className="nav-link">Docs</a>
                    <Link to="/affiliate" className={`nav-link ${isActive('/affiliate')}`}>Affiliate</Link>
                </div>
                <div className="nav-right">
                    <Link to="/login" className="nav-cta">Sign In</Link>
                </div>
            </div>
        </nav>
    )
}
