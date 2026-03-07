import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const slides = [
    { image: '/heroes/hero-ai-code.png', label: 'AI-Native Syntax', title: 'Code That Thinks', subtitle: 'The first language where AI isn\'t an import — it\'s syntax. Call any model with a single keyword.' },
    { image: '/heroes/hero-neural-brain.png', label: 'Intelligent Runtime', title: 'Built for Intelligence', subtitle: 'ask, think, and generate are language primitives. 12 models, 3 providers, zero configuration.' },
    { image: '/heroes/hero-self-healing.png', label: 'Self-Healing Programs', title: 'Software That Heals', subtitle: 'Automatic retry with backoff, circuit breakers, and AI model fallback chains. Your code recovers itself.' },
    { image: '/heroes/hero-evolution.png', label: 'Autonomous Evolution', title: 'Programs That Evolve', subtitle: 'Monitor, optimize, and evolve autonomously. Four self-sustaining layers that make your software alive.' },
]

export default function HeroCarousel() {
    const [current, setCurrent] = useState(0)
    const [paused, setPaused] = useState(false)

    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % slides.length)
    }, [])

    useEffect(() => {
        if (paused) return
        const timer = setInterval(next, 6000)
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
                    <span className="badge-dot" /> The AI-Native Programming Language
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
                        <span className="stat-value">219</span>
                        <span className="stat-label">Tests Passing</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat">
                        <span className="stat-value">6</span>
                        <span className="stat-label">Milestones</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat">
                        <span className="stat-value">4</span>
                        <span className="stat-label">Self-Sustaining Layers</span>
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
