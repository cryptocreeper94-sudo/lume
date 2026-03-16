import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const slides = [
    { image: '/heroes/hero-ai-code.png', label: 'Voice-to-Code', title: 'Speak Your Code', subtitle: 'The first programming language you can speak. Say what you want — the compiler understands. No syntax to memorize. No middleman.' },
    { image: '/heroes/hero-neural-brain.png', label: 'Natural Language Compiler', title: 'English Is Syntax', subtitle: '"Get the user\'s name from the database" compiles directly. Not a prompt. Not AI-generated code. Direct compilation of human language.' },
    { image: '/heroes/hero-self-healing.png', label: 'Certified at Birth', title: 'Security Built In', subtitle: 'Every instruction is security-scanned at the AST level during compilation. Output includes a tamper-evident certificate. No bolt-on tools needed.' },
    { image: '/heroes/hero-evolution.png', label: 'Zero Cognitive Distance', title: 'Think It. Say It. Run It.', subtitle: 'The distance between what you think and what the compiler receives approaches zero. The dissonance disappears.' },
]

export default function HeroCarousel() {
    const [current, setCurrent] = useState(0)
    const [paused, setPaused] = useState(false)

    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % slides.length)
    }, [])

    useEffect(() => {
        if (paused) return
        const timer = setInterval(next, 8000)
        return () => clearInterval(timer)
    }, [paused, next])

    return (
        <section className="hero-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {slides.map((slide, i) => (
                <div key={i} className={`hero-slide ${i === current ? 'active' : ''}`}>
                    <img src={slide.image} alt={slide.label} loading={i === 0 ? 'eager' : 'lazy'} />
                    <div className="hero-overlay" />
                </div>
            ))}

            <div className="hero-content">
                <div className="hero-badge skeleton-reveal">
                    <span className="badge-dot" /> The First Programming Language You Can Speak
                </div>
                <p className={`hero-slide-label ${slides[current] ? 'active' : ''}`} key={`label-${current}`}>
                    {slides[current].label}
                </p>
                <h1 className="hero-title">
                    {slides[current].title.split(' ').map((word, i) =>
                        i === slides[current].title.split(' ').length - 1
                            ? <span key={i} className="gradient-wave-text">{word}</span>
                            : <span key={i}>{word} </span>
                    )}
                </h1>
                <p className="hero-subtitle">{slides[current].subtitle}</p>
                <div className="hero-actions">
                    <Link to="/login" className="btn-primary-lg">
                        <span>Get Started</span>
                        <span className="btn-arrow">→</span>
                    </Link>
                    <a href="#code" className="btn-glass-lg">See the Code</a>
                </div>
                <div className="hero-stats">
                    <div className="stat">
                        <span className="stat-value">520+</span>
                        <span className="stat-label">Tests Passing</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat">
                        <span className="stat-value">15</span>
                        <span className="stat-label">Milestones</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat">
                        <span className="stat-value">3</span>
                        <span className="stat-label">Security Layers</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat">
                        <span className="stat-value">🎤</span>
                        <span className="stat-label">Voice Input</span>
                    </div>
                </div>
            </div>

            <div className="hero-dots">
                {slides.map((_, i) => (
                    <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`} />
                ))}
            </div>
        </section>
    )
}
