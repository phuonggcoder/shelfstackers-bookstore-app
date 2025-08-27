const express = require('express');
const router = express.Router();
const Voucher = require('../models/voucher');
const auth = require('../middleware/auth');

// Middleware kiểm tra admin
function isAdmin(req, res, next) {
  const userRole = req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : undefined);
  const isAdmin = userRole === 'admin' || (Array.isArray(req.user.roles) && req.user.roles.includes('admin'));
  if (!isAdmin) return res.status(403).json({ msg: 'Forbidden: Admins only' });
  next();
}

// Helper function for consistent validation
const validateVoucher = async (voucherId, userId, orderValue, voucherType = null) => {
  try {
    const result = await Voucher.validateForUser(voucherId, userId, orderValue, voucherType);
    return result;
  } catch (error) {
    console.error('Voucher validation error:', error);
    return { valid: false, message: 'Lỗi xác thực voucher' };
  }
};

// ==================== ADMIN ROUTES ====================

// Tạo voucher mới
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const {
      voucher_id,
      voucher_type, // 'discount' hoặc 'shipping'
      discount_type, // 'fixed' hoặc 'percentage' (chỉ cho discount)
      discount_value,
      shipping_discount, // Chỉ cho shipping
      min_order_value,
      max_discount_value, // Chỉ cho discount percentage
      usage_limit,
      max_per_user,
      start_date,
      end_date,
      description
    } = req.body;

    // Validation
    if (!voucher_id || !voucher_type || !min_order_value || !usage_limit || !max_per_user || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Kiểm tra voucher_type
    if (!['discount', 'shipping'].includes(voucher_type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại voucher phải là "discount" hoặc "shipping"'
      });
    }

    // Validation cho discount voucher
    if (voucher_type === 'discount') {
      if (!discount_type || !discount_value) {
        return res.status(400).json({
          success: false,
          message: 'Voucher giảm giá cần có discount_type và discount_value'
        });
      }
      if (!['fixed', 'percentage'].includes(discount_type)) {
        return res.status(400).json({
          success: false,
          message: 'Loại giảm giá phải là "fixed" hoặc "percentage"'
        });
      }
      if (discount_type === 'percentage' && (!max_discount_value || max_discount_value < discount_value)) {
        return res.status(400).json({
          success: false,
          message: 'Voucher giảm phần trăm cần có max_discount_value hợp lệ'
        });
      }
    }

    // Validation cho shipping voucher
    if (voucher_type === 'shipping') {
      if (!shipping_discount) {
        return res.status(400).json({
          success: false,
          message: 'Voucher vận chuyển cần có shipping_discount'
        });
      }
    }

    // Kiểm tra voucher_id unique
    const existingVoucher = await Voucher.findOne({ voucher_id });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID đã tồn tại'
      });
    }

    const voucherData = {
      voucher_id,
      voucher_type,
      min_order_value,
      usage_limit,
      max_per_user,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      description
    };

    // Thêm fields theo loại voucher
    if (voucher_type === 'discount') {
      voucherData.discount_type = discount_type;
      voucherData.discount_value = discount_value;
      if (max_discount_value) {
        voucherData.max_discount_value = max_discount_value;
      }
    } else if (voucher_type === 'shipping') {
      voucherData.shipping_discount = shipping_discount;
    }

    const voucher = new Voucher(voucherData);
    await voucher.save();

    res.status(201).json({
      success: true,
      message: 'Voucher đã được tạo thành công',
      voucher
    });

  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo voucher',
      error: error.message
    });
  }
});

// Lấy danh sách voucher (admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, voucher_type, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { is_deleted: false };

    if (search) {
      query.voucher_id = { $regex: search, $options: 'i' };
    }

    if (voucher_type) {
      query.voucher_type = voucher_type;
    }

    if (status === 'active') {
      query.is_active = true;
    } else if (status === 'inactive') {
      query.is_active = false;
    }

    const vouchers = await Voucher.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Voucher.countDocuments(query);

    res.json({
      success: true,
      vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách voucher'
    });
  }
});

// Lấy chi tiết voucher (admin)
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher không tồn tại'
      });
    }

    res.json({
      success: true,
      voucher
    });

  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin voucher'
    });
  }
});

// Cập nhật voucher (admin)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher không tồn tại'
      });
    }

    // Cập nhật thông tin
    Object.assign(voucher, req.body);
    await voucher.save();

    res.json({
      success: true,
      message: 'Voucher đã được cập nhật',
      voucher
    });

  } catch (error) {
    console.error('Error updating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật voucher'
    });
  }
});

// Xóa voucher (soft delete)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher không tồn tại'
      });
    }

    voucher.is_deleted = true;
    await voucher.save();

    res.json({
      success: true,
      message: 'Voucher đã được xóa'
    });

  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa voucher'
    });
  }
});

// ==================== USER ROUTES ====================

// Lấy danh sách voucher khả dụng
router.get('/available', async (req, res) => {
  try {
    const { voucher_type, discount_type, sort = 'createdAt' } = req.query;

    let query = {
      is_active: true,
      is_deleted: false,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
      $expr: { $lt: ['$usage_count', '$usage_limit'] }
    };

    if (voucher_type) {
      query.voucher_type = voucher_type;
    }

    if (discount_type && voucher_type === 'discount') {
      query.discount_type = discount_type;
    }

    let sortQuery = {};
    if (sort === 'discount_value') {
      sortQuery = { discount_value: -1 };
    } else if (sort === 'shipping_discount') {
      sortQuery = { shipping_discount: -1 };
    } else {
      sortQuery = { createdAt: -1 };
    }

    const vouchers = await Voucher.find(query).sort(sortQuery);

    res.json({
      success: true,
      vouchers
    });

  } catch (error) {
    console.error('Error fetching available vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách voucher khả dụng'
    });
  }
});

// Validate voucher
router.post('/validate', async (req, res) => {
  try {
    const { voucher_id, user_id, order_value, voucher_type } = req.body;

    if (!voucher_id || !user_id || !order_value) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const result = await validateVoucher(voucher_id, user_id, order_value, voucher_type);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: result.message
      });
    }

    const voucher = result.voucher;
    const discountAmount = voucher.calculateDiscount(order_value);

    res.json({
      success: true,
      valid: true,
      voucher: {
        voucher_id: voucher.voucher_id,
        voucher_type: voucher.voucher_type,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        shipping_discount: voucher.shipping_discount,
        min_order_value: voucher.min_order_value,
        max_discount_value: voucher.max_discount_value,
        description: voucher.description
      },
      discount_amount: discountAmount,
      final_amount: order_value - discountAmount,
      message: 'Voucher hợp lệ'
    });

  } catch (error) {
    console.error('Error validating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực voucher'
    });
  }
});

// Sử dụng voucher (với transaction)
router.post('/use', async (req, res) => {
  const session = await Voucher.startSession();
  session.startTransaction();

  try {
    const { voucher_id, user_id, order_id, order_value, shipping_cost = 0 } = req.body;

    if (!voucher_id || !user_id || !order_id || !order_value) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Validate voucher
    const result = await validateVoucher(voucher_id, user_id, order_value);
    
    if (!result.valid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    const voucher = result.voucher;
    
    // Kiểm tra user đã sử dụng voucher này chưa
    const userUsage = voucher.used_by.filter(u => u.user.toString() === user_id).length;
    if (userUsage >= voucher.max_per_user) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Bạn đã sử dụng hết lượt voucher này'
      });
    }

    // Tính toán discount
    const discountAmount = voucher.calculateDiscount(order_value, shipping_cost);

    // Cập nhật voucher
    voucher.usage_count += 1;
    voucher.used_by.push({
      user: user_id,
      order: order_id,
      discount_amount: discountAmount
    });

    await voucher.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      voucher_used: {
        voucher_id: voucher.voucher_id,
        voucher_type: voucher.voucher_type,
        discount_amount: discountAmount,
        final_amount: order_value - discountAmount
      },
      order: {
        id: order_id,
        total_amount: order_value,
        discount_amount: discountAmount,
        final_amount: order_value - discountAmount,
        voucher_applied: voucher.voucher_id
      },
      message: 'Voucher đã được áp dụng thành công'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error using voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi sử dụng voucher'
    });
  } finally {
    session.endSession();
  }
});

// Validate nhiều voucher cùng lúc (cho phép áp dụng đồng thời)
router.post('/validate-multiple', async (req, res) => {
  try {
    const { vouchers, user_id, order_value, shipping_cost = 0 } = req.body;

    if (!vouchers || !Array.isArray(vouchers) || !user_id || !order_value) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const results = [];
    let totalDiscount = 0;
    let finalAmount = order_value;

    // Validate từng voucher
    for (const voucherInfo of vouchers) {
      const { voucher_id, voucher_type } = voucherInfo;
      
      const result = await validateVoucher(voucher_id, user_id, order_value, voucher_type);
      
      if (result.valid) {
        const voucher = result.voucher;
        const discountAmount = voucher.calculateDiscount(order_value, shipping_cost);
        
        results.push({
          voucher_id,
          voucher_type: voucher.voucher_type,
          valid: true,
          discount_amount: discountAmount,
          message: 'Voucher hợp lệ'
        });
        
        totalDiscount += discountAmount;
      } else {
        results.push({
          voucher_id,
          valid: false,
          message: result.message
        });
      }
    }

    finalAmount = Math.max(0, order_value - totalDiscount);

    res.json({
      success: true,
      results,
      summary: {
        order_value,
        total_discount: totalDiscount,
        final_amount: finalAmount,
        vouchers_applied: results.filter(r => r.valid).length
      }
    });

  } catch (error) {
    console.error('Error validating multiple vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực voucher'
    });
  }
});

// Sử dụng nhiều voucher cùng lúc
router.post('/use-multiple', async (req, res) => {
  const session = await Voucher.startSession();
  session.startTransaction();

  try {
    const { vouchers, user_id, order_id, order_value, shipping_cost = 0 } = req.body;

    if (!vouchers || !Array.isArray(vouchers) || !user_id || !order_id || !order_value) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const usedVouchers = [];
    let totalDiscount = 0;

    // Sử dụng từng voucher
    for (const voucherInfo of vouchers) {
      const { voucher_id, voucher_type } = voucherInfo;
      
      const result = await validateVoucher(voucher_id, user_id, order_value, voucher_type);
      
      if (!result.valid) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Voucher ${voucher_id}: ${result.message}`
        });
      }

      const voucher = result.voucher;
      
      // Kiểm tra user usage
      const userUsage = voucher.used_by.filter(u => u.user.toString() === user_id).length;
      if (userUsage >= voucher.max_per_user) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Bạn đã sử dụng hết lượt voucher ${voucher_id}`
        });
      }

      // Tính discount
      const discountAmount = voucher.calculateDiscount(order_value, shipping_cost);

      // Cập nhật voucher
      voucher.usage_count += 1;
      voucher.used_by.push({
        user: user_id,
        order: order_id,
        discount_amount: discountAmount
      });

      await voucher.save({ session });

      usedVouchers.push({
        voucher_id: voucher.voucher_id,
        voucher_type: voucher.voucher_type,
        discount_amount: discountAmount
      });

      totalDiscount += discountAmount;
    }

    await session.commitTransaction();

    const finalAmount = Math.max(0, order_value - totalDiscount);

    res.json({
      success: true,
      vouchers_used: usedVouchers,
      order: {
        id: order_id,
        total_amount: order_value,
        total_discount: totalDiscount,
        final_amount: finalAmount,
        vouchers_applied: usedVouchers.map(v => v.voucher_id)
      },
      message: 'Các voucher đã được áp dụng thành công'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error using multiple vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi sử dụng voucher'
    });
  } finally {
    session.endSession();
  }
});

// Lấy lịch sử sử dụng voucher của user
router.get('/my-usage/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const vouchers = await Voucher.find({
      'used_by.user': user_id,
      is_deleted: false
    })
    .populate('used_by.order', 'order_number total_amount created_at')
    .sort({ 'used_by.used_at': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Voucher.countDocuments({
      'used_by.user': user_id,
      is_deleted: false
    });

    res.json({
      success: true,
      vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user voucher usage:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử sử dụng voucher'
    });
  }
});

module.exports = router;
