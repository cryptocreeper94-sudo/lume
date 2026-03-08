/* SMS API — connects to Lume backend */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function submitSmsOptin({ phone, consent, marketing, ip_address, user_agent }) {
    const res = await fetch(`${API_BASE}/api/sms/optin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consent, marketing, ip_address, user_agent })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Opt-in failed')
    return data
}

export async function handleSmsWebhook(body) {
    const res = await fetch(`${API_BASE}/api/sms/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    return res.json()
}
