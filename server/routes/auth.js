import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import pool from '../db/pool.js'

const router = Router()

// ── Register ──
router.post('/register', async (req, res) => {
    try {
        const { email, password, display_name, referral } = req.body
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

        const hash = await bcrypt.hash(password, 12)
        const referralCode = crypto.randomBytes(6).toString('hex').toUpperCase()

        let referrerId = null
        if (referral) {
            const ref = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referral])
            if (ref.rows.length) referrerId = ref.rows[0].id
        }

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, display_name, referral_code, referred_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, display_name, referral_code, tier, created_at`,
            [email, hash, display_name || email.split('@')[0], referralCode, referrerId]
        )

        const user = result.rows[0]
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

        // Track referral
        if (referrerId && referral) {
            await pool.query(
                'INSERT INTO referrals (referrer_id, referred_id, code, status) VALUES ($1, $2, $3, $4)',
                [referrerId, user.id, referral, 'converted']
            )
        }

        res.status(201).json({ user, token })
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' })
        console.error('Register error:', err)
        res.status(500).json({ error: 'Registration failed' })
    }
})

// ── Login ──
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' })

        const user = result.rows[0]
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
        const { password_hash, ...safe } = user
        res.json({ user: safe, token })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ error: 'Login failed' })
    }
})

// ── SSO Exchange ──
router.post('/sso/exchange', async (req, res) => {
    try {
        const { sso_token } = req.body
        if (!sso_token) return res.status(400).json({ error: 'SSO token required' })

        // Verify with Trust Layer
        const tlRes = await fetch(`${process.env.TRUSTLAYER_BASE_URL}/api/sso/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.TRUSTLAYER_API_KEY
            },
            body: JSON.stringify({ token: sso_token })
        })

        if (!tlRes.ok) return res.status(401).json({ error: 'Invalid SSO token' })
        const tlUser = await tlRes.json()

        // Upsert user
        const result = await pool.query(
            `INSERT INTO users (email, sso_id, display_name, referral_code)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (sso_id) DO UPDATE SET email = $1, updated_at = NOW()
             RETURNING id, email, display_name, referral_code, tier, signal_balance`,
            [tlUser.email, tlUser.id, tlUser.display_name, crypto.randomBytes(6).toString('hex').toUpperCase()]
        )

        const user = result.rows[0]
        const token = jwt.sign({ id: user.id, email: user.email, sso: true }, process.env.JWT_SECRET, { expiresIn: '7d' })
        res.json({ user, token })
    } catch (err) {
        console.error('SSO exchange error:', err)
        res.status(500).json({ error: 'SSO exchange failed' })
    }
})

// ── Get Profile ──
router.get('/me', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, display_name, referral_code, tier, signal_balance, sms_consent, created_at FROM users WHERE id = $1',
            [req.user.id]
        )
        if (!result.rows.length) return res.status(404).json({ error: 'User not found' })
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' })
    }
})

export default router
