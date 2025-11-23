import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userId = decoded.userId;

  if (req.method === 'GET') {
    try {
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user profile' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}