import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { name, email, password, secretKey } = req.body;

    // Check if secret key matches (you can set this in environment variables)
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'admin123';
    
    if (secretKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid secret key' });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(400).json({ message: 'An admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}