import { Router } from 'express'
import pool from '../db/pool.js'
import { auth } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

const TIERS = {
    bronze: { min: 0, rate: 0.10, label: 'Bronze' },
    silver: { min: 10, rate: 0.15, label: 'Silver' },
    gold: { min: 25, rate: 0.20, label: 'Gold' },
    diamond: { min: 50, rate: 0.25, label: 'Diamond' },
}

// ── Get Tiers (public) ──
router.get('/tiers', (req, res) => {
    res.json(TIERS)
})

// ── Get My Stats (auth) ──
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT referral_code, tier, signal_balance FROM users WHERE id = $1', [req.user.id]
        )
        if (!user.rows.length) return res.status(404).json({ error: 'User not found' })

        const referrals = await pool.query(
            'SELECT status, COUNT(*), SUM(signal_earned) as earned FROM referrals WHERE referrer_id = $1 GROUP BY status',
            [req.user.id]
        )

        res.json({
            referral_code: user.rows[0].referral_code,
            tier: user.rows[0].tier,
            signal_balance: user.rows[0].signal_balance,
            referrals: referrals.rows
        })
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch affiliate stats' })
    }
})

// ── Generate Referral Code (auth) ──
router.post('/generate', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT referral_code FROM users WHERE id = $1', [req.user.id])
        if (!result.rows.length) return res.status(404).json({ error: 'User not found' })

        if (result.rows[0].referral_code) {
            return res.json({ code: result.rows[0].referral_code })
        }

        const code = crypto.randomBytes(6).toString('hex').toUpperCase()
        await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, req.user.id])
        res.json({ code })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate referral code' })
    }
})

// ── Track Referral Click (public) ──
router.post('/track', async (req, res) => {
    try {
        const { code } = req.body
        if (!code) return res.status(400).json({ error: 'Referral code required' })

        const ref = await pool.query('SELECT id FROM users WHERE referral_code = $1', [code])
        if (!ref.rows.length) return res.status(404).json({ error: 'Invalid referral code' })

        await pool.query(
            'INSERT INTO referrals (referrer_id, code, status) VALUES ($1, $2, $3)',
            [ref.rows[0].id, code, 'pending']
        )

        res.json({ tracked: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to track referral' })
    }
})

export default router
