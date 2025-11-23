import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
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
    min: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Pre-save middleware to ensure consistent image format
productSchema.pre('save', function(next) {
  // Ensure images array has proper structure
  if (this.images && this.images.length > 0) {
    this.images = this.images.map((img, index) => {
      // If image is a string, convert to object format
      if (typeof img === 'string') {
        return {
          url: img,
          alt: this.name,
          isPrimary: index === 0,
        };
      }
      
      // If image is already an object, ensure it has all required fields
      return {
        url: img.url || '',
        alt: img.alt || this.name,
        isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
      };
    }).filter(img => img.url && img.url.trim() !== ''); // Remove empty images
    
    // Ensure at least one image is marked as primary
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary && this.images.length > 0) {
      this.images[0].isPrimary = true;
    }
  } else {
    // If no images, set a default placeholder
    this.images = [{
      url: '/placeholder-image.jpg',
      alt: this.name,
      isPrimary: true,
    }];
  }
  next();
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);