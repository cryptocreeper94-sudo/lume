/* Email API — connects to Lume backend */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function sendWelcomeEmail(email, token) {
    const res = await fetch(`${API_BASE}/api/email/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
    })
    return res.json()
}

export async function sendVerificationCode(email) {
    const res = await fetch(`${API_BASE}/api/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    return res.json()
}
