import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useEvents } from '../hooks/useEvents';
import { useNavigation } from '@react-navigation/native';

// Coordonnées du Pays de Retz (centre approximatif entre Pornic et Saint-Brevin)
const PAYS_DE_RETZ_REGION = {
  latitude: 47.1167,
  longitude: -2.1,
  latitudeDelta: 0.5, // Zone couvrant le Pays de Retz et environs
  longitudeDelta: 0.5,
};

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

// Fonction pour extraire les coordonnées approximatives depuis la localisation
function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const locationLower = location.toLowerCase();
  
  // Nettoyer la localisation pour enlever les numéros de rue, codes postaux, etc.
  const cleanLocation = locationLower
    .replace(/\d+/g, '') // Enlever les numéros
    .replace(/rue|avenue|boulevard|place|chemin|allée|impasse/g, '') // Enlever les types de voies
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim();
  
  // Chercher la ville dans l'adresse complète ou la localisation nettoyée
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const cityLower = city.toLowerCase();
    if (locationLower.includes(cityLower) || cleanLocation.includes(cityLower)) {
      return coords;
    }
  }
  
  // Retour par défaut au centre du Pays de Retz si aucune ville reconnue
  return { lat: PAYS_DE_RETZ_REGION.latitude, lng: PAYS_DE_RETZ_REGION.longitude };
}

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { data: events, isLoading } = useEvents();

  // Filtrer les événements avec coordonnées
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
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={PAYS_DE_RETZ_REGION}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          mapType={isDark ? 'hybrid' : 'standard'}
        >
          {eventsWithCoords.map((event) => (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.coordinates.lat,
                longitude: event.coordinates.lng,
              }}
              title={event.title}
              description={event.location}
              pinColor={Colors.primary}
              onPress={() => handleMarkerPress(event)}
            />
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
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
  map: {
    flex: 1,
  },
});
