# EventLink - Application Événementielle

Application mobile React Native pour connecter les gens autour d'événements et faciliter le covoiturage.

## 🎯 Fonctionnalités actuelles

### ✅ Version 1.0 (MVP)
- **Accueil** : Vue d'ensemble des événements et statistiques
- **Liste d'événements** : Parcourir les événements disponibles avec filtres par catégorie
- **Covoiturage** : Consulter et proposer des trajets partagés
- **Profil** : Gérer son compte et voir ses événements

## 🚀 Installation et démarrage

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn
- Expo Go app sur votre téléphone (iOS ou Android)

### Installation
```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

### Lancer sur appareil
1. Scannez le QR code avec l'app Expo Go (Android) ou l'appareil photo (iOS)
2. L'application se chargera automatiquement

### Lancer sur émulateur
```bash
# Android
npm run android

# iOS (nécessite macOS)
npm run ios
```

## 📱 Structure du projet

```
src/
├── screens/          # Écrans de l'application
│   ├── HomeScreen.tsx
│   ├── EventsScreen.tsx
│   ├── CarpoolScreen.tsx
│   └── ProfileScreen.tsx
├── navigation/       # Configuration de navigation
│   └── AppNavigator.tsx
├── components/       # Composants réutilisables (à venir)
├── constants/        # Constantes (couleurs, thèmes, etc.)
│   └── colors.ts
└── types/           # Types TypeScript
    └── index.ts
```

## 🎨 Design

L'application utilise une palette de couleurs moderne :
- **Primaire** : Violet (#6C63FF)
- **Secondaire** : Rose (#FF6584)
- **Fond** : Gris clair (#F8F9FA)

## 📋 Prochaines étapes

### Version 1.1 - Fonctionnalités à venir
- [ ] Authentification des utilisateurs
- [ ] Création d'événements
- [ ] Système de notifications
- [ ] Chat entre participants
- [ ] Géolocalisation pour les covoiturages
- [ ] Filtres avancés
- [ ] Système de notation/avis
- [ ] Mode sombre

### Version 2.0 - Fonctionnalités avancées
- [ ] Backend avec API REST
- [ ] Base de données (Firebase ou Supabase)
- [ ] Paiements intégrés
- [ ] Partage sur réseaux sociaux
- [ ] Recommandations personnalisées
- [ ] Calendrier synchronisé
- [ ] Support multi-langues

## 🛠️ Technologies utilisées

- **React Native** : Framework mobile
- **Expo** : Plateforme de développement
- **React Navigation** : Navigation entre écrans
- **TypeScript** : Typage statique

## 📄 License

Projet personnel - Tous droits réservés

## 👨‍💻 Auteur

Maxou - Application Événementielle
