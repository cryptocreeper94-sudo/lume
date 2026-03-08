/* ═══════════════════════════════════════════
   Auth Store — React Context + useAuth hook
   Wraps SSO integration + direct login
   ═══════════════════════════════════════════ */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || ''
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Restore session on mount ──
    useEffect(() => {
        const saved = localStorage.getItem('lume_token')
        const savedUser = localStorage.getItem('lume_user')
        if (saved && savedUser) {
            setToken(saved)
            try { setUser(JSON.parse(savedUser)) } catch { /* corrupt */ }
        }
        setLoading(false)
    }, [])

    // ── Persist to localStorage ──
    const persist = useCallback((t, u) => {
        localStorage.setItem('lume_token', t)
        localStorage.setItem('lume_user', JSON.stringify(u))
        setToken(t)
        setUser(u)
    }, [])

    // ── Direct Login ──
    const login = useCallback(async (email, password) => {
        const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Login failed')
        persist(data.token, data.user)
        return data.user
    }, [persist])

    // ── Register ──
    const register = useCallback(async (email, password, displayName, referral) => {
        const res = await fetch(`${API}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, display_name: displayName, referral })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Registration failed')
        persist(data.token, data.user)
        return data.user
    }, [persist])

    // ── SSO Login (redirect to Trust Layer) ──
    const loginWithSSO = useCallback(() => {
        const redirect = encodeURIComponent(window.location.origin + '/login')
        window.location.href = `https://dwtl.io/login?app=lume&redirect=${redirect}`
    }, [])

    // ── SSO Token Exchange (called after redirect) ──
    const exchangeSSOToken = useCallback(async (ssoToken) => {
        const res = await fetch(`${API}/api/auth/sso/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sso_token: ssoToken })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'SSO exchange failed')
        persist(data.token, data.user)
        return data.user
    }, [persist])

    // ── Fetch Profile (refresh user data) ──
    const refreshProfile = useCallback(async () => {
        if (!token) return null
        const res = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return null
        const profile = await res.json()
        setUser(profile)
        localStorage.setItem('lume_user', JSON.stringify(profile))
        return profile
    }, [token])

    // ── Logout ──
    const logout = useCallback(() => {
        localStorage.removeItem('lume_token')
        localStorage.removeItem('lume_user')
        setToken(null)
        setUser(null)
    }, [])

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            isAuthenticated: !!token,
            login, register, loginWithSSO, exchangeSSOToken, refreshProfile, logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

export default AuthProvider
