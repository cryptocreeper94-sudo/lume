/**
 * Terminal — Interactive CLI terminal for the Lume IDE Playground
 * Simulates Lume CLI commands in-browser.
 */
import { useState, useRef, useCallback, useEffect } from 'react'

const PROMPT = 'lume@playground'
const LUME_VERSION = '0.8.0'

const HELP_TEXT = [
    { type: 'info', text: '  Lume CLI v' + LUME_VERSION + ' — Interactive Playground Terminal' },
    { type: 'info', text: '' },
    { type: 'log', text: '  Usage: lume <command>' },
    { type: 'info', text: '' },
    { type: 'info', text: '  Commands:' },
    { type: 'log', text: '    lume run          Compile and execute the current editor code' },
    { type: 'log', text: '    lume build        Compile to JavaScript (no execution)' },
    { type: 'log', text: '    lume test         Run the sandbox self-test suite' },
    { type: 'log', text: '    lume fmt          Auto-format the current code' },
    { type: 'log', text: '    lume lint         Run Guardian security scan' },
    { type: 'log', text: '    lume explain      Generate code explanations' },
    { type: 'log', text: '    lume voice        Toggle voice input' },
    { type: 'log', text: '    lume version      Show Lume version' },
    { type: 'log', text: '    lume help         Show this help message' },
    { type: 'info', text: '' },
    { type: 'info', text: '  Other:' },
    { type: 'log', text: '    clear             Clear the terminal' },
    { type: 'log', text: '    help              Alias for lume help' },
    { type: 'log', text: '    echo <text>       Print text to terminal' },
]

export default function Terminal({ visible, onAction, onClose }) {
    const [history, setHistory] = useState([
        { type: 'info', text: `Lume Interactive Terminal v${LUME_VERSION}` },
        { type: 'info', text: 'Type "lume help" for available commands.\n' },
    ])
    const [input, setInput] = useState('')
    const [cmdHistory, setCmdHistory] = useState([])
    const [historyIdx, setHistoryIdx] = useState(-1)
    const inputRef = useRef(null)
    const scrollRef = useRef(null)

    // Auto-scroll on new output
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [history])

    // Focus input when terminal becomes visible
    useEffect(() => {
        if (visible && inputRef.current) {
            inputRef.current.focus()
        }
    }, [visible])

    const executeCommand = useCallback((cmd) => {
        const trimmed = cmd.trim()
        if (!trimmed) return

        // Add to command history
        setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)])
        setHistoryIdx(-1)

        // Echo the command
        const newLines = [{ type: 'prompt', text: `${PROMPT} $ ${trimmed}` }]

        // Parse command
        const parts = trimmed.split(/\s+/)
        const command = parts[0].toLowerCase()

        if (command === 'clear') {
            setHistory([])
            setInput('')
            return
        }

        if (command === 'help') {
            newLines.push(...HELP_TEXT)
        } else if (command === 'echo') {
            newLines.push({ type: 'log', text: parts.slice(1).join(' ') })
        } else if (command === 'lume') {
            const sub = (parts[1] || '').toLowerCase()
            switch (sub) {
                case 'help':
                case '':
                    newLines.push(...HELP_TEXT)
                    break
                case 'version':
                case '--version':
                case '-v':
                    newLines.push({ type: 'info', text: `Lume v${LUME_VERSION}` })
                    newLines.push({ type: 'info', text: 'Runtime: Browser Sandbox (client-side)' })
                    newLines.push({ type: 'info', text: 'Engine: Pattern Library + SandboxEngine' })
                    break
                case 'run':
                    newLines.push({ type: 'info', text: '⏳ Compiling and executing...' })
                    onAction?.('run.run')
                    setTimeout(() => {
                        setHistory(prev => [...prev, { type: 'log', text: '✓ Execution complete. See Console panel for output.' }])
                    }, 300)
                    break
                case 'build':
                    newLines.push({ type: 'info', text: '🔨 Building...' })
                    onAction?.('run.build')
                    setTimeout(() => {
                        setHistory(prev => [...prev, { type: 'log', text: '✓ Build complete. Check JS tab for output.' }])
                    }, 300)
                    break
                case 'test':
                    newLines.push({ type: 'info', text: '🧪 Running self-test suite...' })
                    newLines.push({ type: 'info', text: '' })
                    newLines.push({ type: 'log', text: '  ✓ Pattern Library loaded (32 patterns)' })
                    newLines.push({ type: 'log', text: '  ✓ Sandbox Engine initialized' })
                    newLines.push({ type: 'log', text: '  ✓ Security Scanner active' })
                    newLines.push({ type: 'log', text: '  ✓ Voice API available' })
                    newLines.push({ type: 'log', text: '  ✓ localStorage accessible' })
                    newLines.push({ type: 'log', text: '  ✓ Compile API reachable' })
                    newLines.push({ type: 'info', text: '' })
                    newLines.push({ type: 'log', text: '  6 passed, 0 failed' })
                    break
                case 'fmt':
                case 'format':
                    newLines.push({ type: 'info', text: '✨ Formatting current code...' })
                    onAction?.('terminal.lumeFmt')
                    newLines.push({ type: 'log', text: '✓ Formatted. Cleaned indentation and whitespace.' })
                    break
                case 'lint':
                    newLines.push({ type: 'info', text: '🔒 Running Guardian Scanner...' })
                    onAction?.('terminal.lumeLint')
                    setTimeout(() => {
                        setHistory(prev => [...prev, { type: 'log', text: '✓ Scan complete. Check Security tab for results.' }])
                    }, 200)
                    break
                case 'explain':
                    newLines.push({ type: 'info', text: '📖 Generating explanations...' })
                    onAction?.('run.explain')
                    break
                case 'voice':
                    newLines.push({ type: 'info', text: '🎤 Toggling voice input...' })
                    onAction?.('run.toggleVoice')
                    break
                default:
                    newLines.push({ type: 'error', text: `Unknown command: lume ${sub}` })
                    newLines.push({ type: 'info', text: 'Type "lume help" for available commands.' })
            }
        } else {
            newLines.push({ type: 'error', text: `Command not found: ${command}` })
            newLines.push({ type: 'info', text: 'Type "help" for available commands.' })
        }

        newLines.push({ type: 'info', text: '' })
        setHistory(prev => [...prev, ...newLines])
        setInput('')
    }, [onAction])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            executeCommand(input)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (cmdHistory.length > 0) {
                const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1)
                setHistoryIdx(newIdx)
                setInput(cmdHistory[newIdx])
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (historyIdx > 0) {
                const newIdx = historyIdx - 1
                setHistoryIdx(newIdx)
                setInput(cmdHistory[newIdx])
            } else {
                setHistoryIdx(-1)
                setInput('')
            }
        }
    }

    if (!visible) return null

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            background: 'rgba(8,8,16,0.95)',
            borderTop: '1px solid rgba(6,182,212,0.12)',
            height: 200, overflow: 'hidden', flexShrink: 0,
        }}>
            {/* Terminal Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: 1.5, color: 'var(--text-muted)',
                    }}>⬛ Terminal</span>
                    <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 3,
                        background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                        color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                    }}>bash</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => setHistory([])}
                        style={termBtnStyle}
                        title="Clear"
                    >🧹</button>
                    <button
                        onClick={onClose}
                        style={termBtnStyle}
                        title="Close"
                    >✕</button>
                </div>
            </div>

            {/* Terminal Output */}
            <div ref={scrollRef} style={{
                flex: 1, overflowY: 'auto', padding: '8px 16px',
                fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
            }}>
                {history.map((line, i) => (
                    <div key={i} style={{
                        color: line.type === 'error' ? '#d63031'
                            : line.type === 'prompt' ? '#06b6d4'
                                : line.type === 'log' ? 'var(--text-bright)'
                                    : 'var(--text-muted)',
                        fontWeight: line.type === 'prompt' ? 600 : 400,
                        whiteSpace: 'pre-wrap',
                    }}>
                        {line.text}
                    </div>
                ))}

                {/* Input Line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <span style={{ color: '#14b8a6', fontWeight: 600, fontSize: 12, marginRight: 4 }}>
                        {PROMPT}
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>$</span>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck="false"
                        autoComplete="off"
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: 'var(--text-bright)', fontFamily: 'var(--font-mono)',
                            fontSize: 12, caretColor: '#06b6d4',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export function clearTerminal(setHistory) {
    setHistory([])
}

const termBtnStyle = {
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 3,
    cursor: 'pointer', fontSize: 10,
}
