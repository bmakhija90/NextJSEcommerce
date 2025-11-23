import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

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
      const order = await Order.findOne({ _id: id, user: userId })
        .populate('items.product');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching order' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}