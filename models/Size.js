import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Pre-save to ensure consistent formatting
sizeSchema.pre('save', function(next) {
  this.name = this.name.toUpperCase();
  next();
});

export default mongoose.models.Size || mongoose.model('Size', sizeSchema);