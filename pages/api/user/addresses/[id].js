import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { verifyToken } from '../../../../lib/auth';

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

  if (req.method === 'PUT') {
    try {
      const { isDefault, ...addressData } = req.body;

      const updateData = {};
      
      // If setting as default, first remove default from other addresses
      if (isDefault) {
        await User.updateOne(
          { _id: userId, 'addresses.isDefault': true },
          { $set: { 'addresses.$.isDefault': false } }
        );
      }

      // Update the specific address
      const result = await User.updateOne(
        { _id: userId, 'addresses._id': id },
        { 
          $set: { 
            'addresses.$.name': addressData.name,
            'addresses.$.line1': addressData.line1,
            'addresses.$.line2': addressData.line2,
            'addresses.$.city': addressData.city,
            'addresses.$.county': addressData.county,
            'addresses.$.postcode': addressData.postcode,
            'addresses.$.country': addressData.country,
            'addresses.$.isDefault': isDefault,
          } 
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Address not found' });
      }

      res.status(200).json({ message: 'Address updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating address' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = await User.updateOne(
        { _id: userId },
        { $pull: { addresses: { _id: id } } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Address not found' });
      }

      res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting address' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}