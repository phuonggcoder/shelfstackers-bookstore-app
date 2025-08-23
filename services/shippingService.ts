import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface ShippingAddress {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShippingFeeRequest {
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  weight: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  carrier?: 'GHN' | 'GHTK' | 'VNPOST';
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
    if (address.latitude && address.longitude) {
      return { lat: address.latitude, lng: address.longitude };
    }
    
    // Sử dụng Google Geocoding API để lấy tọa độ
    const addressString = [address.street, address.ward, address.district, address.province]
      .filter(Boolean)
      .join(', ');
    
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=AIzaSyCfTkVyuCEsN7C_DjS-e65IFj3TfBxjA-M`
      );
      
      if (response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
    
    // Fallback coordinates (Hà Nội)
    return { lat: 10.8665798, lng: 106.6713759 };
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
      // Lấy tọa độ cho địa chỉ gửi và nhận
      const fromCoords = await this.getCoordinates(request.fromAddress);
      const toCoords = await this.getCoordinates(request.toAddress);
      
      // Tính khoảng cách
      const distance = await this.calculateDistance(
        { ...request.fromAddress, latitude: fromCoords.lat, longitude: fromCoords.lng },
        { ...request.toAddress, latitude: toCoords.lat, longitude: toCoords.lng }
      );
      
      const fees: ShippingFeeResponse[] = [];
      
      // Tính phí cho từng carrier
      if (!request.carrier || request.carrier === 'GHN') {
        fees.push(this.calculateGHNFee(distance, request.weight));
      }
      
      if (!request.carrier || request.carrier === 'GHTK') {
        fees.push(this.calculateGHTKFee(distance, request.weight));
      }
      
      if (!request.carrier || request.carrier === 'VNPOST') {
        fees.push(this.calculateVNPOSTFee(distance, request.weight));
      }
      
      return {
        success: true,
        fees: fees.sort((a, b) => a.fee - b.fee) // Sắp xếp theo phí tăng dần
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
  
  async calculateShippingFeeAPI(request: ShippingFeeRequest): Promise<ShippingCalculationResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/calculate-shipping`, request);
      return response.data;
    } catch (error) {
      console.error('Error calling shipping API:', error);
      // Fallback to local calculation
      return this.calculateShippingFee(request);
    }
  }
}

export default new ShippingService();
