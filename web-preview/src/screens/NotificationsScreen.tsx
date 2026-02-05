import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState({
    newEvents: true,
    eventReminders: true,
    eventUpdates: true,
    carpoolUpdates: false,
    messages: true,
    marketing: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Sauvegarder dans AsyncStorage ou backend
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Événements</Text>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationText}>Nouveaux événements</Text>
              <Text style={styles.notificationSubtext}>
                Recevoir des notifications pour les nouveaux événements près de chez vous
              </Text>
            </View>
            <Switch
              value={notifications.newEvents}
              onValueChange={() => toggleNotification('newEvents')}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={notifications.newEvents ? Colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationText}>Rappels d'événements</Text>
              <Text style={styles.notificationSubtext}>
                Recevoir un rappel 24h avant vos événements
              </Text>
            </View>
            <Switch
              value={notifications.eventReminders}
              onValueChange={() => toggleNotification('eventReminders')}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={notifications.eventReminders ? Colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationText}>Mises à jour d'événements</Text>
              <Text style={styles.notificationSubtext}>
                Changements d'horaire, lieu ou annulations
              </Text>
            </View>
            <Switch
              value={notifications.eventUpdates}
              onValueChange={() => toggleNotification('eventUpdates')}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={notifications.eventUpdates ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationText}>Covoiturage</Text>
              <Text style={styles.notificationSubtext}>
                Nouvelles demandes et confirmations de covoiturage
              </Text>
            </View>
            <Switch
              value={notifications.carpoolUpdates}
              onValueChange={() => toggleNotification('carpoolUpdates')}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={notifications.carpoolUpdates ? Colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationText}>Messages</Text>
              <Text style={styles.notificationSubtext}>
                Nouveaux messages dans les discussions d'événements
              </Text>
            </View>
            <Switch
              value={notifications.messages}
              onValueChange={() => toggleNotification('messages')}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={notifications.messages ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres</Text>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationText}>Actualités et promotions</Text>
              <Text style={styles.notificationSubtext}>
                Nouveautés de l'application et offres spéciales
              </Text>
            </View>
            <Switch
              value={notifications.marketing}
              onValueChange={() => toggleNotification('marketing')}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={notifications.marketing ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Les notifications importantes (annulations, changements d'horaire) ne peuvent pas être désactivées
          </Text>
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
  section: {
    backgroundColor: Colors.card,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  notificationSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: Colors.secondary + '15',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
