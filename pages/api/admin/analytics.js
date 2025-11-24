import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
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
    // Get last 6 months of data for sales overview
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await Order.find({
      createdAt: { $gte: sixMonthsAgo },
      paymentStatus: 'paid'
    }).populate('items.product');

    // Sales Data by Month
    const monthlySales = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleString('en-US', { month: 'short' });
      if (!monthlySales[month]) {
        monthlySales[month] = { revenue: 0, orders: 0 };
      }
      monthlySales[month].revenue += order.total;
      monthlySales[month].orders += 1;
    });

    const salesData = Object.keys(monthlySales).map(month => ({
      name: month,
      revenue: Math.round(monthlySales[month].revenue),
      orders: monthlySales[month].orders
    }));

    // Weekly Revenue Data (last 4 weeks)
    const weeklyRevenue = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekOrders = orders.filter(order => 
        new Date(order.createdAt) >= weekStart && 
        new Date(order.createdAt) <= weekEnd
      );

      const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);
      
      weeklyRevenue.push({
        name: `Week ${4 - i}`,
        revenue: Math.round(weekRevenue)
      });
    }

    // Category Distribution (mock data - you'll need to populate this based on your product categories)
    const categoryData = [
      { name: 'Electronics', value: 35 },
      { name: 'Clothing', value: 25 },
      { name: 'Home & Garden', value: 20 },
      { name: 'Sports', value: 15 },
      { name: 'Others', value: 5 },
    ];

    res.status(200).json({
      salesData,
      revenueData: weeklyRevenue,
      categoryData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
}