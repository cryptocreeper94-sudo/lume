import { useState, useEffect, useRef } from 'react'

const DEMO_MESSAGES = [
    { user: 'LumeBot', text: 'Welcome to Signal Chat — #lume-support 🚀' },
    { user: 'dev_sarah', text: 'Has anyone tried the new @healable decorator? It\'s incredible.' },
    { user: 'LumeBot', text: 'Pro tip: Use `monitor: { dashboard: true }` to see live metrics!' },
]

export default function SignalChatWidget() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState(DEMO_MESSAGES)
    const [input, setInput] = useState('')
    const messagesRef = useRef(null)

    useEffect(() => {
        if (open && messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight
        }
    }, [open, messages])

    const sendMessage = () => {
        if (!input.trim()) return
        setMessages(prev => [...prev, { user: 'You', text: input }])
        setInput('')
        // Simulate bot response
        setTimeout(() => {
            setMessages(prev => [...prev, { user: 'LumeBot', text: 'Thanks for your message! A team member will respond shortly.' }])
        }, 1500)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage()
    }

    return (
        <>
            <button className="signal-tab" onClick={() => setOpen(true)} aria-label="Open Signal Chat">
                💬 Signal Chat
            </button>
            <div className={`signal-modal ${open ? 'open' : ''}`}>
                <div className="signal-header">
                    <h3>💬 Signal Chat <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>#lume-support</span></h3>
                    <button className="signal-close" onClick={() => setOpen(false)}>✕</button>
                </div>
                <div className="signal-messages" ref={messagesRef}>
                    {messages.map((m, i) => (
                        <div key={i} className="signal-msg">
                            <div className="signal-msg-user">{m.user}</div>
                            <div className="signal-msg-text">{m.text}</div>
                        </div>
                    ))}
                </div>
                <div className="signal-input-row">
                    <input
                        className="signal-input"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="signal-send" onClick={sendMessage}>Send</button>
                </div>
            </div>
        </>
    )
}
