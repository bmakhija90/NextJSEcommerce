import mongoose from 'mongoose';

const shippingConfigSchema = new mongoose.Schema({
  freeShippingThreshold: {
    type: Number,
    default: 50,
  },
  standardShippingCost: {
    type: Number,
    default: 0,
  },
  expressShippingCost: {
    type: Number,
    default: 5.99,
  },
  shippingEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure only one configuration document exists
shippingConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export default mongoose.models.ShippingConfig || mongoose.model('ShippingConfig', shippingConfigSchema);