import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const categories = await Product.distinct('category');
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}