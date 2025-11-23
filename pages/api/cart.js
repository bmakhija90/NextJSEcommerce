import dbConnect from '../../lib/mongodb';
import Cart from '../../models/Cart';
import { verifyToken } from '../../lib/auth';

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

  try {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      cart = new Cart({ 
        user: userId, 
        items: [], 
        total: 0 
      });
      await cart.save();
    }

    // Normalize response
    const normalizedCart = {
      ...cart.toObject(),
      items: cart.items.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        product: {
          ...item.product.toObject(),
          price: Number(item.product.price) || 0,
          stock: Number(item.product.stock) || 0,
          images: normalizeCartImages(item.product.images, item.product.name),
        },
      })),
      total: Number(cart.total) || 0,
    };

    res.status(200).json(normalizedCart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
}

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