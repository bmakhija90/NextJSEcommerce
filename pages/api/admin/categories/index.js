import dbConnect from '../../../../lib/mongodb';
import Category from '../../../../models/Category';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/auth';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
      
      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const productCount = await Product.countDocuments({ 
            category: category.name,
            active: true 
          });
          return {
            ...category.toObject(),
            productCount,
          };
        })
      );

      res.status(200).json(categoriesWithCounts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, image, sortOrder, active } = req.body;

      // Check if category already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      const category = await Category.create({
        name,
        description,
        image,
        sortOrder: sortOrder || 0,
        active: active !== false,
      });

      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: 'Error creating category' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default requireAdmin(handler);