import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
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
      const user = await User.findById(userId).select('addresses');
      res.json(user.addresses);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching addresses' });
    }
  } else if (req.method === 'POST') {
    try {
      const { isDefault, ...addressData } = req.body;

      const updateData = {
        $push: { addresses: addressData },
      };

      // If this is set as default, remove default from other addresses
      if (isDefault) {
        await User.updateOne(
          { _id: userId, 'addresses.isDefault': true },
          { $set: { 'addresses.$.isDefault': false } }
        );
        
        // Set the new address as default
        updateData.$push.addresses.isDefault = true;
      }

      await User.findByIdAndUpdate(userId, updateData);
      res.status(201).json({ message: 'Address added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error adding address' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}