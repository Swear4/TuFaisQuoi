import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, Text, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

import ProfileEditScreen from '../screens/ProfileEditScreen';
import EventChatScreen from '../screens/EventChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator id="AuthStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator pour les événements (liste + détails)
function EventsStack() {
  return (
    <Stack.Navigator id="EventsStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EventChat" component={EventChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator pour l'accueil
function HomeStack() {
  return (
    <Stack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EventChat" component={EventChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator pour "Mes Événements"
function MyEventsStack() {
  return (
    <Stack.Navigator id="MyEventsStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyEventsList" component={MyEventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EventChat" component={EventChatScreen} />
    </Stack.Navigator>
  );
}

// Import des nouveaux écrans
import NotificationsScreen from '../screens/NotificationsScreen';
import ThemeScreen from '../screens/ThemeScreen';
import AboutScreen from '../screens/AboutScreen';

// Stack Navigator pour la carte
function MapStack() {
  return (
    <Stack.Navigator id="MapStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator pour le profil
function ProfileStack() {
  return (
    <Stack.Navigator id="ProfileStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      id="MainTabNavigator"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: isDark ? colors.primary : colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
          height: 50 + insets.bottom,
        },
      }}
    >
        <Tab.Screen
          name="Accueil"
          component={HomeStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 28, color }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Événements"
          component={EventsStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 28, color }}>🎫</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Carte"
          component={MapStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 28, color }}>🗺️</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 28, color }}>👤</Text>
            ),
          }}
        />
      </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
