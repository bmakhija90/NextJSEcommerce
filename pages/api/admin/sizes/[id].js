import dbConnect from '../../../../lib/mongodb';
import Size from '../../../../models/Size';
import Product from '../../../../models/Product';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ message: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const size = await Size.findById(id);
      
      if (!size) {
        return res.status(404).json({ message: 'Size not found' });
      }

      res.status(200).json(size);
    } catch (error) {
      console.error('Error fetching size:', error);
      res.status(500).json({ message: 'Error fetching size' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, category, description, order, active } = req.body;

      // Validate required fields
      if (!name || !category) {
        return res.status(400).json({ message: 'Name and category are required' });
      }

      // Check if size already exists (excluding current size)
      const existingSize = await Size.findOne({ 
        name: name.toUpperCase(),
        category,
        _id: { $ne: id }
      });

      if (existingSize) {
        return res.status(400).json({ 
          message: `Size '${name}' already exists in category '${category}'` 
        });
      }

      const size = await Size.findByIdAndUpdate(
        id,
        {
          name: name.toUpperCase(),
          category,
          description: description || '',
          order: order || 0,
          active: active !== undefined ? active : true,
        },
        { new: true, runValidators: true }
      );

      if (!size) {
        return res.status(404).json({ message: 'Size not found' });
      }

      res.status(200).json(size);
    } catch (error) {
      console.error('Error updating size:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'A size with this name already exists' 
        });
      }
      
      res.status(500).json({ message: 'Error updating size' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const size = await Size.findById(id);
      
      if (!size) {
        return res.status(404).json({ message: 'Size not found' });
      }

      // Check if size is being used in any products
      const productsUsingSize = await Product.find({
        'sizes.size': size.name,
        'hasSizes': true
      });

      if (productsUsingSize.length > 0) {
        const productNames = productsUsingSize.map(p => p.name).slice(0, 3);
        return res.status(400).json({ 
          message: `Cannot delete size. It is being used in ${productsUsingSize.length} product(s) including: ${productNames.join(', ')}${productsUsingSize.length > 3 ? '...' : ''}` 
        });
      }

      await Size.findByIdAndDelete(id);
      res.status(200).json({ message: 'Size deleted successfully' });
    } catch (error) {
      console.error('Error deleting size:', error);
      res.status(500).json({ message: 'Error deleting size' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}