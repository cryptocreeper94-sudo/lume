/**
 * Lume Enterprise Presentation
 * Cinematic slide deck with image preload gating, timer stability, and auto-advance.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { presentationScenes, presentationActs } from '../data/presentationData'
import '../styles/presentation.css'

/* ── Icon system (SVG-based, no dependency) ────────────────── */
const icons = {
  Zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Heart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Code: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Brain: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 0 14 7 7 0 0 1 0-14z" opacity=".3"/></svg>,
  Globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Layers: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  TrendingDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Rocket: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
  Play: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Mic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Default: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
}

function Icon({ name, className }) {
  const Comp = icons[name] || icons.Default
  return <span className={`pres-icon ${className || ''}`}><Comp /></span>
}

/* ── TypeWriter ────────────────────────────────────── */
function TypeWriter({ text, speed = 20 }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  return <>{displayed}<span className="pres-cursor">|</span></>
}

/* ── Animated Counter ────────────────────────────── */
function AnimatedCounter({ value, suffix, prefix }) {
  const [display, setDisplay] = useState('0')
  const num = parseFloat(value)
  useEffect(() => {
    if (isNaN(num) || num === 0) { setDisplay(value); return }
    const steps = 40, interval = 1500 / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const eased = 1 - Math.pow(1 - step / steps, 3)
      const current = num * eased
      setDisplay(Number.isInteger(num) ? Math.round(current).toLocaleString() : current.toFixed(1))
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [value, num])
  return <>{prefix}{display}{suffix}</>
}

/* ── Scene Renderers ────────────────────────────── */

function IntroScene({ scene }) {
  return (
    <div className="pres-scene-intro pres-fade-in">
      <div className="pres-intro-header pres-slide-down">
        <h2 className="pres-gradient-text-warm">{scene.content.headline}</h2>
        <p className="pres-subtitle-italic">{scene.content.subheadline}</p>
      </div>
      <div className="pres-intro-bullets pres-stagger">
        {scene.content.bullets?.map((p, i) => (
          <p key={i} className={
            p === 'This is Lume.'
              ? 'pres-bullet-hero pres-gradient-text-cyan'
              : p.startsWith('What if')
                ? 'pres-bullet-emphasis'
                : 'pres-bullet'
          }>{p}</p>
        ))}
      </div>
    </div>
  )
}

function HeroScene({ scene }) {
  return (
    <div className="pres-scene-hero pres-fade-in">
      <div className="pres-hero-badge pres-slide-down">
        <Icon name="Shield" className="pres-icon-sm" />
        <span>Trust Layer Verified</span>
      </div>
      <h1 className="pres-hero-title pres-scale-in">
        <span className="pres-gradient-text-cyan">{scene.content.headline}</span>
      </h1>
      <p className="pres-hero-subtitle pres-fade-in-delay">{scene.content.subheadline}</p>
      <div className="pres-hero-footer pres-fade-in-delay2">
        <div className="pres-line" /><span>A DarkWave Studios Product</span><div className="pres-line" />
      </div>
    </div>
  )
}

function StatsScene({ scene }) {
  const stats = scene.content.stats || []
  return (
    <div className="pres-scene-stats pres-stagger">
      <h2 className="pres-section-title"><span className="pres-gradient-text-white">{scene.title}</span></h2>
      <p className="pres-section-subtitle">{scene.subtitle}</p>
      <div className={`pres-stat-grid pres-cols-${stats.length <= 4 ? stats.length : stats.length <= 6 ? 3 : 4}`}>
        {stats.map((stat, i) => (
          <div key={i} className={`pres-glass-card pres-stagger-item ${i === 0 ? 'pres-glow' : ''}`}>
            <div className="pres-stat-value"><AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></div>
            <div className="pres-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BentoScene({ scene }) {
  const features = scene.content.features || []
  return (
    <div className="pres-scene-bento pres-stagger">
      <h2 className="pres-section-title"><span className="pres-gradient-text-white">{scene.title}</span></h2>
      <p className="pres-section-subtitle">{scene.subtitle}</p>
      <div className={`pres-bento-grid pres-cols-${features.length <= 3 ? 3 : features.length <= 4 ? 2 : 3}`}>
        {features.map((f, i) => (
          <div key={i} className="pres-glass-card pres-stagger-item">
            {f.image && <div className="pres-card-image"><img src={f.image} alt={f.title} /></div>}
            <div className="pres-card-body">
              {!f.image && <div className="pres-card-icon"><Icon name={f.icon} /></div>}
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowScene({ scene }) {
  const steps = scene.content.steps || []
  return (
    <div className="pres-scene-workflow pres-stagger">
      <h2 className="pres-section-title"><span className="pres-gradient-text-white">{scene.title}</span></h2>
      <p className="pres-section-subtitle">{scene.subtitle}</p>
      <div className="pres-workflow-list">
        {steps.map((s, i) => (
          <div key={i} className="pres-glass-card pres-stagger-item pres-workflow-step">
            {s.image && <div className="pres-card-image"><img src={s.image} alt={s.title} /></div>}
            <div className="pres-workflow-content">
              <div className="pres-step-num">{s.step}</div>
              <div className="pres-step-body">
                <div className="pres-step-header"><Icon name={s.icon} className="pres-icon-sm" /><h3>{s.title}</h3></div>
                <p>{s.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureScene({ scene }) {
  const features = scene.content.features || []
  return (
    <div className="pres-scene-feature pres-stagger">
      <h2 className="pres-section-title"><span className="pres-gradient-text-cyan">{scene.content.headline}</span></h2>
      <p className="pres-section-subtitle">{scene.content.subheadline}</p>
      <div className="pres-feature-grid">
        {features.map((f, i) => (
          <div key={i} className="pres-glass-card pres-stagger-item">
            {f.image && <div className="pres-card-image"><img src={f.image} alt={f.title} /></div>}
            <div className="pres-card-body pres-card-row">
              {!f.image && <div className="pres-card-icon"><Icon name={f.icon} /></div>}
              <div><h3>{f.title}</h3><p>{f.description}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonScene({ scene }) {
  const { before = [], after = [] } = scene.content.comparison || {}
  return (
    <div className="pres-scene-comparison pres-stagger">
      <h2 className="pres-section-title"><span className="pres-gradient-text-white">{scene.title}</span></h2>
      <p className="pres-section-subtitle">{scene.subtitle}</p>
      <div className="pres-comparison-grid">
        <div className="pres-glass-card pres-stagger-item">
          <div className="pres-comparison-header pres-before"><div className="pres-dot pres-dot-red" /><h3>Before</h3></div>
          <div className="pres-comparison-list">{before.map((item, i) => (
            <div key={i} className="pres-comparison-row"><span className="pres-comp-label">{item.label}</span><span className="pres-comp-value-dim">{item.value}</span></div>
          ))}</div>
        </div>
        <div className="pres-glass-card pres-glow pres-stagger-item">
          <div className="pres-comparison-header pres-after"><div className="pres-dot pres-dot-green" /><h3>After — Lume</h3></div>
          <div className="pres-comparison-list">{after.map((item, i) => (
            <div key={i} className="pres-comparison-row"><span className="pres-comp-label">{item.label}</span><span className="pres-comp-value-cyan">{item.value}</span></div>
          ))}</div>
        </div>
      </div>
    </div>
  )
}

function TechSpecsScene({ scene }) {
  const categories = scene.content.techCategories || []
  const handleDownloadPDF = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const rows = categories.map(c => `<div style="break-inside:avoid;margin-bottom:28px;"><h2 style="font-size:15px;font-weight:700;color:#06b6d4;margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #1e293b;padding-bottom:6px;">${c.title}</h2><table style="width:100%;border-collapse:collapse;">${c.items.map(it => `<tr><td style="padding:5px 0;color:#94a3b8;font-size:12px;width:40%;border-bottom:1px solid #0f172a;">${it.label}</td><td style="padding:5px 0;color:#e2e8f0;font-size:12px;font-weight:500;border-bottom:1px solid #0f172a;">${it.value}</td></tr>`).join('')}</table></div>`).join('')
    w.document.write(`<!DOCTYPE html><html><head><title>Lume — Technical Architecture</title><style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}body{margin:0;padding:40px;background:#020617;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}h1{font-size:24px;font-weight:800;margin:0 0 4px;background:linear-gradient(90deg,#06b6d4,#fff,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}p.sub{color:#64748b;font-size:13px;margin:0 0 32px}.grid{columns:2;column-gap:32px}.footer{margin-top:40px;text-align:center;color:#475569;font-size:11px;border-top:1px solid #1e293b;padding-top:16px}</style></head><body><h1>Lume — Technical Architecture</h1><p class="sub">AI-Native Programming Language · The first language where AI is syntax</p><div class="grid">${rows}</div><div class="footer">Lume · DarkWave Studios · Trust Layer Verified<br/>Generated ${new Date().toLocaleDateString()}</div><script>setTimeout(()=>{window.print()},400)</script></body></html>`)
    w.document.close()
  }
  return (
    <div className="pres-scene-techspecs pres-stagger">
      <div className="pres-techspecs-badge"><Icon name="Code" className="pres-icon-sm" /><span>For Engineers & Technical Stakeholders</span></div>
      <h2 className="pres-section-title"><span className="pres-gradient-text-cyan">{scene.title}</span></h2>
      <p className="pres-section-subtitle">{scene.subtitle}</p>
      <div className="pres-techspecs-grid">
        {categories.map((cat, i) => (
          <div key={i} className="pres-glass-card pres-stagger-item">
            <div className="pres-techspec-card">
              <div className="pres-techspec-header"><div className="pres-card-icon pres-icon-sm"><Icon name={cat.icon} /></div><h3>{cat.title}</h3></div>
              <div className="pres-techspec-items">{cat.items.map((item, j) => (
                <div key={j} className="pres-techspec-row"><span className="pres-comp-label">{item.label}</span><span className="pres-comp-value-cyan">{item.value}</span></div>
              ))}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="pres-download-btn" onClick={handleDownloadPDF}><Icon name="Download" className="pres-icon-sm" />Download Technical Specs (PDF)</button>
    </div>
  )
}

function CtaScene({ scene, onPlayground, onDocs, onRestart }) {
  const features = scene.content.features || []
  return (
    <div className="pres-scene-cta pres-stagger">
      <Icon name="Rocket" className="pres-cta-rocket pres-stagger-item" />
      <h2 className="pres-cta-title pres-stagger-item"><span className="pres-gradient-text-cyan">{scene.content.headline}</span></h2>
      <p className="pres-cta-subtitle pres-stagger-item">{scene.content.subheadline}</p>
      <div className="pres-cta-grid">
        {features.map((f, i) => (
          <div key={i} className="pres-glass-card pres-stagger-item">
            <div className="pres-card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <Icon name={f.icon} className="pres-cta-icon" />
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pres-cta-buttons pres-stagger-item">
        <button className="pres-btn-primary" onClick={onPlayground}>Try the Playground →</button>
        <button className="pres-btn-secondary" onClick={onDocs}>Read the Docs</button>
        <button className="pres-btn-ghost" onClick={onRestart}>Restart Presentation</button>
      </div>
      <div className="pres-hero-footer pres-fade-in-delay2">
        <div className="pres-line" /><span>Powered by Trust Layer</span><div className="pres-line" />
      </div>
    </div>
  )
}

/* ── Scene Router ────────────────────────────────── */
function SceneRenderer({ scene, onPlayground, onDocs, onRestart }) {
  if (scene.visualType === 'cta') return <CtaScene scene={scene} onPlayground={onPlayground} onDocs={onDocs} onRestart={onRestart} />
  const renderers = { intro: IntroScene, hero: HeroScene, stats: StatsScene, bento: BentoScene, workflow: WorkflowScene, feature: FeatureScene, comparison: ComparisonScene, techSpecs: TechSpecsScene }
  const Component = renderers[scene.visualType] || BentoScene
  return <Component scene={scene} />
}

/* ── Scroll Indicator ────────────────────────────── */
function ScrollIndicator({ containerRef }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const check = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 10
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
      setShow(hasOverflow && !nearBottom)
    }
    check()
    const t = setTimeout(check, 600)
    el.addEventListener('scroll', check)
    return () => { el.removeEventListener('scroll', check); clearTimeout(t) }
  }, [containerRef])
  if (!show) return null
  return (
    <div className="pres-scroll-indicator">
      <div className="pres-scroll-gradient" />
      <div className="pres-scroll-label"><span>Scroll</span><Icon name="ChevronRight" className="pres-icon-xs pres-rotate-90" /></div>
    </div>
  )
}

/* ── Main Presentation Component ────────────────── */
export default function PresentationPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showTOC, setShowTOC] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [imageLoadProgress, setImageLoadProgress] = useState({ loaded: 0, total: 0 })
  const navigate = useNavigate()
  const scenes = presentationScenes
  const scene = scenes[currentIndex]
  const touchStartX = useRef(0)
  const contentScrollRef = useRef(null)
  const [contentOverflows, setContentOverflows] = useState(false)

  // Scroll reset and overflow detection
  useEffect(() => {
    const el = contentScrollRef.current
    if (el) el.scrollTop = 0
    const checkOverflow = () => {
      const el = contentScrollRef.current
      if (el) setContentOverflows(el.scrollHeight > el.clientHeight + 10)
    }
    checkOverflow()
    const timer = setTimeout(checkOverflow, 600)
    let ro
    if (el) { ro = new ResizeObserver(checkOverflow); ro.observe(el) }
    return () => { clearTimeout(timer); ro?.disconnect() }
  }, [currentIndex])

  // Image preload gate — timer won't fire until images are loaded
  useEffect(() => {
    setImagesReady(false)
    setImageLoadProgress({ loaded: 0, total: 0 })
    const images = []
    scene.content.features?.forEach(f => { if (f.image) images.push(f.image) })
    scene.content.steps?.forEach(s => { if (s.image) images.push(s.image) })
    if (images.length === 0) { setImagesReady(true); setImageLoadProgress({ loaded: 0, total: 0 }); return }
    let loaded = 0, cancelled = false
    const total = images.length
    setImageLoadProgress({ loaded: 0, total })
    const onDone = () => {
      loaded++
      if (!cancelled) {
        setImageLoadProgress({ loaded, total })
        if (loaded >= total) setImagesReady(true)
      }
    }
    images.forEach(src => { const img = new Image(); img.onload = onDone; img.onerror = onDone; img.src = src })
    const fallback = setTimeout(() => { if (!cancelled) { setImagesReady(true); setImageLoadProgress({ loaded: total, total }) } }, 4000)
    return () => { cancelled = true; clearTimeout(fallback) }
  }, [currentIndex, scene])

  // Auto-advance timer — stable, gates on imagesReady
  useEffect(() => {
    if (!isPlaying || !imagesReady) return
    if (scene.duration === 0) return // CTA stays forever
    const baseDuration = scene.duration * 1000
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const duration = (contentOverflows && isMobile) ? Math.max(baseDuration, baseDuration * 1.8) : baseDuration
    const timer = setTimeout(() => {
      if (currentIndex < scenes.length - 1) setCurrentIndex(p => p + 1)
      else setIsPlaying(false)
    }, duration)
    return () => clearTimeout(timer)
  }, [isPlaying, currentIndex, imagesReady, scene.duration, contentOverflows, scenes.length])

  // Prefetch next 4 slides
  useEffect(() => {
    scenes.slice(currentIndex + 1, currentIndex + 4).forEach(s => {
      const imgs = []
      s.content.features?.forEach(f => { if (f.image) imgs.push(f.image) })
      s.content.steps?.forEach(st => { if (st.image) imgs.push(st.image) })
      imgs.forEach(src => { const img = new Image(); img.src = src })
    })
  }, [currentIndex, scenes])

  const next = useCallback(() => { if (currentIndex < scenes.length - 1) setCurrentIndex(p => p + 1) }, [currentIndex, scenes.length])
  const prev = useCallback(() => { if (currentIndex > 0) setCurrentIndex(p => p - 1) }, [currentIndex])

  // Keyboard
  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
      else if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p) }
      else if (e.key === 'Escape') navigate('/')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [next, prev, navigate])

  // Touch
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = e => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev() }
  }

  const goToScene = i => { setCurrentIndex(i); setIsPlaying(false); setShowTOC(false) }
  const progress = ((currentIndex + 1) / scenes.length) * 100
  const currentAct = presentationActs.find(a => a.number === scene.actNumber)

  return (
    <div className="pres-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Top bar */}
      <div className="pres-topbar">
        <div className="pres-topbar-left">
          <button className="pres-btn-icon" onClick={() => setShowTOC(true)} aria-label="Open outline"><Icon name="List" /></button>
          <span className="pres-act-label">{currentAct?.name}</span>
        </div>
        <div className="pres-topbar-center">LUME</div>
        <div className="pres-topbar-right">
          <span className="pres-slide-counter">{currentIndex + 1} of {scenes.length}</span>
          <button className="pres-btn-icon pres-btn-specs" onClick={() => { const idx = scenes.findIndex(s => s.visualType === 'techSpecs'); if (idx >= 0) setCurrentIndex(idx) }}>
            <Icon name="Code" className="pres-icon-xs" /><span>Specs</span>
          </button>
          <button className="pres-btn-icon" onClick={() => navigate('/')} aria-label="Close"><Icon name="X" /></button>
        </div>
      </div>

      {/* Image loading progress bar */}
      {!imagesReady && imageLoadProgress.total > 0 && (
        <div className="pres-loading-bar">
          <span className="pres-loading-label">Loading images</span>
          <div className="pres-loading-track">
            <div className="pres-loading-fill" style={{ width: `${Math.round((imageLoadProgress.loaded / imageLoadProgress.total) * 100)}%` }} />
          </div>
          <span className="pres-loading-pct">{Math.round((imageLoadProgress.loaded / imageLoadProgress.total) * 100)}%</span>
        </div>
      )}

      {/* Content area */}
      <div className="pres-content-area">
        <div key={scene.id} className="pres-slide pres-slide-enter">
          <div className={`pres-slide-inner ${scene.narration ? 'pres-with-narration' : ''}`}>
            <div ref={contentScrollRef} className="pres-slide-scroll">
              <div className="pres-slide-wrapper">
                <SceneRenderer scene={scene} onPlayground={() => navigate('/playground')} onDocs={() => navigate('/docs')} onRestart={() => { setCurrentIndex(0); setIsPlaying(false) }} />
              </div>
            </div>
            <ScrollIndicator containerRef={contentScrollRef} />
          </div>
        </div>
      </div>

      {/* Narration bar */}
      {scene.narration && (
        <div className="pres-narration" key={`narr-${scene.id}`}>
          <div className="pres-narration-inner">
            <p><TypeWriter text={scene.narration} speed={20} /></p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="pres-bottombar">
        <div className="pres-progress"><div className="pres-progress-fill" style={{ width: `${progress}%` }} /></div>
        <div className="pres-controls">
          <div className="pres-act-dots">
            {presentationActs.map(act => (
              <div key={act.number} className={`pres-act-dot ${act.number === scene.actNumber ? 'pres-act-dot-active' : act.number < scene.actNumber ? 'pres-act-dot-past' : ''}`} />
            ))}
          </div>
          <div className="pres-nav-buttons">
            <button className="pres-btn-icon" onClick={prev} disabled={currentIndex === 0} aria-label="Previous"><Icon name="ChevronLeft" /></button>
            <button className="pres-btn-icon pres-btn-play" onClick={() => setIsPlaying(p => !p)} aria-label={isPlaying ? 'Pause' : 'Play'}>
              <Icon name={isPlaying ? 'Pause' : 'Play'} />
            </button>
            <button className="pres-btn-icon" onClick={next} disabled={currentIndex === scenes.length - 1} aria-label="Next"><Icon name="ChevronRight" /></button>
          </div>
          <div className="pres-slide-num">{currentIndex + 1}/{scenes.length}</div>
        </div>
      </div>

      {/* TOC sidebar */}
      {showTOC && (
        <>
          <div className="pres-toc-overlay" onClick={() => setShowTOC(false)} />
          <div className="pres-toc-panel">
            <div className="pres-toc-header">
              <h3>Presentation Outline</h3>
              <button className="pres-btn-icon" onClick={() => setShowTOC(false)} aria-label="Close"><Icon name="X" /></button>
            </div>
            {presentationActs.map(act => {
              const actScenes = scenes.filter(s => s.actNumber === act.number)
              return (
                <div key={act.number} className="pres-toc-act">
                  <div className="pres-toc-act-label">Act {act.number} — {act.name}</div>
                  {actScenes.map(s => (
                    <button key={s.id} className={`pres-toc-item ${s.id === scene.id ? 'pres-toc-item-active' : ''}`} onClick={() => goToScene(scenes.indexOf(s))}>
                      <Icon name={s.icon} className="pres-icon-xs" /><span>{s.title}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
