import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function IPConfigScreen() {
  const [ipAddress, setIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidIP, setIsValidIP] = useState(false);

  useEffect(() => {
    // Load saved IP address if exists
    loadSavedIP();
  }, []);

  const loadSavedIP = async () => {
    try {
      const savedIP = await AsyncStorage.getItem('serverIP');
      if (savedIP) {
        setIpAddress(savedIP);
        validateIP(savedIP);
      }
    } catch (error) {
      console.error('Error loading saved IP:', error);
    }
  };

  const validateIP = (ip) => {
    // Basic IP validation regex
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isValid = ipRegex.test(ip);
    setIsValidIP(isValid);
    return isValid;
  };

  const handleIPChange = (text) => {
    setIpAddress(text);
    validateIP(text);
  };

  const testConnection = async () => {
    if (!isValidIP) {
      Alert.alert('Invalid IP', 'Please enter a valid IP address');
      return;
    }

    setIsLoading(true);
    try {
      // First save the IP address
      await AsyncStorage.setItem('serverIP', ipAddress);
      
      // Then test the connection
      const response = await axios.get(`http://${ipAddress}:8000/`, {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.data.message === "Welcome to the Personal Assistant API") {
        Alert.alert('Success', 'Connection successful!', [
          {
            text: 'Continue',
            onPress: () => router.replace('/login')
          }
        ]);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      let errorMessage = 'Could not connect to the server. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Connection timed out. Please check if the server is running and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage += 'Please check the IP address and try again.';
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1E1E1E', '#2D2D2D', '#3D3D3D']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Server Configuration</Text>
          <Text style={styles.subtitle}>Enter your server IP address</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                !isValidIP && ipAddress !== '' && styles.inputError
              ]}
              placeholder="Enter IP address (e.g., 192.168.1.100)"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={ipAddress}
              onChangeText={handleIPChange}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (!isValidIP || isLoading) && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={!isValidIP || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Test Connection</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(74, 144, 226, 0.5)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 