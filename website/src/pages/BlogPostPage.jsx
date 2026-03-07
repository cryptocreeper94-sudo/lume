import { useParams, Link } from 'react-router-dom'
import { posts } from './BlogPage'

/* Full blog post content — seed articles. Backend will serve dynamic content. */
const postContent = {
    'introducing-lume': {
        content: `
## What is Lume?

Lume is the first programming language where AI isn't a library you import — it's a **syntax primitive**. Just like you use \`if\` for conditions and \`for\` for loops, you use \`ask\`, \`think\`, and \`generate\` for AI.

## Why Build a New Language?

Every AI application written today starts with the same boilerplate: install an SDK, configure API keys, write HTTP calls, parse JSON responses, handle errors. Lume eliminates all of that.

\`\`\`
let summary = ask claude.sonnet "Summarize this article"
let plan = think gpt4 "Design an API for {project}"
let code = generate gemini "React component for a dashboard"
\`\`\`

That's real syntax. Three lines replace what typically takes 30+.

## The Self-Sustaining Runtime

But Lume goes further. A Lume program doesn't just run — it **takes care of itself**:

- **Layer 1: Self-Monitoring** — Tracks performance, errors, AI costs, memory
- **Layer 2: Self-Healing** — Automatic retry, circuit breakers, model fallback
- **Layer 3: Self-Optimizing** — Detects bottlenecks, suggests fixes
- **Layer 4: Self-Evolving** — Learns patterns, adapts behavior

## 219 Tests, Zero Failures

Lume has been built across 6 milestones with comprehensive test coverage. Every feature is verified, every edge case is handled.

## Get Started

\`\`\`
npm install -g lume-lang
lume run hello.lume
\`\`\`

Welcome to the future of programming. Welcome to Lume.
    `
    },
    'self-sustaining-runtime': {
        content: `
## The Vision: Software That Cares for Itself

What if your program could detect when it's running slowly and fix itself? What if it knew when an API was failing and automatically switched to a backup? Lume's Milestone 6 makes this real.

## Four Layers, One System

### Layer 1: Self-Monitoring
Every function call is tracked: execution time, error rate, call count. AI calls are monitored for latency, cost, and token usage. Memory snapshots are taken periodically.

\`\`\`
monitor:
    dashboard: true
    interval: 5s
    alert_on:
        error_rate > 0.05
\`\`\`

### Layer 2: Self-Healing
The \`@healable\` decorator wraps any function with retry logic, circuit breakers, and AI model fallback chains.

\`\`\`
@healable
to fetch_data(url: text):
    return fetch url as json
\`\`\`

### Layer 3: Self-Optimizing
The optimizer analyzes monitoring data to find slow functions, high error rates, and expensive AI calls. It can suggest fixes or auto-apply them.

### Layer 4: Self-Evolving
The highest layer learns usage patterns, benchmarks AI models against each other, and makes autonomous decisions about optimization.

## The Result: 219 Passing Tests

Every layer has been thoroughly tested. The self-sustaining runtime is production-ready.
    `
    },
}

export default function BlogPostPage() {
    const { slug } = useParams()
    const post = posts.find(p => p.slug === slug)
    const content = postContent[slug]

    if (!post) {
        return (
            <div className="blog-post">
                <h1>Post Not Found</h1>
                <p style={{ color: 'var(--text-secondary)' }}>This article doesn't exist yet.</p>
                <Link to="/blog" className="btn-primary-lg" style={{ marginTop: 24, display: 'inline-flex' }}>← Back to Blog</Link>
            </div>
        )
    }

    return (
        <article className="blog-post">
            <Link to="/blog" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', marginBottom: 24, display: 'block' }}>← Back to Blog</Link>
            <div className="blog-card-category" style={{ marginBottom: 12 }}>{post.category}</div>
            <h1>{post.title}</h1>
            <div className="blog-post-meta">
                <span>{post.date}</span>
                <span>·</span>
                <span>Lume Team</span>
            </div>
            <img src={post.thumbnail} alt={post.title} style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 32, opacity: 0.8 }} />
            <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: content?.content?.replace(/\n/g, '<br>').replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/## (.*?)(?=<br>)/g, '<h2>$1</h2>').replace(/### (.*?)(?=<br>)/g, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || `<p>${post.excerpt}</p><p style="margin-top:24px;color:var(--text-muted)">Full article coming soon. This content will be served from the Lume backend API.</p>` }} />
        </article>
    )
}
