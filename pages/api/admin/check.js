import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const adminCount = await User.countDocuments({ role: 'admin' });
      res.json({ adminExists: adminCount > 0 });
    } catch (error) {
      res.status(500).json({ message: 'Error checking admin status' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}