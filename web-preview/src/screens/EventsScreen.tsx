import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useEventsByCategory } from '../hooks/useEvents';
import { useTrips } from '../hooks/useTrips';
import { getCategoryColor } from '../utils/categoryColors';
import { getEventCategories, getPrimaryCategory } from '../utils/eventCategories';

export default function EventsScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const initialTab = route?.params?.initialTab || 'events';
  const [activeTab, setActiveTab] = useState<'events' | 'trips'>(initialTab);
  const initialCategory = route?.params?.initialCategory || 'tous';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Fetch events from Supabase
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEventsByCategory(
    selectedCategory === 'tous' ? null : selectedCategory
  );

  // Fetch trips from Supabase
  const { data: trips, isLoading: tripsLoading, error: tripsError } = useTrips();

  const categories = [
    { id: 'tous', label: 'Tous', emoji: '🎯' },
    { id: 'culturel', label: 'Culture', emoji: '🎭' },
    { id: 'concert', label: 'Concerts', emoji: '🎵' },
    { id: 'sport', label: 'Sport', emoji: '⚽' },
    { id: 'nature', label: 'Nature', emoji: '🌳' },
    { id: 'gastronomie', label: 'Gastro', emoji: '🍽️' },
    { id: 'festival', label: 'Festivals', emoji: '🎪' },
    { id: 'nocturne', label: 'Soirées', emoji: '🌙' },
    { id: 'famille', label: 'Famille', emoji: '👨‍👩‍👧' },
    { id: 'bien-etre', label: 'Bien-être', emoji: '🧘' },
  ];

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

  // Formater les dates de voyage
  const formatTripDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{activeTab === 'events' ? 'Événements' : 'Voyages'}</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'events' ? 'Trouvez votre prochaine aventure' : 'Découvrez nos weekends organisés'}
        </Text>
      </View>

      {/* Tabs Événements / Voyages */}
      <View style={[styles.mainTabsContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[styles.mainTab, activeTab === 'events' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, activeTab === 'events' && { color: '#FFFFFF' }]}>
            🎫 Événements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mainTab, activeTab === 'trips' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('trips')}
        >
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, activeTab === 'trips' && { color: '#FFFFFF' }]}>
            ✈️ Voyages
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'events' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedCategory === category.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={{ fontSize: 16 }}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: colors.text },
                    selectedCategory === category.id && { color: '#FFFFFF' },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.eventsContainer}>
            {eventsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des événements...</Text>
              </View>
            ) : eventsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorEmoji}>😕</Text>
                <Text style={[styles.errorText, { color: colors.text }]}>Impossible de charger les événements</Text>
                <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{eventsError.message}</Text>
              </View>
            ) : !events || events.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>Aucun événement trouvé</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Essayez une autre catégorie</Text>
              </View>
            ) : (
              events.map((event) => (
                <TouchableOpacity 
                  key={event.id} 
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetail', { event })}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.categoryBadgesRow}>
                      {(() => {
                        const categories = getEventCategories(event);
                        const fallback = [getPrimaryCategory(event)];
                        const toRender = categories.length ? categories : fallback;
                        return toRender.map((cat) => (
                          <View
                            key={cat}
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: getCategoryColor(cat).backgroundColor },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryBadgeText,
                                { color: getCategoryColor(cat).textColor },
                              ]}
                            >
                              {cat}
                            </Text>
                          </View>
                        ));
                      })()}
                    </View>
                    {event.is_premium_only && (
                      <View style={[styles.premiumBadge, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.premiumBadgeText, { color: colors.accent }]}>⭐ Premium</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                  <Text style={[styles.eventDate, { color: colors.textSecondary }]}>{formatDate(event.date)}</Text>
                  <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>📍 {event.location}</Text>
                  
                  {/* Event Image */}
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
                  
                  {/* Capacity info */}
                  <View style={styles.capacityInfo}>
                    <Text style={[styles.capacityText, { color: colors.textSecondary }]}>
                      {event.participants_count || 0} / {event.capacity || '∞'} participants
                    </Text>
                    {event.capacity && event.participants_count >= event.capacity && (
                      <View style={styles.fullBadge}>
                        <Text style={styles.fullBadgeText}>COMPLET</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
      </>
      )}

      {activeTab === 'trips' && (
        <ScrollView style={styles.eventsContainer}>
          {tripsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des voyages...</Text>
            </View>
          ) : tripsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorEmoji}>😕</Text>
              <Text style={[styles.errorText, { color: colors.text }]}>Impossible de charger les voyages</Text>
              <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{tripsError.message}</Text>
            </View>
          ) : !trips || trips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✈️</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>Aucun voyage disponible</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Revenez bientôt !</Text>
            </View>
          ) : (
            trips.map((trip) => (
              <TouchableOpacity 
                key={trip.id}
                style={[styles.tripCard, { backgroundColor: colors.secondary + '20' }]}
                onPress={() => {/* TODO: Navigation vers détails du voyage */}}
              >
                <View style={styles.tripHeader}>
                  <View style={styles.tripImageContainer}>
                    {trip.image_url ? (
                      <Image 
                        source={{ uri: trip.image_url }} 
                        style={styles.tripImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.tripImagePlaceholder}>
                        <Text style={styles.tripImageEmoji}>🏖️</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tripMainInfo}>
                    <Text style={[styles.tripTitle, { color: colors.text }]} numberOfLines={2}>{trip.title}</Text>
                    <Text style={[styles.tripDate, { color: colors.textSecondary }]}>📅 {formatTripDates(trip.start_date, trip.end_date)}</Text>
                    <Text style={[styles.tripLocation, { color: colors.textSecondary }]}>📍 {trip.location}</Text>
                    <Text style={[styles.tripDuration, { color: colors.textSecondary }]}>⏱️ {trip.duration}</Text>
                  </View>
                </View>

                <View style={[styles.tripPriceRange, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.tripPriceLabel, { color: colors.textSecondary }]}>À partir de</Text>
                  <Text style={[styles.tripPriceValue, { color: colors.primary }]}>{trip.min_price}€</Text>
                </View>

                <View style={[styles.tripFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tripOptionsHint, { color: colors.textSecondary }]}>
                    {trip.trip_options?.length || 0} options disponibles
                  </Text>
                  <Text style={[styles.tripDetailsLink, { color: colors.primary }]}>Voir les détails →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTabActive: {
    backgroundColor: Colors.primary,
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mainTabTextActive: {
    color: '#FFFFFF',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    // backgroundColor: Colors.secondary + '20',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadgesRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginRight: 10,
  },
  categoryBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  eventImageContainer: {
    position: 'absolute',
    right: 16,
    top: 60,
    width: 70,
    height: 70,
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
    fontSize: 36,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 8,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  organizerAvatarText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  organizerDetails: {
    flex: 1,
  },
  organizerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  organizerType: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Trips styles
  tripCard: {
    backgroundColor: Colors.secondary + '20',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tripImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  tripImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  tripImageEmoji: {
    fontSize: 48,
  },
  tripMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  tripDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  tripLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  tripDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tripPriceRange: {
    backgroundColor: Colors.primary + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  tripPriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  tripPriceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tripOptionsHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tripDetailsLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  // Loading, Error, Empty states
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  capacityInfo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capacityText: {
    fontSize: 13,
  },
  fullBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
