import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useEvents } from '../hooks/useEvents';
import { useNavigation } from '@react-navigation/native';
import WebMap from '../components/WebMap';

// Coordonnées de quelques villes clés pour référence
const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Pornic': { lat: 47.1161, lng: -2.1025 },
  'Saint-Brevin-les-Pins': { lat: 47.2456, lng: -2.1660 },
  'Paimboeuf': { lat: 47.2856, lng: -2.0297 },
  'Machecoul': { lat: 46.9956, lng: -1.8236 },
  'La Plaine-sur-Mer': { lat: 47.1439, lng: -2.1897 },
  'Nantes': { lat: 47.2184, lng: -1.5536 },
  'Saint-Nazaire': { lat: 47.2733, lng: -2.2134 },
};

// Coordonnées du Pays de Retz
const PAYS_DE_RETZ_REGION = {
  latitude: 47.1167,
  longitude: -2.1,
};

function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const locationLower = location.toLowerCase();
  const cleanLocation = locationLower
    .replace(/\d+/g, '')
    .replace(/rue|avenue|boulevard|place|chemin|allée|impasse/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const cityLower = city.toLowerCase();
    if (locationLower.includes(cityLower) || cleanLocation.includes(cityLower)) {
      return coords;
    }
  }
  
  return { lat: PAYS_DE_RETZ_REGION.latitude, lng: PAYS_DE_RETZ_REGION.longitude };
}

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { data: events, isLoading } = useEvents();

  const eventsWithCoords = events?.filter(event => {
    if (event.latitude && event.longitude) {
      return true;
    }
    const coords = getCityCoordinates(event.location);
    return coords !== null;
  }).map(event => ({
    ...event,
    coordinates: event.latitude && event.longitude 
      ? { lat: event.latitude, lng: event.longitude }
      : getCityCoordinates(event.location)!,
  })) || [];

  const handleMarkerPress = (event: any) => {
    // @ts-ignore
    navigation.navigate('EventDetail', { 
      event: {
        id: event.id,
        title: event.title || '',
        description: event.description || null,
        date: event.date || '',
        location: event.location || '',
        category: event.category || 'culturel',
        capacity: event.capacity || null,
        image_url: event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        organizer_id: event.organizer_id || '',
        participants_count: event.participants_count || 0,
        latitude: event.latitude || null,
        longitude: event.longitude || null,
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Carte</Text>
        <Text style={styles.subtitle}>Pays de Retz et environs</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement de la carte...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebMap 
            events={eventsWithCoords}
            onMarkerPress={handleMarkerPress}
            isDark={isDark}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
});
