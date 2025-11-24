import dbConnect from '../../../../lib/mongodb';
import Size from '../../../../models/Size';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
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
      const { category, active } = req.query;
      let query = {};

      // Filter by category if provided
      if (category && category !== 'all') {
        query.category = category;
      }

      // Filter by active status if provided
      if (active !== undefined) {
        query.active = active === 'true';
      }

      const sizes = await Size.find(query).sort({ order: 1, name: 1 });
      res.status(200).json(sizes);
    } catch (error) {
      console.error('Error fetching sizes:', error);
      res.status(500).json({ message: 'Error fetching sizes' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, category, description, order, active } = req.body;

      // Validate required fields
      if (!name || !category) {
        return res.status(400).json({ message: 'Name and category are required' });
      }

      // Check if size already exists
      const existingSize = await Size.findOne({ 
        name: name.toUpperCase(),
        category 
      });

      if (existingSize) {
        return res.status(400).json({ 
          message: `Size '${name}' already exists in category '${category}'` 
        });
      }

      // Create new size
      const size = new Size({
        name: name.toUpperCase(),
        category,
        description: description || '',
        order: order || 0,
        active: active !== undefined ? active : true,
      });

      await size.save();
      res.status(201).json(size);
    } catch (error) {
      console.error('Error creating size:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'A size with this name already exists' 
        });
      }
      
      res.status(500).json({ message: 'Error creating size' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}