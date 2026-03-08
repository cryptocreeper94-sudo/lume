import { useState, useCallback, useRef, useEffect } from 'react'

/* ── Pattern Library (in-browser subset) ── */
const PATTERNS = [
    { match: /^(?:get|fetch|retrieve|grab|pull|find|load|read|access|obtain|look up)\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(.+))?$/i, type: 'VariableAccess', extract: (m) => `VariableAccess { target: "${slug(m[1])}"${m[2] ? `, source: "${slug(m[2])}"` : ''} }` },
    { match: /^(?:show|display|render|print|output|log|present)\s+(?:the\s+)?(.+?)(?:\s+(?:on|in|to)\s+(?:the\s+)?(.+))?$/i, type: 'ShowStatement', extract: (m) => `ShowStatement { value: "${slug(m[1])}"${m[2] ? `, target: "${slug(m[2])}"` : ''} }` },
    { match: /^(?:save|store|persist|write|keep|insert|record)\s+(?:the\s+)?(.+?)(?:\s+(?:to|in|into)\s+(?:the\s+)?(.+))?$/i, type: 'StoreOperation', extract: (m) => `StoreOperation { value: "${slug(m[1])}"${m[2] ? `, target: "${slug(m[2])}"` : ''} }` },
    { match: /^(?:delete|remove|destroy|erase|clear|wipe|purge|drop)\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(.+))?$/i, type: 'DeleteOperation', extract: (m) => `DeleteOperation { target: "${slug(m[1])}"${m[2] ? `, source: "${slug(m[2])}"` : ''} }` },
    { match: /^(?:create|make|build|generate|add|set up)\s+(?:a\s+)?(?:new\s+)?(.+?)(?:\s+with\s+(.+))?$/i, type: 'CreateOperation', extract: (m) => `CreateOperation { target: "${slug(m[1])}"${m[2] ? `, fields: [${m[2].split(/,\s*/).map(f => `"${slug(f)}"`).join(', ')}]` : ''} }` },
    { match: /^(?:update|modify|change|edit|set|adjust|patch)\s+(?:the\s+)?(.+?)(?:\s+to\s+(.+))?$/i, type: 'UpdateOperation', extract: (m) => `UpdateOperation { target: "${slug(m[1])}"${m[2] ? `, value: "${m[2]}"` : ''} }` },
    { match: /^(?:send|fire|dispatch|post|push|deliver|broadcast)\s+(?:an?\s+)?(.+?)(?:\s+to\s+(.+))?$/i, type: 'SendOperation', extract: (m) => `SendOperation { payload: "${slug(m[1])}"${m[2] ? `, target: "${m[2]}"` : ''} }` },
    { match: /^(?:repeat|loop|do)\s+(?:this\s+)?(\d+|[a-z]+)\s*times?$/i, type: 'RepeatLoop', extract: (m) => `RepeatLoop { count: ${parseInt(m[1]) || m[1]} }` },
    { match: /^(?:for each|for every|loop (?:through|over))\s+(.+?)(?:\s+in\s+(?:the\s+)?(.+))?$/i, type: 'ForEachLoop', extract: (m) => `ForEachLoop { item: "${slug(m[1])}"${m[2] ? `, collection: "${slug(m[2])}"` : ''} }` },
    { match: /^(?:while|as long as)\s+(.+)$/i, type: 'WhileLoop', extract: (m) => `WhileLoop { condition: "${m[1]}" }` },
    { match: /^(?:if|when|check (?:if|whether))\s+(.+?)(?:,?\s*(?:then\s+)?(.+))?$/i, type: 'IfStatement', extract: (m) => `IfStatement { condition: "${m[1]}"${m[2] ? `, body: "${m[2]}"` : ''} }` },
    { match: /^(?:wait|pause|delay|sleep|hold)\s+(?:for\s+)?(\d+|[a-z]+)\s*(seconds?|milliseconds?|ms|minutes?|mins?|s)$/i, type: 'DelayStatement', extract: (m) => `DelayStatement { duration: ${m[1]}${m[2]} }` },
    { match: /^(?:set|let|define|assign)\s+(?:the\s+)?(.+?)\s+(?:to|as|=|equals?)\s+(.+)$/i, type: 'VariableDeclaration', extract: (m) => `VariableDeclaration { name: "${slug(m[1])}", value: "${m[2]}" }` },
    { match: /^(?:add|plus)\s+(.+?)\s+(?:to|and)\s+(.+)$/i, type: 'BinaryExpression', extract: (m) => `BinaryExpression { op: "+", left: "${m[2].trim()}", right: "${m[1].trim()}" }` },
    { match: /^(?:subtract|minus|take)\s+(.+?)\s+from\s+(.+)$/i, type: 'BinaryExpression', extract: (m) => `BinaryExpression { op: "-", left: "${m[2].trim()}", right: "${m[1].trim()}" }` },
    { match: /^(?:multiply)\s+(.+?)\s+(?:by|times)\s+(.+)$/i, type: 'BinaryExpression', extract: (m) => `BinaryExpression { op: "*", left: "${m[1].trim()}", right: "${m[2].trim()}" }` },
    { match: /^(?:monitor|track|watch|observe)\s+(?:this\s+)?(.*)$/i, type: 'MonitorBlock', extract: (m) => `MonitorBlock { target: "${m[1]?.trim() || 'current'}" }` },
    { match: /^(?:ask|query|tell)\s+(?:the\s+)?(?:ai|gpt|model|llm|assistant)\s+(?:to\s+)?(.+)$/i, type: 'AskExpression', extract: (m) => `AskExpression { prompt: "${m[1]}" }` },
    // ── Phase 14B patterns ──
    { match: /^(?:sort)\s+(?:the\s+)?(.+?)(?:\s+(?:by\s+(.+?)\s+))?(ascending|descending|asc|desc)?$/i, type: 'SortOperation', extract: (m) => `SortOperation { target: "${slug(m[1])}"${m[2] ? `, key: "${slug(m[2])}"` : ''}, dir: "${(m[3] || '').match(/desc/) ? 'desc' : 'asc'}" }` },
    { match: /^(?:return|give back|output|yield|result is)\s+(.+)$/i, type: 'ReturnStatement', extract: (m) => `ReturnStatement { value: "${m[1]}" }` },
    { match: /^(?:toggle)\s+(?:the\s+)?(.+?)(?:\s+(?:on|off))?$/i, type: 'ToggleOperation', extract: (m) => `ToggleOperation { target: "${slug(m[1])}" }` },
    { match: /^(?:increment|increase|bump)\s+(?:the\s+)?(.+?)(?:\s+by\s+(\d+))?$/i, type: 'IncrementOperation', extract: (m) => `IncrementOperation { target: "${slug(m[1])}", amount: ${m[2] || 1} }` },
    { match: /^(?:decrement|decrease|reduce)\s+(?:the\s+)?(.+?)(?:\s+by\s+(\d+))?$/i, type: 'DecrementOperation', extract: (m) => `DecrementOperation { target: "${slug(m[1])}", amount: ${m[2] || 1} }` },
    { match: /^(?:redirect|navigate|go)\s+(?:the\s+user\s+)?to\s+(.+)$/i, type: 'NavigateOperation', extract: (m) => `NavigateOperation { target: "${m[1].replace(/["']/g, '')}" }` },
    { match: /^(?:reset|clear|empty|initialize|init)\s+(?:the\s+)?(.+)$/i, type: 'ResetOperation', extract: (m) => `ResetOperation { target: "${slug(m[1])}" }` },
    { match: /^(?:swap|exchange|switch)\s+(?:the\s+)?(.+?)\s+(?:and|with)\s+(?:the\s+)?(.+)$/i, type: 'SwapOperation', extract: (m) => `SwapOperation { left: "${slug(m[1])}", right: "${slug(m[2])}" }` },
    { match: /^(?:trim|strip|clean)\s+(?:the\s+)?(.+?)(?:\s+(?:whitespace|spaces))?$/i, type: 'TrimOperation', extract: (m) => `CallExpression { callee: "trim", object: "${slug(m[1])}" }` },
    { match: /^(?:from|range)\s+(\d+)\s+to\s+(\d+)$/i, type: 'RangeExpression', extract: (m) => `RangeExpression { start: ${m[1]}, end: ${m[2]} }` },
    { match: /^(?:throw|raise)\s+(?:an?\s+)?(?:error|exception)\s*(?::\s*|with\s+(?:message\s+)?)?(.+)?$/i, type: 'ThrowStatement', extract: (m) => `ThrowStatement { message: "${m[1] || 'An error occurred'}" }` },
    { match: /^(?:alert|notify|popup|toast)\s+(.+)$/i, type: 'AlertStatement', extract: (m) => `ShowStatement { value: "${m[1]}", target: "alert" }` },
    { match: /^(?:try to|attempt to)\s+(.+?)(?:\s+or\s+(?:fail|error)\s+(?:with\s+)?(.+))?$/i, type: 'TryBlock', extract: (m) => `TryBlock { action: "${m[1]}"${m[2] ? `, fallback: "${m[2]}"` : ''} }` },
]

function slug(s) {
    return (s || '').trim().replace(/^(?:the|a|an|my|our|their)\s+/i, '').replace(/[''`]/g, '').replace(/\s+/g, '_').toLowerCase()
}

function compileLine(line) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('mode:')) {
        return { type: 'skip', text: trimmed }
    }
    for (const p of PATTERNS) {
        const m = trimmed.match(p.match)
        if (m) return { type: 'match', node: p.extract(m), nodeType: p.type, text: trimmed }
    }
    return { type: 'unresolved', text: trimmed }
}

/* ── Example Programs ── */
const EXAMPLES = {
    'Hello World': 'mode: english\n\n# My first Lume program\nget the user name\nshow the user name on screen\nsave the user name to the database',
    'Todo App': 'mode: english\n\n# Todo Application\ncreate a new task with title, priority\nget all tasks from the database\nfor each task in the tasks\n  show the task on screen\ndelete the completed tasks',
    'Math Operations': 'mode: english\n\n# Math demo\nset the price to 100\nadd 15 to the price\nsubtract 10 from the total\nmultiply the quantity by 3\nshow the result',
    'Data Pipeline': 'mode: english\n\n# Sort, filter, transform\nget all users from the database\nsort the users by name ascending\nfor each user in the active users\n  increment the login count\n  show the user on dashboard\nreturn the sorted users',
    'UI Actions': 'mode: english\n\n# Interactive UI\ntoggle the dark mode\nreset the search form\nswap the sidebar and main panel\nredirect the user to /dashboard\nwait 2 seconds\nshow the welcome message on screen\nalert the session has expired',
    'Error Handling': 'mode: english\n\n# Robust code\ntry to fetch the data from the api\n  or fail with connection timeout\nif the response is empty\n  throw an error: no data received\nrepeat 3 times\n  save the backup to storage',
}

export default function PlaygroundPage() {
    const [code, setCode] = useState(EXAMPLES['Hello World'])
    const [output, setOutput] = useState([])
    const [activeExample, setActiveExample] = useState('Hello World')
    const textareaRef = useRef(null)

    const compileCode = useCallback(() => {
        const lines = code.split('\n')
        const results = lines.map((line, i) => {
            const result = compileLine(line)
            return { ...result, lineNum: i + 1 }
        })
        setOutput(results)
    }, [code])

    useEffect(() => { compileCode() }, [compileCode])

    const loadExample = (name) => {
        setCode(EXAMPLES[name])
        setActiveExample(name)
    }

    const stats = {
        total: output.filter(r => r.type !== 'skip').length,
        matched: output.filter(r => r.type === 'match').length,
        unresolved: output.filter(r => r.type === 'unresolved').length,
    }

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80 }}>
            <div className="orb orb-1" /><div className="orb orb-3" />

            {/* Header */}
            <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto 32px' }}>
                <span className="section-label">Interactive Compiler</span>
                <h1 className="section-title" style={{ marginTop: 12 }}>
                    Lume <span className="gradient-wave-text">Playground</span>
                </h1>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 600, marginTop: 8, lineHeight: 1.6 }}>
                    Type English — watch it compile. Every line is pattern-matched to an AST node in real time. No AI needed.
                </p>
            </div>

            {/* Example Selector */}
            <div style={{ maxWidth: 1400, margin: '0 auto 16px', padding: '0 24px' }}>
                <div style={{
                    display: 'flex', gap: 6, flexWrap: 'wrap',
                    background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 6,
                }}>
                    {Object.keys(EXAMPLES).map(name => (
                        <button
                            id={`example-${name.toLowerCase().replace(/\s+/g, '-')}`}
                            key={name}
                            onClick={() => loadExample(name)}
                            style={{
                                padding: '8px 16px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)',
                                background: activeExample === name ? 'var(--bg-active)' : 'transparent',
                                border: activeExample === name ? '1px solid var(--border-active)' : '1px solid transparent',
                                borderRadius: 'var(--radius-sm)',
                                color: activeExample === name ? 'var(--accent-glow)' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.15s ease',
                            }}
                        >{name}</button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div style={{ maxWidth: 1400, margin: '0 auto 16px', padding: '0 24px' }}>
                <div className="bento-card" style={{
                    padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', gap: 24, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Lines: <span style={{ color: 'var(--text-bright)' }}>{output.length}</span></span>
                        <span style={{ color: 'var(--text-muted)' }}>Resolved: <span style={{ color: '#00b894' }}>{stats.matched}</span></span>
                        {stats.unresolved > 0 && <span style={{ color: 'var(--text-muted)' }}>Unresolved: <span style={{ color: '#fdcb6e' }}>{stats.unresolved}</span></span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Lume v0.8.0 · Pattern Library · {PATTERNS.length} patterns loaded
                    </div>
                </div>
            </div>

            {/* Split Panel */}
            <div style={{
                maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            }}>
                {/* LEFT: Editor */}
                <div className="bento-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-bright)', textTransform: 'uppercase', letterSpacing: 1 }}>✦ Editor</span>
                        <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>English Mode</span>
                    </div>
                    <div style={{ position: 'relative', flex: 1, minHeight: 500 }}>
                        {/* Line numbers */}
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: 48,
                            background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--glass-border)',
                            padding: '16px 0', fontFamily: 'var(--font-mono)', fontSize: 13,
                            lineHeight: '1.6', color: 'var(--text-muted)', textAlign: 'right',
                            pointerEvents: 'none', userSelect: 'none',
                        }}>
                            {code.split('\n').map((_, i) => (
                                <div key={i} style={{ paddingRight: 12 }}>{i + 1}</div>
                            ))}
                        </div>
                        <textarea
                            id="playground-editor"
                            ref={textareaRef}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            spellCheck="false"
                            style={{
                                width: '100%', height: '100%', minHeight: 500,
                                background: 'transparent', border: 'none', outline: 'none',
                                color: 'var(--text-bright)', fontFamily: 'var(--font-mono)', fontSize: 13,
                                lineHeight: '1.6', padding: '16px 16px 16px 60px',
                                resize: 'none', caretColor: 'var(--accent)',
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT: Compiled Output */}
                <div className="bento-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-bright)', textTransform: 'uppercase', letterSpacing: 1 }}>✦ Compiled AST</span>
                        <span style={{ fontSize: 11, color: '#00b894', fontFamily: 'var(--font-mono)' }}>
                            {stats.matched}/{stats.total} resolved
                        </span>
                    </div>
                    <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', minHeight: 500 }}>
                        {output.map((r, i) => {
                            if (r.type === 'skip' && !r.text) {
                                return <div key={i} style={{ height: 21 }} />
                            }
                            if (r.type === 'skip') {
                                return (
                                    <div key={i} style={{
                                        fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: '1.6',
                                        color: 'var(--text-muted)', fontStyle: 'italic',
                                    }}>
                                        <span style={{ color: 'var(--text-muted)', opacity: 0.4, marginRight: 8, display: 'inline-block', width: 32, textAlign: 'right' }}>{r.lineNum}</span>
                                        {r.text.startsWith('#') ? <span style={{ color: 'rgba(116,185,255,0.6)' }}>{r.text}</span>
                                            : r.text.startsWith('mode:') ? <span style={{ color: 'var(--accent)', opacity: 0.7 }}>{r.text}</span>
                                                : <span>{r.text}</span>}
                                    </div>
                                )
                            }
                            if (r.type === 'match') {
                                return (
                                    <div key={i} style={{
                                        fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: '1.6',
                                        marginBottom: 2,
                                    }}>
                                        <span style={{ color: 'var(--text-muted)', opacity: 0.4, marginRight: 8, display: 'inline-block', width: 32, textAlign: 'right' }}>{r.lineNum}</span>
                                        <span style={{ color: '#00b894' }}>✓ </span>
                                        <span style={{ color: 'var(--accent-glow)' }}>{r.nodeType}</span>
                                        <span style={{ color: 'var(--text-muted)' }}> → </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{r.node}</span>
                                    </div>
                                )
                            }
                            return (
                                <div key={i} style={{
                                    fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: '1.6',
                                    marginBottom: 2,
                                }}>
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.4, marginRight: 8, display: 'inline-block', width: 32, textAlign: 'right' }}>{r.lineNum}</span>
                                    <span style={{ color: '#fdcb6e' }}>⚠ </span>
                                    <span style={{ color: '#fdcb6e', opacity: 0.8 }}>Unresolved: </span>
                                    <span style={{ color: 'var(--text-muted)' }}>"{r.text}"</span>
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.5, fontSize: 11 }}> → would use Layer B (AI)</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div style={{ maxWidth: 1400, margin: '-40px auto 80px', padding: '0 24px' }}>
                <div className="bento-card" style={{
                    padding: '16px 24px',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
                    fontSize: 12, color: 'var(--text-muted)',
                }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>How It Works</div>
                        Each line is matched against {PATTERNS.length} deterministic patterns. No AI is used — this is Layer A (Pattern Library) running entirely in your browser.
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Layer A vs Layer B</div>
                        <span style={{ color: '#00b894' }}>✓ Green</span> = Pattern matched (deterministic). <span style={{ color: '#fdcb6e' }}>⚠ Yellow</span> = Would use AI in full compiler (Layer B).
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Try It</div>
                        Type any English sentence. Pattern tips: "get X", "show X", "save X to Y", "create a new X", "if X then Y", "repeat N times".
                    </div>
                </div>
            </div>
        </div>
    )
}
