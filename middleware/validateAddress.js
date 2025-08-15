const validateAddress = (req, res, next) => {
  const { 
    fullName, 
    phone, 
    street, 
    province, 
    district, 
    ward 
  } = req.body;

  const errors = [];

  // Validate basic information
  if (!fullName || !fullName.trim()) {
    errors.push('Full name is required');
  }

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^[0-9]{10,11}$/.test(phone)) {
    errors.push('Invalid phone number format');
  }

  // Validate address components
  if (!street || !street.trim()) {
    errors.push('Street address is required');
  }

  // Validate province
  if (!province || typeof province !== 'object') {
    errors.push('Province information is required');
  } else if (!province.code || !province.name) {
    errors.push('Province must include both code and name');
  }

  // Validate ward
  if (!ward || typeof ward !== 'object') {
    errors.push('Ward information is required');
  } else if (!ward.code || !ward.name) {
    errors.push('Ward must include both code and name');
  }

  // Optional district validation
  if (district && typeof district === 'object') {
    if (!district.code || !district.name) {
      errors.push('District must include both code and name when provided');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = validateAddress;
