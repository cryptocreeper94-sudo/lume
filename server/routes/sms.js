import { Router } from 'express'
import twilio from 'twilio'
import pool from '../db/pool.js'

const router = Router()

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// ── Opt In ──
router.post('/optin', async (req, res) => {
    try {
        const { phone, consent, marketing } = req.body
        if (!phone || !consent) return res.status(400).json({ error: 'Phone and consent required' })

        const digits = phone.replace(/\D/g, '')
        if (digits.length !== 10) return res.status(400).json({ error: 'Invalid phone number' })

        const formatted = `+1${digits}`

        // Store opt-in record
        await pool.query(
            `INSERT INTO sms_optins (phone, consent, marketing, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            [formatted, consent, marketing || false, req.ip, req.headers['user-agent']]
        )

        // Send confirmation SMS
        await client.messages.create({
            to: formatted,
            from: process.env.TWILIO_PHONE_NUMBER,
            body: 'DarkWave Studios: You\'re opted in for SMS notifications. Reply STOP to unsubscribe, HELP for help. Msg&data rates may apply.'
        })

        res.json({ success: true, message: 'Opted in successfully' })
    } catch (err) {
        console.error('SMS opt-in error:', err)
        res.status(500).json({ error: 'Failed to process opt-in' })
    }
})

// ── Opt Out ──
router.post('/optout', async (req, res) => {
    try {
        const { phone } = req.body
        const formatted = `+1${phone.replace(/\D/g, '')}`

        await pool.query(
            'UPDATE sms_optins SET opted_out = true, opted_out_at = NOW() WHERE phone = $1 AND opted_out = false',
            [formatted]
        )

        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to process opt-out' })
    }
})

// ── Twilio Webhook (incoming STOP/HELP) ──
router.post('/webhook', async (req, res) => {
    const body = (req.body.Body || '').trim().toUpperCase()
    const from = req.body.From

    if (body === 'STOP') {
        await pool.query(
            'UPDATE sms_optins SET opted_out = true, opted_out_at = NOW() WHERE phone = $1', [from]
        )
        const twiml = '<Response><Message>You have been unsubscribed. Reply START to resubscribe.</Message></Response>'
        res.type('text/xml').send(twiml)
    } else if (body === 'HELP') {
        const twiml = '<Response><Message>DarkWave Studios SMS. Email support@darkwavestudios.com for help. Reply STOP to cancel.</Message></Response>'
        res.type('text/xml').send(twiml)
    } else if (body === 'START') {
        await pool.query(
            'UPDATE sms_optins SET opted_out = false, opted_out_at = NULL WHERE phone = $1', [from]
        )
        const twiml = '<Response><Message>Welcome back! You are re-subscribed to DarkWave Studios SMS. Reply STOP to cancel.</Message></Response>'
        res.type('text/xml').send(twiml)
    } else {
        res.type('text/xml').send('<Response></Response>')
    }
})

export default router
