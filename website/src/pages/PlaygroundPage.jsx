import { useState, useCallback, useRef, useEffect } from 'react'
import { executeSandbox, saveProgram, loadPrograms, deleteProgram, exportAsLume } from '../utils/sandboxEngine'
import { compileCode, runCode, explainCode } from '../api/compileApi'
import { scanCode, formatCertificate } from '../utils/securityScanner'
import { PlaygroundAnalytics, hasConsent, setConsent } from '../utils/playgroundAnalytics'
import { useKeyboardShortcuts } from '../components/playground/useKeyboardShortcuts'
import MenuBar from '../components/playground/MenuBar'
import StatusBar from '../components/playground/StatusBar'
import Terminal from '../components/playground/Terminal'
import TabBar from '../components/playground/TabBar'
import FindReplace from '../components/playground/FindReplace'
import CommandPalette from '../components/playground/CommandPalette'
import HelpPanel from '../components/playground/HelpPanel'

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
    const [activeTab, setActiveTab] = useState('ast') // ast | js | explain | security
    const [jsOutput, setJsOutput] = useState('')
    const [explanation, setExplanation] = useState(null)
    const [savedPrograms, setSavedPrograms] = useState([])
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showLoadModal, setShowLoadModal] = useState(false)
    const [saveName, setSaveName] = useState('')
    const [variables, setVariables] = useState({})
    const [isRecording, setIsRecording] = useState(false)
    const [voiceSupported, setVoiceSupported] = useState(false)
    const [securityScan, setSecurityScan] = useState(null)
    const [inputMethod, setInputMethod] = useState('text')  // 'text' | 'voice'
    const [showApproval, setShowApproval] = useState(false)
    const [approved, setApproved] = useState(false)
    const [showBuildReview, setShowBuildReview] = useState(false)
    const [buildReview, setBuildReview] = useState(null)
    const [buildReviewApproved, setBuildReviewApproved] = useState(false)
    const [autoApprove, setAutoApprove] = useState(false)
    const [auditoryMode, setAuditoryMode] = useState(false)
    const [disambiguation, setDisambiguation] = useState(null)  // { line, pronoun, candidates[] }
    // ── IDE State ──
    const [showTerminal, setShowTerminal] = useState(false)
    const [showFindReplace, setShowFindReplace] = useState(false)
    const [findReplaceMode, setFindReplaceMode] = useState('find')
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [helpInitialTab, setHelpInitialTab] = useState(0)
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
    const [tabs, setTabs] = useState([{ id: 'default', name: 'Hello World', source: EXAMPLES['Hello World'], modified: false }])
    const [activeTabId, setActiveTabId] = useState('default')
    const textareaRef = useRef(null)
    const recognitionRef = useRef(null)
    const analyticsRef = useRef(new PlaygroundAnalytics())

    // CHI §7.2: Browser TTS helper for Auditory Mode
    const speak = useCallback((text) => {
        if (!auditoryMode || typeof window === 'undefined' || !window.speechSynthesis) return
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(text)
        utt.rate = 1.0
        utt.pitch = 1.0
        utt.lang = 'en-US'
        window.speechSynthesis.speak(utt)
    }, [auditoryMode])

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
                        setInputMethod('voice')
                        // CHI Analytics: log voice input
                        analyticsRef.current.logVoiceInput({
                            rawTranscript: finalTranscript,
                            cleanedTranscript: cleaned,
                            fillersRemoved: (finalTranscript.match(/\b(?:um|uh|like|you know|basically|actually)\b/gi) || []).length,
                            repeatsCollapsed: finalTranscript !== cleaned ? 1 : 0,
                        })
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

        // CHI §5.5: Detect potential disambiguation scenarios
        // Track subjects for pronoun ambiguity detection
        const subjects = []
        for (const r of results) {
            if (r.type === 'match' && r.node) {
                const targetMatch = r.node.match(/target:\s*"([^"]+)"/)
                const valueMatch = r.node.match(/value:\s*"([^"]+)"/)
                if (targetMatch) subjects.push({ name: targetMatch[1], line: r.lineNum, type: r.nodeType })
                if (valueMatch && !targetMatch) subjects.push({ name: valueMatch[1], line: r.lineNum, type: r.nodeType })
            }
        }
        // Check for pronoun usage ("it", "them", "that") with multiple recent subjects
        for (const r of results) {
            if (r.type === 'match' && r.text && /\b(it|them|that|those|these|this)\b/i.test(r.text)) {
                const recentSubjects = subjects.filter(s => s.line < r.lineNum).slice(-3)
                if (recentSubjects.length >= 2) {
                    // Trigger disambiguation
                    const pronoun = r.text.match(/\b(it|them|that|those|these|this)\b/i)?.[0]
                    setDisambiguation({
                        line: r.lineNum,
                        pronoun,
                        text: r.text,
                        candidates: recentSubjects.map((s, idx) => ({
                            label: String.fromCharCode(65 + idx),
                            subject: s.name,
                            line: s.line,
                            type: s.type,
                        })),
                    })
                    speak(`Ambiguous reference on line ${r.lineNum}. "${pronoun}" could refer to ${recentSubjects.map(s => s.name).join(' or ')}. Which did you mean?`)
                    break // Only show first disambiguation
                }
            }
        }
    }, [code, speak])

    useEffect(() => { compileLocal() }, [compileLocal])

    const stats = {
        total: output.filter(r => r.type !== 'skip').length,
        matched: output.filter(r => r.type === 'match').length,
        unresolved: output.filter(r => r.type === 'unresolved').length,
    }

    // ── Build Review Gate (Natural Language mode) ──
    const isNaturalLanguage = code.trim().startsWith('mode:')
    const reviewConfidence = buildReview ? Math.max(0, Math.round((buildReview.matched / Math.max(buildReview.total, 1)) * 100 - (buildReview.unresolved * 10))) : 0

    const triggerBuildReview = useCallback(async (onApprove) => {
        // Compile to get AST + JS preview
        setStatus('compiling')
        try {
            let reviewData
            if (sandboxMode) {
                // Client-side review
                const lines = code.split('\n')
                const results = lines.map((line, i) => {
                    const result = compileLine(line)
                    return { ...result, lineNum: i + 1 }
                })
                const matched = results.filter(r => r.type === 'match').length
                const total = results.filter(r => r.type !== 'skip').length
                const unresolved = results.filter(r => r.type === 'unresolved').length
                reviewData = {
                    source: code,
                    ast: results,
                    js: '// Sandbox mode — switch to Live for full JS output',
                    matched,
                    total,
                    unresolved,
                    diagnostics: [],
                    onApprove,
                }
            } else {
                // Server-side compile for full preview
                const result = await compileCode(code)
                const lines = code.split('\n')
                const astResults = (result.ast || []).map((node, i) => ({
                    type: 'match',
                    nodeType: node.type || 'Unknown',
                    node: JSON.stringify(node).slice(0, 120),
                    text: lines[i] || '',
                    lineNum: i + 1,
                }))
                const matched = astResults.length
                const total = lines.filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//') && !l.trim().startsWith('mode:')).length
                const unresolved = Math.max(0, total - matched)
                reviewData = {
                    source: code,
                    ast: astResults,
                    js: result.js || '',
                    matched,
                    total,
                    unresolved,
                    diagnostics: result.diagnostics || [],
                    onApprove,
                }
            }

            const confidence = Math.max(0, Math.round((reviewData.matched / Math.max(reviewData.total, 1)) * 100 - (reviewData.unresolved * 10)))

            // Auto-approve if enabled and confidence is high enough
            if (autoApprove && confidence >= 90) {
                setBuildReviewApproved(true)
                setStatus('idle')
                onApprove()
                return
            }

            setBuildReview(reviewData)
            setShowBuildReview(true)
            setStatus('idle')
        } catch (err) {
            setConsoleOutput([{ type: 'error', text: `Review failed: ${err.message}` }])
            setStatus('error')
        }
    }, [sandboxMode, code, autoApprove])

    // ── Run (Sandbox or Live) ──
    const executeRun = useCallback(async () => {
        // Run security scan first
        const scan = scanCode(code, inputMethod)
        setSecurityScan(scan)

        // If threats found and not yet approved, show approval dialog
        if (!scan.summary.clean && !approved) {
            setShowApproval(true)
            return
        }

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
            // CHI Analytics: log sandbox compilation
            analyticsRef.current.logCompilation({
                inputMode: inputMethod,
                sourceLineCount: code.split('\n').length,
                mode: code.trim().startsWith('mode:') ? 'english' : 'standard',
                totalResolved: output.filter(r => r.type === 'match').length,
                totalUnresolved: output.filter(r => r.type === 'unresolved').length,
                compilationTimeMs: result.executionTime,
                executionTimeMs: result.executionTime,
                reviewModeUsed: buildReviewApproved,
            })
            if (result.errors.length > 0) {
                setConsoleOutput(prev => [...prev, ...result.errors.map(e => ({ type: 'error', text: `Line ${e.line}: ${e.message}` }))])
                speak(`Compilation complete with ${result.errors.length} error${result.errors.length > 1 ? 's' : ''}.`)
            } else {
                const matched = output.filter(r => r.type === 'match').length
                speak(`Compilation complete. ${matched} lines resolved successfully in ${result.executionTime} milliseconds.`)
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
                    speak(`Compilation complete with ${result.errors.length} error${result.errors.length > 1 ? 's' : ''}.`)
                } else {
                    speak(`Live compilation complete. ${result.executionTime} milliseconds.`)
                }
            } catch (err) {
                setConsoleOutput([{ type: 'error', text: err.message }])
                setStatus('error')
            }
        }
    }, [sandboxMode, code, output, inputMethod, approved])

    const handleRun = useCallback(async () => {
        // If Natural Language mode and not yet reviewed, show the gate
        if (isNaturalLanguage && !buildReviewApproved) {
            triggerBuildReview(executeRun)
            return
        }
        // Reset for next run
        setBuildReviewApproved(false)
        executeRun()
    }, [isNaturalLanguage, buildReviewApproved, triggerBuildReview, executeRun])

    // ── Build (compile only) ──
    const handleBuild = useCallback(async () => {
        setStatus('compiling')
        // Run security scan
        const scan = scanCode(code, inputMethod)
        setSecurityScan(scan)
        try {
            if (sandboxMode) {
                // Client-side — just show the AST
                setActiveTab('ast')
                setStatus('success')
                setExecutionTime(0)
            } else {
                const result = await compileCode(code)
                setJsOutput(formatCertificate(scan.certificate) + '\n\n' + (result.js || ''))
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
        // Update current tab
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, name, source: EXAMPLES[name], modified: false } : t))
    }

    // ── Tab Management ──
    const handleNewTab = useCallback(() => {
        const id = 'tab_' + Date.now()
        const newTab = { id, name: 'Untitled', source: 'mode: english\n\n# New program\n', modified: false }
        setTabs(prev => [...prev, newTab])
        setActiveTabId(id)
        setCode(newTab.source)
        setActiveExample('')
        setConsoleOutput([])
    }, [])

    const handleCloseTab = useCallback((tabId) => {
        setTabs(prev => {
            const filtered = prev.filter(t => t.id !== tabId)
            if (filtered.length === 0) {
                const newTab = { id: 'default', name: 'Hello World', source: EXAMPLES['Hello World'], modified: false }
                setCode(newTab.source)
                setActiveTabId('default')
                return [newTab]
            }
            if (tabId === activeTabId) {
                const lastTab = filtered[filtered.length - 1]
                setCode(lastTab.source)
                setActiveTabId(lastTab.id)
            }
            return filtered
        })
    }, [activeTabId])

    const handleSelectTab = useCallback((tabId) => {
        // Save current tab source first
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, source: code } : t))
        const tab = tabs.find(t => t.id === tabId)
        if (tab) {
            setCode(tab.source)
            setActiveTabId(tabId)
            setActiveExample('')
        }
    }, [activeTabId, code, tabs])

    // Mark tab as modified when code changes
    useEffect(() => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, source: code, modified: true } : t))
    }, [code])

    // ── Cursor Position Tracking ──
    const handleCursorChange = useCallback(() => {
        if (!textareaRef.current) return
        const pos = textareaRef.current.selectionStart
        const lines = code.substring(0, pos).split('\n')
        setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })
    }, [code])

    // ── Centralized Action Dispatcher ──
    const handleAction = useCallback((actionId) => {
        switch (actionId) {
            // File
            case 'file.new': case 'tab.new': handleNewTab(); break
            case 'file.open': setShowLoadModal(true); break
            case 'file.save': setShowSaveModal(true); break
            case 'file.saveAs': setShowSaveModal(true); break
            case 'file.export': exportAsLume(activeExample || 'program', code); break
            case 'file.import': { const el = document.createElement('input'); el.type = 'file'; el.accept = '.lume'; el.onchange = (ev) => { const f = ev.target.files[0]; if (f) { const r = new FileReader(); r.onload = (re) => { setCode(re.target.result); setActiveExample('') }; r.readAsText(f) } }; el.click(); break }
            // Edit
            case 'edit.find': setFindReplaceMode('find'); setShowFindReplace(true); break
            case 'edit.replace': setFindReplaceMode('replace'); setShowFindReplace(true); break
            case 'edit.comment': {
                if (!textareaRef.current) break
                const start = textareaRef.current.selectionStart
                const end = textareaRef.current.selectionEnd
                const lines = code.split('\n')
                const startLine = code.substring(0, start).split('\n').length - 1
                const endLine = code.substring(0, end).split('\n').length - 1
                for (let i = startLine; i <= endLine; i++) {
                    lines[i] = lines[i].startsWith('# ') ? lines[i].slice(2) : '# ' + lines[i]
                }
                setCode(lines.join('\n'))
                break
            }
            // View
            case 'view.terminal': setShowTerminal(v => !v); break
            case 'view.commandPalette': setShowCommandPalette(true); break
            case 'view.help': setHelpInitialTab(0); setShowHelp(true); break
            // Run
            case 'run.run': handleRun(); break
            case 'run.runSkip': setBuildReviewApproved(true); executeRun(); break
            case 'run.build': handleBuild(); break
            case 'run.explain': handleExplain(); break
            case 'run.toggleMode': setSandboxMode(v => !v); break
            case 'run.toggleVoice': toggleRecording(); break
            // Terminal
            case 'terminal.clear': break // handled by Terminal component
            case 'terminal.lumeFmt': {
                const lines = code.split('\n').map(l => l.trimEnd())
                setCode(lines.join('\n'))
                setConsoleOutput(prev => [...prev, { type: 'info', text: '✨ Code formatted' }])
                break
            }
            case 'terminal.lumeLint': {
                const scan = scanCode(code, inputMethod)
                setSecurityScan(scan)
                setActiveTab('security')
                break
            }
            // Tabs
            case 'tab.close': handleCloseTab(activeTabId); break
            // Help
            case 'help.shortcuts': setHelpInitialTab(1); setShowHelp(true); break
            case 'help.examples': break // example pills are visible
            case 'help.gettingStarted': setHelpInitialTab(2); setShowHelp(true); break
            case 'help.about': setConsoleOutput(prev => [...prev, { type: 'info', text: 'Lume v0.8.0 — The AI-Native Programming Language' }, { type: 'info', text: '© 2024 Trust Layer Ecosystem · DarkWave Studios' }]); break
            case 'help.github': window.open('https://github.com/cryptocreeper94-sudo/lume', '_blank'); break
            case 'help.reportIssue': window.open('https://github.com/cryptocreeper94-sudo/lume/issues', '_blank'); break
            default: break
        }
    }, [code, activeExample, activeTabId, handleRun, handleBuild, handleExplain, executeRun, toggleRecording, handleNewTab, handleCloseTab, inputMethod])

    // ── Keyboard Shortcuts ──
    useKeyboardShortcuts({
        'file.new': () => handleAction('file.new'),
        'file.open': () => handleAction('file.open'),
        'file.save': () => handleAction('file.save'),
        'file.export': () => handleAction('file.export'),
        'edit.find': () => handleAction('edit.find'),
        'edit.replace': () => handleAction('edit.replace'),
        'edit.comment': () => handleAction('edit.comment'),
        'view.terminal': () => handleAction('view.terminal'),
        'view.commandPalette': () => handleAction('view.commandPalette'),
        'view.help': () => handleAction('view.help'),
        'run.run': () => handleAction('run.run'),
        'run.runSkip': () => handleAction('run.runSkip'),
        'run.build': () => handleAction('run.build'),
        'run.explain': () => handleAction('run.explain'),
        'tab.new': () => handleAction('tab.new'),
        'tab.close': () => handleAction('tab.close'),
    })

    const handleKeyDown = (e) => {
        // Tab for indentation (only in textarea)
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
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 60 }}>
            <div className="orb orb-1" /><div className="orb orb-3" />

            {/* ── Menu Bar ── */}
            <MenuBar onAction={handleAction} />

            {/* ── Tab Bar ── */}
            <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
                onNewTab={handleNewTab}
            />

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
                        {/* CHI §7.2: Auditory Mode toggle */}
                        {'speechSynthesis' in (typeof window !== 'undefined' ? window : {}) && (
                            <button
                                id="btn-auditory"
                                onClick={() => {
                                    setAuditoryMode(!auditoryMode)
                                    if (!auditoryMode) {
                                        const utt = new SpeechSynthesisUtterance('Auditory mode enabled.')
                                        utt.rate = 1.0
                                        window.speechSynthesis.speak(utt)
                                    } else {
                                        window.speechSynthesis.cancel()
                                    }
                                    setConsoleOutput(prev => [...prev, { type: 'info', text: !auditoryMode ? '🔊 Auditory Mode enabled — compiler will speak results' : '🔇 Auditory Mode disabled' }])
                                }}
                                title={auditoryMode ? 'Auditory Mode ON: Compiler speaks results' : 'Auditory Mode OFF'}
                                style={{
                                    ...btnStyle(auditoryMode ? '#6c5ce7' : '#636e72', auditoryMode),
                                    animation: auditoryMode ? 'pulse 2s ease-in-out infinite' : 'none',
                                }}
                            >
                                {auditoryMode ? '🔊' : '🔇'} Audio
                            </button>
                        )}
                        <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 4px' }} />
                        <span style={{
                            fontSize: 10, fontFamily: 'var(--font-mono)',
                            color: inputMethod === 'voice' ? '#00b894' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            {inputMethod === 'voice' ? '🎤' : '⌨️'} {inputMethod}
                        </span>
                        {isNaturalLanguage && (
                            <>
                                <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 4px' }} />
                                <button
                                    id="btn-auto-approve"
                                    onClick={() => setAutoApprove(!autoApprove)}
                                    title={autoApprove ? 'Auto-approve ON: Skip review when confidence ≥ 90%' : 'Auto-approve OFF: Always show build review'}
                                    style={{
                                        padding: '4px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                                        background: autoApprove
                                            ? 'linear-gradient(135deg, rgba(0,184,148,0.2), rgba(0,184,148,0.05))'
                                            : 'rgba(255,255,255,0.03)',
                                        border: autoApprove ? '1px solid rgba(0,184,148,0.4)' : '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: autoApprove ? '#00b894' : 'var(--text-muted)',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                    }}
                                >
                                    {autoApprove ? '⚡ Auto' : '🔒 Review'}
                                </button>
                            </>
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
                flex: 1, minHeight: 0,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
                padding: '0 2px',
            }}>
                {/* LEFT: Editor */}
                <div style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(10,10,18,0.95)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
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
                            onChange={e => { setCode(e.target.value); setInputMethod('text') }}
                            onKeyDown={handleKeyDown}
                            onClick={handleCursorChange}
                            onKeyUp={handleCursorChange}
                            onSelect={handleCursorChange}
                            spellCheck="false"
                            style={{
                                width: '100%', height: '100%',
                                background: 'transparent', border: 'none', outline: 'none',
                                color: 'var(--text-bright)', fontFamily: 'var(--font-mono)', fontSize: 13,
                                lineHeight: '1.65', padding: '12px 12px 12px 56px',
                                resize: 'none', caretColor: 'var(--accent)',
                            }}
                        />
                        {/* Find & Replace overlay */}
                        <FindReplace
                            visible={showFindReplace}
                            mode={findReplaceMode}
                            code={code}
                            onCodeChange={setCode}
                            onClose={() => setShowFindReplace(false)}
                        />
                    </div>
                </div>

                {/* RIGHT: AST / JS / Explain + Console */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Top Right: AST / JS / Explain tabs */}
                    <div style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10,10,18,0.95)' }}>
                        <div style={{
                            padding: '0 16px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', gap: 0,
                        }}>
                            {['ast', 'js', 'explain', 'security'].map(tab => (
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
                                    {tab === 'ast' ? '✦ AST' : tab === 'js' ? '{ } JS' : tab === 'explain' ? '📖 Explain' : '🔒 Security'}
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
                            {activeTab === 'security' && <SecurityPanel scan={securityScan} />}
                        </div>
                    </div>

                    {/* Threat Warning Banner */}
                    {securityScan && !securityScan.summary.clean && (
                        <div className="bento-card" style={{
                            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
                            background: securityScan.summary.flagged > 0
                                ? 'rgba(214, 48, 49, 0.15)'
                                : 'rgba(253, 203, 110, 0.15)',
                            border: `1px solid ${securityScan.summary.flagged > 0 ? '#d6303155' : '#fdcb6e55'}`,
                        }}>
                            <span style={{ fontSize: 18 }}>
                                {securityScan.summary.flagged > 0 ? '⚠️' : '⚡'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: securityScan.summary.flagged > 0 ? '#d63031' : '#fdcb6e' }}>
                                    {securityScan.summary.flagged > 0
                                        ? `${securityScan.summary.flagged} Critical Threat${securityScan.summary.flagged > 1 ? 's' : ''} Detected`
                                        : `${securityScan.summary.warned} Warning${securityScan.summary.warned > 1 ? 's' : ''} Detected`
                                    }
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {securityScan.summary.threats.map(t => t.label).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('security')}
                                style={{ ...btnStyle('#fdcb6e', false), fontSize: 10 }}
                            >View Details</button>
                        </div>
                    )}

                    {/* Bottom Right: Console */}
                    <div style={{ padding: 0, overflow: 'hidden', minHeight: 200, display: 'flex', flexDirection: 'column', background: 'rgba(10,10,18,0.95)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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

            {/* ── Terminal ── */}
            <Terminal
                visible={showTerminal}
                onAction={handleAction}
                onClose={() => setShowTerminal(false)}
            />

            {/* ── Status Bar ── */}
            <StatusBar
                code={code}
                cursorPos={cursorPos}
                mode={modeLabel.toLowerCase()}
                sandboxMode={sandboxMode}
                isRecording={isRecording}
                inputMethod={inputMethod}
            />

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

            {/* ── Approval Dialog ── */}
            {showApproval && (
                <Modal onClose={() => setShowApproval(false)} title="⚠️ Security Approval Required">
                    <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        The Guardian Scanner detected potential security threats in your code.
                        Review the findings below before executing.
                    </div>
                    {securityScan && securityScan.summary.threats.map((t, i) => (
                        <div key={i} style={{
                            padding: '6px 10px', marginBottom: 4, borderRadius: 4,
                            background: t.severity === 'critical' ? 'rgba(214,48,49,0.1)' : t.severity === 'high' ? 'rgba(225,112,85,0.1)' : 'rgba(253,203,110,0.1)',
                            border: `1px solid ${t.severity === 'critical' ? '#d6303133' : t.severity === 'high' ? '#e1705533' : '#fdcb6e33'}`,
                            fontSize: 11, fontFamily: 'var(--font-mono)',
                            color: t.severity === 'critical' ? '#d63031' : t.severity === 'high' ? '#e17055' : '#fdcb6e',
                        }}>
                            {t.severity.toUpperCase()}: {t.label}
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button
                            onClick={() => { setApproved(true); setShowApproval(false); setTimeout(() => handleRun(), 100) }}
                            style={btnStyle('#e17055', false)}
                        >
                            ⚠️ Execute Anyway
                        </button>
                        <button onClick={() => setShowApproval(false)} style={btnStyle('#00b894', false)}>
                            ✖ Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── CHI §5.5: Disambiguation Modal ── */}
            {disambiguation && (
                <Modal onClose={() => setDisambiguation(null)} title="🔀 Disambiguation Required">
                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        Ambiguous reference on <span style={{ color: '#6c5ce7', fontWeight: 700 }}>line {disambiguation.line}</span>:
                    </div>
                    <div style={{
                        padding: '10px 14px', marginBottom: 16, borderRadius: 8,
                        background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.2)',
                        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-bright)',
                    }}>
                        "{disambiguation.text}"
                        <div style={{ fontSize: 10, color: '#fdcb6e', marginTop: 4 }}>
                            ⚠ "<strong>{disambiguation.pronoun}</strong>" could refer to multiple subjects
                        </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        Which did you mean?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {disambiguation.candidates.map((c) => (
                            <button
                                key={c.label}
                                onClick={() => {
                                    const startTime = disambiguation._startTime || Date.now()
                                    analyticsRef.current.logDisambiguation({
                                        line: disambiguation.line,
                                        pronoun: disambiguation.pronoun,
                                        candidates: disambiguation.candidates,
                                        selectedCandidate: c.label,
                                        timeToDecideMs: Date.now() - startTime,
                                    })
                                    setConsoleOutput(prev => [...prev, {
                                        type: 'info',
                                        text: `🔀 Disambiguation resolved: "${disambiguation.pronoun}" → "${c.subject}" (line ${c.line})`
                                    }])
                                    speak(`Resolved. "${disambiguation.pronoun}" refers to ${c.subject}.`)
                                    setDisambiguation(null)
                                }}
                                style={{
                                    padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                                    borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { e.target.style.background = 'rgba(0,184,148,0.08)'; e.target.style.borderColor = 'rgba(0,184,148,0.3)' }}
                                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'var(--glass-border)' }}
                            >
                                <span style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(0,184,148,0.15)', border: '1px solid rgba(0,184,148,0.3)',
                                    fontSize: 12, fontWeight: 900, color: '#00b894', fontFamily: 'var(--font-mono)',
                                    flexShrink: 0,
                                }}>
                                    {c.label}
                                </span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>
                                        {c.subject}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        from line {c.line} · {c.type}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </Modal>
            )}
            {showBuildReview && buildReview && (
                <BuildReviewModal
                    review={buildReview}
                    onApprove={() => {
                        setShowBuildReview(false)
                        setBuildReviewApproved(true)
                        setBuildReview(null)
                        setTimeout(() => {
                            if (buildReview.onApprove) buildReview.onApprove()
                        }, 100)
                    }}
                    onEdit={() => {
                        setShowBuildReview(false)
                        setBuildReview(null)
                        textareaRef.current?.focus()
                    }}
                    onExplain={async () => {
                        try {
                            const result = await explainCode(code)
                            setExplanation(result)
                            setActiveTab('explain')
                            setShowBuildReview(false)
                            setBuildReview(null)
                        } catch (err) {
                            setConsoleOutput(prev => [...prev, { type: 'error', text: `Explain: ${err.message}` }])
                        }
                    }}
                    onClose={() => { setShowBuildReview(false); setBuildReview(null) }}
                />
            )}

            {/* ── Command Palette Overlay ── */}
            <CommandPalette
                visible={showCommandPalette}
                onAction={handleAction}
                onClose={() => setShowCommandPalette(false)}
            />

            {/* ── Help Panel Overlay ── */}
            <HelpPanel
                visible={showHelp}
                initialTab={helpInitialTab}
                onClose={() => setShowHelp(false)}
            />

            {/* CSS animation for help panel */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
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

function SecurityPanel({ scan }) {
    if (!scan) {
        return (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12, padding: '8px 0' }}>
                Run or Build to trigger a security scan...
            </div>
        )
    }

    const { results, certificate, summary } = scan
    const severityColor = { critical: '#d63031', high: '#e17055', medium: '#fdcb6e', low: '#74b9ff' }

    return (
        <div>
            {/* Certificate Banner */}
            <div style={{
                padding: '12px 16px', marginBottom: 12, borderRadius: 8,
                background: certificate.status === 'CERTIFIED'
                    ? 'rgba(0, 184, 148, 0.1)'
                    : certificate.status === 'REJECTED'
                        ? 'rgba(214, 48, 49, 0.1)'
                        : 'rgba(253, 203, 110, 0.1)',
                border: `1px solid ${certificate.status === 'CERTIFIED' ? '#00b89433' : certificate.status === 'REJECTED' ? '#d6303133' : '#fdcb6e33'}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>
                        {certificate.status === 'CERTIFIED' ? '✅' : certificate.status === 'REJECTED' ? '❌' : '⚠️'}
                    </span>
                    <span style={{
                        fontSize: 13, fontWeight: 800,
                        color: certificate.status === 'CERTIFIED' ? '#00b894' : certificate.status === 'REJECTED' ? '#d63031' : '#fdcb6e',
                        fontFamily: 'var(--font-mono)', letterSpacing: 1,
                    }}>
                        LUME SECURITY {certificate.status}
                    </span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    <div>Source: <span style={{ color: 'var(--text-bright)' }}>{certificate.source}</span></div>
                    <div>Mode: <span style={{ color: 'var(--text-bright)' }}>{certificate.mode}</span></div>
                    <div>Scanned: <span style={{ color: '#00b894' }}>{certificate.scanned}</span></div>
                    <div>Input: <span style={{ color: 'var(--text-bright)' }}>{certificate.inputMethod === 'voice' ? '🎤 voice' : '⌨️ text'}</span></div>
                    <div>Hash: <span style={{ color: 'var(--accent)' }}>{certificate.hash}</span></div>
                    <div>Time: <span style={{ color: 'var(--text-bright)' }}>{new Date(certificate.timestamp).toLocaleString()}</span></div>
                </div>
            </div>

            {/* Summary Bar */}
            <div style={{
                display: 'flex', gap: 16, padding: '8px 0', marginBottom: 8,
                fontSize: 11, fontFamily: 'var(--font-mono)',
            }}>
                <span style={{ color: '#00b894' }}>✓ {summary.passed} passed</span>
                {summary.warned > 0 && <span style={{ color: '#fdcb6e' }}>⚡ {summary.warned} warned</span>}
                {summary.flagged > 0 && <span style={{ color: '#d63031' }}>⚠ {summary.flagged} flagged</span>}
            </div>

            {/* Per-line Results */}
            {results.map((r, i) => (
                <div key={i} style={{
                    fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: '1.8',
                    display: 'flex', alignItems: 'flex-start', gap: 6,
                }}>
                    <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                        background: r.status === 'pass' ? '#00b894' : r.status === 'flag' ? '#d63031' : '#fdcb6e',
                    }} />
                    <LineNum n={r.lineNum} />
                    <span style={{ color: r.status === 'pass' ? 'var(--text-muted)' : 'var(--text-bright)', flex: 1 }}>
                        {r.threats.length > 0
                            ? r.threats.map((t, j) => (
                                <span key={j} style={{
                                    display: 'inline-block', fontSize: 9, padding: '1px 6px', borderRadius: 3, marginLeft: j > 0 ? 4 : 0,
                                    background: `${severityColor[t.severity]}22`, color: severityColor[t.severity],
                                    border: `1px solid ${severityColor[t.severity]}44`,
                                }}>{t.label}</span>
                            ))
                            : <span style={{ opacity: 0.4 }}>passed</span>
                        }
                    </span>
                </div>
            ))}
        </div>
    )
}

function LineNum({ n }) {
    return <span style={{ color: 'var(--text-muted)', opacity: 0.3, marginRight: 8, display: 'inline-block', width: 28, textAlign: 'right', fontSize: 11 }}>{n}</span>
}

function BuildReviewModal({ review, onApprove, onEdit, onExplain, onClose }) {
    const confidence = Math.max(0, Math.round((review.matched / Math.max(review.total, 1)) * 100 - (review.unresolved * 10)))
    const confColor = confidence >= 90 ? '#00b894' : confidence >= 70 ? '#fdcb6e' : '#d63031'
    const confLabel = confidence >= 90 ? 'High Confidence' : confidence >= 70 ? 'Medium Confidence' : 'Low Confidence — Review Carefully'

    // CHI §8.3: Per-line risk assessment
    const assessRisk = (nodeType) => {
        const high = ['DeleteOperation', 'SendOperation']
        const med = ['UpdateOperation', 'StoreOperation']
        if (high.includes(nodeType)) return { level: 'HIGH', color: '#d63031', icon: '⛔' }
        if (med.includes(nodeType)) return { level: 'MED', color: '#fdcb6e', icon: '⚠️' }
        return { level: 'LOW', color: '#00b894', icon: '✓' }
    }

    // CHI §8.3: Plain-English intent description
    const describeIntent = (nodeType, nodeStr) => {
        const intents = {
            'ShowStatement': 'Display output to the user',
            'VariableDeclaration': 'Declare and set a variable',
            'VariableAccess': 'Read a stored value',
            'CreateOperation': 'Create a new entity',
            'StoreOperation': 'Save data persistently',
            'DeleteOperation': 'Permanently remove data',
            'UpdateOperation': 'Modify existing data',
            'SendOperation': 'Send data externally',
            'ForEachLoop': 'Iterate over a collection',
            'RepeatLoop': 'Repeat an action N times',
            'WhileLoop': 'Loop while condition is true',
            'IfStatement': 'Conditional branch',
            'ReturnStatement': 'Return a value',
            'SortOperation': 'Sort a collection',
            'BinaryExpression': 'Arithmetic operation',
            'IncrementOperation': 'Increase a value',
            'DecrementOperation': 'Decrease a value',
            'AskExpression': 'AI-powered query',
            'NavigateOperation': 'Redirect the user',
            'ToggleOperation': 'Toggle a boolean state',
            'ResetOperation': 'Clear/reset state',
            'ThrowStatement': 'Throw an error',
            'TryBlock': 'Error-safe operation',
            'MonitorBlock': 'Observe a value',
            'DelayStatement': 'Pause execution',
            'AlertStatement': 'Show an alert/notification',
        }
        return intents[nodeType] || `${nodeType} operation`
    }

    // Count risks for summary
    const riskCounts = { HIGH: 0, MED: 0, LOW: 0 }
    review.ast.filter(r => r.type === 'match').forEach(r => {
        const risk = assessRisk(r.nodeType)
        riskCounts[risk.level]++
    })

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 1100, maxHeight: '85vh', overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))',
                    border: '1px solid rgba(0,255,255,0.15)', borderRadius: 16,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 0 60px rgba(0,255,255,0.08), 0 25px 50px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>🔍</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                                Review Mode
                            </h3>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                CHI §8.3 — Verify compiler interpretation before execution
                            </span>
                        </div>
                    </div>
                    {/* Confidence + Risk Summary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Risk summary pills */}
                        {riskCounts.HIGH > 0 && (
                            <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'rgba(214,48,49,0.15)', border: '1px solid #d6303140', color: '#d63031' }}>
                                {riskCounts.HIGH} HIGH
                            </span>
                        )}
                        {riskCounts.MED > 0 && (
                            <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'rgba(253,203,110,0.15)', border: '1px solid #fdcb6e40', color: '#fdcb6e' }}>
                                {riskCounts.MED} MED
                            </span>
                        )}
                        <div style={{
                            padding: '6px 16px', borderRadius: 20,
                            background: `${confColor}15`,
                            border: `1px solid ${confColor}40`,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: `3px solid ${confColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 900, color: confColor,
                                fontFamily: 'var(--font-mono)',
                            }}>
                                {confidence}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: confColor }}>{confLabel}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {review.matched}/{review.total} resolved · {review.unresolved} unresolved
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: 18, padding: 4,
                        }}>✕</button>
                    </div>
                </div>

                {/* Three-Panel Body */}
                <div style={{
                    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr',
                    gap: 0, overflow: 'hidden', minHeight: 0,
                }}>
                    {/* Left: Your Input */}
                    <div style={{
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                            color: 'var(--text-muted)',
                        }}>✦ Your Input</div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                            {review.source.split('\n').map((line, i) => (
                                <div key={i} style={{
                                    fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: '1.7',
                                    color: line.trim().startsWith('#') ? 'rgba(116,185,255,0.6)'
                                        : line.trim().startsWith('mode:') ? 'var(--accent)'
                                            : !line.trim() ? 'transparent'
                                                : 'var(--text-bright)',
                                }}>
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.3, marginRight: 8, display: 'inline-block', width: 24, textAlign: 'right', fontSize: 10 }}>{i + 1}</span>
                                    {line || '\u00A0'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Review Mode — AI Interpretation with Risk + Intent */}
                    <div style={{
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                            color: '#00b894',
                        }}>✦ Review Mode — Compiler Interpretation</div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                            {review.ast.map((r, i) => {
                                if (r.type === 'skip') {
                                    if (!r.text) return <div key={i} style={{ height: 14 }} />
                                    return (
                                        <div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: '1.7', color: 'var(--text-muted)', opacity: 0.5 }}>
                                            {r.text}
                                        </div>
                                    )
                                }
                                if (r.type === 'match') {
                                    const c = NODE_COLORS[r.nodeType] || '#00b894'
                                    const risk = assessRisk(r.nodeType)
                                    const intent = describeIntent(r.nodeType, r.node)
                                    return (
                                        <div key={i} style={{
                                            fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: '1.5',
                                            marginBottom: 6, padding: '6px 8px', borderRadius: 6,
                                            background: risk.level === 'HIGH' ? 'rgba(214,48,49,0.06)'
                                                : risk.level === 'MED' ? 'rgba(253,203,110,0.04)'
                                                    : 'transparent',
                                            borderLeft: `3px solid ${risk.color}`,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 10 }}>{risk.icon}</span>
                                                <span style={{ color: c, fontWeight: 700 }}>{r.nodeType}</span>
                                                <span style={{
                                                    fontSize: 8, padding: '1px 5px', borderRadius: 4,
                                                    background: `${risk.color}20`, color: risk.color,
                                                    fontWeight: 800, letterSpacing: 0.5,
                                                }}>{risk.level}</span>
                                            </div>
                                            <div style={{ paddingLeft: 20, fontSize: 10, color: '#74b9ff', marginTop: 2 }}>
                                                {intent}
                                            </div>
                                            <div style={{ paddingLeft: 20, fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                                                {r.node}
                                            </div>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={i} style={{
                                        fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: '1.5',
                                        marginBottom: 6, padding: '6px 8px', borderRadius: 6,
                                        borderLeft: '3px solid #fdcb6e',
                                        background: 'rgba(253,203,110,0.04)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ color: '#fdcb6e' }}>⚠</span>
                                            <span style={{ color: '#fdcb6e', fontWeight: 700 }}>Unresolved</span>
                                            <span style={{
                                                fontSize: 8, padding: '1px 5px', borderRadius: 4,
                                                background: 'rgba(253,203,110,0.2)', color: '#fdcb6e',
                                                fontWeight: 800,
                                            }}>NEEDS AI</span>
                                        </div>
                                        <div style={{ paddingLeft: 20, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                            "{r.text}" — will route to Layer B (AI Resolver)
                                        </div>
                                    </div>
                                )
                            })}
                            {review.diagnostics.length > 0 && (
                                <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fdcb6e', textTransform: 'uppercase', marginBottom: 6 }}>Diagnostics</div>
                                    {review.diagnostics.map((d, i) => (
                                        <div key={i} style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 0' }}>
                                            ⚡ {typeof d === 'string' ? d : d.message || JSON.stringify(d)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Generated JS */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                            color: '#6c5ce7',
                        }}>{ } Generated JS</div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                            <pre style={{
                                fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6,
                                color: 'var(--text-bright)', whiteSpace: 'pre-wrap', margin: 0,
                            }}>{review.js || '// No JS output available\n// Switch to Live mode for full compilation'}</pre>
                        </div>
                    </div>
                </div>

                {/* Footer: Action Buttons */}
                <div style={{
                    padding: '14px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Ctrl+Shift+Enter to skip review · ESC to cancel
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onExplain} style={{
                            padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            background: 'rgba(9,132,227,0.1)', border: '1px solid rgba(9,132,227,0.3)',
                            borderRadius: 8, color: '#0984e3', cursor: 'pointer',
                        }}>📖 Explain More</button>
                        <button onClick={onEdit} style={{
                            padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            background: 'rgba(99,110,114,0.1)', border: '1px solid rgba(99,110,114,0.3)',
                            borderRadius: 8, color: '#b2bec3', cursor: 'pointer',
                        }}>✏️ Edit</button>
                        <button onClick={onApprove} style={{
                            padding: '8px 20px', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)',
                            background: 'linear-gradient(135deg, rgba(0,184,148,0.2), rgba(0,184,148,0.05))',
                            border: '1px solid rgba(0,184,148,0.5)',
                            borderRadius: 8, color: '#00b894', cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(0,184,148,0.15)',
                        }}>✅ Approve & Run</button>
                    </div>
                </div>
            </div>
        </div>
    )
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
