/**
 * CommandPalette — VS Code-style command launcher for the Lume IDE
 * Ctrl+Shift+P to open, fuzzy search across all available commands.
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { SHORTCUTS } from './useKeyboardShortcuts'

export default function CommandPalette({ visible, onAction, onClose }) {
    const [query, setQuery] = useState('')
    const [selectedIdx, setSelectedIdx] = useState(0)
    const inputRef = useRef(null)

    // Focus on open
    useEffect(() => {
        if (visible && inputRef.current) {
            setQuery('')
            setSelectedIdx(0)
            inputRef.current.focus()
        }
    }, [visible])

    // Build command list from shortcuts + extra commands
    const allCommands = useMemo(() => {
        const extra = [
            { id: 'run.toggleMode', label: 'Toggle Sandbox/Live Mode', category: 'Run', icon: '🔄', keys: '' },
            { id: 'run.toggleVoice', label: 'Toggle Voice Input', category: 'Run', icon: '🎤', keys: '' },
            { id: 'view.resetLayout', label: 'Reset Layout', category: 'View', icon: '📐', keys: '' },
            { id: 'terminal.lumeTest', label: 'Run lume test', category: 'Terminal', icon: '🧪', keys: '' },
            { id: 'terminal.lumeFmt', label: 'Run lume fmt', category: 'Terminal', icon: '✨', keys: '' },
            { id: 'terminal.lumeLint', label: 'Run lume lint', category: 'Terminal', icon: '🔒', keys: '' },
            { id: 'help.shortcuts', label: 'Keyboard Shortcuts Reference', category: 'Help', icon: '⌨️', keys: '' },
            { id: 'help.examples', label: 'Load Example Programs', category: 'Help', icon: '📝', keys: '' },
            { id: 'help.gettingStarted', label: 'Getting Started Guide', category: 'Help', icon: '🎓', keys: '' },
            { id: 'help.about', label: 'About Lume', category: 'Help', icon: 'ℹ️', keys: '' },
            { id: 'help.github', label: 'GitHub Repository', category: 'Help', icon: '🔗', keys: '' },
            { id: 'help.reportIssue', label: 'Report Issue', category: 'Help', icon: '🐛', keys: '' },
            { id: 'file.import', label: 'Import .lume File', category: 'File', icon: '📥', keys: '' },
        ]
        return [...SHORTCUTS, ...extra]
    }, [])

    // Filter by query (fuzzy)
    const filtered = useMemo(() => {
        if (!query) return allCommands
        const q = query.toLowerCase()
        return allCommands.filter(cmd =>
            cmd.label.toLowerCase().includes(q) ||
            cmd.category.toLowerCase().includes(q) ||
            cmd.id.toLowerCase().includes(q)
        ).sort((a, b) => {
            // Prioritize exact prefix matches
            const aStart = a.label.toLowerCase().startsWith(q) ? -1 : 0
            const bStart = b.label.toLowerCase().startsWith(q) ? -1 : 0
            return aStart - bStart
        })
    }, [query, allCommands])

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIdx(0)
    }, [filtered.length])

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') { onClose(); return }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIdx(prev => Math.min(prev + 1, filtered.length - 1))
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIdx(prev => Math.max(prev - 1, 0))
        }
        if (e.key === 'Enter') {
            e.preventDefault()
            if (filtered[selectedIdx]) {
                onAction(filtered[selectedIdx].id)
                onClose()
            }
        }
    }

    if (!visible) return null

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', paddingTop: 80,
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: 560, maxHeight: 440,
                    background: 'rgba(14,14,24,0.98)', backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(6,182,212,0.05)',
                    overflow: 'hidden',display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Search Input */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ color: '#06b6d4', fontSize: 14 }}>⚡</span>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command..."
                        spellCheck="false"
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: 'var(--text-bright)', fontSize: 14, fontFamily: 'var(--font-sans)',
                        }}
                    />
                    <span style={{
                        fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                    }}>
                        {filtered.length} command{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                    {filtered.length === 0 && (
                        <div style={{
                            padding: '20px 16px', textAlign: 'center',
                            color: 'var(--text-muted)', fontSize: 13,
                        }}>
                            No matching commands found
                        </div>
                    )}
                    {filtered.map((cmd, i) => (
                        <button
                            key={cmd.id + i}
                            onClick={() => { onAction(cmd.id); onClose() }}
                            onMouseEnter={() => setSelectedIdx(i)}
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                width: '100%', padding: '8px 16px',
                                background: i === selectedIdx ? 'rgba(6,182,212,0.08)' : 'transparent',
                                border: 'none', cursor: 'pointer',
                                borderLeft: i === selectedIdx ? '2px solid #06b6d4' : '2px solid transparent',
                                transition: 'background 0.08s',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 12, width: 20, textAlign: 'center' }}>{cmd.icon}</span>
                                <span style={{
                                    fontSize: 13,
                                    color: i === selectedIdx ? 'var(--text-bright)' : 'var(--text-secondary)',
                                }}>{cmd.label}</span>
                                <span style={{
                                    fontSize: 9, padding: '1px 6px', borderRadius: 3,
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'var(--text-muted)',
                                }}>{cmd.category}</span>
                            </div>
                            {cmd.keys && (
                                <span style={{
                                    fontSize: 10, fontFamily: 'var(--font-mono)',
                                    color: 'var(--text-muted)', opacity: 0.5,
                                    padding: '2px 6px', borderRadius: 3,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>{cmd.keys}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
