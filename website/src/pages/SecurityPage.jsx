export default function SecurityPage() {
    const layers = [
        {
            icon: '🛡️', num: '01', label: 'BEFORE COMPILATION',
            title: 'Input Security Layer',
            desc: 'Before your code compiles, the Security Layer scans your instructions for dangerous operations. File destruction, credential exposure, privilege escalation, resource exhaustion — 11 threat categories are checked before a single line of JavaScript is generated.',
            threats: ['File system destruction', 'Credential exposure', 'Network exfiltration', 'Database destruction', 'Infinite operations', 'System commands', 'Semantic camouflage', 'Natural language injection', 'Privilege escalation', 'Mass operations', 'Resource exhaustion']
        },
        {
            icon: '⚡', num: '02', label: 'DURING COMPILATION',
            title: 'Guardian Output Scanner',
            desc: 'Security doesn\'t wait until the end. As the compiler processes each instruction, the Guardian Output Scanner verifies it in real-time. Dangerous operations are caught the instant they\'re written. The output carries a Security Certificate proving it passed all checks.',
            threats: ['Destructive operations', 'Obfuscated code (eval, base64)', 'Undeclared network domains', 'Credential passing', 'Crypto mining patterns', 'Dependency hijacking']
        },
        {
            icon: '🔒', num: '03', label: 'AFTER COMPILATION',
            title: 'Sandbox Mode',
            desc: 'The first time a program runs (or any time it changes significantly), it executes in a sandbox. You see a complete report of everything the program WOULD do — every database query, every file write, every network call — before it actually does anything.',
            threats: ['First-run protection', 'Change detection (>20% delta)', '--sandbox forced mode', '--trusted for locked programs', 'Full I/O interception', 'Approval workflow']
        },
    ]

    const scanLevels = [
        { level: 'off', desc: 'No scanning, no certificate', rec: 'Not recommended' },
        { level: 'basic', desc: 'eval(), obfuscated code, file system access', rec: 'Minimum protection' },
        { level: 'standard', desc: 'Full scan — all 11 categories + certificate', rec: 'Default (recommended)' },
        { level: 'strict', desc: 'Everything + flag all network/file/import operations', rec: 'High-security environments' },
    ]

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80 }}>
            <div className="orb orb-1" /><div className="orb orb-3" />

            {/* Hero */}
            <div className="hero-section" style={{ minHeight: 'auto', padding: '80px 24px 60px' }}>
                <span className="section-label">Security Architecture</span>
                <h1 className="section-title" style={{ marginTop: 16, maxWidth: 800 }}>
                    Three Layers.<br />
                    <span className="gradient-wave-text">Zero Configuration.</span>
                </h1>
                <p className="section-subtitle" style={{ maxWidth: 640, margin: '16px auto 0' }}>
                    Every program compiled through Lume is protected by three layers of security.
                    This isn't optional. This isn't a premium feature. This is built into the compiler.
                </p>
            </div>

            {/* Three Layers */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {layers.map((l, i) => (
                        <div key={i} className="bento-card" style={{ padding: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-active)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{l.icon}</div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Layer {l.num} — {l.label}</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-bright)', marginTop: 4 }}>{l.title}</div>
                                </div>
                            </div>
                            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>{l.desc}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {l.threats.map((t, j) => (
                                    <span key={j} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 999, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 500 }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key statement */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 60px', textAlign: 'center' }}>
                <div className="bento-card" style={{ padding: '40px 32px', background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(20,184,166,0.06) 100%)' }}>
                    <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-bright)', lineHeight: 1.7 }}>
                        "Three layers. Before, during, and after compilation.<br />
                        Your code is <span style={{ color: 'var(--accent-glow)' }}>certified clean at birth</span> — not inspected after the fact.<br />
                        No other programming language in the world does this."
                    </p>
                </div>
            </div>

            {/* Security Certificate */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 60px' }}>
                <h2 className="section-title" style={{ fontSize: 26, marginBottom: 24 }}>Security <span className="gradient-wave-text">Certificate</span></h2>
                <div className="bento-card" style={{ padding: 24 }}>
                    <pre style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{`/**
 * LUME SECURITY CERTIFIED
 * Source: app.lume (mode: english, 47 lines)
 * AST nodes scanned: 47/47 passed
 * Raw blocks scanned: 2/2 passed
 * Scan level: standard
 * Compiled: 2026-09-15T14:30:00Z
 * Certificate hash: a3f8b2c1e9d4...
 * Verify: lume verify --hash a3f8b2c1e9d4...
 */`}</pre>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7 }}>
                    Every compiled JavaScript file carries a security certificate. Run <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>lume verify --hash</code> to confirm the code passed the full security pipeline.
                    If anyone modifies the JavaScript after compilation, the hash won't match and the certificate is invalidated.
                </p>
            </div>

            {/* Scan Levels */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
                <h2 className="section-title" style={{ fontSize: 26, marginBottom: 24 }}>Configurable <span className="gradient-wave-text">Scan Levels</span></h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {scanLevels.map((s, i) => (
                        <div key={i} className="bento-card" style={{ padding: 16, display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: 16, alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: s.level === 'standard' ? 'var(--accent-glow)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.level}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.rec}</span>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7 }}>
                    Configure in <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>.lume/security-config.json</code> — project-level, committable to version control.
                </p>
            </div>
        </div>
    )
}
