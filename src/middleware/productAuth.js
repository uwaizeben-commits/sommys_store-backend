function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    // Allow public GET, deny POST/PUT/DELETE without token
    if (req.method === 'GET') return next()
    return res.status(401).json({ message: 'Unauthorized' })
  }
  // Token provided, allow (in production, verify JWT signature)
  next()
}

module.exports = authMiddleware
