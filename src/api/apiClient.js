import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to access localhost, otherwise use localhost
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (like 401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if (error.response?.status === 401) {
    //   // Token expired or invalid
    //   await AsyncStorage.removeItem('userToken');
    //   // Potential redirect to Login could be handled here or via AuthContext listener
    // }
    return Promise.reject(error);
  }
);

export default apiClient;
