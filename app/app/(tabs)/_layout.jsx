import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated, TouchableOpacity, Text } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRef, useEffect } from 'react';

function CustomTabBar({ state, descriptors, navigation }) {
  const { isDarkMode } = useTheme();
  const tabAnimations = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    state.routes.forEach((_, index) => {
      Animated.spring(tabAnimations[index], {
        toValue: state.index === index ? 1 : 0,
        useNativeDriver: true,
        damping: 12,
        mass: 1,
        stiffness: 100,
      }).start();
    });
  }, [state.index]);

  const getIcon = (routeName, isFocused) => {
    const color = isFocused ? '#e94560' : isDarkMode ? '#ffffff' : '#666666';
    const size = 24;

    switch (routeName) {
      case 'home':
        return <FontAwesome name="home" size={size} color={color} />;
      case 'chat':
        return <MaterialCommunityIcons name="chat" size={size} color={color} />;
      case 'settings':
        return <FontAwesome name="cog" size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View style={[
      styles.tabBar,
      { 
        backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff',
        borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }
    ]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.tabItemContainer,
                {
                  transform: [
                    {
                      scale: tabAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              {getIcon(route.name, isFocused)}
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? '#e94560' : isDarkMode ? '#ffffff' : '#666666',
                    opacity: tabAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                    transform: [
                      {
                        translateY: tabAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [5, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
              </Animated.Text>
              {isFocused && (
                <Animated.View
                  style={[
                    styles.activeIndicator,
                    {
                      backgroundColor: '#e94560',
                      transform: [
                        {
                          scale: tabAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});