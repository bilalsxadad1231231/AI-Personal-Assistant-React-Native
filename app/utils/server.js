import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

let serverIP = null;

export const getServerIP = async () => {
  if (!serverIP) {
    serverIP = await AsyncStorage.getItem('serverIP');
  }
  return serverIP;
};

export const setServerIP = async (ip) => {
  serverIP = ip;
  await AsyncStorage.setItem('serverIP', ip);
};

export const getBaseURL = async () => {
  const ip = await getServerIP();
  return `http://${ip}:8000`;
};

export const api = axios.create();

// Add a request interceptor to automatically add the base URL
api.interceptors.request.use(async (config) => {
  const baseURL = await getBaseURL();
  config.baseURL = baseURL;
  return config;
}); 