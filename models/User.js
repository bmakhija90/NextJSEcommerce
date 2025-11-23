import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  addresses: [{
    name: String,
    line1: String,
    line2: String,
    city: String,
    county: String,
    postcode: String,
    country: String,
    isDefault: Boolean,
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);