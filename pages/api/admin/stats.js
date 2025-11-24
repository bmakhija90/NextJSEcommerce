import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import User from '../../../models/User';
import Product from '../../../models/Product';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ message: 'Admin access required' });
  }

  try {
    // Calculate weekly revenue (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyOrders = await Order.find({
      createdAt: { $gte: oneWeekAgo },
      paymentStatus: 'paid'
    });

    const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + order.total, 0);
    const weeklyOrderCount = weeklyOrders.length;

    // Total users
    const totalUsers = await User.countDocuments();

    // Growth calculation (mock for now)
    const growth = 12; // You can calculate this based on previous period

    res.status(200).json({
      weeklyRevenue: Math.round(weeklyRevenue),
      weeklyOrders: weeklyOrderCount,
      totalUsers,
      growth
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
}