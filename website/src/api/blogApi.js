/* Blog API — connects to Lume backend */
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchPosts({ page = 1, limit = 12, category } = {}) {
    const params = new URLSearchParams({ page, limit })
    if (category) params.set('category', category)
    const res = await fetch(`${API_BASE}/api/blog?${params}`)
    if (!res.ok) return { posts: [], total: 0 }
    return res.json()
}

export async function fetchPost(slug) {
    const res = await fetch(`${API_BASE}/api/blog/${slug}`)
    if (!res.ok) return null
    return res.json()
}

export async function createPost(post, token) {
    const res = await fetch(`${API_BASE}/api/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(post)
    })
    return res.json()
}
