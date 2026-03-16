/**
 * FindReplace — VS Code-style Find & Replace overlay for the Lume IDE
 * Floats at the top-right of the editor panel.
 */
import { useState, useRef, useEffect, useCallback } from 'react'

export default function FindReplace({ visible, mode, code, onCodeChange, onClose }) {
    // mode: 'find' | 'replace'
    const [searchTerm, setSearchTerm] = useState('')
    const [replaceTerm, setReplaceTerm] = useState('')
    const [caseSensitive, setCaseSensitive] = useState(false)
    const [wholeWord, setWholeWord] = useState(false)
    const [useRegex, setUseRegex] = useState(false)
    const [currentMatch, setCurrentMatch] = useState(0)
    const [matchCount, setMatchCount] = useState(0)
    const [showReplace, setShowReplace] = useState(mode === 'replace')
    const searchRef = useRef(null)

    // Focus search input when visible
    useEffect(() => {
        if (visible && searchRef.current) {
            searchRef.current.focus()
            searchRef.current.select()
        }
    }, [visible])

    useEffect(() => {
        setShowReplace(mode === 'replace')
    }, [mode])

    // Count matches
    useEffect(() => {
        if (!searchTerm || !code) {
            setMatchCount(0)
            setCurrentMatch(0)
            return
        }
        try {
            const flags = caseSensitive ? 'g' : 'gi'
            let pattern = useRegex ? searchTerm : searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            if (wholeWord) pattern = `\\b${pattern}\\b`
            const regex = new RegExp(pattern, flags)
            const matches = code.match(regex)
            setMatchCount(matches ? matches.length : 0)
            if (currentMatch > (matches?.length || 0)) setCurrentMatch(matches ? 1 : 0)
            if (matches && currentMatch === 0) setCurrentMatch(1)
        } catch {
            setMatchCount(0)
        }
    }, [searchTerm, code, caseSensitive, wholeWord, useRegex])

    const handleReplace = useCallback(() => {
        if (!searchTerm || matchCount === 0) return
        try {
            const flags = caseSensitive ? '' : 'i'
            let pattern = useRegex ? searchTerm : searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            if (wholeWord) pattern = `\\b${pattern}\\b`
            const regex = new RegExp(pattern, flags)
            const newCode = code.replace(regex, replaceTerm)
            onCodeChange(newCode)
        } catch {}
    }, [searchTerm, replaceTerm, code, caseSensitive, wholeWord, useRegex, matchCount, onCodeChange])

    const handleReplaceAll = useCallback(() => {
        if (!searchTerm || matchCount === 0) return
        try {
            const flags = caseSensitive ? 'g' : 'gi'
            let pattern = useRegex ? searchTerm : searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            if (wholeWord) pattern = `\\b${pattern}\\b`
            const regex = new RegExp(pattern, flags)
            const newCode = code.replace(regex, replaceTerm)
            onCodeChange(newCode)
        } catch {}
    }, [searchTerm, replaceTerm, code, caseSensitive, wholeWord, useRegex, matchCount, onCodeChange])

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter' && !e.shiftKey) {
            // Next match
            setCurrentMatch(prev => prev < matchCount ? prev + 1 : 1)
        }
        if (e.key === 'Enter' && e.shiftKey) {
            // Previous match
            setCurrentMatch(prev => prev > 1 ? prev - 1 : matchCount)
        }
    }

    if (!visible) return null

    return (
        <div style={{
            position: 'absolute', top: 8, right: 8, zIndex: 50,
            background: 'rgba(18,18,30,0.98)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8,
            padding: '8px 12px', minWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
            {/* Find Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: showReplace ? 6 : 0 }}>
                {/* Expand toggle */}
                <button
                    onClick={() => setShowReplace(!showReplace)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 10, padding: 2,
                        transform: showReplace ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 0.15s',
                    }}
                >▶</button>

                <input
                    ref={searchRef}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Find..."
                    spellCheck="false"
                    style={inputStyle}
                />

                {/* Match count */}
                <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                    minWidth: 60, textAlign: 'center',
                }}>
                    {searchTerm ? (matchCount > 0 ? `${currentMatch} of ${matchCount}` : 'No results') : ''}
                </span>

                {/* Option toggles */}
                <ToggleBtn active={caseSensitive} onClick={() => setCaseSensitive(!caseSensitive)} title="Case Sensitive">Aa</ToggleBtn>
                <ToggleBtn active={wholeWord} onClick={() => setWholeWord(!wholeWord)} title="Whole Word">Ab</ToggleBtn>
                <ToggleBtn active={useRegex} onClick={() => setUseRegex(!useRegex)} title="Regex">.*</ToggleBtn>

                {/* Nav */}
                <button onClick={() => setCurrentMatch(p => p > 1 ? p - 1 : matchCount)} style={navBtn} title="Previous (Shift+Enter)">↑</button>
                <button onClick={() => setCurrentMatch(p => p < matchCount ? p + 1 : 1)} style={navBtn} title="Next (Enter)">↓</button>

                {/* Close */}
                <button onClick={onClose} style={navBtn} title="Close (Esc)">✕</button>
            </div>

            {/* Replace Row */}
            {showReplace && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 20 }}>
                    <input
                        value={replaceTerm}
                        onChange={e => setReplaceTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Replace..."
                        spellCheck="false"
                        style={inputStyle}
                    />
                    <button onClick={handleReplace} style={actionBtn} title="Replace">⇄</button>
                    <button onClick={handleReplaceAll} style={actionBtn} title="Replace All">⇄All</button>
                </div>
            )}
        </div>
    )
}

function ToggleBtn({ active, onClick, title, children }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                padding: '2px 5px', fontSize: 10, fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                background: active ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: active ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 3,
                color: active ? '#06b6d4' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.1s',
            }}
        >{children}</button>
    )
}

const inputStyle = {
    flex: 1, padding: '4px 8px', fontSize: 12,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4, color: 'var(--text-bright)',
    fontFamily: 'var(--font-mono)', outline: 'none',
}

const navBtn = {
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 3,
    cursor: 'pointer', fontSize: 11,
}

const actionBtn = {
    background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
    color: '#06b6d4', padding: '3px 8px', borderRadius: 3,
    cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
}
