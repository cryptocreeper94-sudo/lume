import { Router } from 'express'
import crypto from 'crypto'
import pool from '../db/pool.js'
import { auth } from '../middleware/auth.js'

const router = Router()

function generateHallmarkId() {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `TN-${hex}`
}

// ── Submit for Hallmarking (auth) ──
router.post('/', auth, async (req, res) => {
    try {
        const { program_name, program_hash } = req.body
        if (!program_name) return res.status(400).json({ error: 'Program name required' })

        const hallmarkId = generateHallmarkId()
        const hash = program_hash || crypto.createHash('sha256').update(program_name + Date.now()).digest('hex')

        const result = await pool.query(
            `INSERT INTO hallmarks (hallmark_id, user_id, program_name, program_hash, status)
             VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
            [hallmarkId, req.user.id, program_name, hash]
        )

        // In production: submit to Trust Layer blockchain
        // const tlRes = await fetch(`${process.env.TRUSTLAYER_BASE_URL}/api/hallmark/mint`, { ... })

        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error('Hallmark error:', err)
        res.status(500).json({ error: 'Failed to create hallmark' })
    }
})

// ── Get Hallmark Status (auth) ──
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM hallmarks WHERE hallmark_id = $1', [req.params.id])
        if (!result.rows.length) return res.status(404).json({ error: 'Hallmark not found' })
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch hallmark' })
    }
})

// ── Verify Hallmark (public) ──
router.get('/verify/:tn', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT h.hallmark_id, h.program_name, h.status, h.created_at, h.verified_at, u.display_name as author
             FROM hallmarks h LEFT JOIN users u ON h.user_id = u.id
             WHERE h.hallmark_id = $1`,
            [req.params.tn]
        )
        if (!result.rows.length) return res.status(404).json({ verified: false, error: 'Hallmark not found' })
        res.json({ verified: true, hallmark: result.rows[0] })
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' })
    }
})

// ── My Hallmarks (auth) ──
router.get('/user/mine', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM hallmarks WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]
        )
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch hallmarks' })
    }
})

export default router
