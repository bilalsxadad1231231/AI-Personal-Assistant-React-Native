import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

export default function HomeScreen() {
  const { isDarkMode, colors } = useTheme();

  const gradientColors = isDarkMode 
    ? [colors.primary, colors.secondary, '#000000']
    : ['#4c669f', '#3b5998', '#192f6a'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Your Assistant
          </Text>
        </View>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <FontAwesome name="comments" size={24} color={colors.text} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Chat with AI
            </Text>
            <Text style={[styles.cardDescription, { color: colors.text }]}>
              Start a conversation with your AI assistant
            </Text>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => {}}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Start Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cardDescription: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 