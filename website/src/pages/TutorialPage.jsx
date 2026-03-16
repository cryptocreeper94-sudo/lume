import { useState } from 'react'
import '../styles/responsive-pages.css'

const lessons = [
    {
        id: 1, title: 'Hello, Lume!', difficulty: 'Beginner', duration: '5 min',
        description: 'Write your first Lume program and understand the basics.',
        code: `// Your first Lume program!\nlet name = "World"\nshow "Hello, {name}!"`,
        concepts: ['Variables', 'String interpolation', 'show statement'],
    },
    {
        id: 2, title: 'Variables & Types', difficulty: 'Beginner', duration: '10 min',
        description: 'Learn about let, define, and Lume\'s type system.',
        code: `let name = "Alice"        // immutable\ndefine count = 0           // mutable\nset count = count + 1      // reassign\n\nlet active = true          // boolean\nlet items = [1, 2, 3]     // list\nlet user = { name: "Bob" } // map`,
        concepts: ['let vs define', 'Types', 'Lists', 'Maps'],
    },
    {
        id: 3, title: 'Functions', difficulty: 'Beginner', duration: '10 min',
        description: 'Define and call functions with parameters and return values.',
        code: `define greet(name):\n    return "Hello, {name}!"\n\nlet message = greet("Alice")\nshow message\n\n// Arrow functions\nlet double = x -> x * 2\nshow double(21)  // 42`,
        concepts: ['define', 'Parameters', 'return', 'Arrow functions'],
    },
    {
        id: 4, title: 'Control Flow', difficulty: 'Beginner', duration: '10 min',
        description: 'Conditionals, loops, and natural language operators.',
        code: `let score = 85\n\nif score is at least 90:\n    show "A grade!"\nelse if score is at least 80:\n    show "B grade!"\nelse:\n    show "Keep studying!"\n\nfor each n in list.range(1, 6):\n    show "Count: {n}"`,
        concepts: ['if/else', 'Natural operators', 'for each', 'while'],
    },
    {
        id: 5, title: 'Working with Data', difficulty: 'Intermediate', duration: '15 min',
        description: 'Use the stdlib to manipulate text, lists, and numbers.',
        code: `use text from stdlib\nuse list from stdlib\nuse math from stdlib\n\nlet names = ["Charlie", "Alice", "Bob"]\nlet sorted = list.sort(names)\nlet upper = list.map(sorted, n -> text.upper(n))\nshow text.join(upper, ", ")  // ALICE, BOB, CHARLIE`,
        concepts: ['Imports', 'Stdlib modules', 'Pipes', 'Chaining'],
    },
    {
        id: 6, title: 'AI Integration', difficulty: 'Intermediate', duration: '15 min',
        description: 'Use ask, think, and generate to call AI models.',
        code: `// Ask a question\nlet capital = ask "What is the capital of France?"\nshow capital\n\n// Think through a problem\nlet analysis = think "What are pros/cons of microservices?"\nshow analysis\n\n// Generate content\nlet bio = generate "A professional bio for a Lume developer"\nshow bio`,
        concepts: ['ask', 'think', 'generate', 'AI models'],
    },
    {
        id: 7, title: 'English Mode', difficulty: 'Intermediate', duration: '15 min',
        description: 'Write code in natural English sentences.',
        code: `mode: english\n\ncreate a user with name "Alice" and email "a@b.com"\nget all users where status is "active"\nsort the users by name\nshow the results`,
        concepts: ['mode: english', 'CRUD patterns', 'Canonical verbs'],
    },
    {
        id: 8, title: 'Error Handling', difficulty: 'Intermediate', duration: '10 min',
        description: 'Handle errors gracefully with try/with and Result types.',
        code: `define divide(a, b):\n    if b is 0:\n        fail "Cannot divide by zero"\n    return a / b\n\ntry:\n    let result = divide(10, 0)\n    show result\nwith error:\n    show "Error: {error}"`,
        concepts: ['try/with', 'fail', 'ok/error', 'maybe types'],
    },
    {
        id: 9, title: 'Type Definitions', difficulty: 'Advanced', duration: '15 min',
        description: 'Create custom types for structured data.',
        code: `type User:\n    name: text\n    age: number\n    email: text\n    active: boolean\n\nlet user = User:\n    name: "Alice"\n    age: 30\n    email: "alice@lume.dev"\n    active: true\n\nshow "{user.name} ({user.age})"`,
        concepts: ['type definitions', 'Fields', 'Construction', 'Access'],
    },
    {
        id: 10, title: 'Self-Healing Apps', difficulty: 'Advanced', duration: '20 min',
        description: 'Build applications with automatic error recovery.',
        code: `monitor:\n    alert_on:\n        error_rate: 0.1\n\n@healable\ndefine fetch_data(url):\n    return fetch url\n\n// This auto-retries on failure!\nlet data = fetch_data("/api/users")\nshow data`,
        concepts: ['@healable', 'monitor', 'Circuit breakers', 'Fallbacks'],
    },
]

const difficultyColors = { Beginner: '#4ade80', Intermediate: '#60a5fa', Advanced: '#c084fc' }

export default function TutorialPage() {
    const [selected, setSelected] = useState(lessons[0])
    const [completed, setCompleted] = useState(new Set())

    const toggleComplete = (id) => {
        const next = new Set(completed)
        next.has(id) ? next.delete(id) : next.add(id)
        setCompleted(next)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e0e0ff', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Hero */}
            <div className="lume-hero" style={{ padding: '4rem 2rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>
                    <span style={{ background: 'linear-gradient(135deg, #4ade80, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Learn Lume</span>
                </h1>
                <p style={{ color: '#a0a0c0', fontSize: '1.2rem' }}>Step-by-step tutorials from beginner to advanced</p>
                <p style={{ color: '#60a5fa', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {completed.size}/{lessons.length} completed
                </p>
            </div>

            <div className="tutorial-layout" style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '2rem', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Sidebar — becomes horizontal scroll on mobile */}
                <div className="tutorial-sidebar" style={{ width: 280, flexShrink: 0 }}>
                    {lessons.map(lesson => (
                        <div key={lesson.id} onClick={() => setSelected(lesson)} className="lume-touch-target" style={{
                            padding: '0.8rem 1rem', marginBottom: '0.5rem', borderRadius: 10,
                            background: selected?.id === lesson.id ? '#2a2a4e' : 'transparent',
                            border: `1px solid ${selected?.id === lesson.id ? '#c084fc' : 'transparent'}`,
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1rem' }}>{completed.has(lesson.id) ? '✅' : '○'}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{lesson.id}. {lesson.title}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: difficultyColors[lesson.difficulty], background: `${difficultyColors[lesson.difficulty]}20`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>{lesson.difficulty}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#a0a0c0' }}>{lesson.duration}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                {selected && (
                    <div className="tutorial-content" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '1.5rem', border: '1px solid #2a2a4e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selected.title}</h2>
                                <span style={{ color: difficultyColors[selected.difficulty], background: `${difficultyColors[selected.difficulty]}20`, padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{selected.difficulty} · {selected.duration}</span>
                            </div>
                            <p style={{ color: '#a0a0c0', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{selected.description}</p>

                            {/* Code Block */}
                            <div style={{ background: '#0d0d1a', borderRadius: 12, padding: '1rem', border: '1px solid #2a2a4e', overflowX: 'auto' }}>
                                <div style={{ color: '#a0a0c0', fontSize: '0.75rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: 1 }}>Example Code</div>
                                <pre style={{ margin: 0, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '0.85rem', lineHeight: 1.6, color: '#e0e0ff', whiteSpace: 'pre', overflowX: 'auto' }}>{selected.code}</pre>
                            </div>

                            {/* Concepts */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.8rem', color: '#c084fc' }}>Key Concepts</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {selected.concepts.map((c, i) => (
                                        <span key={i} style={{ background: '#2a2a4e', padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '0.85rem' }}>{c}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Complete Button */}
                            <button onClick={() => toggleComplete(selected.id)} style={{
                                marginTop: '2rem', padding: '0.8rem 2rem', borderRadius: 10, width: '100%',
                                background: completed.has(selected.id) ? '#2a4a2e' : 'linear-gradient(135deg, #c084fc, #60a5fa)',
                                border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 600,
                                cursor: 'pointer', transition: 'transform 0.2s', minHeight: 48,
                            }}>
                                {completed.has(selected.id) ? '✅ Completed' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
