import dbConnect from '../../../lib/mongodb';
import Cart from '../../../models/Cart';
import Product from '../../../models/Product';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  console.log('=== CART ADD API START ===');
  console.log('HTTP Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Request Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Step 1: Database connection
    console.log('🔌 Connecting to database...');
    await dbConnect();
    console.log('✅ Database connected');

    // Step 2: Token verification
    console.log('🔑 Verifying token...');
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token received:', token ? `Yes (length: ${token.length})` : 'No');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      console.log('❌ Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Step 3: Extract user ID
    const userId = decoded.id || decoded.userId || decoded._id;
    console.log('Extracted User ID:', userId);
    
    if (!userId) {
      console.log('❌ No user ID in token');
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Step 4: Validate request body
    const { productId, quantity = 1 } = req.body;
    console.log('Product ID:', productId);
    console.log('Quantity:', quantity);

    if (!productId) {
      console.log('❌ Product ID is required');
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Step 5: Find product
    console.log('📦 Finding product...');
    const product = await Product.findById(productId);
    console.log('Product found:', product ? `Yes (${product.name})` : 'No');
    
    if (!product) {
      console.log('❌ Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 6: Find or create cart
    console.log('🛒 Finding cart for user...');
    let cart = await Cart.findOne({ user: userId });
    console.log('Cart found:', cart ? `Yes (${cart.items.length} items)` : 'No');

    if (!cart) {
      console.log('🆕 Creating new cart...');
      cart = new Cart({ user: userId, items: [], total: 0 });
    }

    // Step 7: Add/update item in cart
    console.log('➕ Adding item to cart...');
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      console.log('🔄 Updating existing item quantity');
      cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
      console.log('🆕 Adding new item to cart');
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        price: product.price,
      });
    }

    // Step 8: Recalculate total
    console.log('💰 Recalculating total...');
    cart.total = cart.items.reduce((total, item) => {
      const itemTotal = Number(item.price) * Number(item.quantity);
      return total + itemTotal;
    }, 0);
    console.log('New total:', cart.total);

    // Step 9: Save cart
    console.log('💾 Saving cart...');
    await cart.save();
    console.log('✅ Cart saved');

    // Step 10: Populate product details
    console.log('🔍 Populating product details...');
    await cart.populate('items.product');
    console.log('✅ Product details populated');

    // Step 11: Prepare response
    console.log('📤 Preparing response...');
    const normalizedCart = {
      ...cart.toObject(),
      items: cart.items.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        product: {
          ...item.product.toObject(),
          price: Number(item.product.price) || 0,
          images: normalizeCartImages(item.product.images, item.product.name),
        },
      })),
      total: Number(cart.total) || 0,
    };

    console.log('✅ Sending successful response');
    console.log('=== CART ADD API END ===');
    
    res.status(200).json(normalizedCart);

  } catch (error) {
    console.error('❌ CART ADD ERROR:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    console.log('=== CART ADD API ERROR END ===');
    
    res.status(500).json({ 
      message: 'Error adding to cart',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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