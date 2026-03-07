/* Trust Layer SSO Integration for Lume */
const SSO_BASE = 'https://dwtl.io'
const APP_ID = 'lume'

export function loginWithTrustLayer() {
    const redirect = encodeURIComponent(window.location.origin + '/login')
    window.location.href = `${SSO_BASE}/login?app=${APP_ID}&redirect=${redirect}`
}

export async function exchangeToken(hubSessionToken) {
    const res = await fetch(`${SSO_BASE}/api/sso/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: hubSessionToken, app: APP_ID })
    })
    if (!res.ok) throw new Error('SSO exchange failed')
    const { jwt, user } = await res.json()
    localStorage.setItem('lume_token', jwt)
    localStorage.setItem('lume_user', JSON.stringify(user))
    return { jwt, user }
}

export function getToken() {
    return localStorage.getItem('lume_token')
}

export function getUser() {
    const u = localStorage.getItem('lume_user')
    return u ? JSON.parse(u) : null
}

export function logout() {
    localStorage.removeItem('lume_token')
    localStorage.removeItem('lume_user')
    window.location.href = '/'
}

export function isAuthenticated() {
    return !!getToken()
}
