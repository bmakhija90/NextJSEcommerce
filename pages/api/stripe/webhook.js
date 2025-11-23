import { buffer } from 'micro';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import stripe from '../../../lib/stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await dbConnect();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await Order.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          {
            paymentStatus: 'paid',
            status: 'processing',
          }
        );
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        await Order.findOneAndUpdate(
          { paymentIntentId: failedPaymentIntent.id },
          {
            paymentStatus: 'failed',
            status: 'cancelled',
          }
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}