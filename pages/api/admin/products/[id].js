import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product' });
    }
  } else if (req.method === 'PUT') {
    try {
      const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Error updating product' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const product = await Product.findByIdAndDelete(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting product' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default requireAdmin(handler);