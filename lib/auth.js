import jwt from 'jsonwebtoken';

// Use a consistent secret - in production, this should be in .env.local
const JWT_SECRET = process.env.JWT_SECRET || 'your-consistent-secret-key-for-development-12345';

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    return handler(req, res);
  };
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = decoded;
    return handler(req, res);
  };
}

export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function getUserFromToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}