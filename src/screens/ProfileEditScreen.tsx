import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Constants
const AGE_RANGES = ['18-25', '26-35', '36-45', '46+'];

const INTERESTS_LIST = [
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'music', label: 'Musique', icon: '🎵' },
  { id: 'travel', label: 'Voyage', icon: '✈️' },
  { id: 'food', label: 'Cuisine', icon: '🍳' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'cinema', label: 'Cinéma', icon: '🎬' },
  { id: 'games', label: 'Jeux', icon: '🎮' },
  { id: 'fashion', label: 'Mode', icon: '👗' },
  { id: 'wellness', label: 'Bien-être', icon: '🧘' },
  { id: 'party', label: 'Fête', icon: '🎉' },
];

const ADJECTIVES_LIST = [
  'Spontané·e', 'Curieux·se', 'Bavard·e', 'Calme', 
  'Drôle', 'Organisé·e', 'Rêveur·se', 'Aventurier·ère', 
  'Créatif·ve', 'Positif·ve', 'Bienveillant·e', 'Energique'
];

const PHRASE_PROMPTS = [
  "Ce qui me fait vraiment kiffer c'est...",
  "Je suis la personne qui...",
  "Mon truc à moi c'est..."
];

export default function ProfileEditScreen({ navigation }: any) {
  const { user } = useAuth();
  
  // Identity
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [city, setCity] = useState('');
  
  // Interests (Max 3)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Vibe (One of 3 types)
  const [vibeType, setVibeType] = useState<'adjectives' | 'phrase' | 'emojis'>('adjectives');
  
  // Vibe Data
  const [selectedAdjectives, setSelectedAdjectives] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState(PHRASE_PROMPTS[0]);
  const [phraseText, setPhraseText] = useState('');
  const [emojis, setEmojis] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata;
      // Split name if needed or use stored fields
      if (meta.full_name) {
        const parts = meta.full_name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      } else {
        setFirstName(meta.first_name || '');
        setLastName(meta.last_name || '');
      }
      
      setAgeRange(meta.age_range || '');
      setCity(meta.city || '');
      setSelectedInterests(meta.interests || []);
      
      // Load vibe data
      if (meta.vibe_type) setVibeType(meta.vibe_type);
      if (meta.vibe_adjectives) setSelectedAdjectives(meta.vibe_adjectives);
      if (meta.vibe_prompt) setSelectedPrompt(meta.vibe_prompt);
      if (meta.vibe_phrase) setPhraseText(meta.vibe_phrase);
      if (meta.vibe_emojis) setEmojis(meta.vibe_emojis);
    }
  }, [user]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert('Maximum 3', 'Vous ne pouvez sélectionner que 3 centres d\'intérêt.');
      }
    }
  };

  const toggleAdjective = (adj: string) => {
    if (selectedAdjectives.includes(adj)) {
      setSelectedAdjectives(selectedAdjectives.filter(a => a !== adj));
    } else {
      if (selectedAdjectives.length < 3) {
        setSelectedAdjectives([...selectedAdjectives, adj]);
      } else {
        Alert.alert('Maximum 3', 'Vous ne pouvez sélectionner que 3 adjectifs.');
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updates = {
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        age_range: ageRange,
        city: city,
        interests: selectedInterests,
        vibe_type: vibeType,
        vibe_adjectives: vibeType === 'adjectives' ? selectedAdjectives : null,
        vibe_prompt: vibeType === 'phrase' ? selectedPrompt : null,
        vibe_phrase: vibeType === 'phrase' ? phraseText : null,
        vibe_emojis: vibeType === 'emojis' ? emojis : null,
      };

      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      // Update also the public users table if needed (optional depending on architecture)
      // await supabase.from('users').update({ ... }).eq('id', user.id);

      Alert.alert('Succès', 'Profil mis à jour !');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (firstName || lastName) {
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
          <Text style={[styles.saveButtonText, loading && { opacity: 0.5 }]}>
            {loading ? '...' : 'Valider'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Avatar Placeholder */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
           <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.primary }}>{getInitials()}</Text>
           </View>
        </View>

        {/* Identité Légère */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Votre nom"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ex: Paris, Lyon..."
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tranche d'âge</Text>
            <View style={styles.ageContainer}>
              {AGE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.ageChip,
                    ageRange === range && styles.ageChipSelected
                  ]}
                  onPress={() => setAgeRange(range)}
                >
                  <Text style={[
                    styles.ageChipText,
                    ageRange === range && styles.ageChipTextSelected
                  ]}>{range}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Centres d'intérêt */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Mes passions (3 max)</Text>
            <Text style={styles.counter}>{selectedInterests.length}/3</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Ce que j'aime et ce que je recherche</Text>
          
          <View style={styles.interestsGrid}>
            {INTERESTS_LIST.map((item) => {
              const isSelected = selectedInterests.includes(item.label);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.interestBadge,
                    isSelected && styles.interestBadgeSelected
                  ]}
                  onPress={() => toggleInterest(item.label)}
                >
                  <Text style={styles.interestIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.interestLabel,
                    isSelected && styles.interestLabelSelected
                  ]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* L'Essence (Vibe) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon Vibe</Text>
          <Text style={styles.sectionSubtitle}>Comment je me définis...</Text>

          <View style={styles.vibeTypeSelector}>
            <TouchableOpacity 
              style={[styles.vibeTypeBtn, vibeType === 'adjectives' && styles.vibeTypeBtnSelected]}
              onPress={() => setVibeType('adjectives')}
            >
              <Text style={[styles.vibeTypeText, vibeType === 'adjectives' && styles.vibeTypeTextSelected]}>Adjectifs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.vibeTypeBtn, vibeType === 'phrase' && styles.vibeTypeBtnSelected]}
              onPress={() => setVibeType('phrase')}
            >
              <Text style={[styles.vibeTypeText, vibeType === 'phrase' && styles.vibeTypeTextSelected]}>Phrase</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.vibeTypeBtn, vibeType === 'emojis' && styles.vibeTypeBtnSelected]}
              onPress={() => setVibeType('emojis')}
            >
              <Text style={[styles.vibeTypeText, vibeType === 'emojis' && styles.vibeTypeTextSelected]}>Emojis</Text>
            </TouchableOpacity>
          </View>

          {/* Option 1: Adjectifs */}
          {vibeType === 'adjectives' && (
            <View style={styles.vibeContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.vibeInstruction}>Mes amis disent que je suis...</Text>
                <Text style={styles.counter}>{selectedAdjectives.length}/3</Text>
              </View>
              <View style={styles.adjectivesGrid}>
                {ADJECTIVES_LIST.map((adj) => (
                  <TouchableOpacity
                    key={adj}
                    style={[
                      styles.adjChip,
                      selectedAdjectives.includes(adj) && styles.adjChipSelected
                    ]}
                    onPress={() => toggleAdjective(adj)}
                  >
                    <Text style={[
                      styles.adjChipText,
                      selectedAdjectives.includes(adj) && styles.adjChipTextSelected
                    ]}>{adj}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Option 2: Phrase */}
          {vibeType === 'phrase' && (
            <View style={styles.vibeContent}>
              <Text style={styles.vibeInstruction}>Ce qui me fait vibrer</Text>
              <View style={styles.promptSelector}>
                {PHRASE_PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    style={[
                      styles.promptChip,
                      selectedPrompt === prompt && styles.promptChipSelected
                    ]}
                    onPress={() => setSelectedPrompt(prompt)}
                  >
                    <Text style={[
                      styles.promptChipText,
                      selectedPrompt === prompt && styles.promptChipTextSelected
                    ]}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={phraseText}
                onChangeText={setPhraseText}
                placeholder="Complétez..."
                multiline
                maxLength={100}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          )}

          {/* Option 3: Emojis */}
          {vibeType === 'emojis' && (
            <View style={styles.vibeContent}>
              <Text style={styles.vibeInstruction}>Mon vibe en 3 emojis</Text>
              <TextInput
                style={[styles.input, { fontSize: 24, textAlign: 'center' }]}
                value={emojis}
                onChangeText={setEmojis}
                placeholder="🎸🌿📚"
                maxLength={10} // approx 3-4 emojis
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.helperText}>Ex: 🍕🎮🐶 ou 🏔️📸🏃‍♂️</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  ageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ageChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ageChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  ageChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  interestBadgeSelected: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  interestIcon: {
    fontSize: 16,
  },
  interestLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  interestLabelSelected: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  vibeTypeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  vibeTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  vibeTypeBtnSelected: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vibeTypeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  vibeTypeTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  vibeContent: {
    marginTop: 8,
  },
  vibeInstruction: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  adjectivesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adjChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.accent + '10',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  adjChipSelected: {
    backgroundColor: Colors.accent,
  },
  adjChipText: {
    fontSize: 14,
    color: Colors.accent,
  },
  adjChipTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  promptSelector: {
    marginBottom: 16,
    gap: 8,
  },
  promptChip: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  promptChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  promptChipTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

