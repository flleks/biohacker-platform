const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import modelu

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
  }
  
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('Brak konfiguracji JWT_SECRET na serwerze');

    const payload = jwt.verify(token, secret);
    
    // POPRAWKA: Sprawdź czy użytkownik nadal istnieje w bazie
    // Używamy select, żeby nie pobierać hasła, choć middleware potrzebuje głównie ID
    const user = await User.findById(payload.id).select('_id username email');
    
    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje (token nieważny)' });
    }

    req.user = user; // Przypisujemy pełny obiekt usera (lub tylko potrzebne pola)
    return next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Nieprawidłowy lub wygasły token' });
  }
};