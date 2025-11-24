import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  images: [{
    url: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  featured: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  hasSizes: {
    type: Boolean,
    default: false,
  },
  sizes: [{
    size: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceAdjustment: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    }
  }],
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true,
});

// Remove problematic pre-save middleware for now
// We'll handle the data normalization in the API instead

// Virtual for total stock
productSchema.virtual('totalStock').get(function() {
  if (this.hasSizes && this.sizes.length > 0) {
    return this.sizes.reduce((total, size) => total + (size.stock || 0), 0);
  }
  return this.stock;
});

// Include virtuals in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);