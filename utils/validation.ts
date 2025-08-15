export const validateVietnamesePhone = (phone: string) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Check if it's a valid Vietnamese phone number
  // Must be 10 digits and start with appropriate prefixes
  if (cleanPhone.length !== 10) {
    return false;
  }

  // Vietnamese mobile prefixes
  const validPrefixes = [
    '086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039', // Viettel
    '088', '091', '094', '083', '084', '085', '081', '082', // Vinaphone
    '089', '090', '093', '070', '079', '077', '076', '078', // Mobifone
    '092', '056', '058', // Vietnamobile
    '099', '059', // Gmobile
  ];

  // Check if the phone number starts with a valid prefix
  return validPrefixes.some(prefix => cleanPhone.startsWith(prefix));
};

export const validateAddress = (address: {
  fullName: string;
  phone: string;
  street: string;
  province: string;
  district: string;
  ward: string;
  note?: string;
}) => {
  const errors: Record<string, string> = {};

  if (!address.fullName?.trim()) {
    errors.fullName = 'Fullname is required';
  }

  if (!address.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validateVietnamesePhone(address.phone)) {
    errors.phone = 'Invalid Vietnamese phone number';
  }

  if (!address.street?.trim()) {
    errors.street = 'Street address is required';
  }

  if (!address.province?.trim()) {
    errors.province = 'Province is required';
  }

  if (!address.district?.trim()) {
    errors.district = 'District is required';
  }

  if (!address.ward?.trim()) {
    errors.ward = 'Ward is required';
  }

  if (address.note && address.note.length > 500) {
    errors.note = 'Note cannot exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
