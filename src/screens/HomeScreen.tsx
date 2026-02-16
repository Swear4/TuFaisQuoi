import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import CreateEventModal from './CreateEventModal';
import { usePopularEvents, useEventsStats, useUpcomingCountByCategory } from '../hooks/useEvents';
import { useTripsStats } from '../hooks/useTrips';
import { getCategoryColor } from '../utils/categoryColors';
import { getEventCategories, getPrimaryCategory } from '../utils/eventCategories';

export default function HomeScreen({ navigation }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { colors } = useTheme();

  // Fetch data from Supabase
  const { data: popularEvents, isLoading: eventsLoading } = usePopularEvents(3);
  const { data: eventsStats } = useEventsStats();
  const { data: tripsStats } = useTripsStats();
  const { data: dinnersUpcoming } = useUpcomingCountByCategory('gastronomie');
  const { data: partiesUpcoming } = useUpcomingCountByCategory('nocturne');

  // Formater la date pour affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <CreateEventModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Bienvenue sur TuFaisQuoi</Text>
        <Text style={styles.subtitle}>Connectez-vous, partagez, vibrez ensemble</Text>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.secondary + '30' }]}
          onPress={() => navigation.navigate('Événements', { 
            screen: 'EventsList',
            params: { initialTab: 'events' }
          })}
        >
          <Text style={[styles.statNumber, { color: colors.primary }]}>{eventsStats?.upcoming || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Événements à venir</Text>
          <Text style={styles.statIcon}>🎫</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.secondary + '30' }]}
          onPress={() => navigation.navigate('Événements', { 
            screen: 'EventsList',
            params: { initialTab: 'newFriends', initialNewFriendsTab: 'trips' }
          })}
        >
          <Text style={[styles.statNumber, { color: colors.primary }]}>{tripsStats?.upcoming || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Voyages à venir</Text>
          <Text style={styles.statIcon}>✈️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.secondary + '30' }]}
          onPress={() => navigation.navigate('Événements', { 
            screen: 'EventsList',
            params: { initialTab: 'newFriends', initialNewFriendsTab: 'dinners' }
          })}
        >
          <Text style={[styles.statNumber, { color: colors.primary }]}>{dinnersUpcoming || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dîners à venir</Text>
          <Text style={styles.statIcon}>🍽️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.secondary + '30' }]}
          onPress={() => navigation.navigate('Événements', { 
            screen: 'EventsList',
            params: { initialTab: 'newFriends', initialNewFriendsTab: 'parties' }
          })}
        >
          <Text style={[styles.statNumber, { color: colors.primary }]}>{partiesUpcoming || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Soirées à venir</Text>
          <Text style={styles.statIcon}>🌙</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Événements populaires</Text>
        {eventsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : !popularEvents || popularEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun événement pour le moment</Text>
          </View>
        ) : (
          popularEvents.map((event) => (
            <TouchableOpacity 
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { event })}
            >
              <View style={styles.eventInfo}>
                <View style={styles.categoryBadgesRow}>
                  {(() => {
                    const categories = getEventCategories(event);
                    const fallback = [getPrimaryCategory(event)];
                    const toRender = categories.length ? categories : fallback;
                    return toRender.map((cat) => (
                      <View
                        key={cat}
                        style={[styles.categoryBadge, { backgroundColor: getCategoryColor(cat).backgroundColor }]}
                      >
                        <Text style={[styles.categoryBadgeText, { color: getCategoryColor(cat).textColor }]}>
                          {cat}
                        </Text>
                      </View>
                    ));
                  })()}
                </View>
                <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.eventDate, { color: colors.textSecondary }]}>{formatDate(event.date)}</Text>
                <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>{event.location}</Text>
              </View>
              <View style={styles.eventImageContainer}>
                {event.image_url ? (
                  <Image 
                    source={{ uri: event.image_url }} 
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.eventImagePlaceholder}>
                    <Text style={styles.eventImageEmoji}>🖼️</Text>
                  </View>
                )}
              </View>
              <View style={[styles.eventBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.eventBadgeText}>{event.participants_count || 0} participants</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: colors.accent }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.createButtonText}>+ Créer un événement</Text>
      </TouchableOpacity>
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
    backgroundColor: Colors.primary,
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.secondary + '30',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventInfo: {
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  eventBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventImageContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 60,
    height: 60,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  eventImageEmoji: {
    fontSize: 32,
  },
  createButton: {
    backgroundColor: Colors.accent,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
