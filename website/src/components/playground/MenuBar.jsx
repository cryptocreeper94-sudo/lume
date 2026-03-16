/**
 * MenuBar — Professional IDE menu bar for the Lume Playground
 * File / Edit / View / Run / Terminal / Help with keyboard shortcut labels.
 */
import { useState, useRef, useEffect } from 'react'
import { getShortcutLabel } from './useKeyboardShortcuts'

/* ── Menu Definitions ── */
const MENUS = [
    {
        label: 'File', items: [
            { id: 'file.new', label: 'New File', shortcut: 'file.new' },
            { id: 'file.open', label: 'Open...', shortcut: 'file.open' },
            { divider: true },
            { id: 'file.save', label: 'Save', shortcut: 'file.save' },
            { id: 'file.saveAs', label: 'Save As...', shortcut: 'file.saveAs' },
            { divider: true },
            { id: 'file.export', label: 'Export .lume', shortcut: 'file.export' },
            { id: 'file.import', label: 'Import .lume...' },
        ]
    },
    {
        label: 'Edit', items: [
            { id: 'edit.undo', label: 'Undo', shortcut: 'edit.undo' },
            { id: 'edit.redo', label: 'Redo', shortcut: 'edit.redo' },
            { divider: true },
            { id: 'edit.find', label: 'Find', shortcut: 'edit.find' },
            { id: 'edit.replace', label: 'Find & Replace', shortcut: 'edit.replace' },
            { divider: true },
            { id: 'edit.comment', label: 'Toggle Comment', shortcut: 'edit.comment' },
            { id: 'edit.selectAll', label: 'Select All', shortcut: 'edit.selectAll' },
        ]
    },
    {
        label: 'View', items: [
            { id: 'view.terminal', label: 'Toggle Terminal', shortcut: 'view.terminal' },
            { id: 'view.console', label: 'Toggle Console', shortcut: 'view.console' },
            { id: 'view.sidebar', label: 'Toggle Sidebar', shortcut: 'view.sidebar' },
            { divider: true },
            { id: 'view.commandPalette', label: 'Command Palette', shortcut: 'view.commandPalette' },
            { divider: true },
            { id: 'view.zoomIn', label: 'Zoom In', shortcut: 'view.zoomIn' },
            { id: 'view.zoomOut', label: 'Zoom Out', shortcut: 'view.zoomOut' },
            { id: 'view.resetLayout', label: 'Reset Layout' },
        ]
    },
    {
        label: 'Run', items: [
            { id: 'run.run', label: 'Run', shortcut: 'run.run', accent: true },
            { id: 'run.runSkip', label: 'Run (Skip Review)', shortcut: 'run.runSkip' },
            { id: 'run.build', label: 'Build', shortcut: 'run.build' },
            { id: 'run.explain', label: 'Explain', shortcut: 'run.explain' },
            { divider: true },
            { id: 'run.toggleMode', label: 'Toggle Sandbox/Live' },
            { id: 'run.toggleVoice', label: 'Toggle Voice Input' },
        ]
    },
    {
        label: 'Terminal', items: [
            { id: 'view.terminal', label: 'New Terminal', shortcut: 'view.terminal' },
            { id: 'terminal.clear', label: 'Clear Terminal', shortcut: 'terminal.clear' },
            { divider: true },
            { id: 'terminal.lumeTest', label: 'Run lume test' },
            { id: 'terminal.lumeFmt', label: 'Run lume fmt' },
            { id: 'terminal.lumeLint', label: 'Run lume lint' },
        ]
    },
    {
        label: 'Help', items: [
            { id: 'view.help', label: 'Language Reference', shortcut: 'view.help' },
            { id: 'help.shortcuts', label: 'Keyboard Shortcuts' },
            { divider: true },
            { id: 'help.examples', label: 'Load Examples' },
            { id: 'help.gettingStarted', label: 'Getting Started' },
            { divider: true },
            { id: 'help.about', label: 'About Lume' },
            { id: 'help.github', label: 'GitHub Repository ↗' },
            { id: 'help.reportIssue', label: 'Report Issue ↗' },
        ]
    },
]

export default function MenuBar({ onAction }) {
    const [openMenu, setOpenMenu] = useState(null)
    const barRef = useRef(null)

    // Close menu on click outside
    useEffect(() => {
        if (openMenu === null) return
        function handleClick(e) {
            if (barRef.current && !barRef.current.contains(e.target)) {
                setOpenMenu(null)
            }
        }
        window.addEventListener('mousedown', handleClick)
        return () => window.removeEventListener('mousedown', handleClick)
    }, [openMenu])

    // Close on Escape
    useEffect(() => {
        if (openMenu === null) return
        function handleKey(e) {
            if (e.key === 'Escape') setOpenMenu(null)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [openMenu])

    return (
        <div ref={barRef} style={{
            display: 'flex', alignItems: 'center', gap: 0,
            padding: '0 8px', height: 32,
            background: 'linear-gradient(180deg, rgba(20,20,35,0.98), rgba(10,10,18,0.98))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12, fontFamily: 'var(--font-sans)',
            userSelect: 'none', flexShrink: 0, position: 'relative', zIndex: 100,
        }}>
            {/* Lume Logo Mark */}
            <span style={{
                fontSize: 13, fontWeight: 800, letterSpacing: 1,
                background: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginRight: 12, padding: '0 8px',
            }}>
                ◆ LUME
            </span>

            {MENUS.map((menu, mi) => (
                <div key={menu.label} style={{ position: 'relative' }}>
                    <button
                        onMouseDown={() => setOpenMenu(openMenu === mi ? null : mi)}
                        onMouseEnter={() => openMenu !== null && setOpenMenu(mi)}
                        style={{
                            padding: '4px 10px', fontSize: 12, fontWeight: 500,
                            background: openMenu === mi ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: 'none', borderRadius: 4,
                            color: openMenu === mi ? 'var(--text-bright)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'background 0.1s',
                        }}
                    >
                        {menu.label}
                    </button>

                    {/* Dropdown */}
                    {openMenu === mi && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: 2,
                            minWidth: 240, padding: '4px 0',
                            background: 'rgba(18,18,30,0.98)', backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                            zIndex: 200,
                        }}>
                            {menu.items.map((item, ii) => {
                                if (item.divider) {
                                    return <div key={ii} style={{
                                        height: 1, margin: '4px 8px',
                                        background: 'rgba(255,255,255,0.06)',
                                    }} />
                                }
                                return (
                                    <button
                                        key={item.id + ii}
                                        onClick={() => { onAction(item.id); setOpenMenu(null) }}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            width: '100%', padding: '6px 16px', fontSize: 12,
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: item.accent ? '#00b894' : 'var(--text-secondary)',
                                            fontWeight: item.accent ? 700 : 400,
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                                        onMouseLeave={e => e.target.style.background = 'none'}
                                    >
                                        <span>{item.label}</span>
                                        {item.shortcut && (
                                            <span style={{
                                                fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                                marginLeft: 24, opacity: 0.6,
                                            }}>
                                                {getShortcutLabel(item.shortcut)}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            ))}

            {/* Right side: Quick toolbar still available */}
            <div style={{ flex: 1 }} />
            <span style={{
                fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.4,
            }}>
                Ctrl+Shift+P for commands
            </span>
        </div>
    )
}
