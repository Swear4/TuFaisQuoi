import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export default function AboutScreen({ navigation }: any) {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🎫</Text>
          </View>
          <Text style={styles.appName}>TuFaisQuoi</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Connectez-vous, partagez, vibrez ensemble</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos de l'application</Text>
          <Text style={styles.description}>
            TuFaisQuoi est votre compagnon idéal pour découvrir et participer à des événements près de chez vous. 
            Concerts, festivals, activités sportives, sorties culturelles... Ne manquez plus rien !
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>Découvrez des événements près de chez vous</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🚗</Text>
            <Text style={styles.featureText}>Organisez des covoiturages</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💬</Text>
            <Text style={styles.featureText}>Discutez avec les participants</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>✈️</Text>
            <Text style={styles.featureText}>Rejoignez des voyages organisés</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liens utiles</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://tufaisquoi.fr/privacy')}
          >
            <Text style={styles.linkText}>Politique de confidentialité</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://tufaisquoi.fr/terms')}
          >
            <Text style={styles.linkText}>Conditions d'utilisation</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://tufaisquoi.fr/contact')}
          >
            <Text style={styles.linkText}>Nous contacter</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crédits</Text>
          <Text style={styles.creditsText}>
            Développé avec ❤️ pour la communauté du Pays de Retz
          </Text>
          <Text style={styles.creditsSubtext}>
            © 2025 TuFaisQuoi. Tous droits réservés.
          </Text>
        </View>

        <View style={styles.socialSection}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleOpenLink('https://instagram.com/tufaisquoi')}
          >
            <Text style={styles.socialEmoji}>📷</Text>
            <Text style={styles.socialText}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleOpenLink('https://facebook.com/tufaisquoi')}
          >
            <Text style={styles.socialEmoji}>👍</Text>
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleOpenLink('https://twitter.com/tufaisquoi')}
          >
            <Text style={styles.socialEmoji}>🐦</Text>
            <Text style={styles.socialText}>Twitter</Text>
          </TouchableOpacity>
        </View>
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
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: Colors.primary + '20',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  linkArrow: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  creditsText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  creditsSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: Colors.card,
    marginBottom: 24,
  },
  socialButton: {
    alignItems: 'center',
    padding: 12,
  },
  socialEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  socialText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
