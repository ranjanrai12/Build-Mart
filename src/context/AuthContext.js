import { createContext, useReducer, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
  hasSeenOnboarding: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ONBOARDING':
      return { ...state, hasSeenOnboarding: action.payload };
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token || state.token,
        loading: false
      };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [userStr, token, onboardingStr] = await Promise.all([
        AsyncStorage.getItem('@buildmart_user'),
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('@has_seen_onboarding'),
      ]);

      if (onboardingStr === 'true') {
        dispatch({ type: 'SET_ONBOARDING', payload: true });
      }

      if (userStr && token) {
        dispatch({
          type: 'LOGIN',
          payload: { user: JSON.parse(userStr), token }
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setHasSeenOnboarding = (val) => {
    dispatch({ type: 'SET_ONBOARDING', payload: val });
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      await Promise.all([
        AsyncStorage.setItem('@buildmart_user', JSON.stringify(user)),
        AsyncStorage.setItem('userToken', access_token),
      ]);

      dispatch({ type: 'LOGIN', payload: { user, token: access_token } });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, role = 'buyer') => {
    try {
      const response = await apiClient.post('/auth/register', {
        name, email, password, role
      });
      const { access_token, user } = response.data;

      await Promise.all([
        AsyncStorage.setItem('@buildmart_user', JSON.stringify(user)),
        AsyncStorage.setItem('userToken', access_token),
      ]);

      dispatch({ type: 'LOGIN', payload: { user, token: access_token } });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const updateUser = async (updatedData) => {
    // This is for immediate local updates (like name or UI preferences)
    // For sensitive fields, use requestProfileUpdate + confirmProfileUpdate
    const newData = { ...state.user, ...updatedData };
    if (newData.role === 'seller' && newData.isStoreOpen === undefined) {
      newData.isStoreOpen = true;
    }
    await AsyncStorage.setItem('@buildmart_user', JSON.stringify(newData));
    dispatch({ type: 'LOGIN', payload: { user: newData } });
  };

  const requestProfileUpdate = async (updatedData) => {
    try {
      const response = await apiClient.post('/auth/profile-update/request', updatedData);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed'
      };
    }
  };

  const confirmProfileUpdate = async (updatedData, otp) => {
    try {
      const response = await apiClient.post('/auth/profile-update/confirm', {
        updateData: updatedData,
        otp
      });
      const { access_token, user } = response.data;

      await Promise.all([
        AsyncStorage.setItem('@buildmart_user', JSON.stringify(user)),
        AsyncStorage.setItem('userToken', access_token),
      ]);

      dispatch({ type: 'LOGIN', payload: { user, token: access_token } });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed'
      };
    }
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('@buildmart_user'),
      AsyncStorage.removeItem('userToken'),
    ]);
    dispatch({ type: 'LOGOUT' });
  };

  const loginByPhone = async (phone, userData = {}) => {
    try {
      const response = await apiClient.post('/auth/phone-login', {
        phone,
        ...userData,
      });
      const { access_token, user } = response.data;

      await Promise.all([
        AsyncStorage.setItem('@buildmart_user', JSON.stringify(user)),
        AsyncStorage.setItem('userToken', access_token),
      ]);

      dispatch({ type: 'LOGIN', payload: { user, token: access_token } });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Phone login failed'
      };
    }
  };
  
  const checkPhone = async (phone) => {
    try {
      const response = await apiClient.post('/auth/phone-check', { phone });
      return response.data; // { exists: boolean }
    } catch (error) {
      console.error('Phone check failed:', error);
      return { exists: false, error: true };
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      ...state, 
      login, 
      register, 
      logout, 
      updateUser, 
      requestProfileUpdate,
      confirmProfileUpdate,
      setHasSeenOnboarding, 
      loginByPhone,
      checkPhone
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
