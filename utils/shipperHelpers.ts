// Helper functions để xử lý shipper data từ backend populate
// Hỗ trợ cả backend cũ (string) và mới (object)

export interface ShipperInfo {
  _id: string;
  full_name: string;
  phone_number: string;
  username: string;
}

// Helper để xử lý shipper data từ backend populate
export const getShipperInfo = (assignedShipperId: any): ShipperInfo | null => {
  if (!assignedShipperId) return null;
  
  // Nếu là object (backend đã populate)
  if (typeof assignedShipperId === 'object' && assignedShipperId._id) {
    return {
      _id: assignedShipperId._id,
      full_name: assignedShipperId.full_name || '',
      phone_number: assignedShipperId.phone_number || '',
      username: assignedShipperId.username || ''
    };
  }
  
  // Nếu là string (backend chưa populate)
  if (typeof assignedShipperId === 'string') {
    return {
      _id: assignedShipperId,
      full_name: '',
      phone_number: '',
      username: ''
    };
  }
  
  return null;
};

// Helper để lấy shipper name
export const getShipperName = (assignedShipperId: any): string => {
  const shipperInfo = getShipperInfo(assignedShipperId);
  return shipperInfo?.full_name || shipperInfo?.username || 'Unknown Shipper';
};

// Helper để lấy shipper phone
export const getShipperPhone = (assignedShipperId: any): string => {
  const shipperInfo = getShipperInfo(assignedShipperId);
  return shipperInfo?.phone_number || '';
};

// Helper để lấy shipper ID
export const getShipperId = (assignedShipperId: any): string => {
  const shipperInfo = getShipperInfo(assignedShipperId);
  return shipperInfo?._id || '';
};

// Helper để kiểm tra có shipper không
export const hasShipper = (assignedShipperId: any): boolean => {
  return getShipperInfo(assignedShipperId) !== null;
};

// Helper để lấy display name (full_name hoặc username)
export const getShipperDisplayName = (assignedShipperId: any): string => {
  const shipperInfo = getShipperInfo(assignedShipperId);
  if (!shipperInfo) return 'Unknown Shipper';
  
  return shipperInfo.full_name || shipperInfo.username || 'Unknown Shipper';
};
