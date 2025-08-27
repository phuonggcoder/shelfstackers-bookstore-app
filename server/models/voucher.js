const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  voucher_id: {
    type: String,
    required: [true, 'Voucher ID là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]+$/.test(v);
      },
      message: 'Voucher ID chỉ được chứa chữ cái và số'
    }
  },
  
  voucher_type: {
    type: String,
    required: [true, 'Loại voucher là bắt buộc'],
    enum: {
      values: ['discount', 'shipping'],
      message: 'Loại voucher phải là "discount" hoặc "shipping"'
    }
  },
  
  discount_type: {
    type: String,
    required: function() {
      return this.voucher_type === 'discount';
    },
    enum: {
      values: ['fixed', 'percentage'],
      message: 'Loại giảm giá phải là "fixed" hoặc "percentage"'
    }
  },
  
  discount_value: {
    type: Number,
    required: function() {
      return this.voucher_type === 'discount';
    },
    min: [0, 'Giá trị giảm giá không được âm'],
    validate: {
      validator: function(v) {
        if (this.discount_type === 'percentage') {
          return v > 0 && v <= 100;
        }
        return v > 0;
      },
      message: 'Giá trị giảm giá không hợp lệ'
    }
  },
  
  shipping_discount: {
    type: Number,
    required: function() {
      return this.voucher_type === 'shipping';
    },
    min: [0, 'Giảm phí ship không được âm']
  },
  
  min_order_value: {
    type: Number,
    required: [true, 'Giá trị đơn hàng tối thiểu là bắt buộc'],
    min: [0, 'Giá trị đơn hàng tối thiểu không được âm']
  },
  
  max_discount_value: {
    type: Number,
    required: function() {
      return this.voucher_type === 'discount' && this.discount_type === 'percentage';
    },
    min: [0, 'Giá trị giảm tối đa không được âm'],
    validate: {
      validator: function(v) {
        return v >= this.discount_value || this.discount_type === 'fixed';
      },
      message: 'Giá trị giảm tối đa phải lớn hơn hoặc bằng giá trị giảm'
    }
  },
  
  usage_limit: {
    type: Number,
    required: [true, 'Giới hạn sử dụng là bắt buộc'],
    min: [1, 'Giới hạn sử dụng phải lớn hơn 0']
  },
  
  usage_count: {
    type: Number,
    default: 0,
    min: [0, 'Số lần sử dụng không được âm'],
    validate: {
      validator: function(v) {
        return v <= this.usage_limit;
      },
      message: 'Số lần sử dụng không được vượt quá giới hạn'
    }
  },
  
  max_per_user: {
    type: Number,
    required: [true, 'Giới hạn sử dụng mỗi user là bắt buộc'],
    min: [1, 'Giới hạn sử dụng mỗi user phải lớn hơn 0']
  },
  
  start_date: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc']
  },
  
  end_date: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc'],
    validate: {
      validator: function(v) {
        return v > this.start_date;
      },
      message: 'Ngày kết thúc phải sau ngày bắt đầu'
    }
  },
  
  used_by: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    used_at: {
      type: Date,
      default: Date.now
    },
    discount_amount: {
      type: Number,
      required: true
    }
  }],
  
  is_active: {
    type: Boolean,
    default: true
  },
  
  is_deleted: {
    type: Boolean,
    default: false
  },
  
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual properties
voucherSchema.virtual('isExpired').get(function() {
  return new Date() > this.end_date;
});

voucherSchema.virtual('isNotStarted').get(function() {
  return new Date() < this.start_date;
});

voucherSchema.virtual('isValid').get(function() {
  return this.is_active && !this.is_deleted && !this.isExpired && !this.isNotStarted && this.usage_count < this.usage_limit;
});

voucherSchema.virtual('remainingUsage').get(function() {
  return Math.max(0, this.usage_limit - this.usage_count);
});

// Static methods
voucherSchema.statics.findActive = function() {
  return this.find({
    is_active: true,
    is_deleted: false,
    start_date: { $lte: new Date() },
    end_date: { $gte: new Date() },
    usage_count: { $lt: '$usage_limit' }
  });
};

voucherSchema.statics.validateForUser = async function(voucherId, userId, orderValue, voucherType = null) {
  const query = { 
    voucher_id: voucherId, 
    is_active: true, 
    is_deleted: false 
  };
  
  if (voucherType) {
    query.voucher_type = voucherType;
  }
  
  const voucher = await this.findOne(query);
  
  if (!voucher) {
    return { valid: false, message: 'Voucher không tồn tại' };
  }
  
  if (voucher.isExpired) {
    return { valid: false, message: 'Voucher đã hết hạn' };
  }
  
  if (voucher.isNotStarted) {
    return { valid: false, message: 'Voucher chưa có hiệu lực' };
  }
  
  if (orderValue < voucher.min_order_value) {
    return { 
      valid: false, 
      message: `Đơn hàng phải đạt tối thiểu ${voucher.min_order_value.toLocaleString()} VND` 
    };
  }
  
  if (voucher.usage_count >= voucher.usage_limit) {
    return { valid: false, message: 'Voucher đã hết lượt sử dụng' };
  }
  
  // Kiểm tra max_per_user
  const userUsage = voucher.used_by.filter(u => u.user.toString() === userId).length;
  if (userUsage >= voucher.max_per_user) {
    return { valid: false, message: 'Bạn đã sử dụng hết lượt voucher này' };
  }
  
  return { valid: true, voucher };
};

// Instance methods
voucherSchema.methods.calculateDiscount = function(orderValue, shippingCost = 0) {
  let discountAmount = 0;
  
  if (this.voucher_type === 'discount') {
    if (this.discount_type === 'percentage') {
      discountAmount = (orderValue * this.discount_value) / 100;
      if (this.max_discount_value && discountAmount > this.max_discount_value) {
        discountAmount = this.max_discount_value;
      }
    } else {
      discountAmount = this.discount_value;
    }
    
    // Không giảm quá giá trị đơn hàng
    discountAmount = Math.min(discountAmount, orderValue);
  } else if (this.voucher_type === 'shipping') {
    discountAmount = Math.min(this.shipping_discount, shippingCost);
  }
  
  return discountAmount;
};

// Pre-save middleware
voucherSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate usage count
  if (this.usage_count > this.usage_limit) {
    return next(new Error('Số lần sử dụng không được vượt quá giới hạn'));
  }
  
  next();
});

// Indexes for performance
voucherSchema.index({ is_active: 1, is_deleted: 1 });
voucherSchema.index({ voucher_type: 1 });
voucherSchema.index({ start_date: 1, end_date: 1 });
voucherSchema.index({ usage_count: 1, usage_limit: 1 });
voucherSchema.index({ 'used_by.user': 1 });
voucherSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
