/* Compile API — connects to Lume backend sandbox */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function compileCode(source, filename = 'playground.lume') {
    const res = await fetch(`${API_BASE}/api/compile/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, filename })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Compilation failed')
    return data
}

export async function runCode(source, filename = 'playground.lume') {
    const res = await fetch(`${API_BASE}/api/compile/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, filename })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Execution failed')
    return data
}

export async function explainCode(source, filename = 'playground.lume') {
    const res = await fetch(`${API_BASE}/api/compile/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, filename, mode: 'annotate' })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Explain failed')
    return data
}
