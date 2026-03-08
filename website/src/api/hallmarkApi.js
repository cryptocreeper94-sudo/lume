/* Hallmark API — connects to Lume backend */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function createHallmark(programName, programHash, token) {
    const res = await fetch(`${API_BASE}/api/hallmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ program_name: programName, program_hash: programHash })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Hallmark creation failed')
    return data
}

export async function verifyHallmark(tn) {
    const res = await fetch(`${API_BASE}/api/hallmark/verify/${tn}`)
    if (!res.ok) return null
    return res.json()
}

export async function getHallmark(id) {
    const res = await fetch(`${API_BASE}/api/hallmark/${id}`)
    if (!res.ok) return null
    return res.json()
}

export async function getMyHallmarks(token) {
    const res = await fetch(`${API_BASE}/api/hallmark/user/mine`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []
    return res.json()
}
