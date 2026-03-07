import { Router } from 'express'
import pool from '../db/pool.js'
import { auth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// ── List Posts (public) ──
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, tag } = req.query
        const offset = (page - 1) * limit
        let query = 'SELECT id, slug, title, excerpt, thumbnail, author, tags, created_at FROM blog_posts WHERE published = true'
        const params = []

        if (tag) {
            params.push(tag)
            query += ` AND $${params.length} = ANY(tags)`
        }

        query += ' ORDER BY created_at DESC'
        params.push(limit, offset)
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`

        const result = await pool.query(query, params)
        const count = await pool.query('SELECT COUNT(*) FROM blog_posts WHERE published = true')

        res.json({
            posts: result.rows,
            total: parseInt(count.rows[0].count),
            page: parseInt(page),
            totalPages: Math.ceil(count.rows[0].count / limit)
        })
    } catch (err) {
        console.error('Blog list error:', err)
        res.status(500).json({ error: 'Failed to fetch posts' })
    }
})

// ── Get Single Post (public) ──
router.get('/:slug', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM blog_posts WHERE slug = $1 AND published = true', [req.params.slug]
        )
        if (!result.rows.length) return res.status(404).json({ error: 'Post not found' })
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch post' })
    }
})

// ── Create Post (auth required) ──
router.post('/', auth, async (req, res) => {
    try {
        const { title, slug, excerpt, body, thumbnail, tags, published } = req.body
        if (!title || !body) return res.status(400).json({ error: 'Title and body required' })

        const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const result = await pool.query(
            `INSERT INTO blog_posts (title, slug, excerpt, body, thumbnail, tags, published)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, postSlug, excerpt || '', body, thumbnail || '', tags || [], published !== false]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Slug already exists' })
        console.error('Blog create error:', err)
        res.status(500).json({ error: 'Failed to create post' })
    }
})

// ── Update Post (auth required) ──
router.put('/:slug', auth, async (req, res) => {
    try {
        const { title, excerpt, body, thumbnail, tags, published } = req.body
        const result = await pool.query(
            `UPDATE blog_posts SET title = COALESCE($1, title), excerpt = COALESCE($2, excerpt),
             body = COALESCE($3, body), thumbnail = COALESCE($4, thumbnail), tags = COALESCE($5, tags),
             published = COALESCE($6, published), updated_at = NOW()
             WHERE slug = $7 RETURNING *`,
            [title, excerpt, body, thumbnail, tags, published, req.params.slug]
        )
        if (!result.rows.length) return res.status(404).json({ error: 'Post not found' })
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update post' })
    }
})

// ── Delete Post (auth required) ──
router.delete('/:slug', auth, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM blog_posts WHERE slug = $1 RETURNING id', [req.params.slug])
        if (!result.rows.length) return res.status(404).json({ error: 'Post not found' })
        res.json({ deleted: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete post' })
    }
})

export default router
