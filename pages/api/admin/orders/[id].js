import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import { requireAdmin } from '../../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { status, trackingInfo } = req.body;

      const updateData = { status };
      if (trackingInfo) {
        updateData.trackingInfo = trackingInfo;
      }

      const order = await Order.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('user', 'name email');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Error updating order' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default requireAdmin(handler);