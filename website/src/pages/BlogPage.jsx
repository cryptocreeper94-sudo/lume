import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts } from '../api/blogApi'

/* Fallback seed data — used when backend is unreachable */
const SEED_POSTS = [
    {
        slug: 'introducing-lume',
        title: 'Introducing Lume: The AI-Native Programming Language',
        excerpt: 'Today we launch Lume — the first language where AI is a syntax primitive, not a library. Program with ask, think, and generate as keywords.',
        category: 'Launch',
        date: 'Mar 7, 2026',
        thumbnail: '/features/ai-syntax.png',
    },
    {
        slug: 'self-sustaining-runtime',
        title: 'Building Software That Takes Care of Itself',
        excerpt: 'Lume\'s Milestone 6 introduces four self-sustaining layers: monitoring, healing, optimizing, and evolving. Here\'s how they work together.',
        category: 'Deep Dive',
        date: 'Mar 7, 2026',
        thumbnail: '/features/self-healing.png',
    },
    {
        slug: 'lume-vs-python',
        title: 'Lume vs. Python for AI Development',
        excerpt: '90% less code for AI integration. Side-by-side comparison of building AI-powered apps in Lume vs. traditional Python with the OpenAI SDK.',
        category: 'Comparison',
        date: 'Mar 6, 2026',
        thumbnail: '/features/monitoring.png',
    },
    {
        slug: 'pipe-operator-guide',
        title: 'The Pipe Operator: Elegant Data Transformation',
        excerpt: 'Chain operations left-to-right with Lume\'s |> operator. Make your data flow readable and composable.',
        category: 'Tutorial',
        date: 'Mar 5, 2026',
        thumbnail: '/features/pipe.png',
    },
    {
        slug: 'trust-layer-integration',
        title: 'Lume Joins the Trust Layer Ecosystem',
        excerpt: 'SSO, Signal Chat, hallmarking, and blockchain provenance — Lume programs are now part of the authenticated creation ecosystem.',
        category: 'Ecosystem',
        date: 'Mar 4, 2026',
        thumbnail: '/features/http.png',
    },
    {
        slug: 'healable-decorator',
        title: 'The @healable Decorator: Self-Healing Functions',
        excerpt: 'One decorator replaces 15 lines of retry logic. Circuit breakers, exponential backoff, and AI model fallback — all automatic.',
        category: 'Tutorial',
        date: 'Mar 3, 2026',
        thumbnail: '/features/evolving.png',
    },
]

export default function BlogPage() {
    const [posts, setPosts] = useState(SEED_POSTS)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        fetchPosts({ limit: 50 })
            .then(data => {
                if (!cancelled && data.posts && data.posts.length > 0) {
                    setPosts(data.posts.map(p => ({
                        slug: p.slug,
                        title: p.title,
                        excerpt: p.excerpt,
                        category: (p.tags && p.tags[0]) || 'Article',
                        date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        thumbnail: p.thumbnail || '/features/ai-syntax.png',
                    })))
                }
            })
            .catch(() => { /* Keep seed data on error */ })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    return (
        <div style={{ minHeight: '100vh' }}>
            <div className="orb orb-1" />

            {/* Hero Banner */}
            <div style={{ position: 'relative', height: 300, overflow: 'hidden', marginTop: 64 }}>
                <img src="/pages/blog-hero.png" alt="Lume Blog" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,6,10,0.3), rgba(6,6,10,0.95))' }} />
                <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
                    <span className="section-label">Blog</span>
                    <h2 className="section-title" style={{ marginTop: 12 }}>Latest from <span className="gradient-wave-text">Lume</span></h2>
                    <p className="section-subtitle" style={{ margin: '8px auto 0' }}>Tutorials, deep dives, and ecosystem updates</p>
                </div>
            </div>

            <section className="section" style={{ paddingTop: 40 }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        Loading posts...
                    </div>
                )}
                <div className="blog-grid">
                    {posts.map((p, i) => (
                        <Link to={`/blog/${p.slug}`} key={i} className="blog-card">
                            <img src={p.thumbnail} alt={p.title} className="blog-card-img" loading="lazy" />
                            <div className="blog-card-body">
                                <div className="blog-card-category">{p.category}</div>
                                <h3 className="blog-card-title">{p.title}</h3>
                                <p className="blog-card-excerpt">{p.excerpt}</p>
                                <div className="blog-card-date">{p.date}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
