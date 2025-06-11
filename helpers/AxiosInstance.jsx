import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hàm tạo Axios instance
const AxiosInstance = (token = '', contentType = 'application/json') => {
    const instance = axios.create({
        baseURL: 'https://cro101-b166e76cc76a.herokuapp.com/',
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json',
            'Content-Type': contentType
        }
    });

    // Interceptor để trả về response.data luôn
    instance.interceptors.response.use(
        response => response.data,
        error => {
            console.error('API Error:', error?.response || error.message);
            return Promise.reject(error);
        }
    );

    return instance;
};

// Hàm gọi API để lấy giỏ hàng
export const getCartItems = async () => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        const axiosInstance = AxiosInstance(token);
        const response = await axiosInstance.get('/cart');
        return response; 
    } catch (error) {
        console.error('Get cart failed:', error);
        return [];
    }
};

export default AxiosInstance;
