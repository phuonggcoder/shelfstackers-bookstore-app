const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema definitions for administrative units
const adminUnitSchema = new Schema({
  code: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

// Main address schema
const addressSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic information
  fullName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Please enter a valid phone number']
  },
  
  // Address components
  street: { 
    type: String, 
    required: true, 
    trim: true 
  },
  province: { 
    type: adminUnitSchema,
    required: true
  },
  district: { 
    type: adminUnitSchema,
    required: false
  },
  ward: { 
    type: adminUnitSchema,
    required: true
  },
  
  // Generated full address
  fullAddress: { 
    type: String, 
    required: true 
  },
  
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  
  note: { 
    type: String, 
    trim: true,
    maxlength: 500 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate fullAddress before saving
addressSchema.pre('save', function(next) {
  if (this.isModified('street') || 
      this.isModified('ward') || 
      this.isModified('district') || 
      this.isModified('province')) {
    
    const addressParts = [
      this.street,
      this.ward?.name,
      this.district?.name,
      this.province?.name
    ].filter(Boolean);
    
    this.fullAddress = addressParts.join(', ');
  }
  next();
});

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    try {
      await this.constructor.updateMany(
        { 
          user_id: this.user_id, 
          _id: { $ne: this._id } 
        },
        { 
          isDefault: false 
        }
      );
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Validation middleware
addressSchema.pre('validate', function(next) {
  const validationErrors = [];
  
  // Validate required fields
  if (!this.street?.trim()) {
    validationErrors.push('Street address is required');
  }
  
  if (!this.province?.code || !this.province?.name) {
    validationErrors.push('Province information is incomplete');
  }
  
  if (!this.ward?.code || !this.ward?.name) {
    validationErrors.push('Ward information is incomplete');
  }
  
  // Optional district validation
  if (this.district && (!this.district.code || !this.district.name)) {
    validationErrors.push('District information is incomplete');
  }
  
  if (validationErrors.length > 0) {
    next(new Error(validationErrors.join(', ')));
  } else {
    next();
  }
});

module.exports = mongoose.model('Address', addressSchema);
