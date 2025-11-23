import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  await dbConnect();

  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
}

export default requireAdmin(handler);