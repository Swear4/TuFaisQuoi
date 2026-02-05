import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserEvents, useUserStats, useUserCreatedEvents } from '../hooks/useEvents';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  
  // Fetch user's events and stats from Supabase
  const { data: upcomingEvents, isLoading } = useUserEvents(user?.id || null, 5);
  const { data: createdEvents, isLoading: isLoadingCreated } = useUserCreatedEvents(user?.id || null, 5);
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id || null);

  // Formater la date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return { day: day.toString(), month, time };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.user_metadata?.full_name || 'Utilisateur'}</Text>
        
        <View style={styles.identityRow}>
           {(user?.user_metadata?.age_range) && (
             <View style={styles.identityTag}>
               <Text style={styles.identityText}>{user.user_metadata.age_range} ans</Text>
             </View>
           )}
           {(user?.user_metadata?.city) && (
             <View style={styles.identityTag}>
               <Text style={styles.identityText}>📍 {user.user_metadata.city}</Text>
             </View>
           )}
        </View>
      </View>
      
      {/* Vibe Section */}
      <View style={[styles.vibeContainer, { backgroundColor: colors.card }]}>
         {/* Interests */}
         {user?.user_metadata?.interests?.length > 0 && (
           <View style={styles.interestsWrapper}>
              {user.user_metadata.interests.map((interest: string, index: number) => (
                <View key={index} style={[styles.interestBadge, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}>
                  <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
                </View>
              ))}
           </View>
         )}

         {/* The Essence */}
         {user?.user_metadata?.vibe_type && (
           <View style={[styles.essenceBox, { backgroundColor: colors.background }]}>
              {user.user_metadata.vibe_type === 'adjectives' && user.user_metadata.vibe_adjectives && (
                 <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.essenceLabel, { color: colors.textSecondary }]}>Mes amis disent que je suis...</Text>
                    <View style={styles.adjectivesContainer}>
                      {user.user_metadata.vibe_adjectives.map((adj: string, i: number) => (
                        <Text key={i} style={[styles.adjText, { color: colors.primary }]}>✨ {adj}</Text>
                      ))}
                    </View>
                 </View>
              )}
              {user.user_metadata.vibe_type === 'phrase' && user.user_metadata.vibe_phrase && (
                 <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.essenceLabel, { color: colors.textSecondary }]}>{user.user_metadata.vibe_prompt}</Text>
                    <Text style={[styles.phraseText, { color: colors.text }]}>"{user.user_metadata.vibe_phrase}"</Text>
                 </View>
              )}
              {user.user_metadata.vibe_type === 'emojis' && user.user_metadata.vibe_emojis && (
                 <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.essenceLabel, { color: colors.textSecondary }]}>Mon vibe en emojis</Text>
                    <Text style={styles.emojisText}>{user.user_metadata.vibe_emojis}</Text>
                 </View>
              )}
           </View>
         )}
      </View>

      <View style={[styles.statsSection, { backgroundColor: colors.secondary + '30' }]}>
        <View style={styles.statItem}>
          {statsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.eventsJoined || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Événements rejoints</Text>
            </>
          )}
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          {statsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.eventsCreated || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Événements créés</Text>
            </>
          )}
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          {statsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.carpools || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Covoiturages</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes événements à venir</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : !upcomingEvents || upcomingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Aucun événement à venir</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Inscrivez-vous à un événement !</Text>
          </View>
        ) : (
          upcomingEvents.map((event) => {
            const { day, month, time } = formatEventDate(event.date);
            return (
              <TouchableOpacity 
                key={event.id}
                style={[styles.eventItem, { backgroundColor: colors.secondary + '20' }]}
                onPress={() => navigation.navigate('MyEvents', { event })}
              >
                <View style={[styles.eventDate, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.eventDay, { color: colors.primary }]}>{day}</Text>
                  <Text style={[styles.eventMonth, { color: colors.primary }]}>{month}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                  <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{time} • {event.location}</Text>
                </View>
                <View style={styles.eventImageContainer}>
                  {event.image_url ? (
                    <Image 
                      source={{ uri: event.image_url }} 
                      style={styles.eventImagePlaceholder}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.eventImagePlaceholder}>
                      <Text style={styles.eventImageEmoji}>🖼️</Text>
                    </View>
                  )}
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={[styles.arrowIcon, { color: colors.textSecondary }]}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes événements créés</Text>
        
        {isLoadingCreated ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : !createdEvents || createdEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Aucun événement créé</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Créez votre premier événement !</Text>
          </View>
        ) : (
          createdEvents.map((event) => {
            const { day, month, time } = formatEventDate(event.date);
            return (
              <TouchableOpacity 
                key={event.id}
                style={[styles.eventItem, { backgroundColor: colors.secondary + '20' }]}
                onPress={() => navigation.navigate('EventDetail', { event })}
              >
                <View style={[styles.eventDate, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.eventDay, { color: colors.accent }]}>{day}</Text>
                  <Text style={[styles.eventMonth, { color: colors.accent }]}>{month}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                  <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{time} • {event.location}</Text>
                  <Text style={[styles.eventParticipants, { color: colors.primary }]}>
                    👥 {event.participants_count || 0} / {event.capacity || '∞'}
                  </Text>
                </View>
                <View style={styles.eventImageContainer}>
                  {event.image_url ? (
                    <Image 
                      source={{ uri: event.image_url }} 
                      style={styles.eventImagePlaceholder}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.eventImagePlaceholder}>
                      <Text style={styles.eventImageEmoji}>🖼️</Text>
                    </View>
                  )}
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={[styles.arrowIcon, { color: colors.textSecondary }]}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Paramètres</Text>
        
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.primary + '15', borderTopColor: colors.border }]}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Modifier le profil</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.primary + '15', borderTopColor: colors.border }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.primary + '15', borderTopColor: colors.border }]}
          onPress={() => navigation.navigate('Theme')}
        >
          <Text style={styles.menuIcon}>🌙</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Mode sombre</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.primary + '15', borderTopColor: colors.border }]}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>À propos</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast, { backgroundColor: colors.primary + '15', borderTopColor: colors.border }]}
          onPress={() => signOut()}
        >
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuText, styles.logoutText, { color: colors.error }]}>Déconnexion</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  identityTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  identityText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  vibeContainer: {
    margin: 16,
    marginBottom: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  interestsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  interestBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  essenceBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  essenceLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  adjectivesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  adjText: {
    fontSize: 15,
    fontWeight: '600',
  },
  phraseText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  emojisText: {
    fontSize: 32,
    letterSpacing: 8,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '30',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  eventItem: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  eventDate: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventParticipants: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  eventImageContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 50,
    height: 50,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  eventImageEmoji: {
    fontSize: 28,
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  arrowIcon: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  logoutText: {
    color: Colors.error,
  },
  menuArrow: {
    fontSize: 24,
    color: Colors.textSecondary,
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
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
