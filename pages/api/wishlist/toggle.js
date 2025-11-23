import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
  const { productId } = req.body;

  try {
    const user = await User.findById(userId);
    const isInWishlist = user.wishlist.includes(productId);

    if (isInWishlist) {
      // Remove from wishlist
      await User.findByIdAndUpdate(userId, {
        $pull: { wishlist: productId },
      });
    } else {
      // Add to wishlist
      await User.findByIdAndUpdate(userId, {
        $addToSet: { wishlist: productId },
      });
    }

    res.json({ 
      isInWishlist: !isInWishlist,
      message: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating wishlist' });
  }
}