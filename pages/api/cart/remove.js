import dbConnect from '../../../lib/mongodb';
import Cart from '../../../models/Cart';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    // Recalculate total - ensure all values are numbers
    cart.total = cart.items.reduce((total, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);

    await cart.save();
    await cart.populate('items.product');

    // Normalize images before sending response
    const cartWithNormalizedImages = {
      ...cart.toObject(),
      items: cart.items.map(item => ({
        ...item,
        // Ensure price and quantity are numbers in response
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        product: {
          ...item.product.toObject(),
          images: normalizeCartImages(item.product.images, item.product.name),
        },
      })),
      total: Number(cart.total) || 0, // Ensure total is a number
    };

    res.status(200).json(cartWithNormalizedImages);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error removing item from cart' });
  }
}

// Helper function to normalize images for cart
function normalizeCartImages(images, productName) {
  if (!images || images.length === 0) {
    return [{ url: '/placeholder-image.jpg', alt: productName, isPrimary: true }];
  }

  if (typeof images[0] === 'string') {
    return images.map((url, index) => ({
      url,
      alt: productName,
      isPrimary: index === 0,
    }));
  }

  return images.map((img, index) => ({
    url: img.url || '/placeholder-image.jpg',
    alt: img.alt || productName,
    isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
  }));
}