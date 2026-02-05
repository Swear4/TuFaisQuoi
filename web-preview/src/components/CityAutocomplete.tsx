import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import * as geocodingService from '../services/geocodingService';
import { Colors } from '../constants/colors';

// Villes prédéfinies pour le web (évite les problèmes CORS)
const PREDEFINED_CITIES = [
  { name: 'Pornic', lat: 47.1161, lng: -2.1025, display_name: 'Pornic, Pays de Retz', postcode: '44210' },
  { name: 'Saint-Brevin-les-Pins', lat: 47.2456, lng: -2.1660, display_name: 'Saint-Brevin-les-Pins, Loire-Atlantique', postcode: '44250' },
  { name: 'Paimboeuf', lat: 47.2856, lng: -2.0297, display_name: 'Paimboeuf, Loire-Atlantique', postcode: '44560' },
  { name: 'Machecoul', lat: 46.9956, lng: -1.8236, display_name: 'Machecoul-Saint-Même, Loire-Atlantique', postcode: '44270' },
  { name: 'La Plaine-sur-Mer', lat: 47.1439, lng: -2.1897, display_name: 'La Plaine-sur-Mer, Loire-Atlantique', postcode: '44770' },
  { name: 'Guérande', lat: 47.3281, lng: -2.4294, display_name: 'Guérande, Loire-Atlantique', postcode: '44350' },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536, display_name: 'Nantes, Loire-Atlantique', postcode: '44000' },
  { name: 'Saint-Nazaire', lat: 47.2733, lng: -2.2134, display_name: 'Saint-Nazaire, Loire-Atlantique', postcode: '44600' },
  { name: 'Sainte-Pazanne', lat: 47.1031, lng: -1.8106, display_name: 'Sainte-Pazanne, Loire-Atlantique', postcode: '44680' },
  { name: 'Bourgneuf-en-Retz', lat: 47.0456, lng: -2.0483, display_name: 'Bourgneuf-en-Retz, Loire-Atlantique', postcode: '44580' },
];

interface CityAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectCity: (city: geocodingService.GeocodingResult) => void;
  placeholder?: string;
  style?: any;
  isDark?: boolean;
  colors?: any;
}

export default function CityAutocomplete({
  value,
  onChangeText,
  onSelectCity,
  placeholder = 'Nom de la ville...',
  style,
  isDark = false,
  colors,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<geocodingService.GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Sur web, utiliser les villes prédéfinies
    if (Platform.OS === 'web') {
      if (value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const filtered = PREDEFINED_CITIES
        .filter(city => city.name.toLowerCase().includes(value.toLowerCase()))
        .map(city => ({
          display_name: city.display_name,
          lat: city.lat,
          lon: city.lng,
          address: {
            postcode: city.postcode
          }
        }));
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && !isConfirmed);
      return;
    }

    // Code natif avec API OpenStreetMap
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (isConfirmed) {
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await geocodingService.searchCitySuggestions(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Erreur recherche villes:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [value, isConfirmed]);

  const handleSelectSuggestion = (suggestion: geocodingService.GeocodingResult) => {
    onChangeText(suggestion.display_name);
    onSelectCity(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsConfirmed(true);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setIsConfirmed(false);
    if (text.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const defaultColors = colors || Colors;

  return (
    <View style={style}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? defaultColors.card : '#FFFFFF',
              borderColor: isConfirmed 
                ? '#10B981' 
                : (isDark ? defaultColors.border : '#E5E7EB'),
              color: isDark ? defaultColors.text : '#1F2937', // Texte plus foncé
              fontWeight: '500',
            },
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor={isDark ? defaultColors.textSecondary : '#9CA3AF'}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isSearching && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={defaultColors.primary} />
          </View>
        )}
        {isConfirmed && (
          <View style={styles.confirmedIndicator}>
            <Text style={styles.confirmedIcon}>✓</Text>
          </View>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && !isConfirmed && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: isDark ? defaultColors.card : '#FFFFFF',
              borderColor: isDark ? defaultColors.border : '#E5E7EB',
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  index < suggestions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? defaultColors.border : '#F3F4F6',
                  },
                ]}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={styles.suggestionTextContainer}>
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: isDark ? defaultColors.text : Colors.text },
                    ]}
                  >
                    {item.display_name}
                  </Text>
                  {item.address.postcode && (
                    <Text
                      style={[
                        styles.postcodeText,
                        { color: isDark ? defaultColors.textSecondary : Colors.textSecondary },
                      ]}
                    >
                      {item.address.postcode}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    minHeight: 56,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  confirmedIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  suggestionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  postcodeText: {
    fontSize: 12,
    marginTop: 2,
  },
});
