import dbConnect from '../../../../lib/mongodb';
import Size from '../../../../models/Size';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ message: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const { category } = req.query;

      if (!category) {
        return res.status(400).json({ message: 'Category is required' });
      }

      const sizes = await Size.find({ 
        category,
        active: true 
      }).sort({ order: 1, name: 1 });

      res.status(200).json(sizes);
    } catch (error) {
      console.error('Error fetching size suggestions:', error);
      res.status(500).json({ message: 'Error fetching size suggestions' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}