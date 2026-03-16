/**
 * useKeyboardShortcuts — Centralized keyboard shortcut registry for the Lume IDE
 * 
 * Provides a single source of truth for all shortcuts, used by:
 *  - MenuBar (displays shortcuts next to menu items)
 *  - CommandPalette (searchable shortcut list)
 *  - HelpPanel (keyboard shortcuts reference)
 *  - PlaygroundPage (actual event handling)
 */
import { useEffect, useCallback, useRef } from 'react'

/* ── Shortcut Definitions ── */
export const SHORTCUTS = [
    // File
    { id: 'file.new',       keys: 'Ctrl+N',       label: 'New File',           category: 'File',     icon: '📄' },
    { id: 'file.open',      keys: 'Ctrl+O',       label: 'Open',              category: 'File',     icon: '📂' },
    { id: 'file.save',      keys: 'Ctrl+S',       label: 'Save',              category: 'File',     icon: '💾' },
    { id: 'file.saveAs',    keys: 'Ctrl+Shift+S', label: 'Save As...',        category: 'File',     icon: '💾' },
    { id: 'file.export',    keys: 'Ctrl+Shift+X', label: 'Export .lume',      category: 'File',     icon: '⬇' },

    // Edit
    { id: 'edit.undo',      keys: 'Ctrl+Z',       label: 'Undo',              category: 'Edit',     icon: '↩' },
    { id: 'edit.redo',      keys: 'Ctrl+Y',       label: 'Redo',              category: 'Edit',     icon: '↪' },
    { id: 'edit.find',      keys: 'Ctrl+F',       label: 'Find',              category: 'Edit',     icon: '🔍' },
    { id: 'edit.replace',   keys: 'Ctrl+H',       label: 'Find & Replace',    category: 'Edit',     icon: '🔄' },
    { id: 'edit.comment',   keys: 'Ctrl+/',       label: 'Toggle Comment',    category: 'Edit',     icon: '//' },
    { id: 'edit.selectAll', keys: 'Ctrl+A',       label: 'Select All',        category: 'Edit',     icon: '☐' },

    // View
    { id: 'view.terminal',    keys: 'Ctrl+`',       label: 'Toggle Terminal',     category: 'View',   icon: '⬛' },
    { id: 'view.console',     keys: 'Ctrl+J',       label: 'Toggle Console',      category: 'View',   icon: '📋' },
    { id: 'view.sidebar',     keys: 'Ctrl+B',       label: 'Toggle Sidebar',      category: 'View',   icon: '📁' },
    { id: 'view.commandPalette', keys: 'Ctrl+Shift+P', label: 'Command Palette', category: 'View',   icon: '⚡' },
    { id: 'view.help',        keys: 'F1',            label: 'Help',               category: 'View',   icon: '❓' },
    { id: 'view.zoomIn',      keys: 'Ctrl+=',        label: 'Zoom In',            category: 'View',   icon: '🔍' },
    { id: 'view.zoomOut',     keys: 'Ctrl+-',        label: 'Zoom Out',           category: 'View',   icon: '🔍' },

    // Run
    { id: 'run.run',          keys: 'Ctrl+Enter',      label: 'Run',              category: 'Run',    icon: '▶' },
    { id: 'run.runSkip',      keys: 'Ctrl+Shift+Enter', label: 'Run (Skip Review)', category: 'Run',  icon: '⏩' },
    { id: 'run.build',        keys: 'F6',              label: 'Build',             category: 'Run',    icon: '🔨' },
    { id: 'run.explain',      keys: 'Ctrl+Shift+E',   label: 'Explain',           category: 'Run',    icon: '📖' },
    { id: 'run.stop',         keys: 'Shift+F5',        label: 'Stop',              category: 'Run',    icon: '⏹' },

    // Terminal
    { id: 'terminal.clear',   keys: 'Ctrl+L',          label: 'Clear Terminal',    category: 'Terminal', icon: '🧹' },

    // Tabs
    { id: 'tab.new',          keys: 'Ctrl+Shift+N',    label: 'New Tab',           category: 'File',   icon: '➕' },
    { id: 'tab.close',        keys: 'Ctrl+W',          label: 'Close Tab',         category: 'File',   icon: '✕' },
    { id: 'tab.next',         keys: 'Ctrl+Tab',        label: 'Next Tab',          category: 'File',   icon: '→' },
    { id: 'tab.prev',         keys: 'Ctrl+Shift+Tab',  label: 'Previous Tab',      category: 'File',   icon: '←' },
]

/* ── Parse shortcut strings into event matchers ── */
function parseShortcut(keys) {
    const parts = keys.toLowerCase().split('+')
    return {
        ctrl: parts.includes('ctrl'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        key: parts.filter(p => !['ctrl', 'shift', 'alt'].includes(p))[0],
    }
}

function matchesEvent(parsed, e) {
    const key = e.key.toLowerCase()
        .replace('escape', 'esc')
        .replace(' ', 'space')
    const ctrlMatch = parsed.ctrl === (e.ctrlKey || e.metaKey)
    const shiftMatch = parsed.shift === e.shiftKey
    const altMatch = parsed.alt === e.altKey

    // Handle special key names
    const keyMatch = key === parsed.key
        || (parsed.key === '`' && key === '`')
        || (parsed.key === 'enter' && key === 'enter')
        || (parsed.key === 'tab' && key === 'tab')
        || (parsed.key === '=' && (key === '=' || key === '+'))
        || (parsed.key === '-' && key === '-')
        || (parsed.key === '/' && key === '/')

    return ctrlMatch && shiftMatch && altMatch && keyMatch
}

/* ── The Hook ── */
export function useKeyboardShortcuts(handlers) {
    const handlersRef = useRef(handlers)
    handlersRef.current = handlers

    useEffect(() => {
        const parsedShortcuts = SHORTCUTS.map(s => ({
            ...s,
            parsed: parseShortcut(s.keys),
        }))

        function onKeyDown(e) {
            for (const shortcut of parsedShortcuts) {
                if (matchesEvent(shortcut.parsed, e)) {
                    const handler = handlersRef.current[shortcut.id]
                    if (handler) {
                        e.preventDefault()
                        e.stopPropagation()
                        handler()
                        return
                    }
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])
}

/* ── Utility: Get shortcut label for display ── */
export function getShortcutLabel(id) {
    const s = SHORTCUTS.find(s => s.id === id)
    return s ? s.keys : ''
}

/* ── Utility: Get all shortcuts by category ── */
export function getShortcutsByCategory() {
    const categories = {}
    for (const s of SHORTCUTS) {
        if (!categories[s.category]) categories[s.category] = []
        categories[s.category].push(s)
    }
    return categories
}
