import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Cart from '../../../models/Cart';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';
import stripe from '../../../lib/stripe';

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
  const { shippingAddress, useNewAddress } = req.body;

  try {
    // Get user cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create order
    const order = new Order({
      user: userId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: cart.total,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'pending',
    });

    await order.save();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(cart.total * 100), // Convert to pence
      currency: 'gbp',
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], total: 0 }
    );

    // Save address if it's new
    if (useNewAddress) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          addresses: shippingAddress,
        },
      });
    }

    res.status(201).json({
      ...order.toObject(),
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
}