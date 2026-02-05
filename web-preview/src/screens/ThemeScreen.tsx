import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeScreen({ navigation }: any) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : Colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mode d'affichage</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: isDark ? '#1E293B' : Colors.card }]}>
          <View style={styles.themeOption}>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeText, { color: isDark ? '#F9FAFB' : Colors.text }]}>
                {isDark ? '🌙 Mode sombre' : '☀️ Mode clair'}
              </Text>
              <Text style={[styles.themeSubtext, { color: isDark ? '#9CA3AF' : Colors.textSecondary }]}>
                {isDark 
                  ? 'Interface sombre pour moins de fatigue visuelle'
                  : 'Interface lumineuse et colorée'
                }
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={isDark ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.previewSection, { backgroundColor: isDark ? '#1E293B' : Colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : Colors.text }]}>
            Aperçu
          </Text>
          
          <View style={[styles.previewCard, { 
            backgroundColor: isDark ? '#334155' : Colors.secondary + '20',
            borderColor: isDark ? '#475569' : Colors.border 
          }]}>
            <Text style={[styles.previewTitle, { color: isDark ? '#F9FAFB' : Colors.text }]}>
              Événement exemple
            </Text>
            <Text style={[styles.previewSubtext, { color: isDark ? '#9CA3AF' : Colors.textSecondary }]}>
              Samedi 15 décembre • 20h00
            </Text>
            <Text style={[styles.previewSubtext, { color: isDark ? '#9CA3AF' : Colors.textSecondary }]}>
              📍 Centre-ville
            </Text>
            <View style={[styles.previewBadge, { backgroundColor: Colors.primary }]}>
              <Text style={styles.previewBadgeText}>45 participants</Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1E3A5F' : Colors.secondary + '15' }]}>
          <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : Colors.textSecondary }]}>
            💡 Le mode sombre réduit la fatigue oculaire dans les environnements peu éclairés et peut économiser la batterie sur les écrans OLED
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeInfo: {
    flex: 1,
    marginRight: 12,
  },
  themeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeSubtext: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewSection: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewSubtext: {
    fontSize: 14,
    marginBottom: 4,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
