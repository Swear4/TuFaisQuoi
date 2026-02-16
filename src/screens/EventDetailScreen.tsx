import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as eventsService from '../services/eventsService';
import { supabase } from '../lib/supabase';
import { useCarpoolsByEvent, useJoinCarpool, useLeaveCarpool, useCreateCarpool, useIsUserInCarpool } from '../hooks/useCarpools';
import { useCarpoolRequestsByEvent, useCreateCarpoolRequest, useInvitationsForUser, useCreateCarpoolInvitation, useRespondToCarpoolInvitation, useMarkRequestMatched } from '../hooks/useCarpoolRequests';
import { getEventCategories, getPrimaryCategory } from '../utils/eventCategories';

export default function EventDetailScreen({ route, navigation }: any) {
  const { event: eventParam } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'covoiturage'>('details');
  const [carpoolTab, setCarpoolTab] = useState<'search' | 'offer'>('search');
  const [showCreateCarpoolModal, setShowCreateCarpoolModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    departure_location: '',
    departure_time: '',
    seats_needed: '1',
    notes: '',
  });
  const [carpoolForm, setCarpoolForm] = useState({
    departure_location: '',
    departure_time: '',
    total_seats: '3',
    price_per_seat: '0',
    notes: '',
  });

  // Récupérer l'événement frais depuis la DB
  const { data: event, isLoading } = useQuery({
    queryKey: ['events', eventParam.id],
    queryFn: () => eventsService.fetchEventById(eventParam.id),
    initialData: eventParam,
  });

  // Vérifier si l'utilisateur est l'organisateur
  const isOrganizer = user && event && user.id === event.organizer_id;

  // Vérifier si l'événement est complet
  const isEventFull = event && event.capacity ? event.participants_count >= event.capacity : false;

  // Vérifier si l'utilisateur est inscrit
  const { data: isRegistered, isLoading: isCheckingRegistration } = useQuery({
    queryKey: ['event-registration', event?.id, user?.id],
    queryFn: async () => {
      if (!user || !event) return false;
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();
      
      return !!data;
    },
    enabled: !!user && !!event,
  });

  // Mutation pour s'inscrire
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user || !event) throw new Error('Données manquantes');
      
      // La fonction PostgreSQL gère la vérification de capacité et l'incrémentation
      await eventsService.registerToEvent(event.id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', event.id] });
      queryClient.invalidateQueries({ queryKey: ['event-registration', event.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Inscrit !', 'Vous êtes maintenant inscrit à cet événement');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Impossible de s\'inscrire');
    },
  });

  // Mutation pour masquer/afficher l'événement (organisateur seulement)
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (isHidden: boolean) => {
      if (!event) throw new Error('Événement introuvable');
      await eventsService.toggleEventVisibility(event.id, isHidden);
    },
    onSuccess: (_, isHidden) => {
      queryClient.invalidateQueries({ queryKey: ['events', event?.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert(
        'Visibilité modifiée', 
        isHidden 
          ? 'L\'événement est maintenant masqué. Les personnes déjà inscrites peuvent toujours le voir.' 
          : 'L\'événement est maintenant visible par tous.'
      );
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Impossible de modifier la visibilité');
    },
  });

  // Mutation pour se désinscrire
  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (!user || !event) throw new Error('Données manquantes');
      
      // Le trigger PostgreSQL décrémente automatiquement le compteur
      await eventsService.unregisterFromEvent(event.id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', event.id] });
      queryClient.invalidateQueries({ queryKey: ['event-registration', event.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Désinscrit', 'Vous n\'êtes plus inscrit à cet événement');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Impossible de se désinscrire');
    },
  });

  const handleRegistration = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour vous inscrire', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (isRegistered) {
      Alert.alert(
        'Se désinscrire ?',
        'Voulez-vous vraiment vous désinscrire de cet événement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Me désinscrire', style: 'destructive', onPress: () => unregisterMutation.mutate() },
        ]
      );
    } else {
      registerMutation.mutate();
    }
  };

  const handleJoinCarpool = (carpoolId: string, availableSeats: number) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté');
      return;
    }

    if (!isRegistered) {
      Alert.alert('Inscription requise', 'Vous devez être inscrit à l\'événement pour rejoindre un covoiturage');
      return;
    }

    if (availableSeats <= 0) {
      Alert.alert('Complet', 'Ce covoiturage est complet');
      return;
    }

    joinCarpoolMutation.mutate(
      { carpoolId, userId: user.id },
      {
        onSuccess: () => Alert.alert('Succès', 'Vous avez rejoint le covoiturage !'),
        onError: (error: any) => Alert.alert('Erreur', error.message),
      }
    );
  };

  const handleCreateCarpool = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté');
      return;
    }

    if (!isRegistered) {
      Alert.alert('Inscription requise', 'Vous devez être inscrit à l\'événement pour créer un covoiturage');
      return;
    }

    if (!carpoolForm.departure_location || !carpoolForm.departure_time) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!event) return;

    // Convertir la date et l'heure
    const eventDate = new Date(event.date);
    const [hours, minutes] = carpoolForm.departure_time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createCarpoolMutation.mutate(
      {
        event_id: event.id,
        driver_id: user.id,
        departure_location: carpoolForm.departure_location,
        departure_time: eventDate.toISOString(),
        total_seats: parseInt(carpoolForm.total_seats),
        price_per_seat: parseFloat(carpoolForm.price_per_seat),
        notes: carpoolForm.notes || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Covoiturage créé !');
          setShowCreateCarpoolModal(false);
          setCarpoolForm({
            departure_location: '',
            departure_time: '',
            total_seats: '3',
            price_per_seat: '0',
            notes: '',
          });
        },
        onError: (error: any) => Alert.alert('Erreur', error.message),
      }
    );
  };

  const createRequestMutation = useCreateCarpoolRequest();
  const createInvitationMutation = useCreateCarpoolInvitation();
  const respondInvitationMutation = useRespondToCarpoolInvitation();
  const markRequestMatchedMutation = useMarkRequestMatched();

  const handleCreateCarpoolRequest = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté');
      return;
    }

    if (!isRegistered) {
      Alert.alert('Inscription requise', 'Vous devez être inscrit à l\'événement pour demander une place');
      return;
    }

    if (!event) return;

    if (!requestForm.departure_location || !requestForm.departure_time) {
      Alert.alert('Champs requis', 'Veuillez remplir le lieu de départ et l\'heure');
      return;
    }

    const seatsNeeded = Math.max(1, parseInt(requestForm.seats_needed || '1'));

    const eventDate = new Date(event.date);
    const [hours, minutes] = requestForm.departure_time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createRequestMutation.mutate(
      {
        event_id: event.id,
        requester_id: user.id,
        departure_location: requestForm.departure_location,
        departure_time: eventDate.toISOString(),
        seats_needed: seatsNeeded,
        notes: requestForm.notes || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Demande publiée', 'Votre demande de place est maintenant visible.');
          setRequestForm({ departure_location: '', departure_time: '', seats_needed: '1', notes: '' });
        },
        onError: (error: any) => Alert.alert('Erreur', error.message),
      }
    );
  };

  const handleInviteRequester = (requestId: string, toUserId: string) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté');
      return;
    }
    if (!event) return;

    const myCarpools = (carpools || []).filter((c) => c.driver_id === user.id);
    if (myCarpools.length === 0) {
      Alert.alert('Créer une annonce', 'Créez d\'abord un covoiturage (onglet Proposer) pour envoyer une invitation.');
      return;
    }

    const sendInvite = (carpoolId: string) => {
      createInvitationMutation.mutate(
        {
          event_id: event.id,
          carpool_id: carpoolId,
          request_id: requestId,
          from_user_id: user.id,
          to_user_id: toUserId,
        },
        {
          onSuccess: () => Alert.alert('Invitation envoyée', 'La personne pourra accepter ou refuser.'),
          onError: (error: any) => Alert.alert('Erreur', error.message),
        }
      );
    };

    if (myCarpools.length === 1) {
      sendInvite(myCarpools[0].id);
      return;
    }

    Alert.alert(
      'Choisir un covoiturage',
      'Avec quel covoiturage voulez-vous inviter ? ',
      [
        ...myCarpools.slice(0, 3).map((c) => {
          const time = new Date(c.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          return {
            text: `${c.departure_location} • ${time}`,
            onPress: () => sendInvite(c.id),
          } as any;
        }),
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleRespondInvitation = async (invitation: any, status: 'accepted' | 'declined') => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté');
      return;
    }

    if (status === 'accepted') {
      joinCarpoolMutation.mutate(
        { carpoolId: invitation.carpool_id, userId: user.id },
        {
          onSuccess: () => {
            respondInvitationMutation.mutate({ invitationId: invitation.id, status: 'accepted' });
            if (invitation.request_id) {
              markRequestMatchedMutation.mutate({ requestId: invitation.request_id });
            }
            Alert.alert('Bienvenue !', 'Vous avez rejoint le covoiturage.');
          },
          onError: (error: any) => Alert.alert('Erreur', error.message),
        }
      );
      return;
    }

    respondInvitationMutation.mutate(
      { invitationId: invitation.id, status: 'declined' },
      {
        onSuccess: () => Alert.alert('Refusé', 'Invitation refusée.'),
        onError: (error: any) => Alert.alert('Erreur', error.message),
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Événement introuvable</Text>
      </SafeAreaView>
    );
  }

  // Récupérer les covoiturages depuis Supabase
  const { data: carpools, isLoading: carpoolsLoading } = useCarpoolsByEvent(event?.id || null);
  const { data: carpoolRequests, isLoading: requestsLoading } = useCarpoolRequestsByEvent(event?.id || null);
  const { data: pendingInvitations, isLoading: invitationsLoading } = useInvitationsForUser(event?.id || null, user?.id || null);
  const joinCarpoolMutation = useJoinCarpool();
  const leaveCarpoolMutation = useLeaveCarpool();
  const createCarpoolMutation = useCreateCarpool();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Fixed Header with Back Button */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Détails</Text>
      </View>

      <ScrollView>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {event.image_url ? (
            <Image 
              source={{ uri: event.image_url }} 
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📸</Text>
            </View>
          )}
        </View>

        {/* Event Header */}
        <View style={styles.content}>
          <View style={styles.headerBadges}>
            {(() => {
              const categories = getEventCategories(event);
              const fallback = [getPrimaryCategory(event)];
              const toRender = categories.length ? categories : fallback;
              return toRender.map((cat) => (
                <View key={cat} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{cat}</Text>
                </View>
              ));
            })()}
            {event.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>📅 {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>📍 {event.location}</Text>
          </View>

          {/* Discussion Entry Point */}
          <View style={styles.discussionContainer}>
            <View style={styles.discussionHeader}>
              <View>
                <Text style={styles.discussionTitle}>💬 Discussion de groupe</Text>
                <Text style={styles.discussionSubtitle}>
                   {event.participants_count > 0 
                     ? `${event.participants_count} participants` 
                     : 'Soyez le premier à rejoindre !'}
                </Text>
              </View>
              {isRegistered ? (
                <TouchableOpacity 
                  style={styles.joinChatButton}
                  onPress={() => navigation.navigate('EventChat', { 
                    eventId: event.id, 
                    eventTitle: event.title,
                    eventDate: event.date
                  })}
                >
                  <Text style={styles.joinChatButtonText}>Rejoindre</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.joinChatBadge}>
                   <Text style={styles.joinChatBadgeText}>🔒 Inscrivez-vous</Text>
                </View>
              )}
            </View>
          </View>

          {/* Organizer */}
          <View style={styles.organizerSection}>
            <Text style={styles.sectionTitle}>Organisé par</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerAvatarText}>
                  {event.organizerName ? event.organizerName[0] : 'O'}
                </Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>
                  {event.organizerName || 'EventLink Pro'}
                </Text>
                <Text style={styles.organizerType}>
                  {event.isProOrganizer ? '🏢 Professionnel' : '👤 Particulier'}
                </Text>
              </View>
              {event.isProOrganizer && event.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Vérifié</Text>
                </View>
              )}
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
              style={[styles.tab, activeTab === 'covoiturage' && styles.tabActive]}
              onPress={() => setActiveTab('covoiturage')}
            >
              <Text style={[styles.tabText, activeTab === 'covoiturage' && styles.tabTextActive]}>
                Covoiturages
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {event.description || 
                  'Une expérience unique vous attend ! Rejoignez-nous pour un moment inoubliable. ' +
                  'Profitez d\'une ambiance conviviale et rencontrez des personnes partageant les mêmes passions. ' +
                  'Places limitées, inscrivez-vous vite !'}
              </Text>

              <Text style={styles.sectionTitle}>Informations pratiques</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoCardRow}>
                  <Text style={styles.infoCardLabel}>Capacité</Text>
                  <Text style={styles.infoCardValue}>{event.capacity || 'Illimitée'}</Text>
                </View>
                <View style={styles.infoCardRow}>
                  <Text style={styles.infoCardLabel}>Tarif</Text>
                  <Text style={styles.infoCardValue}>Gratuit</Text>
                </View>
                <View style={styles.infoCardRow}>
                  <Text style={styles.infoCardLabel}>Âge minimum</Text>
                  <Text style={styles.infoCardValue}>18 ans</Text>
                </View>
              </View>
            </View>
          ) : activeTab === 'covoiturage' ? (
            <View style={styles.tabContent}>
              <View style={styles.carpoolTabsContainer}>
                <TouchableOpacity
                  style={[styles.carpoolTab, carpoolTab === 'search' && styles.carpoolTabActive]}
                  onPress={() => setCarpoolTab('search')}
                >
                  <Text style={[styles.carpoolTabText, carpoolTab === 'search' && styles.carpoolTabTextActive]}>
                    Rechercher
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.carpoolTab, carpoolTab === 'offer' && styles.carpoolTabActive]}
                  onPress={() => setCarpoolTab('offer')}
                >
                  <Text style={[styles.carpoolTabText, carpoolTab === 'offer' && styles.carpoolTabTextActive]}>
                    Proposer
                  </Text>
                </TouchableOpacity>
              </View>

              {carpoolTab === 'search' ? (
                <>
                  <Text style={styles.sectionTitle}>Covoiturages disponibles</Text>
                  {carpoolsLoading ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                  ) : carpools && carpools.length > 0 ? (
                    carpools.map((carpool) => {
                      const departureTime = new Date(carpool.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const isDriver = user && carpool.driver_id === user.id;
                      
                      return (
                        <View key={carpool.id} style={styles.carpoolCard}>
                          <View style={styles.carpoolHeader}>
                            <View style={styles.carpoolAvatar}>
                              <Text style={styles.carpoolAvatarText}>
                                {carpool.driver_name ? carpool.driver_name[0].toUpperCase() : 'C'}
                              </Text>
                            </View>
                            <View style={styles.carpoolInfo}>
                              <Text style={styles.carpoolDriverName}>
                                {carpool.driver_name || 'Conducteur'}
                                {isDriver && ' (Vous)'}
                              </Text>
                              <Text style={styles.carpoolDetail}>
                                📍 {carpool.departure_location} • 🕐 {departureTime}
                              </Text>
                              <Text style={styles.carpoolSeats}>
                                💺 {carpool.available_seats} / {carpool.total_seats} places disponibles
                              </Text>
                              {carpool.notes && (
                                <Text style={styles.carpoolNotes}>📝 {carpool.notes}</Text>
                              )}
                            </View>
                            {carpool.price_per_seat === 0 ? (
                              <View style={styles.freeBadge}>
                                <Text style={styles.freeBadgeText}>Gratuit</Text>
                              </View>
                            ) : (
                              <View style={styles.priceBadge}>
                                <Text style={styles.priceBadgeText}>{carpool.price_per_seat}€</Text>
                              </View>
                            )}
                          </View>
                          {!isDriver && (
                            <TouchableOpacity 
                              style={[styles.carpoolRequestButton, carpool.available_seats === 0 && styles.carpoolRequestButtonDisabled]}
                              onPress={() => handleJoinCarpool(carpool.id, carpool.available_seats)}
                              disabled={carpool.available_seats === 0 || joinCarpoolMutation.isPending}
                            >
                              {joinCarpoolMutation.isPending ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                              ) : (
                                <Text style={styles.carpoolRequestButtonText}>
                                  {carpool.available_seats === 0 ? 'Complet' : 'Demander une place'}
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        Aucun covoiturage proposé pour le moment.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.sectionTitle}>Invitations reçues</Text>
                  {invitationsLoading ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginVertical: 10 }} />
                  ) : pendingInvitations && pendingInvitations.length > 0 ? (
                    pendingInvitations.map((inv) => (
                      <View key={inv.id} style={styles.requestCard}>
                        <Text style={styles.requestTitle}>🚗 Invitation de {inv.from_user_name || 'un conducteur'}</Text>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[styles.inviteButton, styles.acceptButton]}
                            onPress={() => handleRespondInvitation(inv as any, 'accepted')}
                            disabled={respondInvitationMutation.isPending || joinCarpoolMutation.isPending}
                          >
                            <Text style={styles.inviteButtonText}>Accepter</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.inviteButton, styles.declineButton]}
                            onPress={() => handleRespondInvitation(inv as any, 'declined')}
                            disabled={respondInvitationMutation.isPending}
                          >
                            <Text style={styles.inviteButtonText}>Refuser</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>Aucune invitation pour le moment.</Text>
                    </View>
                  )}

                  <Text style={styles.sectionTitle}>Demander des places</Text>
                  <View style={styles.requestFormCard}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Lieu de départ"
                      placeholderTextColor={Colors.textSecondary}
                      value={requestForm.departure_location}
                      onChangeText={(t) => setRequestForm((p) => ({ ...p, departure_location: t }))}
                    />
                    <View style={styles.formRow}>
                      <TextInput
                        style={[styles.modalInput, styles.halfInput]}
                        placeholder="Heure (HH:MM)"
                        placeholderTextColor={Colors.textSecondary}
                        value={requestForm.departure_time}
                        onChangeText={(t) => setRequestForm((p) => ({ ...p, departure_time: t }))}
                      />
                      <TextInput
                        style={[styles.modalInput, styles.halfInput]}
                        placeholder="Places"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                        value={requestForm.seats_needed}
                        onChangeText={(t) => setRequestForm((p) => ({ ...p, seats_needed: t }))}
                      />
                    </View>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Note (optionnel)"
                      placeholderTextColor={Colors.textSecondary}
                      value={requestForm.notes}
                      onChangeText={(t) => setRequestForm((p) => ({ ...p, notes: t }))}
                    />
                    <TouchableOpacity
                      style={styles.publishRequestButton}
                      onPress={handleCreateCarpoolRequest}
                      disabled={createRequestMutation.isPending}
                    >
                      {createRequestMutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.publishRequestButtonText}>Publier ma demande</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Proposer un covoiturage</Text>
                  <TouchableOpacity 
                    style={styles.createCarpoolButton}
                    onPress={() => {
                      if (!isRegistered) {
                        Alert.alert('Inscription requise', 'Vous devez être inscrit à l\'événement pour proposer un covoiturage');
                        return;
                      }
                      setShowCreateCarpoolModal(true);
                    }}
                  >
                    <Text style={styles.createCarpoolButtonText}>+ Créer une annonce</Text>
                  </TouchableOpacity>

                  <Text style={styles.sectionTitle}>Demandes en attente</Text>
                  {requestsLoading ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginVertical: 10 }} />
                  ) : carpoolRequests && carpoolRequests.length > 0 ? (
                    carpoolRequests.map((req) => {
                      const time = new Date(req.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const isMine = user && req.requester_id === user.id;
                      return (
                        <View key={req.id} style={styles.requestCard}>
                          <Text style={styles.requestTitle}>🙋 {req.requester_name || 'Participant'} {isMine && '(Vous)'}</Text>
                          <Text style={styles.requestDetail}>📍 {req.departure_location} • 🕐 {time} • 💺 {req.seats_needed}</Text>
                          {req.notes ? <Text style={styles.requestDetail}>📝 {req.notes}</Text> : null}
                          {!isMine && (
                            <TouchableOpacity
                              style={styles.inviteButton}
                              onPress={() => handleInviteRequester(req.id, req.requester_id)}
                              disabled={createInvitationMutation.isPending}
                            >
                              {createInvitationMutation.isPending ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                              ) : (
                                <Text style={styles.inviteButtonText}>Inviter</Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>Aucune demande pour le moment.</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.participantsCount}>
            {event.participants_count || 0} / {event.capacity || '∞'} participants
          </Text>
          {isEventFull && (
            <Text style={styles.fullEventText}>✨ Événement complet</Text>
          )}
          {event.is_hidden && (
            <Text style={styles.hiddenEventText}>👁️‍🗨️ Événement masqué</Text>
          )}
        </View>

        {/* Boutons de gestion pour l'organisateur */}
        {isOrganizer && (
          <View style={styles.organizerButtons}>
            <TouchableOpacity
              style={[styles.organizerButton, event.is_hidden && styles.organizerButtonActive]}
              onPress={() => {
                Alert.alert(
                  event.is_hidden ? 'Rendre visible ?' : 'Masquer l\'événement ?',
                  event.is_hidden 
                    ? 'L\'événement redeviendra visible dans les listes publiques.'
                    : 'L\'événement sera masqué des listes publiques. Les personnes déjà inscrites pourront toujours y accéder.',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { 
                      text: event.is_hidden ? 'Rendre visible' : 'Masquer', 
                      onPress: () => toggleVisibilityMutation.mutate(!event.is_hidden),
                      style: event.is_hidden ? 'default' : 'destructive'
                    },
                  ]
                );
              }}
              disabled={toggleVisibilityMutation.isPending}
            >
              {toggleVisibilityMutation.isPending ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <>
                  <Text style={styles.organizerButtonIcon}>{event.is_hidden ? '👁️' : '🙈'}</Text>
                  <Text style={styles.organizerButtonText}>
                    {event.is_hidden ? 'Rendre visible' : 'Masquer'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.joinButton,
            isRegistered && styles.joinButtonRegistered,
            (registerMutation.isPending || unregisterMutation.isPending) && styles.joinButtonDisabled,
            isOrganizer && styles.joinButtonOrganizer,
          ]}
          onPress={handleRegistration}
          disabled={isOrganizer || registerMutation.isPending || unregisterMutation.isPending || (isEventFull && !isRegistered)}
        >
          {registerMutation.isPending || unregisterMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>
              {isOrganizer 
                ? '👤 Vous êtes l\'organisateur' 
                : isRegistered 
                  ? '✓ Inscrit' 
                  : isEventFull 
                    ? '😔 Complet' 
                    : 'Rejoindre l\'événement'
              }
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de création de covoiturage */}
      <Modal
        visible={showCreateCarpoolModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateCarpoolModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proposer un covoiturage</Text>
              <TouchableOpacity onPress={() => setShowCreateCarpoolModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Lieu de départ *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Gare de Pornic"
                value={carpoolForm.departure_location}
                onChangeText={(text) => setCarpoolForm({ ...carpoolForm, departure_location: text })}
              />

              <Text style={styles.modalLabel}>Heure de départ *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="HH:MM (Ex: 19:30)"
                value={carpoolForm.departure_time}
                onChangeText={(text) => setCarpoolForm({ ...carpoolForm, departure_time: text })}
              />

              <Text style={styles.modalLabel}>Nombre de places *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 3"
                value={carpoolForm.total_seats}
                onChangeText={(text) => setCarpoolForm({ ...carpoolForm, total_seats: text })}
                keyboardType="number-pad"
              />

              <Text style={styles.modalLabel}>Prix par place (€)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0 pour gratuit"
                value={carpoolForm.price_per_seat}
                onChangeText={(text) => setCarpoolForm({ ...carpoolForm, price_per_seat: text })}
                keyboardType="decimal-pad"
              />

              <Text style={styles.modalLabel}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="Informations complémentaires..."
                value={carpoolForm.notes}
                onChangeText={(text) => setCarpoolForm({ ...carpoolForm, notes: text })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowCreateCarpoolModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleCreateCarpool}
                disabled={createCarpoolMutation.isPending}
              >
                {createCarpoolMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.text,
    marginLeft: -2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerPlaceholder: {
    width: 44,
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 80,
  },
  content: {
    padding: 20,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  organizerSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '25',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  organizerAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  organizerType: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    marginBottom: 100,
  },
  carpoolTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  carpoolTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  carpoolTabActive: {
    backgroundColor: Colors.primary,
  },
  carpoolTabText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  carpoolTabTextActive: {
    color: '#FFFFFF',
  },
  requestFormCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  publishRequestButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  publishRequestButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  requestDetail: {
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.success,
    marginTop: 0,
  },
  declineButton: {
    flex: 1,
    backgroundColor: Colors.warning,
    marginTop: 0,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  discussionContainer: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.secondary + '15',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discussionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  discussionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  joinChatButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinChatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  joinChatBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  joinChatBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoCardLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  infoCardValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  carpoolCard: {
    backgroundColor: Colors.secondary + '25',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carpoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  carpoolAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carpoolAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  carpoolInfo: {
    flex: 1,
  },
  carpoolDriverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  carpoolDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  carpoolSeats: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  freeBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  carpoolRequestButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  carpoolRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  createCarpoolButton: {
    backgroundColor: Colors.secondary + '40',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createCarpoolButtonText: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomBarInfo: {
    marginBottom: 8,
  },
  participantsCount: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  fullEventText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  hiddenEventText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  organizerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  organizerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F97316',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  organizerButtonActive: {
    backgroundColor: '#FFF7ED',
  },
  organizerButtonIcon: {
    fontSize: 18,
  },
  organizerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  joinButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonRegistered: {
    backgroundColor: '#10B981',
  },
  joinButtonOrganizer: {
    backgroundColor: '#8B5CF6',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  carpoolNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  carpoolRequestButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 28,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButtonSecondary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalButtonPrimary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
