import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/auth';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching products' });
    }
  } else if (req.method === 'POST') {
    try {
      const productData = {
        ...req.body,
        // Normalize images format
        images: req.body.images.map((img, index) => {
          // If it's already in object format, use it
          if (typeof img === 'object' && img.url) {
            return {
              url: img.url,
              alt: img.alt || req.body.name,
              isPrimary: img.isPrimary || index === 0,
            };
          }
          // If it's a string (old format), convert to object
          return {
            url: img,
            alt: req.body.name,
            isPrimary: index === 0,
          };
        }),
      };
      
      const product = await Product.create(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Error creating product' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default requireAdmin(handler);