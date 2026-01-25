import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import * as geocodingService from '../services/geocodingService';
import { Colors } from '../constants/colors';

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
    // Débounce: attendre 400ms après la dernière frappe
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Ne pas chercher si déjà confirmé
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
