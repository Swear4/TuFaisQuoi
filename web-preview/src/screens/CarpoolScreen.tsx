import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export default function CarpoolScreen() {
  const carpools = [
    {
      id: '1',
      eventName: 'Concert de jazz',
      driverName: 'Marie D.',
      departureLocation: 'Centre-ville',
      departureTime: '20h45',
      availableSeats: 3,
      pricePerSeat: 5,
    },
    {
      id: '2',
      eventName: 'Soirée d\'été en plein air',
      driverName: 'Thomas L.',
      departureLocation: 'Gare Nord',
      departureTime: '19h30',
      availableSeats: 2,
      pricePerSeat: 0,
    },
    {
      id: '3',
      eventName: 'Match de football amateur',
      driverName: 'Sophie M.',
      departureLocation: 'Place de la République',
      departureTime: '14h15',
      availableSeats: 4,
      pricePerSeat: 3,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Covoiturage</Text>
        <Text style={styles.subtitle}>Partagez le trajet, partagez les moments</Text>
      </View>

      <ScrollView style={styles.carpoolsContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Le covoiturage vous permet de partager les frais de transport et de rencontrer d'autres participants avant l'événement !
          </Text>
        </View>

        {carpools.map((carpool) => (
          <View key={carpool.id} style={styles.carpoolCard}>
            <View style={styles.carpoolHeader}>
              <Text style={styles.eventName}>{carpool.eventName}</Text>
              {carpool.pricePerSeat === 0 ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>Gratuit</Text>
                </View>
              ) : (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{carpool.pricePerSeat}€/place</Text>
                </View>
              )}
            </View>

            <View style={styles.driverInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{carpool.driverName[0]}</Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{carpool.driverName}</Text>
                <Text style={styles.driverLabel}>Conducteur</Text>
              </View>
            </View>

            <View style={styles.tripInfo}>
              <View style={styles.tripRow}>
                <Text style={styles.tripIcon}>📍</Text>
                <View style={styles.tripDetails}>
                  <Text style={styles.tripLabel}>Départ</Text>
                  <Text style={styles.tripText}>{carpool.departureLocation}</Text>
                </View>
              </View>
              <View style={styles.tripRow}>
                <Text style={styles.tripIcon}>🕐</Text>
                <View style={styles.tripDetails}>
                  <Text style={styles.tripLabel}>Heure</Text>
                  <Text style={styles.tripText}>{carpool.departureTime}</Text>
                </View>
              </View>
              <View style={styles.tripRow}>
                <Text style={styles.tripIcon}>💺</Text>
                <View style={styles.tripDetails}>
                  <Text style={styles.tripLabel}>Places disponibles</Text>
                  <Text style={styles.tripText}>{carpool.availableSeats}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.requestButton}>
              <Text style={styles.requestButtonText}>Demander une place</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.createCarpoolButton}>
          <Text style={styles.createCarpoolButtonText}>+ Proposer un covoiturage</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  carpoolsContainer: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: Colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  carpoolCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  carpoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  freeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  driverLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tripInfo: {
    marginBottom: 16,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  tripDetails: {
    flex: 1,
  },
  tripLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  tripText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: Colors.secondary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  createCarpoolButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createCarpoolButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
