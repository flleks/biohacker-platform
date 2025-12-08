const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
  }
  
  try {
    // Wymagamy, aby JWT_SECRET był w .env
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('Brak konfiguracji JWT_SECRET na serwerze');

    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id, _id: payload.id };
    return next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Nieprawidłowy lub wygasły token' });
  }
};