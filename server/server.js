import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { auth } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import blogRoutes from './routes/blog.js'
import affiliateRoutes from './routes/affiliate.js'
import smsRoutes from './routes/sms.js'
import hallmarkRoutes from './routes/hallmark.js'
import emailRoutes from './routes/email.js'
import compileRoutes from './routes/compile.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ── Security ──
app.use(helmet())
app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        'https://lume-lang.org',
        'https://www.lume-lang.org',
        'https://lume-lang.com',
        'http://localhost:5173',
    ],
    credentials: true,
}))

// ── Rate Limiting ──
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// Auth endpoints get stricter limits
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later.' }
})

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health Check ──
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'lume-server',
        version: '0.8.0',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    })
})

// ── Meta (for DarkWave Studios catalog) ──
app.get('/api/meta', (req, res) => {
    res.json({
        name: 'Lume',
        version: '0.8.0',
        status: 'active',
        category: 'Developer Tools',
        stack: 'Node/Express + PostgreSQL',
        website: 'https://lume-lang.org',
        repo: 'github.com/cryptocreeper94-sudo/lume',
        tests: 366,
        milestones: 13,
        loc: 10800,
        ecosystem: 'Trust Layer'
    })
})

// ── Routes ──
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/auth/me', auth, authRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/affiliate', affiliateRoutes)
app.use('/api/sms', smsRoutes)
app.use('/api/hallmark', hallmarkRoutes)
app.use('/api/email', emailRoutes)

// Compile sandbox — stricter rate limit
const compileLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many compile requests, slow down.' }
})
app.use('/api/compile', compileLimiter, compileRoutes)

// ── 404 ──
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
})

// ── Error Handler ──
app.use((err, req, res, next) => {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error' })
})

// ── Start ──
app.listen(PORT, () => {
    console.log(`
  ⚡ Lume Server v0.8.0
  ────────────────────────
  Port:     ${PORT}
  Env:      ${process.env.NODE_ENV || 'development'}
  Client:   ${process.env.CLIENT_URL}
  ────────────────────────
  Routes:
    GET  /api/health
    GET  /api/meta
    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/sso/exchange
    GET  /api/auth/me
    GET  /api/blog
    GET  /api/blog/:slug
    POST /api/blog
    PUT  /api/blog/:slug
    DEL  /api/blog/:slug
    GET  /api/affiliate/tiers
    GET  /api/affiliate/stats
    POST /api/affiliate/generate
    POST /api/affiliate/track
    POST /api/sms/optin
    POST /api/sms/optout
    POST /api/sms/webhook
    POST /api/hallmark
    GET  /api/hallmark/:id
    GET  /api/hallmark/verify/:tn
    GET  /api/hallmark/user/mine
    POST /api/email/welcome
    POST /api/email/verify
    POST /api/compile/compile
    POST /api/compile/run
    POST /api/compile/explain
  ────────────────────────
    `)
})

export default app
