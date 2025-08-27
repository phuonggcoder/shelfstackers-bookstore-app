import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface ShippingAddress {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  address_id?: string; // Add support for address_id
  // OSM data support
  location?: {
    coordinates?: [number, number]; // [longitude, latitude]
    type?: string;
  };
  osm?: {
    lat?: number;
    lng?: number;
    displayName?: string;
    raw?: any;
  };
}

export interface ShippingFeeRequest {
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  weight: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  carrier?: 'GHN' | 'GHTK' | 'VNPOST';
  // New parameters for total price calculation
  subtotal?: number; // Product price
  voucher_code_order?: string; // Order discount voucher
  voucher_code_shipping?: string; // Shipping discount voucher
}

export interface ShippingFeeResponse {
  carrier: string;
  service: string;
  fee: number;
  estimatedDays: number;
  note?: string;
}

export interface ShippingCalculationResult {
  success: boolean;
  fees: ShippingFeeResponse[];
  error?: string;
  // New fields for total price calculation
  priceBreakdown?: {
    subtotal: number;
    order_discount_amount: number;
    final_amount: number;
    shipping_fee: number;
    shipping_discount_amount: number;
    final_shipping_fee: number;
    total_price: number;
  };
  vouchers?: {
    orderVoucher?: {
      voucher_id: string;
      discount_value: number;
      voucher_type: string;
      applied_discount: number;
    };
    shippingVoucher?: {
      voucher_id: string;
      discount_value: number;
      voucher_type: string;
      applied_discount: number;
    };
  };
}

class ShippingService {
  private async calculateDistance(from: ShippingAddress, to: ShippingAddress): Promise<number> {
    // Sử dụng Haversine formula để tính khoảng cách
    const R = 6371; // Bán kính Trái Đất (km)
    
    const lat1 = from.latitude || 0;
    const lon1 = from.longitude || 0;
    const lat2 = to.latitude || 0;
    const lon2 = to.longitude || 0;
    
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // km
    
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  private async getCoordinates(address: ShippingAddress): Promise<{lat: number, lng: number}> {
    console.log('  📍 Getting coordinates for address:', {
      hasLatLng: !!(address.latitude && address.longitude),
      hasLocation: !!(address.location?.coordinates),
      hasOsm: !!(address.osm?.lat && address.osm?.lng),
      addressString: [address.street, address.ward, address.district, address.province].filter(Boolean).join(', ')
    });
    
    // Check if coordinates are already available
    if (address.latitude && address.longitude) {
      console.log('  ✅ Using direct coordinates:', { lat: address.latitude, lng: address.longitude });
      return { lat: address.latitude, lng: address.longitude };
    }
    
    // Check if address has location.coordinates (from OSM)
    if (address.location && address.location.coordinates && Array.isArray(address.location.coordinates)) {
      const [lng, lat] = address.location.coordinates;
      console.log('  ✅ Using OSM location.coordinates:', { lat, lng });
      return { lat, lng };
    }
    
    // Check if address has OSM data
    if (address.osm && address.osm.lat && address.osm.lng) {
      console.log('  ✅ Using OSM data:', { lat: address.osm.lat, lng: address.osm.lng });
      return { lat: address.osm.lat, lng: address.osm.lng };
    }
    
    // If no coordinates available, use OpenStreetMap Nominatim API
    const addressString = [address.street, address.ward, address.district, address.province]
      .filter(Boolean)
      .join(', ');
    
    if (addressString) {
      try {
        console.log('  🔍 Getting coordinates from OpenStreetMap for:', addressString);
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString + ', Vietnam')}&limit=1`,
          {
            timeout: 10000, // 10 seconds timeout
            headers: {
              'User-Agent': 'ShelfStackers-App/1.0'
            }
          }
        );
        
        if (response.data && response.data.length > 0) {
          const location = response.data[0];
          const coords = { lat: parseFloat(location.lat), lng: parseFloat(location.lon) };
          console.log('  ✅ OSM coordinates found:', coords);
          return coords;
        } else {
          console.log('  ⚠️ No OSM coordinates found for address');
        }
      } catch (error) {
        console.error('  ❌ Error getting coordinates from OpenStreetMap:', error);
        // Don't throw error, just log and use fallback coordinates
      }
    }
    
    // Fallback coordinates (Hà Nội)
    console.log('  🔄 Using fallback coordinates for Hà Nội');
    return { lat: 21.0285, lng: 105.8542 };
  }
  
  private calculateGHNFee(distance: number, weight: number): ShippingFeeResponse {
    // GHN pricing logic
    let baseFee = 15000; // Phí cơ bản
    
    if (distance <= 5) {
      baseFee = 15000;
    } else if (distance <= 10) {
      baseFee = 20000;
    } else if (distance <= 20) {
      baseFee = 25000;
    } else if (distance <= 50) {
      baseFee = 35000;
    } else {
      baseFee = 50000;
    }
    
    // Phí theo trọng lượng
    const weightFee = Math.ceil(weight) * 2000;
    
    return {
      carrier: 'GHN',
      service: 'Giao hàng nhanh',
      fee: baseFee + weightFee,
      estimatedDays: distance <= 20 ? 1 : distance <= 50 ? 2 : 3,
      note: 'Giao hàng trong ngày'
    };
  }
  
  private calculateGHTKFee(distance: number, weight: number): ShippingFeeResponse {
    // GHTK pricing logic
    let baseFee = 12000;
    
    if (distance <= 5) {
      baseFee = 12000;
    } else if (distance <= 10) {
      baseFee = 18000;
    } else if (distance <= 20) {
      baseFee = 22000;
    } else if (distance <= 50) {
      baseFee = 30000;
    } else {
      baseFee = 45000;
    }
    
    const weightFee = Math.ceil(weight) * 1500;
    
    return {
      carrier: 'GHTK',
      service: 'Giao hàng tiết kiệm',
      fee: baseFee + weightFee,
      estimatedDays: distance <= 20 ? 1 : distance <= 50 ? 2 : 3,
      note: 'Giao hàng tiết kiệm'
    };
  }
  
  private calculateVNPOSTFee(distance: number, weight: number): ShippingFeeResponse {
    // VNPOST pricing logic
    let baseFee = 10000;
    
    if (distance <= 5) {
      baseFee = 10000;
    } else if (distance <= 10) {
      baseFee = 15000;
    } else if (distance <= 20) {
      baseFee = 20000;
    } else if (distance <= 50) {
      baseFee = 28000;
    } else {
      baseFee = 40000;
    }
    
    const weightFee = Math.ceil(weight) * 1000;
    
    return {
      carrier: 'VNPOST',
      service: 'Bưu điện Việt Nam',
      fee: baseFee + weightFee,
      estimatedDays: distance <= 20 ? 2 : distance <= 50 ? 3 : 5,
      note: 'Giao hàng bưu điện'
    };
  }
  
  async calculateShippingFee(request: ShippingFeeRequest): Promise<ShippingCalculationResult> {
    try {
      // Ensure weight is provided or use default
      const defaultWeight = 0.5; // 500g default
      const requestWithWeight = {
        ...request,
        weight: request.weight || defaultWeight
      };
      
      console.log(`📦 Local calculation weight: ${request.weight || 'not provided'} -> using ${requestWithWeight.weight}kg`);
      
      console.log('🔄 Local Shipping Calculation - Request Details:');
      console.log('  - Request:', JSON.stringify(requestWithWeight, null, 2));
      
      // Handle address_id case - if toAddress has address_id, we need to get the full address
      let toAddress = requestWithWeight.toAddress;
      if (requestWithWeight.toAddress.address_id && !requestWithWeight.toAddress.latitude && !requestWithWeight.toAddress.longitude) {
        console.log('  - Address has address_id, coordinates will be extracted from address data');
        console.log('  - Address ID:', requestWithWeight.toAddress.address_id);
        // The address data should already contain coordinates from the backend
      }
      
      // Lấy tọa độ cho địa chỉ gửi và nhận
      console.log('  - Getting coordinates for fromAddress...');
      const fromCoords = await this.getCoordinates(requestWithWeight.fromAddress);
      console.log('  - From coordinates:', fromCoords);
      
      console.log('  - Getting coordinates for toAddress...');
      const toCoords = await this.getCoordinates(toAddress);
      console.log('  - To coordinates:', toCoords);
      
      // Tính khoảng cách
      console.log('  - Calculating distance...');
      const distance = await this.calculateDistance(
        { ...requestWithWeight.fromAddress, latitude: fromCoords.lat, longitude: fromCoords.lng },
        { ...toAddress, latitude: toCoords.lat, longitude: toCoords.lng }
      );
      
      console.log('  - Calculated distance:', distance, 'km');
      
      const fees: ShippingFeeResponse[] = [];
      
      // Tính phí cho từng carrier
      if (!requestWithWeight.carrier || requestWithWeight.carrier === 'GHN') {
        fees.push(this.calculateGHNFee(distance, requestWithWeight.weight));
      }
      
      if (!requestWithWeight.carrier || requestWithWeight.carrier === 'GHTK') {
        fees.push(this.calculateGHTKFee(distance, requestWithWeight.weight));
      }
      
      if (!requestWithWeight.carrier || requestWithWeight.carrier === 'VNPOST') {
        fees.push(this.calculateVNPOSTFee(distance, requestWithWeight.weight));
      }
      
      const sortedFees = fees.sort((a, b) => a.fee - b.fee); // Sắp xếp theo phí tăng dần
      
      console.log('📦 Local shipping calculation results:', {
        distance: `${distance}km`,
        weight: `${requestWithWeight.weight}kg`,
        feesCount: sortedFees.length,
        cheapestFee: sortedFees[0]?.fee || 0,
        allFees: sortedFees.map(fee => `${fee.carrier}: ${fee.fee}VND`)
      });
      
      return {
        success: true,
        fees: sortedFees
      };
      
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      return {
        success: false,
        fees: [],
        error: 'Không thể tính phí vận chuyển'
      };
    }
  }
  
  async calculateShippingFeeAPI(request: ShippingFeeRequest, token?: string): Promise<ShippingCalculationResult> {
    try {
      // Ensure weight is provided or use default
      const defaultWeight = 0.5; // 500g default
      const requestWithWeight = {
        ...request,
        weight: request.weight || defaultWeight
      };
      
      console.log(`📦 Shipping API request weight: ${request.weight || 'not provided'} -> using ${requestWithWeight.weight}kg`);
      
      // Prepare request body for new API format
      const requestBody: any = {
        weight: requestWithWeight.weight,
        carrier: requestWithWeight.carrier || 'GHN'
      };
      
      // Add address_id if available, otherwise use full address objects
      if (requestWithWeight.toAddress.address_id) {
        requestBody.address_id = requestWithWeight.toAddress.address_id;
      } else {
        requestBody.toAddress = requestWithWeight.toAddress;
        requestBody.fromAddress = requestWithWeight.fromAddress;
      }
      
      // Add new parameters for total price calculation
      if (requestWithWeight.subtotal !== undefined) {
        requestBody.subtotal = requestWithWeight.subtotal;
      }
      if (requestWithWeight.voucher_code_order) {
        requestBody.voucher_code_order = requestWithWeight.voucher_code_order;
      }
      if (requestWithWeight.voucher_code_shipping) {
        requestBody.voucher_code_shipping = requestWithWeight.voucher_code_shipping;
      }
      
      console.log('🚀 Shipping API Call - Request Details:');
      console.log('  - URL:', `${API_BASE_URL}/api/orders/calculate-shipping`);
      console.log('  - Method: POST');
      console.log('  - Token provided:', !!token);
      console.log('  - Request body:', JSON.stringify(requestBody, null, 2));
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token is provided
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('  - Authorization header: Bearer [TOKEN]');
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/orders/calculate-shipping`, requestBody, {
        timeout: 15000, // 15 seconds timeout
        headers
      });
      
      console.log('✅ Shipping API Response:');
      console.log('  - Status:', response.status);
      console.log('  - Data:', JSON.stringify(response.data, null, 2));
      
      // Handle new API response format with price breakdown
      if (response.data.priceBreakdown) {
        console.log('💰 Price breakdown from API:', {
          subtotal: response.data.priceBreakdown.subtotal,
          order_discount: response.data.priceBreakdown.order_discount_amount,
          final_amount: response.data.priceBreakdown.final_amount,
          shipping_fee: response.data.priceBreakdown.shipping_fee,
          shipping_discount: response.data.priceBreakdown.shipping_discount_amount,
          final_shipping_fee: response.data.priceBreakdown.final_shipping_fee,
          total_price: response.data.priceBreakdown.total_price
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error calling shipping API:', error);
      
      // Log specific error details
      if (error.response) {
        console.error('  - API Error Response:', JSON.stringify(error.response.data, null, 2));
        console.error('  - API Error Status:', error.response.status);
        console.error('  - API Error Headers:', error.response.headers);
      } else if (error.request) {
        console.error('  - API Request Error:', error.request);
      } else {
        console.error('  - API Error Message:', error.message);
      }
      
      // Fallback to local calculation
      console.log('🔄 Falling back to local shipping calculation...');
      return this.calculateShippingFee(request);
    }
  }
}

export default new ShippingService();
