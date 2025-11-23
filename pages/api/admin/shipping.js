import dbConnect from '../../../lib/mongodb';
import ShippingConfig from '../../../models/ShippingConfig';
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      let config = await ShippingConfig.findOne();
      
      if (!config) {
        // Return default configuration
        config = {
          freeShippingThreshold: 50,
          standardShippingCost: 0,
          expressShippingCost: 5.99,
          shippingEnabled: true,
        };
      }

      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching shipping configuration' });
    }
  } else if (req.method === 'PUT') {
    try {
      let config = await ShippingConfig.findOne();
      
      if (config) {
        // Update existing configuration
        config = await ShippingConfig.findByIdAndUpdate(config._id, req.body, { new: true });
      } else {
        // Create new configuration
        config = await ShippingConfig.create(req.body);
      }

      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error updating shipping configuration' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default requireAdmin(handler);