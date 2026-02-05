import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as eventsService from '../services/eventsService';
import { EventCategory } from '../types';
import * as geocodingService from '../services/geocodingService';
import CityAutocomplete from '../components/CityAutocomplete';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateEventModal({ visible, onClose, onSuccess }: CreateEventModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState({
    title: '',
    categories: [] as string[], // Maintenant un tableau de 1-3 catégories
    date: '',
    time: '',
    location: '', // Adresse texte libre
    city: '', // Ville pour le pin GPS
    description: '',
    capacity: '',
    imageUri: '',
  });
  const [cityCoordinates, setCityCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Mutation pour créer l'événement
  const createEventMutation = useMutation({
    mutationFn: async (data: typeof eventData) => {
      if (!user) throw new Error('Vous devez être connecté');

      // Vérifier que la ville a été confirmée
      if (!cityCoordinates) {
        throw new Error('Veuillez sélectionner une ville dans la liste de suggestions pour le pin GPS.');
      }

      // Convertir la date et l'heure en format ISO
      const [day, month, year] = data.date.split('/');
      const dateTime = new Date(`${year}-${month}-${day}T${data.time}:00`);

      // Note: Pour l'instant, on utilise toujours l'image par défaut
      // TODO: Implémenter l'upload d'images vers Supabase Storage
      const imageUrl = data.imageUri && data.imageUri.startsWith('http') 
        ? data.imageUri 
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';

      const eventPayload = {
        title: data.title.slice(0, 100), // Limiter à 100 caractères
        category: data.categories[0] as EventCategory, // Utiliser la première catégorie pour la DB
        date: dateTime.toISOString(),
        location: data.location, // Adresse affichée
        latitude: cityCoordinates.lat, // Coordonnées de la ville
        longitude: cityCoordinates.lng,
        description: data.description ? data.description.slice(0, 500) : null, // Limiter à 500 caractères
        capacity: data.capacity ? parseInt(data.capacity) : null,
        image_url: imageUrl,
        // participants_count sera défini par défaut à 0 dans la DB
      };

      return eventsService.createEvent(eventPayload, user.id);
    },
    onSuccess: () => {
      // Invalider le cache pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Succès', 'Votre événement a été créé !');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'événement');
    },
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!visible) {
      setStep(1);
      setEventData({
        title: '',
        categories: [],
        date: '',
        time: '',
        location: '',
        city: '',
        description: '',
        capacity: '',
        imageUri: '',
      });
      setCityCoordinates(null);
    }
  }, [visible]);

  const pickImage = async () => {
    // Sur web, on utilise un input file natif
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setEventData({ ...eventData, imageUri: event.target?.result as string });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Code natif pour mobile
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à vos photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEventData({ ...eventData, imageUri: result.assets[0].uri });
    }
  };

  const categories = [
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

  // Validation étape 1
  const validateStep1 = () => {
    if (!eventData.title.trim()) {
      Alert.alert('Nom requis', 'Veuillez entrer un nom pour votre événement');
      return false;
    }
    if (eventData.categories.length === 0) {
      Alert.alert('Catégorie requise', 'Veuillez sélectionner au moins une catégorie (maximum 3)');
      return false;
    }
    return true;
  };

  // Validation étape 2
  const validateStep2 = () => {
    if (!eventData.date.trim()) {
      Alert.alert('Date requise', 'Veuillez entrer la date de l\'événement');
      return false;
    }
    if (!eventData.time.trim()) {
      Alert.alert('Heure requise', 'Veuillez entrer l\'heure de l\'événement');
      return false;
    }
    if (!eventData.location.trim()) {
      Alert.alert('Adresse requise', 'Veuillez entrer l\'adresse de l\'événement');
      return false;
    }
    if (!eventData.city.trim()) {
      Alert.alert('Ville requise', 'Veuillez entrer la ville pour le pin GPS');
      return false;
    }
    if (!cityCoordinates) {
      Alert.alert('Ville non validée', 'Veuillez sélectionner une ville dans la liste de suggestions');
      return false;
    }

    // Valider le format de la date
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(eventData.date)) {
      Alert.alert('Format invalide', 'Le format de date doit être JJ/MM/AAAA');
      return false;
    }

    // Valider le format de l'heure
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(eventData.time)) {
      Alert.alert('Format invalide', 'Le format d\'heure doit être HH:MM');
      return false;
    }

    return true;
  };

  const handleCreate = () => {
    // Le géocodage sera fait dans la mutation
    createEventMutation.mutate(eventData);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#ffeaddff' }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderBottomColor: isDark ? colors.border : '#F3F4F6' }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDark ? colors.primary + '20' : Colors.secondary + '20' }]}>
            <Text style={[styles.closeButtonText, { color: isDark ? colors.text : Colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : Colors.text }]}>Créer un événement</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress bar */}
        <View style={[styles.progressContainer, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%`, backgroundColor: isDark ? colors.primary : Colors.accent }]} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={0}
        >
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {step === 1 && (
            <View>
              <Text style={[styles.stepTitle, { color: isDark ? colors.text : Colors.text }]}>Informations de base</Text>
              
              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Image de l'événement (optionnel)</Text>
              <TouchableOpacity 
                style={[styles.imagePickerButton, { borderColor: isDark ? colors.border : '#E5E7EB', backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                onPress={pickImage}
              >
                {eventData.imageUri ? (
                  <Image 
                    source={{ uri: eventData.imageUri }} 
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Text style={styles.imagePickerEmoji}>📷</Text>
                    <Text style={[styles.imagePickerText, { color: isDark ? colors.textSecondary : Colors.textSecondary }]}>Ajouter une photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Titre de l'événement * (max 100 caractères)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB', color: isDark ? colors.text : Colors.text }]}
                placeholder="Ex: Soirée jazz en plein air"
                value={eventData.title}
                onChangeText={(text) => setEventData({ ...eventData, title: text.slice(0, 100) })}
                placeholderTextColor={isDark ? colors.textSecondary : Colors.textSecondary}
                maxLength={100}
              />

              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Catégories * (1 à 3)</Text>
              <ScrollView 
                style={styles.categoriesScrollContainer}
                contentContainerStyle={styles.categoriesGrid}
                showsVerticalScrollIndicator={true}
              >
                {categories.map((cat) => {
                  const isSelected = eventData.categories.includes(cat.id);
                  const selectionIndex = eventData.categories.indexOf(cat.id);
                  
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB' },
                        isSelected && { backgroundColor: isDark ? colors.primary : Colors.accent, borderColor: isDark ? colors.primary : Colors.accent },
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          // Retirer la catégorie
                          setEventData({ 
                            ...eventData, 
                            categories: eventData.categories.filter(c => c !== cat.id) 
                          });
                        } else {
                          // Ajouter la catégorie si on n'a pas atteint 3
                          if (eventData.categories.length < 3) {
                            setEventData({ 
                              ...eventData, 
                              categories: [...eventData.categories, cat.id] 
                            });
                          } else {
                            Alert.alert('Maximum atteint', 'Vous pouvez sélectionner au maximum 3 catégories');
                          }
                        }
                      }}
                    >
                      {isSelected && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{selectionIndex + 1}</Text>
                        </View>
                      )}
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: isDark ? colors.text : Colors.text },
                          isSelected && { color: '#FFFFFF' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.stepTitle, { color: isDark ? colors.text : Colors.text }]}>Date et lieu</Text>
              
              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Date *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB', color: isDark ? colors.text : Colors.text }]}
                placeholder="JJ/MM/AAAA"
                value={eventData.date}
                onChangeText={(text) => setEventData({ ...eventData, date: text })}
                placeholderTextColor={isDark ? colors.textSecondary : Colors.textSecondary}
              />

              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Heure *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB', color: isDark ? colors.text : Colors.text }]}
                placeholder="HH:MM"
                value={eventData.time}
                onChangeText={(text) => setEventData({ ...eventData, time: text })}
                placeholderTextColor={isDark ? colors.textSecondary : Colors.textSecondary}
              />

              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Adresse de l'événement *</Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.addressInput,
                  { 
                    backgroundColor: isDark ? colors.card : '#FFFFFF', 
                    borderColor: isDark ? colors.border : '#E5E7EB', 
                    color: isDark ? colors.text : '#1F2937' // Texte plus foncé pour meilleure visibilité
                  }
                ]}
                placeholder="Ex: Salle des fêtes, 12 rue du Port"
                value={eventData.location}
                onChangeText={(text) => setEventData({ ...eventData, location: text })}
                placeholderTextColor={isDark ? colors.textSecondary : '#9CA3AF'}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
              <Text style={[styles.locationHint, { color: isDark ? colors.textSecondary : Colors.textSecondary }]}>
                💬 Cette adresse sera affichée aux participants (détails, liste...)
              </Text>

              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Ville du pin GPS *</Text>
              <CityAutocomplete
                value={eventData.city}
                onChangeText={(text) => {
                  setEventData({ ...eventData, city: text });
                }}
                onSelectCity={(city) => {
                  setEventData({ ...eventData, city: city.display_name });
                  setCityCoordinates({ lat: city.lat, lng: city.lng });
                }}
                placeholder="Ex: Pornic"
                style={styles.autocompleteContainer}
                isDark={isDark}
                colors={colors}
              />
              <Text style={[styles.locationHint, { color: isDark ? colors.textSecondary : Colors.textSecondary }]}>
                📍 Sélectionnez la ville pour placer le pin sur la carte (2 caractères minimum)
              </Text>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.stepTitle, { color: isDark ? colors.text : Colors.text }]}>Détails</Text>
              
              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Description (max 500 caractères)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB', color: isDark ? colors.text : Colors.text }]}
                placeholder="Décrivez votre événement..."
                value={eventData.description}
                onChangeText={(text) => setEventData({ ...eventData, description: text.slice(0, 500) })}
                multiline
                numberOfLines={6}
                placeholderTextColor={isDark ? colors.textSecondary : Colors.textSecondary}
                textAlignVertical="top"
                maxLength={500}
              />

              <Text style={[styles.label, { color: isDark ? colors.text : Colors.text }]}>Capacité (optionnel)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB', color: isDark ? colors.text : Colors.text }]}
                placeholder="Nombre de participants max"
                value={eventData.capacity}
                onChangeText={(text) => setEventData({ ...eventData, capacity: text })}
                keyboardType="number-pad"
                placeholderTextColor={isDark ? colors.textSecondary : Colors.textSecondary}
              />
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer buttons */}
        <View style={[styles.footer, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderTopColor: isDark ? colors.border : '#F3F4F6' }]}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: isDark ? colors.border : Colors.accent, backgroundColor: isDark ? colors.background : '#FFFFFF' }]}
              onPress={() => setStep(step - 1)}
            >
              <Text style={[styles.secondaryButtonText, { color: isDark ? colors.text : Colors.accent }]}>Précédent</Text>
            </TouchableOpacity>
          )}
          
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.primaryButton, step === 1 && styles.primaryButtonFull]}
              onPress={() => {
                if (step === 1 && !validateStep1()) return;
                if (step === 2 && !validateStep2()) return;
                setStep(step + 1);
              }}
            >
              <Text style={styles.primaryButtonText}>Suivant</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>✨ Créer l'événement</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundOrange,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F97316', // Orange vif
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  addressInput: {
    minHeight: 60,
    paddingTop: 16,
    paddingBottom: 16,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  categoriesScrollContainer: {
    maxHeight: 400,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingBottom: 20,
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryButtonActive: {
    borderColor: '#F97316', // Orange vif
    backgroundColor: '#F97316' + '15',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#F97316',
  },
  categoryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryBadgeText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: '#FF00FF', // Violet fushia
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF00FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#F97316', // Orange vif
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#FF00FF', // Violet fushia
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  locationHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  autocompleteContainer: {
    marginBottom: 4,
  },
});
