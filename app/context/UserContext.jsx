import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const UserContext = createContext();

// Default server URL (https://jalalkhan123-agent-backend.hf.space)
const DEFAULT_SERVER_URL = 'https://5faa-223-123-88-223.ngrok-free.app';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseURL, setBaseURL] = useState(DEFAULT_SERVER_URL);

  // Configure axios defaults
  useEffect(() => {
    const setupAxios = async () => {
      try {
        setBaseURL(DEFAULT_SERVER_URL);
        axios.defaults.baseURL = DEFAULT_SERVER_URL;
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.headers.common['Accept'] = 'application/json';
        
        // Add timeout and error handling
        axios.interceptors.response.use(
          response => response,
          error => {
            console.error('API Error:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              url: error.config?.url,
              baseURL: error.config?.baseURL
            });
            return Promise.reject(error);
          }
        );
      } catch (error) {
        console.error('Error setting up axios:', error);
      }
    };

    setupAxios();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await axios.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Session check response:', response.data);
          setUser(response.data);
        }
      } catch (err) {
        console.error('Session check error:', err);
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signup = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting signup with:', { 
        username, 
        email,
        apiUrl: baseURL,
        platform: Platform.OS
      });
      
      const response = await axios.post('/signup', {
        username,
        email,
        password
      }, {
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes less than 500
        }
      });
      
      console.log('Signup response:', response.data);
      
      if (response.status >= 400) {
        throw new Error(response.data.detail || 'Signup failed');
      }
      
      // If signup was successful but no token was received, try to login
      if (!response.data.access_token) {
        console.log('No access token received, attempting login...');
        const loginResponse = await axios.post('/login', {
          email,
          password
        });
        
        if (loginResponse.data.access_token) {
          await AsyncStorage.setItem('token', loginResponse.data.access_token);
          setUser(loginResponse.data);
          return loginResponse.data;
        } else {
          throw new Error('Login failed after successful signup');
        }
      }
      
      // If we got a token directly from signup
      await AsyncStorage.setItem('token', response.data.access_token);
      setUser(response.data);
      return response.data;
      
    } catch (err) {
      console.error('Signup error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code
      });
      
      let errorMessage = 'An error occurred during signup';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timed out. Please check your internet connection.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting login with:', { email, apiUrl: baseURL, platform: Platform.OS });
      
      const response = await axios.post('/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.access_token) {
        await AsyncStorage.setItem('token', response.data.access_token);
        
        // Get user data after successful login
        const userResponse = await axios.get('/users/me', {
          headers: { Authorization: `Bearer ${response.data.access_token}` }
        });
        
        console.log('User data after login:', userResponse.data);
        setUser(userResponse.data);
      }
      
      return response.data;
    } catch (err) {
      console.error('Login error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred during login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const chat = async (message) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post('/chat', {
        query: message  // Changed from 'message' to 'query' to match backend
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (err) {
      console.error('Chat error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'An error occurred during chat';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      error,
      signup,
      login,
      logout,
      chat
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 