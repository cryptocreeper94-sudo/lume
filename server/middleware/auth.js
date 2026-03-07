import jwt from 'jsonwebtoken'

export function auth(req, res, next) {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }
    try {
        const token = header.split(' ')[1]
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload
        next()
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}

export function optionalAuth(req, res, next) {
    const header = req.headers.authorization
    if (header && header.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
        } catch { /* ignore */ }
    }
    next()
}
