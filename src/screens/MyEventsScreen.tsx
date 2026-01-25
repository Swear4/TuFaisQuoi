import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export default function MyEventsScreen({ navigation, route }: any) {
  const { event } = route.params;
  const [activeTab, setActiveTab] = useState<'details' | 'discussions' | 'ticket'>('details');
  
  // Mock data - à remplacer par vraies données backend
  const userRegistration = {
    eventId: event.id,
    registrationDate: '2024-11-15',
    ticketType: 'standard',
    isRefundable: false, // Non remboursable car discussions ouvertes
    hasJoinedMainChat: true,
    carpoolId: '1',
    beforeAfterId: '2',
  };

  const carpoolDetails = {
    id: '1',
    driverName: 'Sophie Martin',
    departureLocation: 'Gare du Nord',
    departureTime: '19:30',
    availableSeats: 3,
    passengers: ['Vous', 'Thomas L.', 'Marie D.'],
  };

  const beforeAfterDetails = {
    id: '2',
    type: 'before',
    title: 'Apéro avant la soirée',
    location: 'Bar Le Central',
    time: '18:00',
    participants: 8,
  };

  const isSmallEvent = event.capacity <= 20;

  const handleOpenChat = (chatType: string) => {
    // TODO: Navigation vers l'écran de chat
    console.log(`Opening ${chatType} chat`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Mon Événement</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Event Header Card */}
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventImageLarge}>
            {event.imageUri ? (
              <Image source={{ uri: event.imageUri }} style={styles.eventImage} resizeMode="cover" />
            ) : (
              <Text style={styles.eventImageEmoji}>🖼️</Text>
            )}
          </View>
          <View style={styles.eventMainInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.eventDate}>📅 {event.date}</Text>
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Détails
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discussions' && styles.tabActive]}
          onPress={() => setActiveTab('discussions')}
        >
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.tabTextActive]}>
            Discussions
          </Text>
          {(carpoolDetails || beforeAfterDetails) && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {(carpoolDetails ? 2 : 0) + (beforeAfterDetails ? 5 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ticket' && styles.tabActive]}
          onPress={() => setActiveTab('ticket')}
        >
          <Text style={[styles.tabText, activeTab === 'ticket' && styles.tabTextActive]}>
            Billet
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>

        {/* Onglet Détails */}
        {activeTab === 'details' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Informations</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{event.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lieu</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Capacité</Text>
                  <Text style={styles.detailValue}>{event.capacity} personnes</Text>
                </View>
              </View>
            </View>

            {/* Carpool Section */}
            {carpoolDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚗 Mon Covoiturage</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Conducteur</Text>
                    <Text style={styles.detailValue}>{carpoolDetails.driverName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Départ</Text>
                    <Text style={styles.detailValue}>{carpoolDetails.departureLocation}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Heure</Text>
                    <Text style={styles.detailValue}>{carpoolDetails.departureTime}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Passagers</Text>
                    <Text style={styles.detailValue}>{carpoolDetails.passengers.length}/{carpoolDetails.availableSeats + carpoolDetails.passengers.length}</Text>
                  </View>
                  
                  <View style={styles.passengersList}>
                    {carpoolDetails.passengers.map((passenger, index) => (
                      <View key={index} style={styles.passengerChip}>
                        <Text style={styles.passengerName}>{passenger}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Before/After Section */}
            {beforeAfterDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {beforeAfterDetails.type === 'before' ? '⏰ Mon Before' : '🎉 Mon After'}
                </Text>
                <View style={styles.detailCard}>
                  <Text style={styles.beforeAfterTitle}>{beforeAfterDetails.title}</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lieu</Text>
                    <Text style={styles.detailValue}>{beforeAfterDetails.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Heure</Text>
                    <Text style={styles.detailValue}>{beforeAfterDetails.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Participants</Text>
                    <Text style={styles.detailValue}>{beforeAfterDetails.participants} personnes</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Danger Zone */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.dangerButton} disabled={!userRegistration.isRefundable}>
                <Text style={styles.dangerButtonText}>
                  {userRegistration.isRefundable ? 'Annuler ma participation' : 'Annulation impossible'}
                </Text>
              </TouchableOpacity>
              {!userRegistration.isRefundable && (
                <Text style={styles.helperTextDanger}>
                  Les billets ne sont plus remboursables une fois les discussions ouvertes
                </Text>
              )}
            </View>
          </>
        )}

        {/* Onglet Discussions */}
        {activeTab === 'discussions' && (
          <>
            {/* Main Chat Section (for small events) */}
            {isSmallEvent && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💬 Discussion principale</Text>
                <TouchableOpacity 
                  style={styles.chatCard}
                  onPress={() => handleOpenChat('main')}
                >
                  <View style={styles.chatIconContainer}>
                    <Text style={styles.chatIcon}>👥</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>Groupe principal</Text>
                    <Text style={styles.chatSubtitle}>{event.capacity} participants max</Text>
                  </View>
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>3</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  ℹ️ Petit événement : tout le monde dans une seule discussion
                </Text>
              </View>
            )}

            {/* Carpool Discussion */}
            {!isSmallEvent && carpoolDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚗 Discussions</Text>
                <TouchableOpacity 
                  style={styles.chatCard}
                  onPress={() => handleOpenChat('carpool')}
                >
                  <View style={styles.chatIconContainer}>
                    <Text style={styles.chatIcon}>🚗</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>Covoiturage</Text>
                    <Text style={styles.chatSubtitle}>{carpoolDetails.passengers.length} passagers</Text>
                  </View>
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>2</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Before/After Discussion */}
            {!isSmallEvent && beforeAfterDetails && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.chatCard}
                  onPress={() => handleOpenChat('beforeafter')}
                >
                  <View style={styles.chatIconContainer}>
                    <Text style={styles.chatIcon}>
                      {beforeAfterDetails.type === 'before' ? '⏰' : '🎉'}
                    </Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>{beforeAfterDetails.title}</Text>
                    <Text style={styles.chatSubtitle}>{beforeAfterDetails.participants} participants</Text>
                  </View>
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>5</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Large Event Info */}
            {!isSmallEvent && (
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Grand événement : les discussions sont organisées par sous-groupes (covoiturage, before/after) pour faciliter la coordination.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Onglet Billet */}
        {activeTab === 'ticket' && (
          <View style={styles.section}>
            <View style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>🎟️ Votre Billet</Text>
              <View style={styles.ticketQR}>
                <Text style={styles.ticketQREmoji}>📱</Text>
                <Text style={styles.ticketQRText}>QR Code</Text>
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketLabel}>Événement</Text>
                <Text style={styles.ticketValue}>{event.title}</Text>
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketLabel}>Date</Text>
                <Text style={styles.ticketValue}>{event.date}</Text>
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketLabel}>Type de billet</Text>
                <Text style={styles.ticketValue}>{userRegistration.ticketType}</Text>
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketLabel}>Inscrit le</Text>
                <Text style={styles.ticketValue}>{userRegistration.registrationDate}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 40,
  },
  eventCard: {
    backgroundColor: Colors.secondary + '15',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: Colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventImageLarge: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  eventImageEmoji: {
    fontSize: 40,
  },
  eventMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 24,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  nonRefundableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  nonRefundableIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  nonRefundableText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatIcon: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chatBadge: {
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: Colors.secondary + '20',
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  passengersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  passengerChip: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  passengerName: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  chatButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  chatButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chatButtonBadge: {
    backgroundColor: Colors.error,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  beforeAfterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: Colors.error + '20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: '600',
  },
  helperTextDanger: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  ticketQR: {
    width: 200,
    height: 200,
    backgroundColor: Colors.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  ticketQREmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  ticketQRText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ticketValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
});
