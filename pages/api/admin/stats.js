import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import User from '../../../models/User';
import Product from '../../../models/Product';
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  await dbConnect();

  try {
    // Calculate date range for this week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    // Weekly revenue
    const weeklyOrders = await Order.find({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      paymentStatus: 'paid',
    });
    
    const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + order.total, 0);

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Growth calculation (simplified)
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(endOfWeek);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const lastWeekOrders = await Order.find({
      createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
      paymentStatus: 'paid',
    });

    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + order.total, 0);
    const growth = lastWeekRevenue > 0 
      ? ((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
      : 0;

    res.json({
      weeklyRevenue: weeklyRevenue.toFixed(2),
      weeklyOrders: weeklyOrders.length,
      totalUsers,
      totalProducts,
      totalOrders,
      growth,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
}

export default requireAdmin(handler);