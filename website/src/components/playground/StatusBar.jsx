/**
 * StatusBar — Bottom status bar for the Lume IDE Playground
 * Shows cursor position, mode, connection status, and version info.
 */

export default function StatusBar({ code, cursorPos, mode, sandboxMode, isRecording, inputMethod }) {
    const lineCount = code.split('\n').length
    const charCount = code.length

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '4px 16px', height: 26,
            background: 'linear-gradient(90deg, rgba(6,182,212,0.08), rgba(6,6,10,0.95), rgba(20,184,166,0.08))',
            borderTop: '1px solid rgba(6,182,212,0.15)',
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)', userSelect: 'none',
            flexShrink: 0,
        }}>
            {/* Left: Cursor Position */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span>
                    Ln <span style={{ color: 'var(--text-bright)' }}>{cursorPos.line}</span>,
                    Col <span style={{ color: 'var(--text-bright)' }}>{cursorPos.col}</span>
                </span>
                <span>{lineCount} lines · {charCount} chars</span>
                <span style={{ color: 'var(--accent)', opacity: 0.6 }}>UTF-8</span>
            </div>

            {/* Center: Mode */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{
                    padding: '1px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                    color: 'var(--accent)',
                }}>
                    {mode === 'english' ? '◆ English Mode' : '◆ Standard Mode'}
                </span>
                {isRecording && (
                    <span style={{
                        padding: '1px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                        background: 'rgba(214,48,49,0.15)', border: '1px solid rgba(214,48,49,0.3)',
                        color: '#d63031', animation: 'pulse 1.5s ease-in-out infinite',
                    }}>
                        ● REC
                    </span>
                )}
            </div>

            {/* Right: Connection + Version */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {inputMethod === 'voice' ? '🎤' : '⌨️'} {inputMethod}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: sandboxMode ? '#00b894' : '#fdcb6e',
                        boxShadow: sandboxMode ? '0 0 6px #00b89466' : '0 0 6px #fdcb6e66',
                    }} />
                    {sandboxMode ? 'Sandbox' : 'Live'}
                </span>
                <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Lume v0.8.0</span>
            </div>
        </div>
    )
}
