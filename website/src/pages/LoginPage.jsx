import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSSO = () => {
        // Redirect to Trust Layer SSO
        window.location.href = 'https://dwtl.io/login?app=lume&redirect=' + encodeURIComponent(window.location.origin + '/login')
    }

    const handleLogin = (e) => {
        e.preventDefault()
        // Will connect to Lume backend API
        console.log('Login:', email)
    }

    return (
        <div className="login-page">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="login-card">
                <h2>Welcome to <span className="gradient-wave-text">Lume</span></h2>
                <p className="subtitle">Sign in to access your dashboard</p>

                <button className="btn-sso" onClick={handleSSO}>
                    🔐 Sign in with Trust Layer
                </button>

                <div className="divider">or</div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-primary-lg" style={{ width: '100%', justifyContent: 'center' }}>Sign In</button>
                </form>

                <div className="escape-links">
                    <Link to="/">← Explore</Link>
                    <Link to="/blog">Blog</Link>
                    <Link to="/legal">Legal</Link>
                </div>
            </div>
        </div>
    )
}
