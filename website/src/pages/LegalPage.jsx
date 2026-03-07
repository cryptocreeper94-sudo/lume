import { Link } from 'react-router-dom'

export default function LegalPage() {
    return (
        <div className="legal-page">
            <h1>Legal</h1>
            <p>Lume is developed and operated by <strong>DarkWave Studios LLC</strong>. Part of the <strong>Trust Layer</strong> ecosystem.</p>

            <div className="legal-links">
                <a href="https://dwtl.io/legal/terms" target="_blank" rel="noopener" className="legal-link">📜 Terms of Service</a>
                <a href="https://dwtl.io/legal/privacy" target="_blank" rel="noopener" className="legal-link">🔒 Privacy Policy</a>
                <a href="https://dwtl.io/legal/dmca" target="_blank" rel="noopener" className="legal-link">⚖️ DMCA Policy</a>
            </div>

            <h2>Open Source License</h2>
            <p>The Lume language specification and core compiler are released under the MIT License. This includes the lexer, parser, transpiler, and standard library.</p>

            <h2>Trust Layer Integration</h2>
            <p>Lume participates in the Trust Layer ecosystem. User authentication is handled via Trust Layer SSO (<a href="https://dwtl.io" style={{ color: 'var(--accent)' }}>dwtl.io</a>). All user data is governed by the Trust Layer Privacy Policy.</p>

            <h2>Blockchain Provenance</h2>
            <p>Hallmarked Lume programs receive an on-chain TN-XXXXXXX identifier via Trust Layer's blockchain. This provides cryptographic proof of authorship and creation date. Hallmarking is optional and user-initiated.</p>

            <h2>Affiliate Program</h2>
            <p>The Lume affiliate program uses cookie-based referral tracking with a 30-day attribution window. Signal rewards are distributed according to the published tier rates. DarkWave Studios reserves the right to modify rates with 30-day notice.</p>

            <h2>Contact</h2>
            <p>For legal inquiries: <span style={{ color: 'var(--accent)' }}>legal@darkwavestudios.com</span></p>
            <p>For support: Use <Link to="/" style={{ color: 'var(--accent)' }}>Signal Chat</Link> or email <span style={{ color: 'var(--accent)' }}>support@lume-lang.org</span></p>

            <div style={{ marginTop: 40, padding: 16, background: 'var(--bg-active)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)' }}>
                © 2026 DarkWave Studios LLC · Protected by TrustShield.tech · All rights reserved.
            </div>
        </div>
    )
}
