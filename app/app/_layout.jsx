import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../context/UserContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function Layout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login screen on app start
    router.replace('/login');
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#4A90E2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen 
            name="(tabs)" 
            options={{
              headerShown: false
            }}
          />
        </Stack>
      </UserProvider>
    </ThemeProvider>
  );
}