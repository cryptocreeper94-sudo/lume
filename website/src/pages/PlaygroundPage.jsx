import { useState, useCallback, useRef, useEffect } from 'react'
import { executeSandbox, saveProgram, loadPrograms, deleteProgram, exportAsLume } from '../utils/sandboxEngine'
import { compileCode, runCode, explainCode } from '../api/compileApi'

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

/* ── Examples ── */
const EXAMPLES = {
    'Hello World': 'mode: english\n\n# My first Lume program\nset the greeting to Hello World\nshow the greeting on screen\nsave the greeting to the database',
    'Todo App': 'mode: english\n\n# Todo Application\ncreate a new task with title, priority\nget all tasks from the database\nfor each task in the tasks\n  show the task on screen\ndelete the completed tasks',
    'Math Engine': 'mode: english\n\n# Math demo\nset the price to 100\nadd 15 to the price\nsubtract 10 from the total\nmultiply the quantity by 3\nshow the result',
    'Data Pipeline': 'mode: english\n\n# Sort, filter, transform\nget all users from the database\nsort the users by name ascending\nfor each user in the active users\n  increment the login count\n  show the user on dashboard\nreturn the sorted users',
    'UI Actions': 'mode: english\n\n# Interactive UI\ntoggle the dark mode\nreset the search form\nswap the sidebar and main panel\nredirect the user to /dashboard\nwait 2 seconds\nshow the welcome message on screen\nalert the session has expired',
    'Error Handling': 'mode: english\n\n# Robust code\ntry to fetch the data from the api\n  or fail with connection timeout\nif the response is empty\n  throw an error: no data received\nrepeat 3 times\n  save the backup to storage',
    'AI Integration': 'mode: english\n\n# AI-powered features\nget the user question\nask the ai to summarize the report\nshow the result on screen\nset the sentiment to positive\nif the sentiment is negative\n  alert please review this content',
    'E-Commerce': 'mode: english\n\n# Shopping cart\ncreate a new cart with items, total\nget the product from the catalog\nadd the product to the cart\nset the total to 0\nfor each item in the cart\n  increment the total by 1\nshow the total on screen\nsend the order to payment gateway',
    'Standard Mode': '// Standard Lume syntax\nlet name = "Developer"\nlet score = 100\n\nshow "Welcome, {name}!"\nshow "Your score: {score}"\n\nto greet(person)\n  show "Hello, {person}!"\nend\n\ngreet("World")',
}

/* ── Node Type Colors ── */
const NODE_COLORS = {
    ShowStatement: '#00b894',
    VariableDeclaration: '#6c5ce7',
    VariableAccess: '#0984e3',
    CreateOperation: '#00cec9',
    StoreOperation: '#fdcb6e',
    DeleteOperation: '#d63031',
    UpdateOperation: '#e17055',
    SendOperation: '#74b9ff',
    BinaryExpression: '#a29bfe',
    IncrementOperation: '#55efc4',
    DecrementOperation: '#fab1a0',
    RepeatLoop: '#fd79a8',
    ForEachLoop: '#fd79a8',
    WhileLoop: '#fd79a8',
    IfStatement: '#ffeaa7',
    ReturnStatement: '#dfe6e9',
    AskExpression: '#00b894',
    NavigateOperation: '#74b9ff',
    ToggleOperation: '#e17055',
    ResetOperation: '#636e72',
    SwapOperation: '#b2bec3',
    SortOperation: '#81ecec',
    DelayStatement: '#636e72',
    MonitorBlock: '#00cec9',
    ThrowStatement: '#d63031',
    TryBlock: '#fdcb6e',
    AlertStatement: '#ffeaa7',
}

export default function PlaygroundPage() {
    const [code, setCode] = useState(EXAMPLES['Hello World'])
    const [output, setOutput] = useState([])
    const [consoleOutput, setConsoleOutput] = useState([])
    const [activeExample, setActiveExample] = useState('Hello World')
    const [sandboxMode, setSandboxMode] = useState(true) // true=sandbox, false=live
    const [status, setStatus] = useState('idle') // idle | compiling | running | success | error
    const [executionTime, setExecutionTime] = useState(null)
    const [activeTab, setActiveTab] = useState('ast') // ast | js | explain
    const [jsOutput, setJsOutput] = useState('')
    const [explanation, setExplanation] = useState(null)
    const [savedPrograms, setSavedPrograms] = useState([])
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showLoadModal, setShowLoadModal] = useState(false)
    const [saveName, setSaveName] = useState('')
    const [variables, setVariables] = useState({})
    const [isRecording, setIsRecording] = useState(false)
    const [voiceSupported, setVoiceSupported] = useState(false)
    const textareaRef = useRef(null)
    const recognitionRef = useRef(null)

    // Load saved programs
    useEffect(() => { setSavedPrograms(loadPrograms()) }, [])

    // Check Web Speech API support
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            setVoiceSupported(true)
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onresult = (event) => {
                let finalTranscript = ''
                let interimTranscript = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript
                    } else {
                        interimTranscript += transcript
                    }
                }
                if (finalTranscript) {
                    // Process through voice cleanup (client-side subset)
                    const cleaned = finalTranscript
                        .replace(/\b(\w+)(\s+\1)+\b/gi, '$1')  // collapse repeats
                        .replace(/\b(?:um|uh|like|you know|basically|actually)\b[,.]?\s*/gi, '') // strip fillers
                        .replace(/\b(?:period|full stop)\b/gi, '.')
                        .replace(/\bnew line\b/gi, '\n')
                        .replace(/\bcomma\b/gi, ',')
                        .replace(/\s+([.,;:!?])/g, '$1')
                        .trim()
                    if (cleaned) {
                        setCode(prev => prev + (prev.endsWith('\n') || !prev ? '' : '\n') + cleaned)
                        setConsoleOutput(prev => [...prev, { type: 'info', text: `🎤 ${cleaned}` }])
                    }
                }
            }

            recognition.onerror = (event) => {
                if (event.error !== 'no-speech') {
                    setConsoleOutput(prev => [...prev, { type: 'error', text: `🎤 Voice error: ${event.error}` }])
                }
                setIsRecording(false)
            }

            recognition.onend = () => {
                setIsRecording(false)
            }

            recognitionRef.current = recognition
        }
    }, [])

    const toggleRecording = useCallback(() => {
        if (!recognitionRef.current) return
        if (isRecording) {
            recognitionRef.current.stop()
            setIsRecording(false)
            setConsoleOutput(prev => [...prev, { type: 'info', text: '🎤 Voice input stopped' }])
        } else {
            recognitionRef.current.start()
            setIsRecording(true)
            setConsoleOutput(prev => [...prev, { type: 'info', text: '🎤 Listening... speak your Lume code' }])
        }
    }, [isRecording])

    // Client-side compile on every keystroke
    const compileLocal = useCallback(() => {
        const lines = code.split('\n')
        const results = lines.map((line, i) => {
            const result = compileLine(line)
            return { ...result, lineNum: i + 1 }
        })
        setOutput(results)
    }, [code])

    useEffect(() => { compileLocal() }, [compileLocal])

    const stats = {
        total: output.filter(r => r.type !== 'skip').length,
        matched: output.filter(r => r.type === 'match').length,
        unresolved: output.filter(r => r.type === 'unresolved').length,
    }

    // ── Run (Sandbox or Live) ──
    const handleRun = useCallback(async () => {
        setStatus('running')
        setConsoleOutput([])
        setVariables({})
        setActiveTab('ast')

        if (sandboxMode) {
            // Client-side execution
            const result = executeSandbox(output)
            setConsoleOutput(result.output)
            setVariables(result.variables)
            setExecutionTime(result.executionTime)
            setStatus(result.errors.length > 0 ? 'error' : 'success')
            if (result.errors.length > 0) {
                setConsoleOutput(prev => [...prev, ...result.errors.map(e => ({ type: 'error', text: `Line ${e.line}: ${e.message}` }))])
            }
        } else {
            // Live backend execution
            try {
                const result = await runCode(code)
                setConsoleOutput(result.output || [])
                setJsOutput(result.js || '')
                setExecutionTime(result.executionTime)
                setStatus(result.errors?.length > 0 ? 'error' : 'success')
                if (result.errors?.length > 0) {
                    setConsoleOutput(prev => [...prev, ...result.errors.map(e => ({ type: 'error', text: e.message }))])
                }
            } catch (err) {
                setConsoleOutput([{ type: 'error', text: err.message }])
                setStatus('error')
            }
        }
    }, [sandboxMode, code, output])

    // ── Build (compile only) ──
    const handleBuild = useCallback(async () => {
        setStatus('compiling')
        try {
            if (sandboxMode) {
                // Client-side — just show the AST
                setActiveTab('ast')
                setStatus('success')
                setExecutionTime(0)
            } else {
                const result = await compileCode(code)
                setJsOutput(result.js || '')
                setActiveTab('js')
                setStatus('success')
            }
        } catch (err) {
            setConsoleOutput([{ type: 'error', text: err.message }])
            setStatus('error')
        }
    }, [sandboxMode, code])

    // ── Explain ──
    const handleExplain = useCallback(async () => {
        setStatus('compiling')
        try {
            const result = await explainCode(code)
            setExplanation(result)
            setActiveTab('explain')
            setStatus('success')
        } catch (err) {
            setConsoleOutput([{ type: 'error', text: `Explain: ${err.message}` }])
            setStatus('error')
        }
    }, [code])

    // ── Save/Load ──
    const handleSave = () => {
        if (!saveName.trim()) return
        saveProgram(saveName, code)
        setSavedPrograms(loadPrograms())
        setShowSaveModal(false)
        setSaveName('')
        setConsoleOutput(prev => [...prev, { type: 'info', text: `✓ Saved "${saveName}"` }])
    }

    const handleLoad = (program) => {
        setCode(program.source)
        setActiveExample('')
        setShowLoadModal(false)
        setConsoleOutput([{ type: 'info', text: `Loaded "${program.name}"` }])
    }

    const handleDelete = (id) => {
        deleteProgram(id)
        setSavedPrograms(loadPrograms())
    }

    const loadExample = (name) => {
        setCode(EXAMPLES[name])
        setActiveExample(name)
        setConsoleOutput([])
        setStatus('idle')
    }

    const handleKeyDown = (e) => {
        // Ctrl+Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleRun()
        }
        // Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault()
            const start = e.target.selectionStart
            const end = e.target.selectionEnd
            setCode(code.substring(0, start) + '  ' + code.substring(end))
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 2
            }, 0)
        }
    }

    const modeLabel = code.trim().startsWith('mode:') ? 'English' : 'Standard'

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80 }}>
            <div className="orb orb-1" /><div className="orb orb-3" />

            {/* ── Header ── */}
            <div style={{ padding: '0 24px', maxWidth: 1440, margin: '0 auto 24px' }}>
                <span className="section-label">Development Environment</span>
                <h1 className="section-title" style={{ marginTop: 12 }}>
                    Lume <span className="gradient-wave-text">Sandbox</span>
                </h1>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 700, marginTop: 8, lineHeight: 1.6 }}>
                    Write code, compile, and execute — all in your browser. Switch between Sandbox mode
                    (instant, client-side) and Live mode (full compiler on server) when you're ready.
                </p>
            </div>

            {/* ── Example Pills ── */}
            <div style={{ maxWidth: 1440, margin: '0 auto 12px', padding: '0 24px' }}>
                <div style={{
                    display: 'flex', gap: 4, flexWrap: 'wrap',
                    background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 4,
                }}>
                    {Object.keys(EXAMPLES).map(name => (
                        <button
                            id={`example-${name.toLowerCase().replace(/\s+/g, '-')}`}
                            key={name}
                            onClick={() => loadExample(name)}
                            style={{
                                padding: '6px 12px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
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

            {/* ── Toolbar ── */}
            <div style={{ maxWidth: 1440, margin: '0 auto 12px', padding: '0 24px' }}>
                <div className="bento-card" style={{
                    padding: '8px 16px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 8,
                }}>
                    {/* Left: Actions */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button id="btn-run" onClick={handleRun} style={btnStyle('#00b894', status === 'running')}>
                            {status === 'running' ? '⏳' : '▶'} Run
                        </button>
                        <button id="btn-build" onClick={handleBuild} style={btnStyle('#6c5ce7', status === 'compiling')}>
                            🔨 Build
                        </button>
                        <button id="btn-explain" onClick={handleExplain} style={btnStyle('#0984e3', false)} disabled={sandboxMode}>
                            📖 Explain
                        </button>
                        <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 4px' }} />
                        <button onClick={() => setShowSaveModal(true)} style={btnStyle('#636e72', false)}>💾 Save</button>
                        <button onClick={() => setShowLoadModal(true)} style={btnStyle('#636e72', false)}>📂 Open</button>
                        <button onClick={() => exportAsLume(activeExample || 'program', code)} style={btnStyle('#636e72', false)}>⬇ Export</button>
                        {voiceSupported && (
                            <button
                                id="btn-mic"
                                onClick={toggleRecording}
                                style={{
                                    ...btnStyle(isRecording ? '#d63031' : '#00b894', isRecording),
                                    animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                    position: 'relative',
                                }}
                            >
                                🎤 {isRecording ? 'Stop' : 'Voice'}
                            </button>
                        )}
                    </div>

                    {/* Center: Status */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Lines: <span style={{ color: 'var(--text-bright)' }}>{output.length}</span></span>
                        <span style={{ color: 'var(--text-muted)' }}>Resolved: <span style={{ color: '#00b894' }}>{stats.matched}</span></span>
                        {stats.unresolved > 0 && <span style={{ color: 'var(--text-muted)' }}>Unresolved: <span style={{ color: '#fdcb6e' }}>{stats.unresolved}</span></span>}
                        {executionTime !== null && <span style={{ color: 'var(--text-muted)' }}>⏱ <span style={{ color: 'var(--text-bright)' }}>{executionTime}ms</span></span>}
                        <StatusBadge status={status} />
                    </div>

                    {/* Right: Mode Toggle */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {modeLabel} Mode · {PATTERNS.length} patterns
                        </span>
                        <button
                            id="btn-mode-toggle"
                            onClick={() => setSandboxMode(!sandboxMode)}
                            style={{
                                padding: '6px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                                background: sandboxMode
                                    ? 'linear-gradient(135deg, rgba(0,184,148,0.2), rgba(0,184,148,0.05))'
                                    : 'linear-gradient(135deg, rgba(214,48,49,0.2), rgba(214,48,49,0.05))',
                                border: sandboxMode ? '1px solid rgba(0,184,148,0.4)' : '1px solid rgba(214,48,49,0.4)',
                                borderRadius: 'var(--radius-sm)',
                                color: sandboxMode ? '#00b894' : '#d63031',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}
                        >
                            {sandboxMode ? '🧪 Sandbox' : '🚀 Live'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Split Layout ── */}
            <div style={{
                maxWidth: 1440, margin: '0 auto', padding: '0 24px 80px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                minHeight: 600,
            }}>
                {/* LEFT: Editor */}
                <div className="bento-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-bright)', textTransform: 'uppercase', letterSpacing: 1 }}>
                            ✦ Editor
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                            {modeLabel} Mode · Ctrl+Enter to run
                        </span>
                    </div>
                    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: 44,
                            background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--glass-border)',
                            padding: '12px 0', fontFamily: 'var(--font-mono)', fontSize: 12,
                            lineHeight: '1.65', color: 'var(--text-muted)', textAlign: 'right',
                            pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
                        }}>
                            {code.split('\n').map((_, i) => (
                                <div key={i} style={{ paddingRight: 8 }}>{i + 1}</div>
                            ))}
                        </div>
                        <textarea
                            id="playground-editor"
                            ref={textareaRef}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck="false"
                            style={{
                                width: '100%', height: '100%',
                                background: 'transparent', border: 'none', outline: 'none',
                                color: 'var(--text-bright)', fontFamily: 'var(--font-mono)', fontSize: 13,
                                lineHeight: '1.65', padding: '12px 12px 12px 56px',
                                resize: 'none', caretColor: 'var(--accent)',
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT: AST / JS / Explain + Console */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Top Right: AST / JS / Explain tabs */}
                    <div className="bento-card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            padding: '0 16px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', gap: 0,
                        }}>
                            {['ast', 'js', 'explain'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '10px 16px', fontSize: 11, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: 1,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: activeTab === tab ? 'var(--accent-glow)' : 'var(--text-muted)',
                                        borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {tab === 'ast' ? '✦ AST' : tab === 'js' ? '{ } JavaScript' : '📖 Explain'}
                                </button>
                            ))}
                            <div style={{ flex: 1 }} />
                            <span style={{ fontSize: 10, color: '#00b894', fontFamily: 'var(--font-mono)' }}>
                                {stats.matched}/{stats.total} resolved
                            </span>
                        </div>
                        <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', minHeight: 200 }}>
                            {activeTab === 'ast' && <ASTPanel output={output} />}
                            {activeTab === 'js' && <JSPanel js={jsOutput} />}
                            {activeTab === 'explain' && <ExplainPanel data={explanation} />}
                        </div>
                    </div>

                    {/* Bottom Right: Console */}
                    <div className="bento-card" style={{ padding: 0, overflow: 'hidden', minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-bright)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                ✦ Console Output
                            </span>
                            <button
                                onClick={() => setConsoleOutput([])}
                                style={{
                                    fontSize: 10, background: 'none', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                                }}
                            >Clear</button>
                        </div>
                        <div style={{ flex: 1, padding: '8px 16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {consoleOutput.length === 0 && (
                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11, padding: '8px 0' }}>
                                    Click ▶ Run or press Ctrl+Enter to execute your program...
                                </div>
                            )}
                            {consoleOutput.map((item, i) => (
                                <div key={i} style={{
                                    padding: '3px 0',
                                    color: item.type === 'error' ? '#d63031'
                                        : item.type === 'warn' ? '#fdcb6e'
                                            : item.type === 'ai' ? '#00b894'
                                                : item.type === 'result' ? '#6c5ce7'
                                                    : item.type === 'info' ? 'var(--text-secondary)'
                                                        : 'var(--text-bright)',
                                    borderLeft: item.type === 'error' ? '2px solid #d63031'
                                        : item.type === 'result' ? '2px solid #6c5ce7'
                                            : 'none',
                                    paddingLeft: (item.type === 'error' || item.type === 'result') ? 8 : 0,
                                }}>
                                    {item.text}
                                </div>
                            ))}
                            {Object.keys(variables).length > 0 && (
                                <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                                        Variables
                                    </div>
                                    {Object.entries(variables).map(([k, v]) => (
                                        <div key={k} style={{ color: 'var(--text-secondary)', fontSize: 11, padding: '2px 0' }}>
                                            <span style={{ color: '#6c5ce7' }}>{k}</span>
                                            <span style={{ color: 'var(--text-muted)' }}> = </span>
                                            <span style={{ color: 'var(--text-bright)' }}>{JSON.stringify(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer Info ── */}
            <div style={{ maxWidth: 1440, margin: '-40px auto 80px', padding: '0 24px' }}>
                <div className="bento-card" style={{
                    padding: '14px 20px',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
                    fontSize: 12, color: 'var(--text-muted)',
                }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>🧪 Sandbox Mode</div>
                        Compiles and runs entirely in your browser using the Pattern Library. Instant feedback, zero network latency.
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>🚀 Live Mode</div>
                        Sends code to the Lume backend for full compilation using all 13 milestones. Real execution in a sandboxed VM.
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Keyboard Shortcuts</div>
                        <span style={{ color: 'var(--accent)' }}>Ctrl+Enter</span> Run · <span style={{ color: 'var(--accent)' }}>Tab</span> Indent
                    </div>
                </div>
            </div>

            {/* ── Save Modal ── */}
            {showSaveModal && (
                <Modal onClose={() => setShowSaveModal(false)} title="Save Program">
                    <input
                        id="save-name-input"
                        type="text"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        placeholder="Program name..."
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        style={inputStyle}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleSave} style={btnStyle('#00b894', false)}>Save</button>
                        <button onClick={() => setShowSaveModal(false)} style={btnStyle('#636e72', false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {/* ── Load Modal ── */}
            {showLoadModal && (
                <Modal onClose={() => setShowLoadModal(false)} title="Open Program">
                    {savedPrograms.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 16, textAlign: 'center' }}>
                            No saved programs yet
                        </div>
                    )}
                    {savedPrograms.map(p => (
                        <div key={p.id} style={{
                            padding: '10px 12px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid var(--glass-border)',
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 13 }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                    {new Date(p.updatedAt).toLocaleDateString()} · {p.source.split('\n').length} lines
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => handleLoad(p)} style={btnStyle('#00b894', false)}>Open</button>
                                <button onClick={() => handleDelete(p.id)} style={btnStyle('#d63031', false)}>×</button>
                            </div>
                        </div>
                    ))}
                </Modal>
            )}
        </div>
    )
}

/* ── Sub-components ── */

function StatusBadge({ status }) {
    const map = {
        idle: { color: 'var(--text-muted)', text: '● Ready' },
        compiling: { color: '#fdcb6e', text: '● Compiling...' },
        running: { color: '#74b9ff', text: '● Running...' },
        success: { color: '#00b894', text: '● Success' },
        error: { color: '#d63031', text: '● Error' },
    }
    const s = map[status] || map.idle
    return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.text}</span>
}

function ASTPanel({ output }) {
    return output.map((r, i) => {
        if (r.type === 'skip' && !r.text) return <div key={i} style={{ height: 18 }} />
        if (r.type === 'skip') {
            return (
                <div key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    <LineNum n={r.lineNum} />
                    {r.text.startsWith('#') ? <span style={{ color: 'rgba(116,185,255,0.6)' }}>{r.text}</span>
                        : r.text.startsWith('mode:') ? <span style={{ color: 'var(--accent)', opacity: 0.7 }}>{r.text}</span>
                            : <span style={{ fontStyle: 'italic' }}>{r.text}</span>}
                </div>
            )
        }
        if (r.type === 'match') {
            const c = NODE_COLORS[r.nodeType] || '#00b894'
            return (
                <div key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: '1.6', marginBottom: 1 }}>
                    <LineNum n={r.lineNum} />
                    <span style={{ color: '#00b894' }}>✓ </span>
                    <span style={{ color: c, fontWeight: 600 }}>{r.nodeType}</span>
                    <span style={{ color: 'var(--text-muted)' }}> → </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{r.node}</span>
                </div>
            )
        }
        return (
            <div key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: '1.6', marginBottom: 1 }}>
                <LineNum n={r.lineNum} />
                <span style={{ color: '#fdcb6e' }}>⚠ </span>
                <span style={{ color: '#fdcb6e', opacity: 0.8 }}>Unresolved: </span>
                <span style={{ color: 'var(--text-muted)' }}>"{r.text}"</span>
                <span style={{ color: 'var(--text-muted)', opacity: 0.5, fontSize: 10 }}> → Layer B (AI)</span>
            </div>
        )
    })
}

function JSPanel({ js }) {
    if (!js) return (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12, padding: '12px 0' }}>
            Click 🔨 Build in Live mode to see compiled JavaScript output
        </div>
    )
    return (
        <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
            color: 'var(--text-bright)', whiteSpace: 'pre-wrap', margin: 0,
        }}>{js}</pre>
    )
}

function ExplainPanel({ data }) {
    if (!data) return (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12, padding: '12px 0' }}>
            Click 📖 Explain in Live mode to get code annotations
        </div>
    )
    return (
        <div>
            {data.summary && (
                <div style={{
                    padding: '10px 14px', marginBottom: 12,
                    background: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)',
                    borderRadius: 8, fontSize: 12, color: 'var(--text-bright)', lineHeight: 1.6,
                }}>
                    {data.summary}
                </div>
            )}
            {data.annotations?.map((ann, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Line {ann.line}: <span style={{ color: 'var(--accent)' }}>"{ann.code}"</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#00b894', paddingLeft: 12 }}>
                        → {ann.explanation}
                    </div>
                </div>
            ))}
        </div>
    )
}

function LineNum({ n }) {
    return <span style={{ color: 'var(--text-muted)', opacity: 0.3, marginRight: 8, display: 'inline-block', width: 28, textAlign: 'right', fontSize: 11 }}>{n}</span>
}

function Modal({ onClose, title, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: 420, maxHeight: '70vh', overflowY: 'auto',
                    background: 'var(--glass-bg)', backdropFilter: 'blur(40px)',
                    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
                    padding: 24,
                }}
            >
                <h3 style={{ margin: '0 0 16px', color: 'var(--text-bright)', fontSize: 16 }}>{title}</h3>
                {children}
            </div>
        </div>
    )
}

/* ── Styles ── */
function btnStyle(color, active) {
    return {
        padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
        background: active ? `${color}33` : `${color}15`,
        border: `1px solid ${color}55`,
        borderRadius: 'var(--radius-sm)',
        color, cursor: 'pointer',
        transition: 'all 0.15s ease',
        opacity: active ? 0.7 : 1,
    }
}

const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-bright)',
    fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
}
