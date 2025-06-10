import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { user, logout } = useUser();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isFocused = useIsFocused();
  const router = useRouter();
  
  // Animation values
  const [buttonScale] = useState(new Animated.Value(1));
  const [headerScale] = useState(new Animated.Value(0));
  const [headerOpacity] = useState(new Animated.Value(0));
  const [contentOpacity] = useState(new Animated.Value(0));
  const [contentTranslateY] = useState(new Animated.Value(50));
  const [switchAnimations] = useState({
    notifications: new Animated.Value(notifications ? 1 : 0),
    darkMode: new Animated.Value(isDarkMode ? 1 : 0),
  });

  const gradientColors = isDarkMode 
    ? ['#1E1E1E', '#2D2D2D', '#3D3D3D']
    : ['#4A90E2', '#357ABD', '#2A5F9E'];

  const cardBackground = isDarkMode
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.9)';

  const textColor = isDarkMode ? '#FFFFFF' : '#2A2A2A';
  const secondaryTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(42, 42, 42, 0.7)';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(42, 42, 42, 0.1)';

  const buttonGradientColors = isDarkMode
    ? ['#4158D0', '#C850C0']
    : ['#FF6B6B', '#FF8E53'];

  const switchColors = {
    track: {
      false: isDarkMode ? '#2c2c2c' : '#e0e0e0',
      true: isDarkMode ? '#4158D0' : '#FF6B6B',
    },
    thumb: {
      false: isDarkMode ? '#4a4a4a' : '#f4f3f4',
      true: isDarkMode ? '#C850C0' : '#FF8E53',
    },
  };

  // Initialize animations when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset animation values
      headerScale.setValue(0);
      headerOpacity.setValue(0);
      contentOpacity.setValue(0);
      contentTranslateY.setValue(50);

      // Animate header
      Animated.parallel([
        Animated.timing(headerScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate content with delay
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }
  }, [isFocused]);

  // Update switch animations when values change
  useEffect(() => {
    Animated.timing(switchAnimations.notifications, {
      toValue: notifications ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [notifications]);

  useEffect(() => {
    Animated.timing(switchAnimations.darkMode, {
      toValue: isDarkMode ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [isDarkMode]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    animateButton();
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      const response = await axios.post(`/update-api-key?api_key=${encodeURIComponent(apiKey.trim())}`, null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        Alert.alert('Success', 'API key updated successfully');
        setApiKey('');
      } else {
        throw new Error(response.data.message || 'Failed to update API key');
      }
    } catch (error) {
      Alert.alert(
        'Error', 
        error.response?.data?.detail || error.message || 'Failed to update API key'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await logout();
      router.replace('/login');
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const renderSection = (title, content, animation) => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: animation,
          transform: [{
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        {title}
      </Text>
      {content}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.userHeader,
            {
              backgroundColor: cardBackground,
              opacity: headerOpacity,
              transform: [
                {
                  scale: headerScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.userInfo}>
            <Animated.View
              style={[
                styles.userIconContainer,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 144, 226, 0.1)',
                  transform: [
                    {
                      scale: headerScale.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <FontAwesome name="user-circle" size={32} color={isDarkMode ? '#FFFFFF' : '#4A90E2'} />
            </Animated.View>
            <View style={styles.userTextContainer}>
              <Animated.Text
                style={[
                  styles.username,
                  {
                    color: textColor,
                    opacity: headerOpacity,
                    transform: [
                      {
                        translateX: headerOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {user?.username || 'Guest'}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.userEmail,
                  {
                    color: secondaryTextColor,
                    opacity: headerOpacity,
                    transform: [
                      {
                        translateX: headerOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {user?.email || 'Not signed in'}
              </Animated.Text>
            </View>
          </View>
        </Animated.View>
        
        <Animated.ScrollView 
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [
                {
                  translateY: contentTranslateY,
                },
              ],
            },
          ]}
        >
          {renderSection(
            'Preferences',
            <>
              <View style={[styles.settingItem, { backgroundColor: cardBackground }]}>
                <View style={styles.settingLeft}>
                  <Ionicons 
                    name="notifications-outline" 
                    size={24} 
                    color={textColor}
                    style={styles.settingIcon} 
                  />
                  <Text style={[styles.settingText, { color: textColor }]}>
                    Enable Notifications
                  </Text>
                </View>
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: switchAnimations.notifications.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#767577', true: isDarkMode ? '#4A90E2' : '#357ABD' }}
                    thumbColor={notifications ? '#fff' : '#f4f3f4'}
                  />
                </Animated.View>
              </View>
              <View style={[styles.settingItem, { backgroundColor: cardBackground }]}>
                <View style={styles.settingLeft}>
                  <Ionicons 
                    name={isDarkMode ? "moon" : "sunny-outline"} 
                    size={24} 
                    color={textColor}
                    style={styles.settingIcon} 
                  />
                  <Text style={[styles.settingText, { color: textColor }]}>
                    Dark Mode
                  </Text>
                </View>
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: switchAnimations.darkMode.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: isDarkMode ? '#4A90E2' : '#357ABD' }}
                    thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                  />
                </Animated.View>
              </View>
            </>,
            contentOpacity
          )}

          {renderSection(
            'Account',
            <Animated.View
              style={{
                transform: [
                  {
                    scale: buttonScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: isDarkMode ? '#4A90E2' : '#357ABD' }]} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </Animated.View>,
            contentOpacity
          )}
        </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  username: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingText: {
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 