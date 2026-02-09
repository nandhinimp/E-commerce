const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// checks if user sent valid login token
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  // token not sent
  if (!header) {
    console.log('No auth header found');
    return res.status(401).json({ error: 'Please login first' });
  }

  // wrong format
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Wrong auth format' });
  }

  const token = header.split(' ')[1];

  try {
    const userData = jwt.verify(token, JWT_SECRET);

    // store decoded data for next middleware
    req.user = userData;

    next();

  } catch (error) {
    console.log('Token check failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


// checks if logged user is admin
function requireAdmin(req, res, next) {

  if (!req.user) {
    return res.status(401).json({ error: 'Auth required before admin check' });
  }

  if (req.user.role !== 'admin') {
    console.log('Non-admin tried admin route:', req.user.userId);
    return res.status(403).json({ error: 'Admin only action' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
