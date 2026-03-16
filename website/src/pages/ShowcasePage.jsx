import { useState } from 'react'
import '../styles/responsive-pages.css'

const examples = [
    { name: 'Chatbot', file: 'chatbot.lume', category: 'AI', difficulty: 'Advanced', icon: '🤖', desc: 'AI chatbot with conversation history and context management.', features: ['ask keyword', 'Context building', 'Multi-turn dialogue'] },
    { name: 'REST API', file: 'rest-api.lume', category: 'Backend', difficulty: 'Advanced', icon: '🚀', desc: 'Full CRUD REST API with validation and middleware.', features: ['CRUD operations', 'Input validation', 'JSON responses'] },
    { name: 'Game Engine', file: 'game-logic.lume', category: 'Games', difficulty: 'Advanced', icon: '🗡️', desc: 'Turn-based RPG with combat, leveling, and inventory.', features: ['Combat system', 'Level progression', 'Inventory management'] },
    { name: 'Dashboard', file: 'dashboard.lume', category: 'Data', difficulty: 'Advanced', icon: '📊', desc: 'Real-time monitoring dashboard with alerts.', features: ['Data aggregation', 'Bar charts', 'Alert system'] },
    { name: 'Auth System', file: 'auth-system.lume', category: 'Security', difficulty: 'Advanced', icon: '🔐', desc: 'JWT-style auth with RBAC and session management.', features: ['Password hashing', 'Role-based access', 'Session tokens'] },
    { name: 'Data Pipeline', file: 'data-pipeline.lume', category: 'Data', difficulty: 'Advanced', icon: '🔄', desc: 'ETL pipeline with validation and aggregation.', features: ['Extract/Transform/Load', 'Data validation', 'Customer tiering'] },
    { name: 'CLI Tool', file: 'cli-tool.lume', category: 'Tooling', difficulty: 'Intermediate', icon: '⌨️', desc: 'CLI argument parser with command routing.', features: ['Argument parsing', 'Command routing', 'Flag handling'] },
    { name: 'Self-Healing', file: 'self-healing.lume', category: 'Runtime', difficulty: 'Advanced', icon: '🩹', desc: 'Self-sustaining runtime with all 4 layers.', features: ['@healable', 'Monitor config', 'Auto-recovery'] },
    { name: 'Web Scraper', file: 'web-scraper.lume', category: 'Web', difficulty: 'Intermediate', icon: '🔍', desc: 'GitHub repo scraper with retry logic.', features: ['HTTP fetch', '@healable', 'JSON parsing'] },
    { name: 'English Mode', file: 'english-advanced.lume', category: 'Language', difficulty: 'Advanced', icon: '🧠', desc: '11 complex natural language patterns.', features: ['Pipes', 'Events', 'Assertions'] },
    { name: 'Voice Demo', file: 'voice-demo.lume', category: 'Voice', difficulty: 'Intermediate', icon: '🎤', desc: 'Voice-to-code pipeline walkthrough.', features: ['Homophones', 'Corrections', 'Structural cues'] },
    { name: 'Blockchain', file: 'blockchain-stamp.lume', category: 'Trust', difficulty: 'Advanced', icon: '🔗', desc: 'Trust stamps and hallmark verification.', features: ['Hashing', 'Proof-of-work', 'Chain verification'] },
    { name: 'File Watcher', file: 'file-watcher.lume', category: 'Tooling', difficulty: 'Intermediate', icon: '👁️', desc: 'File system monitoring with pattern rules.', features: ['Event handling', 'Pattern matching', 'Auto-actions'] },
    { name: 'Hello World', file: 'hello.lume', category: 'Basics', difficulty: 'Beginner', icon: '👋', desc: 'Your first Lume program.', features: ['show', 'Variables', 'Strings'] },
    { name: 'Todo App', file: 'todo.lume', category: 'Basics', difficulty: 'Beginner', icon: '✅', desc: 'Simple todo list with CRUD.', features: ['Lists', 'Functions', 'Loops'] },
    { name: 'Calculator', file: 'calculator.lume', category: 'Basics', difficulty: 'Beginner', icon: '🔢', desc: 'Basic calculator with operators.', features: ['Math', 'Input', 'Functions'] },
    { name: 'FizzBuzz', file: 'fizzbuzz.lume', category: 'Basics', difficulty: 'Beginner', icon: '🎯', desc: 'Classic FizzBuzz challenge.', features: ['Loops', 'Conditionals', 'Modulo'] },
    { name: 'AI Demo', file: 'ai_demo.lume', category: 'AI', difficulty: 'Intermediate', icon: '🤖', desc: 'AI integration showcase.', features: ['ask', 'think', 'generate'] },
]

const categories = ['All', ...new Set(examples.map(e => e.category))]
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']
const difficultyColors = { Beginner: '#4ade80', Intermediate: '#60a5fa', Advanced: '#c084fc' }

export default function ShowcasePage() {
    const [category, setCategory] = useState('All')
    const [difficulty, setDifficulty] = useState('All')
    const [selected, setSelected] = useState(null)

    const filtered = examples.filter(e =>
        (category === 'All' || e.category === category) &&
        (difficulty === 'All' || e.difficulty === difficulty)
    )

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e0e0ff', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Hero */}
            <div className="lume-hero" style={{ padding: '4rem 2rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>
                    <span style={{ background: 'linear-gradient(135deg, #c084fc, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Example Gallery</span>
                </h1>
                <p style={{ color: '#a0a0c0', fontSize: '1.2rem' }}>{examples.length} examples showing Lume's full capabilities</p>
            </div>

            <div className="lume-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
                {/* Filters */}
                <div className="showcase-filters" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Category</div>
                        <div className="showcase-filter-buttons" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {categories.map(c => (
                                <button key={c} onClick={() => setCategory(c)} style={{
                                    padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.85rem',
                                    background: category === c ? '#c084fc' : '#1a1a2e',
                                    color: category === c ? '#fff' : '#a0a0c0',
                                    border: `1px solid ${category === c ? '#c084fc' : '#2a2a4e'}`,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Difficulty</div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {difficulties.map(d => (
                                <button key={d} onClick={() => setDifficulty(d)} style={{
                                    padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.85rem',
                                    background: difficulty === d ? (difficultyColors[d] || '#c084fc') : '#1a1a2e',
                                    color: difficulty === d ? '#fff' : '#a0a0c0',
                                    border: `1px solid ${difficulty === d ? (difficultyColors[d] || '#c084fc') : '#2a2a4e'}`,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}>{d}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="showcase-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
                    {filtered.map((ex, i) => (
                        <div key={i} onClick={() => setSelected(selected?.name === ex.name ? null : ex)} style={{
                            background: '#1a1a2e', borderRadius: 16, padding: '1.5rem',
                            border: `1px solid ${selected?.name === ex.name ? '#c084fc' : '#2a2a4e'}`,
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.8rem' }}>{ex.icon}</span>
                                <span style={{ color: difficultyColors[ex.difficulty], background: `${difficultyColors[ex.difficulty]}20`, padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>{ex.difficulty}</span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>{ex.name}</h3>
                            <p style={{ color: '#a0a0c0', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.8rem' }}>{ex.desc}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {ex.features.map((f, fi) => (
                                    <span key={fi} style={{ background: '#2a2a4e', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', color: '#b0b0d0' }}>{f}</span>
                                ))}
                            </div>
                            <div style={{ marginTop: '0.8rem', color: '#60a5fa', fontSize: '0.8rem' }}>📄 {ex.file}</div>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#a0a0c0' }}>
                        No examples match the current filters.
                    </div>
                )}
            </div>
        </div>
    )
}
