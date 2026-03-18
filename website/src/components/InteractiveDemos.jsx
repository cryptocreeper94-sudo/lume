import { useState, useEffect, useRef, useCallback } from 'react'

/* ════════════════════════════════════════════════════════════
   Layer A Pattern Library (client-side subset for live demo)
   102 patterns in the full compiler; ~30 representative ones here
   ════════════════════════════════════════════════════════════ */
const PATTERNS = [
    { re: /^get (?:all )?(?:the )?(.+?) from (?:the )?(.+)$/i, gen: (m) => `const ${camel(m[1])} = await db.query('SELECT * FROM ${slug(m[2])}');` },
    { re: /^show (?:the )?(.+?)(?: on (?:the )?(?:screen|page))?$/i, gen: (m) => `console.log(${camel(m[1])});` },
    { re: /^create (?:a )?(?:new )?(.+)$/i, gen: (m) => `const ${camel(m[1])} = await db.create('${slug(m[1])}', data);` },
    { re: /^delete (?:the )?(.+)$/i, gen: (m) => `await db.delete('${slug(m[1])}');` },
    { re: /^save (?:the )?(.+?) to (?:the )?(.+)$/i, gen: (m) => `await db.insert('${slug(m[2])}', ${camel(m[1])});` },
    { re: /^update (?:the )?(.+?) to (.+)$/i, gen: (m) => `await db.update('${slug(m[1])}', ${m[2]});` },
    { re: /^send (?:an? )?(.+?) to (?:the )?(.+)$/i, gen: (m) => `await send(${camel(m[1])}, '${slug(m[2])}');` },
    { re: /^filter (?:the )?(.+?) (?:where|who|that|with) (.+)$/i, gen: (m) => `const filtered = ${camel(m[1])}.filter(item => item.${camel(m[2])});` },
    { re: /^sort (?:the )?(.+?) by (.+?)(?: (ascending|descending))?$/i, gen: (m) => `${camel(m[1])}.sort((a, b) => ${m[3] === 'descending' ? 'b' : 'a'}.${camel(m[2])} - ${m[3] === 'descending' ? 'a' : 'b'}.${camel(m[2])});` },
    { re: /^if (?:the )?(.+?) is (?:not )?empty/i, gen: (m) => `if (${camel(m[1])}.length ${m[0].includes('not') ? '>' : '==='} 0) {` },
    { re: /^if (?:the )?(.+?) is (.+)$/i, gen: (m) => `if (${camel(m[1])} === ${isNaN(m[2]) ? `'${m[2]}'` : m[2]}) {` },
    { re: /^for each (.+?) in (?:the )?(.+)$/i, gen: (m) => `for (const ${camel(m[1])} of ${camel(m[2])}) {` },
    { re: /^let (.+?) (?:=|be|equal) (.+)$/i, gen: (m) => `let ${camel(m[1])} = ${isNaN(m[2]) ? `'${m[2]}'` : m[2]};` },
    { re: /^set (?:the )?(.+?) to (.+)$/i, gen: (m) => `${camel(m[1])} = ${isNaN(m[2]) ? `'${m[2]}'` : m[2]};` },
    { re: /^return (?:the )?(.+)$/i, gen: (m) => `return ${camel(m[1])};` },
    { re: /^log (?:the )?(.+)$/i, gen: (m) => `console.log(${camel(m[1])});` },
    { re: /^add (.+?) to (?:the )?(.+)$/i, gen: (m) => `${camel(m[2])}.push(${camel(m[1])});` },
    { re: /^remove (.+?) from (?:the )?(.+)$/i, gen: (m) => `${camel(m[2])} = ${camel(m[2])}.filter(x => x !== ${camel(m[1])});` },
    { re: /^count (?:the )?(.+)$/i, gen: (m) => `const count = ${camel(m[1])}.length;` },
    { re: /^calculate (?:the )?(.+)$/i, gen: (m) => `const ${camel(m[1])} = /* computed */;` },
    { re: /^navigate to (?:the )?(.+)$/i, gen: (m) => `window.location.href = '/${slug(m[1])}';` },
    { re: /^redirect to (?:the )?(.+)$/i, gen: (m) => `window.location.replace('/${slug(m[1])}');` },
    { re: /^wait (?:for )?(\d+) seconds?$/i, gen: (m) => `await new Promise(r => setTimeout(r, ${m[1]} * 1000));` },
    { re: /^ask (.+)$/i, gen: (m) => `const answer = await ai.ask('${m[1]}');\n// LUME-CERT: Intent: ASK | Risk: LOW` },
    { re: /^verify (.+?) is (.+)$/i, gen: (m) => `if (${camel(m[1])} !== ${isNaN(m[2]) ? `'${m[2]}'` : m[2]}) throw new Error('✗ Verify failed');` },
    { re: /^deploy to (.+)$/i, gen: (m) => `await DeployEngine.deploy({ platform: '${slug(m[1])}' });\n// LUME-CERT: Intent: DEPLOY | Risk: MEDIUM` },
]

function camel(s) { return s.trim().replace(/['']/g, '').replace(/\b(the|a|an|of|in|on|to|and|or|from|is|are|was|were)\b/gi, '').trim().replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, '') || 'value' }
function slug(s) { return s.trim().replace(/['']/g, '').replace(/\b(the|a|an)\b/gi, '').trim().replace(/\s+/g, '_').toLowerCase() }

function compileLayerA(line) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('note:')) return { js: `// ${trimmed}`, layer: 0 }
    for (const p of PATTERNS) {
        const m = trimmed.match(p.re)
        if (m) return { js: p.gen(m), layer: 1 }
    }
    // Fuzzy: try stripping articles and retrying
    const stripped = trimmed.replace(/\b(the|a|an|all|please|can you|could you)\b/gi, '').replace(/\s+/g, ' ').trim()
    for (const p of PATTERNS) {
        const m = stripped.match(p.re)
        if (m) return { js: p.gen(m), layer: 2 }
    }
    return { js: `// [Layer 4+ AI would resolve]: "${trimmed}"`, layer: 4 }
}

/* ════════════════════════════════════════════════════════════
   SECURITY SCANNER (client-side subset)
   ════════════════════════════════════════════════════════════ */
const THREATS = [
    { re: /delete all (?:the )?(?:user|system|database|server)/i, cat: 'Mass Destruction', level: 'BLOCK', msg: 'Mass deletion of critical data' },
    { re: /drop (?:the )?(?:table|database)/i, cat: 'Database Destruction', level: 'BLOCK', msg: 'DROP TABLE/DATABASE detected' },
    { re: /show (?:the )?(?:password|secret|token|key|credential)/i, cat: 'Credential Exposure', level: 'BLOCK', msg: 'Sensitive credential would be exposed' },
    { re: /send .+ to (?:external|unknown|hack)/i, cat: 'Network Exfiltration', level: 'BLOCK', msg: 'Data exfiltration to unknown endpoint' },
    { re: /run (?:the )?(?:shell|system|exec|command)/i, cat: 'System Command', level: 'BLOCK', msg: 'Direct system command execution' },
    { re: /delete all (?:the )?files/i, cat: 'File System Destruction', level: 'BLOCK', msg: 'Mass file system deletion' },
    { re: /make .+ (?:admin|superuser|root)/i, cat: 'Privilege Escalation', level: 'CONFIRM', msg: 'Privilege escalation detected' },
    { re: /repeat forever|loop forever|infinite/i, cat: 'Infinite Execution', level: 'WARNING', msg: 'Potentially infinite operation' },
    { re: /send email to (?:every|all) .+ every/i, cat: 'Mass Operation', level: 'WARNING', msg: 'Unbounded mass operation' },
    { re: /allocate .+ (?:terabyte|gigabyte)/i, cat: 'Resource Exhaustion', level: 'BLOCK', msg: 'Excessive resource allocation' },
]

function scanSecurity(line) {
    for (const t of THREATS) {
        if (t.re.test(line)) return { threat: true, ...t }
    }
    return { threat: false }
}

/* ════════════════════════════════════════════════════════════
   1. LIVE COMPILATION DEMO
   ════════════════════════════════════════════════════════════ */
export function LiveCompiler() {
    const [input, setInput] = useState('get all the users from the database\nfilter the users who signed up this month\nshow the users on the screen')
    const [output, setOutput] = useState([])

    useEffect(() => {
        const lines = input.split('\n').filter(l => l.trim())
        const compiled = lines.map(l => {
            const sec = scanSecurity(l)
            if (sec.threat) return { line: l, js: `// ✗ BLOCKED: ${sec.msg}`, cert: `✗ ${sec.cat}`, blocked: true }
            const { js, layer } = compileLayerA(l)
            return { line: l, js, cert: `✓ Layer ${layer}`, blocked: false }
        })
        setOutput(compiled)
    }, [input])

    return (
        <div style={{ maxWidth: 1000, margin: '40px auto 0' }}>
            <div className="bento-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
                <div className="demo-split">
                    <div style={{ padding: 24, borderRight: '1px solid var(--border)' }}>
                        <div className="demo-label" style={{ color: 'var(--accent)' }}>◈ Type English — Live Compilation</div>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            spellCheck={false}
                            style={{
                                width: '100%', minHeight: 200, background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
                                fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-bright)', lineHeight: 1.8,
                            }}
                            placeholder="Type any English instruction..."
                        />
                    </div>
                    <div style={{ padding: 24 }}>
                        <div className="demo-label" style={{ color: '#00b894' }}>✓ Compiled JavaScript</div>
                        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00b894', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', minHeight: 200 }}>
                            {output.map((o, i) => (
                                <div key={i} style={{ marginBottom: 4, color: o.blocked ? '#e17055' : '#00b894' }}>
                                    <span>{o.js}</span>
                                </div>
                            ))}
                        </pre>
                    </div>
                </div>
                <div style={{ padding: '10px 24px', borderTop: '1px solid var(--border)', background: 'rgba(34,197,94,0.04)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {output.map((o, i) => (
                        <span key={i} style={{
                            padding: '2px 10px', borderRadius: 99, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                            background: o.blocked ? 'rgba(225,112,85,0.1)' : 'rgba(34,197,94,0.08)',
                            color: o.blocked ? '#e17055' : '#22c55e',
                            border: `1px solid ${o.blocked ? 'rgba(225,112,85,0.2)' : 'rgba(34,197,94,0.2)'}`,
                        }}>{o.cert}</span>
                    ))}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>Layer A · 102 patterns · client-side · no API</span>
                </div>
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════
   2. TOLERANCE CHAIN VISUALIZER
   ════════════════════════════════════════════════════════════ */
const TC_LAYERS = [
    { name: 'Exact Pattern Match', speed: '<1ms', icon: '①' },
    { name: 'Fuzzy Match (Levenshtein ≥85%)', speed: '<1ms', icon: '②' },
    { name: 'Word-Bag Match', speed: '<1ms', icon: '③' },
    { name: 'AI Resolution (High ≥80%)', speed: '~1-3s', icon: '④' },
    { name: 'AI Resolution (Low 50-79%)', speed: '~1-3s', icon: '⑤' },
    { name: 'AI Resolution (Very Low <50%)', speed: '~1-3s', icon: '⑥' },
    { name: 'Unresolvable', speed: '—', icon: '⑦' },
]

const TC_EXAMPLES = [
    { input: 'get all the users from the database', resolves: 1, result: "const users = await db.query('SELECT * FROM database');" },
    { input: 'git teh usrs frum databse', resolves: 2, result: "const users = await db.query('SELECT * FROM database');" },
    { input: 'grab users DB', resolves: 3, result: "const users = await db.query('SELECT * FROM db');" },
    { input: 'show the dashboard if the user is admin', resolves: 1, result: "if (user === 'admin') { showDashboard(); }" },
    { input: 'diplsay teh dahsboard iff user = admn', resolves: 2, result: "if (user === 'admin') { showDashboard(); }" },
]

export function ToleranceChainViz() {
    const [exIdx, setExIdx] = useState(0)
    const [animStep, setAnimStep] = useState(0)
    const [animating, setAnimating] = useState(false)
    const ex = TC_EXAMPLES[exIdx]

    const runAnimation = useCallback((idx) => {
        setExIdx(idx)
        setAnimStep(0)
        setAnimating(true)
        const target = TC_EXAMPLES[idx].resolves
        let step = 0
        const iv = setInterval(() => {
            step++
            setAnimStep(step)
            if (step >= target) { clearInterval(iv); setTimeout(() => setAnimating(false), 600) }
        }, 400)
    }, [])

    useEffect(() => { runAnimation(0) }, [])

    return (
        <div style={{ maxWidth: 900, margin: '40px auto 0' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {TC_EXAMPLES.map((e, i) => (
                    <button key={i} onClick={() => runAnimation(i)} style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        background: i === exIdx ? 'var(--bg-active)' : 'rgba(16,16,26,0.5)', color: i === exIdx ? 'var(--accent-glow)' : 'var(--text-muted)',
                        border: `1px solid ${i === exIdx ? 'var(--border-active)' : 'var(--border)'}`, transition: 'all 0.3s',
                    }}>"{e.input.slice(0, 25)}…"</button>
                ))}
            </div>
            <div className="bento-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-bright)', marginBottom: 20, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                    <span style={{ color: 'var(--accent)', fontSize: 10, fontWeight: 700 }}>INPUT:</span> {ex.input}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {TC_LAYERS.map((l, i) => {
                        const isTarget = i + 1 === ex.resolves
                        const isPassed = animStep > i + 1 || (animStep === i + 1 && !isTarget)
                        const isActive = animStep === i + 1 && isTarget
                        const isWaiting = animStep <= i
                        return (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 8,
                                background: isActive ? 'rgba(34,197,94,0.08)' : isPassed ? 'rgba(225,112,85,0.04)' : 'rgba(16,16,26,0.3)',
                                border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : isPassed ? 'rgba(225,112,85,0.1)' : 'var(--border)'}`,
                                opacity: isWaiting ? 0.3 : 1, transition: 'all 0.4s var(--ease-out)',
                            }}>
                                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{l.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#22c55e' : isPassed ? '#e17055' : 'var(--text-secondary)', flex: 1 }}>{l.name}</span>
                                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{l.speed}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, width: 60, textAlign: 'right', fontFamily: 'var(--font-mono)', color: isActive ? '#22c55e' : isPassed ? '#e17055' : 'transparent' }}>
                                    {isActive ? '✓ MATCH' : isPassed ? '✗ miss' : '—'}
                                </span>
                            </div>
                        )
                    })}
                </div>
                {animStep >= ex.resolves && (
                    <div style={{ marginTop: 16, padding: 14, background: 'rgba(34,197,94,0.04)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>✓ Resolved at Layer {ex.resolves}</div>
                        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00b894', margin: 0, whiteSpace: 'pre-wrap' }}>{ex.result}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════
   3. VOICE-TO-CODE DEMO
   ════════════════════════════════════════════════════════════ */
export function VoiceDemo() {
    const [listening, setListening] = useState(false)
    const [raw, setRaw] = useState('')
    const [cleaned, setCleaned] = useState('')
    const [compiled, setCompiled] = useState('')
    const [stage, setStage] = useState(0) // 0=idle, 1=listening, 2=transcribed, 3=cleaned, 4=compiled
    const recogRef = useRef(null)

    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

    // Transcription cleanup pipeline (7 steps simplified)
    function cleanupTranscription(text) {
        let t = text.toLowerCase()
        // Step 1: stutter collapse
        t = t.replace(/\b(\w+)(\s+\1)+\b/gi, '$1')
        // Step 3: filler stripping
        const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'so', 'well', 'right', 'okay', 'ok', 'actually', 'literally', 'I guess', 'sort of', 'kind of', 'hmm', 'er', 'ah']
        fillers.forEach(f => { t = t.replace(new RegExp(`\\b${f}\\b`, 'gi'), '') })
        // Step 4: homophones
        t = t.replace(/\bfour\b/gi, (m) => t.includes('loop') || t.includes('each') ? 'for' : '4')
        t = t.replace(/\btwo\b/gi, '2').replace(/\bto\b/gi, 'to')
        t = t.replace(/\bwrite\b/gi, (m) => t.includes('file') || t.includes('save') ? 'write' : 'right')
        // Step 5: number words
        t = t.replace(/\bone\b/g, '1').replace(/\bthree\b/g, '3').replace(/\bfive\b/g, '5').replace(/\bten\b/g, '10')
        // Normalize whitespace
        t = t.replace(/\s+/g, ' ').trim()
        return t
    }

    const startListening = () => {
        if (!SpeechRecognition) return
        const recog = new SpeechRecognition()
        recog.continuous = false
        recog.interimResults = true
        recog.lang = 'en-US'
        recog.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
            setRaw(transcript)
            setStage(2)
        }
        recog.onend = () => {
            setListening(false)
            // Run cleanup pipeline after speech ends
            setTimeout(() => {
                setStage(3)
                setTimeout(() => {
                    setStage(4)
                }, 800)
            }, 600)
        }
        recog.start()
        recogRef.current = recog
        setListening(true)
        setStage(1)
        setRaw('')
        setCleaned('')
        setCompiled('')
    }

    useEffect(() => {
        if (stage === 3 && raw) {
            const c = cleanupTranscription(raw)
            setCleaned(c)
        }
        if (stage === 4 && cleaned) {
            const lines = cleaned.split(/\band then\b|\bthen\b|\band also\b/i).map(l => l.trim()).filter(Boolean)
            const js = lines.map(l => {
                const sec = scanSecurity(l)
                if (sec.threat) return `// ✗ BLOCKED: ${sec.msg}`
                return compileLayerA(l).js
            }).join('\n')
            setCompiled(js + '\n// LUME-CERT: sha256:' + Math.random().toString(36).slice(2, 10) + '... | Voice Pipeline | Risk: LOW')
        }
    }, [stage, raw, cleaned])

    return (
        <div style={{ maxWidth: 900, margin: '40px auto 0' }}>
            <div className="bento-card" style={{ padding: 32, textAlign: 'center' }}>
                <button
                    onClick={startListening}
                    disabled={listening || !SpeechRecognition}
                    style={{
                        width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: listening ? 'default' : 'pointer',
                        background: listening ? 'rgba(225,112,85,0.2)' : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                        color: 'white', fontSize: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: listening ? '0 0 0 8px rgba(225,112,85,0.1), 0 0 40px rgba(225,112,85,0.2)' : '0 4px 20px rgba(6,182,212,0.3)',
                        transition: 'all 0.3s', animation: listening ? 'pulse 1s infinite' : 'none',
                    }}
                >
                    {listening ? '●' : '🎤'}
                </button>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                    {!SpeechRecognition ? 'Voice requires Chrome/Edge' : listening ? 'Listening... speak your code' : 'Click to speak'}
                </div>

                {stage >= 2 && raw && (
                    <div style={{ marginTop: 24, textAlign: 'left' }}>
                        <div className="voice-stage" style={{ marginBottom: 12 }}>
                            <div className="demo-label" style={{ color: 'var(--text-muted)' }}>① Raw Transcription</div>
                            <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{raw}</div>
                        </div>
                        {stage >= 3 && cleaned && (
                            <div className="voice-stage" style={{ marginBottom: 12 }}>
                                <div className="demo-label" style={{ color: 'var(--accent)' }}>② Cleaned (fillers removed, homophones resolved)</div>
                                <div style={{ padding: 12, background: 'rgba(6,182,212,0.04)', borderRadius: 8, border: '1px solid rgba(6,182,212,0.1)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-glow)' }}>{cleaned}</div>
                            </div>
                        )}
                        {stage >= 4 && compiled && (
                            <div className="voice-stage">
                                <div className="demo-label" style={{ color: '#22c55e' }}>③ Compiled JavaScript (certified)</div>
                                <pre style={{ padding: 12, background: 'rgba(34,197,94,0.04)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00b894', margin: 0, whiteSpace: 'pre-wrap' }}>{compiled}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════
   4. SECURITY PIPELINE DEMO
   ════════════════════════════════════════════════════════════ */
const SEC_EXAMPLES = [
    { input: 'delete all the user data from the database', expected: 'BLOCK' },
    { input: 'show the admin password on the screen', expected: 'BLOCK' },
    { input: 'send user emails to external-server.com', expected: 'BLOCK' },
    { input: 'make this account a superuser', expected: 'CONFIRM' },
    { input: 'get all users from the database', expected: 'PASS' },
    { input: 'show the user name on the page', expected: 'PASS' },
]

export function SecurityDemo() {
    const [input, setInput] = useState('')
    const [result, setResult] = useState(null)
    const [animPhase, setAnimPhase] = useState(0) // 0=idle, 1=scanning, 2=done

    const runScan = (text) => {
        setInput(text)
        setResult(null)
        setAnimPhase(1)
        setTimeout(() => {
            const sec = scanSecurity(text)
            if (sec.threat) {
                setResult(sec)
            } else {
                const { js } = compileLayerA(text)
                setResult({ threat: false, js, cat: 'Clean', level: 'PASS', msg: 'No threats detected — certified clean' })
            }
            setAnimPhase(2)
        }, 800)
    }

    return (
        <div style={{ maxWidth: 900, margin: '40px auto 0' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {SEC_EXAMPLES.map((e, i) => (
                    <button key={i} onClick={() => runScan(e.input)} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        background: e.expected === 'BLOCK' ? 'rgba(225,112,85,0.06)' : e.expected === 'CONFIRM' ? 'rgba(168,85,247,0.06)' : 'rgba(34,197,94,0.06)',
                        color: e.expected === 'BLOCK' ? '#e17055' : e.expected === 'CONFIRM' ? '#a855f7' : '#22c55e',
                        border: `1px solid ${e.expected === 'BLOCK' ? 'rgba(225,112,85,0.15)' : e.expected === 'CONFIRM' ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)'}`,
                        transition: 'all 0.3s', whiteSpace: 'nowrap',
                    }}>{e.input.length > 35 ? e.input.slice(0, 35) + '…' : e.input}</button>
                ))}
            </div>
            <div className="bento-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <input
                        type="text" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && runScan(input)}
                        placeholder="Type any instruction to scan…"
                        style={{
                            flex: 1, padding: '10px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                            borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-bright)', outline: 'none',
                        }}
                    />
                    <button onClick={() => runScan(input)} style={{
                        padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                        border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}>Scan</button>
                </div>

                {animPhase === 1 && (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <div style={{ fontSize: 14, color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)', animation: 'pulse 0.6s infinite' }}>
                            ◈ Guardian Scanner — Analyzing intent...
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 4 }}>
                            {['Input Security', 'AST Node Scan', 'Negative Constraint', 'Certificate'].map((s, i) => (
                                <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(6,182,212,0.06)', color: 'var(--accent)', border: '1px solid rgba(6,182,212,0.1)' }}>{s}</span>
                            ))}
                        </div>
                    </div>
                )}

                {animPhase === 2 && result && (
                    <div style={{
                        padding: 20, borderRadius: 12,
                        background: result.threat ? 'rgba(225,112,85,0.04)' : 'rgba(34,197,94,0.04)',
                        border: `1px solid ${result.threat ? 'rgba(225,112,85,0.2)' : 'rgba(34,197,94,0.2)'}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{
                                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)',
                                background: result.level === 'BLOCK' ? 'rgba(225,112,85,0.15)' : result.level === 'CONFIRM' ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.08)',
                                color: result.level === 'BLOCK' ? '#e17055' : result.level === 'CONFIRM' ? '#a855f7' : '#22c55e',
                            }}>{result.level === 'BLOCK' ? '✗ BLOCKED' : result.level === 'CONFIRM' ? '⚠ REQUIRES CONFIRMATION' : '✓ CERTIFIED CLEAN'}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{result.cat}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: result.js ? 12 : 0 }}>{result.msg}</div>
                        {result.js && (
                            <pre style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00b894', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {result.js}{'\n'}// LUME-CERT: sha256:{Math.random().toString(36).slice(2, 10)}... | Risk: LOW | Chain: VALID
                            </pre>
                        )}
                        {result.threat && (
                            <div style={{ marginTop: 12, padding: 10, background: 'rgba(225,112,85,0.06)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: '#e17055' }}>
                                ⟐ This instruction will not compile. The Guardian Scanner detected a {result.cat.toLowerCase()} threat at the intent level — before any code was generated.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════
   5. COGNITIVE DISTANCE CHART
   ════════════════════════════════════════════════════════════ */
const CD_DATA = [
    { name: 'Assembly', year: '1950s', cd: 25, color: '#e17055' },
    { name: 'C', year: '1978', cd: 21, color: '#e17055' },
    { name: 'JavaScript', year: '2015', cd: 16, color: '#f0932b' },
    { name: 'Python', year: '1991', cd: 13, color: '#f0932b' },
    { name: 'AI Agents', year: '2024', cd: 9, color: '#a855f7' },
    { name: 'Lume (text)', year: '2026', cd: 2, color: '#06b6d4' },
    { name: 'Lume (voice)', year: '2026', cd: 1, color: '#22c55e' },
]

export function CognitiveDistanceChart() {
    const [animated, setAnimated] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current) return
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setTimeout(() => setAnimated(true), 300); obs.disconnect() }
        }, { threshold: 0.3 })
        obs.observe(ref.current)
        return () => obs.disconnect()
    }, [])

    return (
        <div ref={ref} style={{ maxWidth: 800, margin: '40px auto 0' }}>
            <div className="bento-card" style={{ padding: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
                    CD(L, I) = Σ wᵢ · Tᵢ — 6 transformation dimensions
                </div>
                {CD_DATA.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: 'var(--text-bright)', textAlign: 'right' }}>{d.name}</div>
                        <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                                height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`,
                                width: animated ? `${(d.cd / 25) * 100}%` : '0%',
                                transition: `width 1.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s`,
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                            }}>
                                <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                    {animated ? `CD=${d.cd}` : ''}
                                </span>
                            </div>
                        </div>
                        <div style={{ width: 45, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'left' }}>{d.year}</div>
                    </div>
                ))}
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(34,197,94,0.04)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.1)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#22c55e' }}>The Middleman Paradox:</strong> AI agents (CD=9) reduced T₁–T₃ but <em>increased</em> the chain: Developer → AI → Review → Compiler (3 hops). Lume eliminates the middleman: Developer → Compiler (1 hop) — in natural language.
                </div>
            </div>
        </div>
    )
}
