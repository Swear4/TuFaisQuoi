# Guide de développement - EventLink

## 🎯 Objectif du projet

Créer une application mobile d'événementiel social permettant de :
- Rejoindre et créer des événements
- Organiser des covoiturages
- Créer du lien social entre participants

## 📝 Notes de développement

### État actuel (v1.0 - MVP)

L'application dispose actuellement de :

1. **4 écrans principaux** :
   - Accueil : Vue d'ensemble avec stats et événements populaires
   - Événements : Liste complète avec filtres par catégorie
   - Covoiturage : Propositions de trajets partagés
   - Profil : Informations utilisateur et paramètres

2. **Navigation** :
   - Navigation par onglets (bottom tabs)
   - 4 onglets : Accueil, Événements, Covoiturage, Profil

3. **Design** :
   - Interface moderne avec palette de couleurs cohérente
   - Cartes et composants réutilisables
   - Émojis pour les icônes (temporaire)

### Données actuelles

Pour l'instant, toutes les données sont **statiques** (mock data) directement dans les composants.

### Prochaines étapes recommandées

#### Phase 1 : Amélioration de l'UI (court terme)
- [ ] Remplacer les émojis par des vraies icônes (react-native-vector-icons)
- [ ] Ajouter des animations (react-native-reanimated)
- [ ] Améliorer le responsive design
- [ ] Ajouter des images pour les événements

#### Phase 2 : Navigation avancée (court terme)
- [ ] Ajouter Stack Navigator pour les détails d'événement
- [ ] Créer un écran de détails d'événement
- [ ] Créer un écran de détails de covoiturage
- [ ] Ajouter un formulaire de création d'événement

#### Phase 3 : Gestion des données (moyen terme)
- [ ] Créer un contexte global (React Context) pour la gestion d'état
- [ ] Extraire les données mock dans des fichiers séparés
- [ ] Implémenter Redux ou Zustand pour le state management

#### Phase 4 : Backend et authentification (moyen terme)
- [ ] Configurer Firebase ou Supabase
- [ ] Implémenter l'authentification (email/password, Google, etc.)
- [ ] Créer les collections/tables de données
- [ ] Connecter l'app au backend

#### Phase 5 : Fonctionnalités avancées (long terme)
- [ ] Géolocalisation avec cartes (react-native-maps)
- [ ] Notifications push
- [ ] Chat en temps réel
- [ ] Système de paiement
- [ ] Upload d'images
- [ ] Partage sur réseaux sociaux

## 🔧 Commandes utiles

```bash
# Démarrer l'application
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios

# Lancer sur le web
npm run web

# Installer une nouvelle dépendance compatible Expo
npx expo install <package-name>

# Mettre à jour les dépendances Expo
npx expo install --fix

# Vérifier les erreurs
npm run lint

# Build pour production
npx eas build
```

## 📦 Dépendances principales

- `react-native` : Framework mobile
- `expo` : Plateforme de développement
- `@react-navigation/native` : Navigation
- `@react-navigation/bottom-tabs` : Navigation par onglets
- `react-native-screens` : Performance des écrans
- `react-native-safe-area-context` : Gestion des zones sûres

## 🎨 Palette de couleurs

```typescript
{
  primary: '#6C63FF',      // Violet
  secondary: '#FF6584',    // Rose
  background: '#F8F9FA',   // Gris très clair
  card: '#FFFFFF',         // Blanc
  text: '#2D3436',         // Gris foncé
  textSecondary: '#636E72', // Gris moyen
  border: '#DFE6E9',       // Gris clair
  success: '#00B894',      // Vert
  warning: '#FDCB6E',      // Jaune
  error: '#D63031',        // Rouge
}
```

## 💡 Conseils pour la suite

1. **Commencez petit** : Ajoutez une fonctionnalité à la fois
2. **Testez régulièrement** : Lancez l'app après chaque modification
3. **Gardez le code propre** : Créez des composants réutilisables
4. **Documentez** : Ajoutez des commentaires pour le code complexe
5. **Git** : Faites des commits réguliers avec des messages clairs

## 📚 Ressources

- [Documentation Expo](https://docs.expo.dev/)
- [Documentation React Navigation](https://reactnavigation.org/)
- [Documentation React Native](https://reactnative.dev/)
- [Expo Snack](https://snack.expo.dev/) - Tester du code en ligne
