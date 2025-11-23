import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Normalize image format
      const normalizedProduct = {
        ...product.toObject(),
        images: normalizeImages(product.images, product.name),
      };

      res.status(200).json(normalizedProduct);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product' });
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