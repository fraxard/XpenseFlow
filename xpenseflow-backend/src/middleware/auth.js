const jwt = require('jsonwebtoken');

/**
 * Protects routes that require a logged-in user.
 * Expects:  Authorization: Bearer <token>
 * Attaches: req.user = { id, email, name }
 */
function requireAuth(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    const token = header.slice(7); // strip "Bearer "

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.sub, email: payload.email, name: payload.name };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
}

module.exports = { requireAuth };
