import { useState } from 'react'

export default function SmsOptIn() {
    const [phone, setPhone] = useState('')
    const [consent, setConsent] = useState(false)
    const [marketing, setMarketing] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const formatPhone = (v) => {
        const digits = v.replace(/\D/g, '').slice(0, 10)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const digits = phone.replace(/\D/g, '')
        if (digits.length !== 10) { setError('Please enter a valid 10-digit phone number.'); return }
        if (!consent) { setError('You must agree to receive SMS messages.'); return }
        setError('')
        // Will POST to backend: /api/sms/optin
        console.log('SMS Opt-In:', { phone: `+1${digits}`, consent: true, marketing })
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <div className="login-page">
                <div className="orb orb-1" /><div className="orb orb-3" />
                <div className="login-card" style={{ maxWidth: 440, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h2 style={{ color: 'var(--text-bright)', marginBottom: 8 }}>You're Opted In</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        You'll receive SMS notifications from DarkWave Studios at the number provided.
                        To opt out at any time, reply <strong style={{ color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>STOP</strong> to any message.
                    </p>
                    <a href="/" className="btn-primary-lg" style={{ display: 'inline-flex', marginTop: 20, justifyContent: 'center' }}>← Back to Lume</a>
                </div>
            </div>
        )
    }

    return (
        <div className="login-page">
            <div className="orb orb-1" /><div className="orb orb-2" />
            <div className="login-card" style={{ maxWidth: 480 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
                    <h2 style={{ color: 'var(--text-bright)', fontSize: 20, marginBottom: 4 }}>SMS Notifications</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Opt in to receive account alerts and updates via text message</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Phone Number */}
                    <div style={{ marginBottom: 20 }}>
                        <label className="form-label">Mobile Phone Number</label>
                        <input
                            className="form-input"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={phone}
                            onChange={e => setPhone(formatPhone(e.target.value))}
                            style={{ fontSize: 18, letterSpacing: 1, fontFamily: 'var(--font-mono)' }}
                        />
                    </div>

                    {/* Required Consent Checkbox */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={e => setConsent(e.target.checked)}
                                style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>I agree to receive SMS messages</strong> from DarkWave Studios LLC regarding my account, security alerts, and service notifications.
                                Message frequency varies. Message and data rates may apply.
                                Reply <strong style={{ color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>STOP</strong> to cancel,{' '}
                                <strong style={{ color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>HELP</strong> for help.
                                <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>
                            </span>
                        </label>
                    </div>

                    {/* Optional Marketing Checkbox */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={marketing}
                                onChange={e => setMarketing(e.target.checked)}
                                style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                I also agree to receive <strong style={{ color: 'var(--text-primary)' }}>promotional messages</strong> about new features, ecosystem updates, and special offers from the Trust Layer ecosystem. <em>(Optional)</em>
                            </span>
                        </label>
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="btn-primary-lg" style={{ width: '100%', justifyContent: 'center' }}>
                        Opt In to SMS
                    </button>
                </form>

                {/* Legal Disclosures */}
                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>SMS Terms & Conditions</div>
                    <ul style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                        <li>By opting in, you consent to receive text messages from <strong>DarkWave Studios LLC</strong> at the phone number provided.</li>
                        <li>Messages may include: account verification codes, security alerts, service notifications, and (if selected) promotional content.</li>
                        <li>Message frequency varies based on account activity. Typically 1–5 messages per month.</li>
                        <li><strong>Message and data rates may apply.</strong> Check with your carrier for details.</li>
                        <li>Reply <strong style={{ color: 'var(--accent-glow)' }}>STOP</strong> to any message to unsubscribe. Reply <strong style={{ color: 'var(--accent-glow)' }}>HELP</strong> for customer support.</li>
                        <li>Your consent is not a condition of purchase or use of our services.</li>
                        <li>We will not share your phone number with third parties for marketing purposes.</li>
                        <li>Supported carriers include: AT&T, Verizon, T-Mobile, Sprint, and most major US carriers.</li>
                        <li>For questions, email <span style={{ color: 'var(--accent)' }}>support@darkwavestudios.com</span> or visit our <a href="/legal" style={{ color: 'var(--accent)' }}>privacy policy</a>.</li>
                    </ul>
                </div>

                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                    © {new Date().getFullYear()} DarkWave Studios LLC. All rights reserved.
                </div>
            </div>
        </div>
    )
}
