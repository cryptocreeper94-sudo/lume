/**
 * HelpPanel — Slide-in reference panel for the Lume IDE
 * Language Reference, Keyboard Shortcuts, Getting Started guide.
 */
import { useState } from 'react'
import { getShortcutsByCategory } from './useKeyboardShortcuts'

const TABS = ['📖 Reference', '⌨️ Shortcuts', '🎓 Start', '🔗 Links']

/* ── Language Reference Data ── */
const LANG_REF = [
    {
        title: 'Mode Declaration',
        syntax: 'mode: english',
        desc: 'Sets the file to English (natural language) mode. Place at the top of your file.',
    },
    {
        title: 'Show / Display',
        syntax: 'show the result on screen',
        desc: 'Outputs a value to the console or a UI target.',
    },
    {
        title: 'Variables',
        syntax: 'set the price to 100',
        desc: 'Declares or assigns a variable using natural language.',
    },
    {
        title: 'Create',
        syntax: 'create a new user with name, email',
        desc: 'Creates a new object or record with optional fields.',
    },
    {
        title: 'Read / Get',
        syntax: 'get all users from the database',
        desc: 'Retrieves data from a source (variable, database, API).',
    },
    {
        title: 'Update',
        syntax: 'update the status to active',
        desc: 'Modifies an existing variable or record.',
    },
    {
        title: 'Delete',
        syntax: 'delete the old records from storage',
        desc: 'Removes data from a variable or collection.',
    },
    {
        title: 'Loops',
        syntax: 'for each item in the cart\n  show the item on screen',
        desc: 'Iterates over a collection. Also supports: repeat X times, while condition.',
    },
    {
        title: 'Conditionals',
        syntax: 'if the status is active\n  show the user on dashboard',
        desc: 'Executes code based on a condition. Supports: if, when, check if.',
    },
    {
        title: 'AI Integration',
        syntax: 'ask the ai to summarize the report',
        desc: 'Sends a prompt to the AI engine. Keywords: ask, think, generate.',
    },
    {
        title: 'Math Operations',
        syntax: 'add 15 to the price\nsubtract 10 from the total\nmultiply the quantity by 3',
        desc: 'Arithmetic using natural language. Operates on variables.',
    },
    {
        title: 'Error Handling',
        syntax: 'try to fetch the data from the api\n  or fail with connection timeout',
        desc: 'Wraps operations in a try/catch block with fallback messages.',
    },
    {
        title: 'Navigation',
        syntax: 'redirect the user to /dashboard',
        desc: 'Navigates to a URL or route.',
    },
    {
        title: 'Send',
        syntax: 'send the order to payment gateway',
        desc: 'Dispatches data to an endpoint or service.',
    },
    {
        title: 'Monitor (L1)',
        syntax: 'monitor this function',
        desc: 'Activates Layer 1 self-monitoring for a function or block.',
    },
    {
        title: 'Comments',
        syntax: '# This is a comment',
        desc: 'Lines starting with # are comments (ignored by compiler).',
    },
    {
        title: 'Standard Mode',
        syntax: 'let name = "Lume"\nshow "Hello, {name}!"',
        desc: 'Traditional Lume syntax (no mode: english). Uses let, to/end, show.',
    },
]

/* ── Getting Started Steps ── */
const GETTING_STARTED = [
    { step: 1, title: 'Choose Your Mode', text: 'Start with `mode: english` at the top for natural language, or write standard Lume syntax directly.' },
    { step: 2, title: 'Write Your First Program', text: 'Try: `set the greeting to Hello World` then `show the greeting on screen`.' },
    { step: 3, title: 'Hit Run', text: 'Press ▶ Run or Ctrl+Enter to execute. Start in Sandbox mode for instant feedback.' },
    { step: 4, title: 'Check the AST', text: 'The AST tab shows how Lume parsed your natural language into executable nodes.' },
    { step: 5, title: 'Try Voice Input', text: 'Click 🎤 Voice and speak your code in plain English. Lume transcribes and compiles it.' },
    { step: 6, title: 'Go Live', text: 'Switch to Live mode to use the full Lume compiler on the server for 100% accurate compilation.' },
    { step: 7, title: 'Save & Export', text: 'Save programs to your browser or export as .lume files for use in the DarkWave Studio IDE.' },
]

/* ── Links ── */
const LINKS = [
    { label: 'Lume Website', url: '/', icon: '🌐' },
    { label: 'Blog & Tutorials', url: '/blog', icon: '📝' },
    { label: 'DarkWave Academy', url: 'https://academy.dwtl.io', icon: '🎓' },
    { label: 'DarkWave Studio IDE', url: 'https://studio.tlid.io', icon: '💻' },
    { label: 'Trust Layer Ecosystem', url: 'https://dwtl.io', icon: '🔗' },
    { label: 'GitHub Repository', url: 'https://github.com/cryptocreeper94-sudo/lume', icon: '📦' },
    { label: 'Report an Issue', url: 'https://github.com/cryptocreeper94-sudo/lume/issues', icon: '🐛' },
    { label: 'Signal Chat Support', url: '#', icon: '💬', note: 'Open the Signal Chat widget →' },
]

export default function HelpPanel({ visible, initialTab, onClose }) {
    const [activeTab, setActiveTab] = useState(initialTab || 0)
    const shortcuts = getShortcutsByCategory()

    if (!visible) return null

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            zIndex: 9998,
            background: 'rgba(10,10,18,0.98)', backdropFilter: 'blur(30px)',
            borderLeft: '1px solid rgba(6,182,212,0.15)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.2s ease-out',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span style={{
                    fontSize: 14, fontWeight: 800, color: 'var(--text-bright)',
                    letterSpacing: 0.5,
                }}>
                    ◆ Lume Help
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-muted)', cursor: 'pointer', padding: '3px 8px',
                        borderRadius: 4, fontSize: 12,
                    }}
                >✕ Close</button>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 0,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {TABS.map((tab, i) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(i)}
                        style={{
                            padding: '8px 16px', fontSize: 11, fontWeight: 600,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: activeTab === i ? '#06b6d4' : 'var(--text-muted)',
                            borderBottom: activeTab === i ? '2px solid #06b6d4' : '2px solid transparent',
                        }}
                    >{tab}</button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {/* Language Reference */}
                {activeTab === 0 && LANG_REF.map((item, i) => (
                    <div key={i} style={{
                        marginBottom: 16, padding: '12px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 8,
                    }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700, color: '#06b6d4', marginBottom: 6,
                        }}>{item.title}</div>
                        <pre style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
                            color: 'var(--text-bright)', margin: '0 0 6px',
                            padding: '6px 10px', borderRadius: 4,
                            background: 'rgba(0,0,0,0.3)',
                            whiteSpace: 'pre-wrap',
                        }}>{item.syntax}</pre>
                        <div style={{
                            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
                        }}>{item.desc}</div>
                    </div>
                ))}

                {/* Keyboard Shortcuts */}
                {activeTab === 1 && Object.entries(shortcuts).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: 1.5, color: '#06b6d4', marginBottom: 8,
                        }}>{cat}</div>
                        {items.map(s => (
                            <div key={s.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '5px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {s.icon} {s.label}
                                </span>
                                <span style={{
                                    fontSize: 10, fontFamily: 'var(--font-mono)',
                                    padding: '2px 8px', borderRadius: 4,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'var(--text-muted)',
                                }}>{s.keys}</span>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Getting Started */}
                {activeTab === 2 && (
                    <div>
                        <div style={{
                            padding: '12px 14px', marginBottom: 16, borderRadius: 8,
                            background: 'rgba(6,182,212,0.05)',
                            border: '1px solid rgba(6,182,212,0.15)',
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>
                                Welcome to Lume! 🚀
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Lume is the first AI-native programming language. Write code in plain English — the compiler understands you.
                            </div>
                        </div>
                        {GETTING_STARTED.map(s => (
                            <div key={s.step} style={{
                                display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start',
                            }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800, color: '#06b6d4',
                                    fontFamily: 'var(--font-mono)',
                                }}>{s.step}</div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 2 }}>
                                        {s.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        {s.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Links */}
                {activeTab === 3 && LINKS.map((link, i) => (
                    <a
                        key={i}
                        href={link.url}
                        target={link.url.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', marginBottom: 4,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            borderRadius: 6, textDecoration: 'none',
                            transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                        <span style={{ fontSize: 16 }}>{link.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-bright)', fontWeight: 600 }}>
                                {link.label}
                            </div>
                            {link.note && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                                    {link.note}
                                </div>
                            )}
                        </div>
                        {link.url.startsWith('http') && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.4 }}>↗</span>
                        )}
                    </a>
                ))}
            </div>
        </div>
    )
}
