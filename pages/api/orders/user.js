import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
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
      const orders = await Order.find({ user: userId })
        .populate('items.product')
        .sort({ createdAt: -1 });

      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}