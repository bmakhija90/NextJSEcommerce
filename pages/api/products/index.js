import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const products = await Product.find({ active: true });
      
      // Normalize image format for frontend
      const normalizedProducts = products.map(product => ({
        ...product.toObject(),
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        images: normalizeImages(product.images, product.name),
      }));

      res.status(200).json(normalizedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ 
        message: 'Error fetching products',
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

// Helper function to normalize image format
function normalizeImages(images, productName) {
  if (!images || images.length === 0) {
    return [{ url: '/placeholder-image.jpg', alt: productName, isPrimary: true }];
  }

  // If images are in string format, convert to object format
  if (typeof images[0] === 'string') {
    return images.map((url, index) => ({
      url,
      alt: productName,
      isPrimary: index === 0,
    }));
  }

  // Ensure all images have required fields
  return images.map((img, index) => ({
    url: img.url || '/placeholder-image.jpg',
    alt: img.alt || productName,
    isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
  }));
}