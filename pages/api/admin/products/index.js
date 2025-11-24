import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { verifyToken } from '../../../../lib/auth';

// Helper function to generate SKU - moved outside handler
function generateSKU() {
  return 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Helper function to normalize product data for response
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

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await dbConnect();

  // Verify authentication for all methods
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Handle GET request - Fetch products
  if (req.method === 'GET') {
    try {
      console.log('Fetching products request');
      
      // Get query parameters
      const { 
        active, 
        featured, 
        category, 
        page = 1, 
        limit = 50,
        search 
      } = req.query;

      // Build filter object
      const filter = {};
      
      // Filter by active status if provided
      if (active !== undefined) {
        filter.active = active === 'true';
      }
      
      // Filter by featured status if provided
      if (featured !== undefined) {
        filter.featured = featured === 'true';
      }
      
      // Filter by category if provided
      if (category) {
        filter.category = new RegExp(category, 'i');
      }
      
      // Search in name and description if search query provided
      if (search) {
        filter.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }

      console.log('Fetching products with filter:', filter);

      // Calculate pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Fetch products with pagination
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get total count for pagination
      const total = await Product.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);

      // Normalize products for response
      const normalizedProducts = products.map(product => normalizeProduct(product));

      console.log(`Fetched ${normalizedProducts.length} products out of ${total} total`);

      res.status(200).json({
        products: normalizedProducts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        }
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      
      res.status(500).json({ 
        message: 'Error fetching products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
  // Handle POST request - Create product
  else if (req.method === 'POST') {
    try {
      console.log('Received product creation request');
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

      // Validate required fields with more specific checks
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

      // Create product data object with safer parsing
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category.trim(),
        stock: parseInt(stock) || 0,
        featured: Boolean(featured),
        active: Boolean(active),
        images: Array.isArray(images) ? images : [],
        hasSizes: Boolean(hasSizes),
        createdBy: decoded.userId || 'admin',
      };

      // Process images with better validation
      if (productData.images && productData.images.length > 0) {
        productData.images = productData.images
          .filter(img => img && img.url) // Remove empty images
          .map((img, index) => ({
            url: img.url || '',
            alt: img.alt || `${productData.name} image ${index + 1}`,
            isPrimary: Boolean(img.isPrimary) || index === 0
          }));
      } else {
        // Set default image if none provided
        productData.images = [{
          url: '/placeholder-image.jpg',
          alt: productData.name,
          isPrimary: true,
        }];
      }

      // Process sizes if enabled
      if (productData.hasSizes && sizes && Array.isArray(sizes) && sizes.length > 0) {
        productData.sizes = sizes
          .filter(size => size && size.size && size.size.trim()) // Remove empty sizes
          .map(size => ({
            size: size.size.trim(),
            stock: parseInt(size.stock) || 0,
            priceAdjustment: parseFloat(size.priceAdjustment) || 0,
            sku: size.sku?.trim() || generateSKU(),
            active: true
          }));
        
        console.log(`Processed ${productData.sizes.length} size variations`);
      } else {
        productData.sizes = [];
        // If no sizes but hasSizes was true, set it to false
        if (productData.hasSizes && (!sizes || !Array.isArray(sizes) || sizes.length === 0)) {
          productData.hasSizes = false;
        }
      }

      // Validate stock for non-sized products
      if (!productData.hasSizes && (isNaN(productData.stock) || productData.stock < 0)) {
        return res.status(400).json({ message: 'Valid stock quantity is required' });
      }

      console.log('Creating product with data:', {
        name: productData.name,
        category: productData.category,
        price: productData.price,
        hasSizes: productData.hasSizes,
        sizesCount: productData.sizes.length,
        imagesCount: productData.images.length
      });

      // Create and save product
      const product = new Product(productData);
      const savedProduct = await product.save();

      console.log('Product created successfully:', savedProduct._id);

      // Return normalized product data
      const normalizedProduct = normalizeProduct(savedProduct);

      res.status(201).json({
        message: 'Product created successfully',
        product: normalizedProduct
      });

    } catch (error) {
      console.error('Error creating product:', error);
      
      // More specific error handling
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        console.error('Mongoose validation errors:', errors);
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

      // MongoDB connection errors
      if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
        return res.status(503).json({ 
          message: 'Database connection error. Please try again.' 
        });
      }

      res.status(500).json({ 
        message: 'Internal server error while creating product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
  // Handle other methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}