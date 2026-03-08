import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../stores/authStore'

export default function LoginPage() {
    const { login, register, loginWithSSO, exchangeSSOToken, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // If already authenticated, redirect
    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true })
    }, [isAuthenticated, navigate])

    // Handle SSO callback — check for sso_token in URL params
    useEffect(() => {
        const ssoToken = searchParams.get('sso_token')
        if (ssoToken) {
            setLoading(true)
            exchangeSSOToken(ssoToken)
                .then(() => navigate('/', { replace: true }))
                .catch(err => { setError(err.message); setLoading(false) })
        }
    }, [searchParams, exchangeSSOToken, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (mode === 'register') {
                await register(email, password, displayName)
            } else {
                await login(email, password)
            }
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <img src="/pages/login-hero.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, zIndex: 0 }} />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="login-card">
                <h2>Welcome to <span className="gradient-wave-text">Lume</span></h2>
                <p className="subtitle">
                    {mode === 'register' ? 'Create your account' : 'Sign in to access your dashboard'}
                </p>

                <button className="btn-sso" onClick={loginWithSSO} disabled={loading}>
                    🔐 Sign in with Trust Layer
                </button>

                <div className="divider">or</div>

                {error && (
                    <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginBottom: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="form-group">
                            <label className="form-label">Display Name</label>
                            <input className="form-input" type="text" placeholder="Your name"
                                value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="you@example.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="••••••••"
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary-lg" disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
                        {loading ? '...' : mode === 'register' ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    {mode === 'login' ? (
                        <>Don't have an account?{' '}
                            <button onClick={() => { setMode('register'); setError('') }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-glow)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>Already have an account?{' '}
                            <button onClick={() => { setMode('login'); setError('') }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-glow)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                                Sign in
                            </button>
                        </>
                    )}
                </div>

                <div className="escape-links">
                    <Link to="/">← Explore</Link>
                    <Link to="/blog">Blog</Link>
                    <Link to="/legal">Legal</Link>
                </div>
            </div>
        </div>
    )
}
