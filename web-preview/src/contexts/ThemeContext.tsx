import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

type Theme = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@tufaisquoi_theme';

// Couleurs pour le mode clair
const lightColors: ThemeColors = {
  primary: '#0EA5E9',
  secondary: '#38BDF8',
  accent: '#F97316',
  background: '#E0F7FA',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

// Couleurs pour le mode sombre
const darkColors: ThemeColors = {
  primary: '#1E40AF', // Bleu roi plus foncé
  secondary: '#3B82F6',
  accent: '#F97316',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#334155',
  error: '#EF4444',
  success: '#10B981',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light'); // Toujours clair par défaut
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
      // Si pas de thème sauvegardé, reste sur 'light' par défaut
      setIsLoaded(true);
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
      setIsLoaded(true);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
}
