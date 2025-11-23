import dbConnect from '../../../../lib/mongodb';
import Category from '../../../../models/Category';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching category' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, description, image, sortOrder, active } = req.body;

      // Check if name is being changed and if it conflicts with existing category
      if (name) {
        const existingCategory = await Category.findOne({ 
          name, 
          _id: { $ne: id } 
        });
        if (existingCategory) {
          return res.status(400).json({ message: 'Category name already exists' });
        }
      }

      const category = await Category.findByIdAndUpdate(
        id,
        {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(image !== undefined && { image }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(active !== undefined && { active }),
        },
        { new: true }
      );

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: 'Error updating category' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Check if category has products
      const productCount = await Product.countDocuments({ category: category.name });
      if (productCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category. There are ${productCount} products associated with this category.` 
        });
      }

      await Category.findByIdAndDelete(id);
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting category' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default requireAdmin(handler);