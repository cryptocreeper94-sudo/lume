import { Resend } from 'resend'
import { Router } from 'express'

const router = Router()
const resend = new Resend(process.env.RESEND_API_KEY)

// ── Send Welcome Email ──
router.post('/welcome', async (req, res) => {
    try {
        const { email, name } = req.body
        if (!email) return res.status(400).json({ error: 'Email required' })

        await resend.emails.send({
            from: 'DarkWave Studios <noreply@lume-lang.org>',
            to: email,
            subject: 'Welcome to Lume — The AI-Native Programming Language',
            html: `
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #06060a; color: #e0e0e0; padding: 40px; border-radius: 12px;">
                    <h1 style="color: #22d3ee; font-size: 24px;">Welcome to Lume, ${name || 'Developer'}!</h1>
                    <p style="line-height: 1.8;">You've joined the first programming language where AI is a syntax primitive — not a library import.</p>
                    <p style="line-height: 1.8;">Here's what you can do:</p>
                    <ul style="line-height: 2;">
                        <li>Write AI-powered programs with <code>ask</code>, <code>think</code>, and <code>generate</code></li>
                        <li>Deploy self-sustaining programs that heal and optimize themselves</li>
                        <li>Earn Signal through referrals and hallmarking</li>
                    </ul>
                    <a href="https://lume-lang.org" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #06b6d4, #14b8a6); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">Get Started →</a>
                    <hr style="border: 1px solid #1a1a2e; margin: 32px 0;">
                    <p style="font-size: 11px; color: #666;">DarkWave Studios LLC · Trust Layer Ecosystem</p>
                </div>
            `
        })

        res.json({ sent: true })
    } catch (err) {
        console.error('Email error:', err)
        res.status(500).json({ error: 'Failed to send email' })
    }
})

// ── Send Verification Code ──
router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body
        await resend.emails.send({
            from: 'Lume <noreply@lume-lang.org>',
            to: email,
            subject: `Your Lume verification code: ${code}`,
            html: `
                <div style="font-family: Inter, sans-serif; max-width: 400px; margin: 0 auto; background: #06060a; color: #e0e0e0; padding: 40px; border-radius: 12px; text-align: center;">
                    <h2 style="color: #22d3ee;">Verification Code</h2>
                    <div style="font-size: 36px; font-family: monospace; letter-spacing: 8px; color: #14b8a6; padding: 20px; background: #0a0a14; border-radius: 8px; margin: 20px 0;">${code}</div>
                    <p style="font-size: 12px; color: #666;">This code expires in 10 minutes.</p>
                </div>
            `
        })
        res.json({ sent: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to send verification email' })
    }
})

export default router
