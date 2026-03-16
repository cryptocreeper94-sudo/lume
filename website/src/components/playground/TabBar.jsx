/**
 * TabBar — Multi-tab editing for the Lume IDE Playground
 * Supports multiple open programs with unsaved-change indicators.
 */
import { useState, useRef } from 'react'

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) {
    const [contextMenu, setContextMenu] = useState(null)
    const barRef = useRef(null)

    const handleContextMenu = (e, tabId) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, tabId })
    }

    const closeContextMenu = () => setContextMenu(null)

    return (
        <div ref={barRef} style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: 'rgba(12,12,22,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            height: 34, overflow: 'hidden', flexShrink: 0,
            position: 'relative',
        }}>
            {/* Tabs */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
                {tabs.map(tab => {
                    const isActive = tab.id === activeTabId
                    return (
                        <div
                            key={tab.id}
                            onClick={() => onSelectTab(tab.id)}
                            onContextMenu={e => handleContextMenu(e, tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '0 12px', height: '100%',
                                background: isActive
                                    ? 'rgba(6,182,212,0.06)'
                                    : 'transparent',
                                borderRight: '1px solid rgba(255,255,255,0.04)',
                                borderBottom: isActive
                                    ? '2px solid #06b6d4'
                                    : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                                minWidth: 0,
                                maxWidth: 180,
                            }}
                        >
                            {/* File icon */}
                            <span style={{
                                fontSize: 11, opacity: 0.6, flexShrink: 0,
                                color: isActive ? '#06b6d4' : 'var(--text-muted)',
                            }}>
                                ◇
                            </span>

                            {/* Tab Name */}
                            <span style={{
                                fontSize: 11, fontWeight: isActive ? 600 : 400,
                                color: isActive ? 'var(--text-bright)' : 'var(--text-secondary)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {tab.name}
                            </span>

                            {/* Unsaved indicator */}
                            {tab.modified && (
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#06b6d4', flexShrink: 0,
                                }} />
                            )}

                            {/* Close button */}
                            {tabs.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
                                    style={{
                                        background: 'none', border: 'none', padding: '0 2px',
                                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
                                        opacity: 0.4, flexShrink: 0, lineHeight: 1,
                                    }}
                                    onMouseEnter={e => e.target.style.opacity = 1}
                                    onMouseLeave={e => e.target.style.opacity = 0.4}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* New Tab Button */}
            <button
                onClick={onNewTab}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 14, padding: '0 10px',
                    height: '100%', display: 'flex', alignItems: 'center',
                    transition: 'color 0.1s',
                }}
                onMouseEnter={e => e.target.style.color = '#06b6d4'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                title="New Tab (Ctrl+Shift+N)"
            >
                +
            </button>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                        onClick={closeContextMenu}
                    />
                    <div style={{
                        position: 'fixed', left: contextMenu.x, top: contextMenu.y,
                        minWidth: 160, padding: '4px 0', zIndex: 1000,
                        background: 'rgba(18,18,30,0.98)', backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                        {[
                            { label: 'Close', action: () => onCloseTab(contextMenu.tabId) },
                            { label: 'Close Others', action: () => {
                                tabs.forEach(t => { if (t.id !== contextMenu.tabId) onCloseTab(t.id) })
                            }},
                            { label: 'Close All', action: () => {
                                tabs.forEach(t => onCloseTab(t.id))
                            }},
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => { item.action(); closeContextMenu() }}
                                style={{
                                    display: 'block', width: '100%', padding: '6px 16px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-secondary)', fontSize: 12, textAlign: 'left',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
