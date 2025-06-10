import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

export default function ChatScreen() {
  const { user, chat, loading } = useUser();
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const scrollViewRef = useRef();
  const isFocused = useIsFocused();

  // Animation values
  const [headerScale] = useState(new Animated.Value(0));
  const [headerOpacity] = useState(new Animated.Value(0));
  const [contentOpacity] = useState(new Animated.Value(0));
  const [contentTranslateY] = useState(new Animated.Value(50));
  const [buttonScale] = useState(new Animated.Value(1));
  const [inputScale] = useState(new Animated.Value(0));
  const messageAnimations = useRef({}).current;

  // Initialize animations when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset animation values
      headerScale.setValue(0);
      headerOpacity.setValue(0);
      contentOpacity.setValue(0);
      contentTranslateY.setValue(50);
      inputScale.setValue(0);

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

      // Animate input area
      Animated.timing(inputScale, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }).start();
    }
  }, [isFocused]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
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

  const getMessageAnimation = (index) => {
    if (!messageAnimations[index]) {
      messageAnimations[index] = new Animated.Value(0);
    }
    return messageAnimations[index];
  };

  useEffect(() => {
    messages.forEach((_, index) => {
      Animated.spring(getMessageAnimation(index), {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        damping: 12,
        mass: 1,
        stiffness: 100,
      }).start();
    });
  }, [messages]);

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'image.jpg'
      });
      formData.append('name', `user_${user.id}_${Date.now()}`);

      const response = await axios.post('/upload-image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.filename;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadPdf = async (pdfAsset) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: pdfAsset.uri,
        type: 'application/pdf',
        name: pdfAsset.name
      });

      const response = await axios.post('/process-pdf', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('PDF upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (message.trim() || selectedImage || selectedPdf) {
      let uploadedImageFilename = null;
      let uploadedPdfFilename = null;
      
      // First, upload the image if present
      if (selectedImage) {
        try {
          uploadedImageFilename = await uploadImage(selectedImage);
        } catch (error) {
          const errorMessage = { 
            text: 'Error uploading image: ' + error.message, 
            sender: 'assistant',
            isError: true 
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
      }

      // Then, upload the PDF if present
      if (selectedPdf) {
        try {
          uploadedPdfFilename = await uploadPdf(selectedPdf);
        } catch (error) {
          const errorMessage = { 
            text: 'Error uploading PDF: ' + error.message, 
            sender: 'assistant',
            isError: true 
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
      }

      // Add user message to chat
      const userMessage = { 
        text: message, 
        sender: 'user',
        image: selectedImage ? { uri: selectedImage.uri } : null,
        pdf: selectedPdf ? { uri: selectedPdf.uri } : null
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setSelectedImage(null);
      setSelectedPdf(null);
      
      // Then send the message with the query
      try {
        const response = await chat(message);
        const assistantMessage = { 
          text: response.content || 'Sorry, I could not process your request.', 
          sender: 'assistant' 
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage = { 
          text: 'Error: ' + error.message, 
          sender: 'assistant',
          isError: true 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setShowMenu(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      setSelectedPdf(result.assets[0]);
      setShowMenu(false);

      try {
        const response = await uploadPdf(result.assets[0]);
        const successMessage = { 
          text: `PDF "${result.assets[0].name}" uploaded and processed successfully!`, 
          sender: 'assistant'
        };
        setMessages(prev => [...prev, successMessage]);
      } catch (error) {
        const errorMessage = { 
          text: 'Error uploading PDF: ' + error.message, 
          sender: 'assistant',
          isError: true 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user';
    const animation = getMessageAnimation(index);

    return (
      <Animated.View
        key={index}
        style={[
          styles.messageWrapper,
          isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper,
          {
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {!isUser && (
          <Animated.View 
            style={[
              styles.assistantAvatar,
              {
                opacity: animation,
                transform: [
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="robot-happy" size={24} color="#fff" />
          </Animated.View>
        )}
        {isUser && (
          <Animated.View 
            style={[
              styles.userAvatar,
              {
                opacity: animation,
                transform: [
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessage : styles.assistantMessage,
            msg.isError && styles.errorMessage,
            {
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {msg.image && (
            <Image
              source={msg.image}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          {msg.pdf && (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
              msg.isError && styles.errorText
            ]}>
              {msg.pdf.name}
            </Text>
          )}
          {msg.text && (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
              msg.isError && styles.errorText
            ]}>
              {msg.text}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.userHeader,
            { backgroundColor: colors.card },
            {
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
          <FontAwesome name="user-circle" size={24} color={colors.text} />
          <Text style={[styles.username, { color: colors.text }]}>
            {user?.username || 'Guest'}
          </Text>
        </Animated.View>
        
        <View style={styles.mainContainer}>
          <Animated.ScrollView 
            ref={scrollViewRef}
            style={[
              styles.messagesContainer,
              {
                opacity: contentOpacity,
                transform: [
                  {
                    translateY: contentTranslateY,
                  },
                ],
              },
            ]}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {messages.map((msg, index) => renderMessage(msg, index))}
            {(loading || uploading) && (
              <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
                <View style={styles.assistantAvatar}>
                  <MaterialCommunityIcons name="robot-happy" size={24} color="#fff" />
                </View>
                <View style={[styles.messageBubble, styles.assistantMessage]}>
                  <ActivityIndicator size="small" color="#e94560" />
                </View>
              </View>
            )}
          </Animated.ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.keyboardView}
          >
            <Animated.View 
              style={[
                styles.bottomContainer,
                {
                  opacity: inputScale,
                  transform: [
                    {
                      scale: inputScale.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {selectedImage && (
                <Animated.View 
                  style={[
                    styles.selectedImageContainer, 
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    {
                      opacity: buttonScale,
                      transform: [{ scale: buttonScale }],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <FontAwesome name="times-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              )}
              <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: '#e94560' }]}
                    onPress={() => {
                      animateButton();
                      handleSend();
                    }}
                  >
                    <FontAwesome name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
              <View style={[styles.bottomIconsContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => {
                      animateButton();
                      pickImage();
                    }}
                    disabled={uploading}
                  >
                    <MaterialCommunityIcons name="image-plus" size={24} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => {
                      animateButton();
                      pickPdf();
                    }}
                    disabled={uploading}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>

        <Modal
          visible={showMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMenu(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={pickImage}
                disabled={uploading}
              >
                <FontAwesome name="image" size={24} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>
                  Upload Image
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={pickPdf}
                disabled={uploading}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>
                  Upload PDF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowMenu(false)}
              >
                <FontAwesome name="times" size={24} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  username: {
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  keyboardView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    marginBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageWrapper: {
    marginVertical: 5,
    paddingHorizontal: 5,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userMessage: {
    backgroundColor: '#e94560',
    borderBottomRightRadius: 5,
  },
  assistantMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 5,
  },
  errorMessage: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#1a1a2e',
  },
  errorText: {
    color: '#ff0000',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 5,
    paddingLeft: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageUploadButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  removeImageButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 10,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  imageCaption: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  bottomContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
}); 