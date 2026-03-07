/* Affiliate API — connects to Lume backend */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function getAffiliateStats(token) {
    const res = await fetch(`${API_BASE}/api/affiliate/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return null
    return res.json()
}

export async function generateReferralCode(token) {
    const res = await fetch(`${API_BASE}/api/affiliate/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
}

export function trackReferral() {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
        document.cookie = `lume_ref=${ref}; max-age=${30 * 24 * 60 * 60}; path=/; secure; samesite=lax`
    }
}

export function getReferralCode() {
    const match = document.cookie.match(/lume_ref=([^;]+)/)
    return match ? match[1] : null
}
