import { Link } from 'react-router-dom'
import { useRef } from 'react'

export default function Footer() {
    const dwscClickRef = useRef({ count: 0, timer: null })
    const handleDWSCClick = () => {
        dwscClickRef.current.count++
        if (dwscClickRef.current.count === 3) {
            dwscClickRef.current.count = 0
            clearTimeout(dwscClickRef.current.timer)
            window.open('https://dwsc.io/#portal', '_blank')
        } else {
            clearTimeout(dwscClickRef.current.timer)
            dwscClickRef.current.timer = setTimeout(() => { dwscClickRef.current.count = 0 }, 800)
        }
    }
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="nav-logo">✦</span>
                        <span className="gradient-wave-text footer-logo-text">Lume</span>
                    </div>
                    <p className="footer-tagline">The AI-Native Programming Language</p>
                    <p className="footer-powered">Powered by Trust Layer · DarkWave Studios</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h5>Language</h5>
                        <a href="/#features">Features</a>
                        <a href="/#code">Syntax</a>
                        <a href="/#docs">Documentation</a>
                        <a href="/#get-started">Get Started</a>
                    </div>
                    <div className="footer-col">
                        <h5>Ecosystem</h5>
                        <a href="https://dwtl.io" target="_blank" rel="noopener">Trust Layer</a>
                        <a href="https://signalchat.tlid.io" target="_blank" rel="noopener">Signal Chat</a>
                        <a href="https://trustgen.tlid.io" target="_blank" rel="noopener">TrustGen 3D</a>
                        <a href="https://bomber.tlid.io" target="_blank" rel="noopener">Bomber 3D</a>
                        <a href="https://studio.tlid.io" target="_blank" rel="noopener">DarkWave Studio</a>
                        <a href="https://trusthub.tlid.io" target="_blank" rel="noopener">Trust Hub</a>
                    </div>
                    <div className="footer-col">
                        <h5>Platform</h5>
                        <Link to="/blog">Blog</Link>
                        <Link to="/affiliate">Affiliate</Link>
                        <Link to="/legal">Legal</Link>
                        <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© 2026 DarkWave Studios LLC. Built with ✦ Lume.</p>
                <p>Protected by TrustShield.tech <span onClick={handleDWSCClick} style={{ cursor: 'default', userSelect: 'none', marginLeft: 6, opacity: 0.3 }} title="◈ DWSC">◈</span></p>
            </div>
        </footer>
    )
}
