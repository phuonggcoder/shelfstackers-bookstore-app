import AsyncStorage from '@react-native-async-storage/async-storage';
import AxiosInstance from '../helpers/AxiosInstance';

// Lấy danh sách sản phẩm trong giỏ hàng
export const getCartItems = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) throw new Error('Token not found');
    
    const axios = AxiosInstance(token);
    const response = await axios.get('/cart');
    return response.data;
  } catch (error) {
    console.error('Get cart failed:', error);
    return [];
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCartApi = async (productId: number, quantity: number) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) throw new Error('Token not found');

    const axios = AxiosInstance(token);
    const response = await axios.post('/cart', {
      productId,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error('Add to cart failed:', error);
    return null;
  }
};
