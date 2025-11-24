import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { verifyToken } from '../../../../lib/auth';

// Helper function to normalize product data
function normalizeProduct(product) {
  const productObj = product.toObject ? product.toObject() : product;
  
  return {
    ...productObj,
    price: Number(productObj.price) || 0,
    stock: Number(productObj.stock) || 0,
    images: normalizeImages(productObj.images, productObj.name),
    sizes: productObj.sizes?.map(size => ({
      ...size,
      stock: Number(size.stock) || 0,
      priceAdjustment: Number(size.priceAdjustment) || 0,
    })) || [],
  };
}

// Helper function to normalize images
function normalizeImages(images, productName) {
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

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await dbConnect();

  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  // GET - Fetch single product
  if (req.method === 'GET') {
    try {
      console.log('Fetching product with ID:', id);

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const normalizedProduct = normalizeProduct(product);

      res.status(200).json(normalizedProduct);

    } catch (error) {
      console.error('Error fetching product:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      res.status(500).json({ 
        message: 'Error fetching product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
  // PUT - Update product
  else if (req.method === 'PUT') {
    try {
      console.log('Updating product with ID:', id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const {
        name,
        description,
        price,
        category,
        stock,
        featured,
        active,
        images,
        hasSizes,
        sizes
      } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Product name is required' });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ message: 'Product description is required' });
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ message: 'Valid price is required' });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ message: 'Category is required' });
      }

      // Find existing product
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Prepare update data
      const updateData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category.trim(),
        stock: parseInt(stock) || 0,
        featured: Boolean(featured),
        active: Boolean(active),
        images: Array.isArray(images) ? images : [],
        hasSizes: Boolean(hasSizes),
        updatedAt: new Date(),
      };

      // Process images
      if (updateData.images && updateData.images.length > 0) {
        updateData.images = updateData.images
          .filter(img => img && img.url)
          .map((img, index) => ({
            url: img.url || '',
            alt: img.alt || `${updateData.name} image ${index + 1}`,
            isPrimary: Boolean(img.isPrimary) || index === 0
          }));
      }

      // Process sizes
      if (updateData.hasSizes && sizes && Array.isArray(sizes) && sizes.length > 0) {
        updateData.sizes = sizes
          .filter(size => size && size.size && size.size.trim())
          .map(size => ({
            size: size.size.trim(),
            stock: parseInt(size.stock) || 0,
            priceAdjustment: parseFloat(size.priceAdjustment) || 0,
            sku: size.sku?.trim() || `${updateData.name.replace(/\s+/g, '-').toUpperCase()}-${size.size}`,
            active: true
          }));
      } else {
        updateData.sizes = [];
        updateData.hasSizes = false;
      }

      console.log('Updating product with data:', {
        name: updateData.name,
        category: updateData.category,
        price: updateData.price,
        hasSizes: updateData.hasSizes,
        sizesCount: updateData.sizes?.length || 0
      });

      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      const normalizedProduct = normalizeProduct(updatedProduct);

      res.status(200).json({
        message: 'Product updated successfully',
        product: normalizedProduct
      });

    } catch (error) {
      console.error('Error updating product:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Product validation failed', 
          errors: errors 
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'A product with this name already exists' 
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      res.status(500).json({ 
        message: 'Error updating product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
  // Handle other methods
  else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}