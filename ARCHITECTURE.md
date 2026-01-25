# Architecture Frontend/Backend

## 📁 Structure du projet

```
src/
├── api/                    # (Futur) API endpoints externes
├── services/               # 🔧 BACKEND - Logique métier
│   ├── authService.ts      # Authentification (signUp, signIn, signOut)
│   ├── eventsService.ts    # Gestion des événements
│   └── tripsService.ts     # Gestion des voyages
├── hooks/                  # 🔄 React Query hooks (couche frontend)
│   ├── useEvents.ts        # Hooks pour événements
│   └── useTrips.ts         # Hooks pour voyages
├── contexts/               # 📦 Contextes React
│   ├── AuthContext.tsx     # État d'authentification global
│   └── ThemeContext.tsx    # Thème sombre/clair
├── screens/                # 📱 FRONTEND - Composants écrans
│   ├── WelcomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── HomeScreen.tsx
│   ├── EventsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
├── components/             # 🧩 Composants réutilisables
├── navigation/             # 🗺️ Navigation de l'app
├── lib/                    # ⚙️ Configuration (Supabase client)
├── constants/              # 🎨 Constantes (colors, etc.)
└── types/                  # 📝 Types TypeScript

supabase/                   # 💾 DATABASE
├── schema.sql              # Schéma de la base de données
├── seed.sql                # Données de test
└── update_images.sql       # Script de mise à jour
```

## 🔄 Flux de données

```
FRONTEND (Screens) 
    ↓
HOOKS (useEvents, useAuth) 
    ↓
SERVICES (eventsService, authService)
    ↓
SUPABASE CLIENT (lib/supabase.ts)
    ↓
DATABASE (PostgreSQL)
```

## 📋 Services Backend

### authService.ts
- `signUp()` - Créer un compte
- `signIn()` - Se connecter
- `signOut()` - Se déconnecter
- `updateProfile()` - Mettre à jour le profil
- `getUserProfile()` - Récupérer le profil
- `resetPassword()` - Réinitialiser mot de passe

### eventsService.ts
- `fetchEvents()` - Récupérer tous les événements
- `fetchEventsByCategory()` - Par catégorie
- `fetchPopularEvents()` - Événements populaires
- `fetchEventById()` - Un événement spécifique
- `fetchEventsStats()` - Statistiques
- `fetchUserEvents()` - Événements de l'utilisateur
- `fetchUserStats()` - Stats utilisateur
- `createEvent()` - Créer un événement
- `updateEvent()` - Modifier un événement
- `deleteEvent()` - Supprimer un événement
- `registerToEvent()` - S'inscrire à un événement
- `unregisterFromEvent()` - Se désinscrire

### tripsService.ts
- `fetchTrips()` - Récupérer tous les voyages
- `fetchTripById()` - Un voyage spécifique
- `fetchTripOptions()` - Options d'un voyage
- `fetchTripsStats()` - Statistiques
- `createTrip()` - Créer un voyage
- `createTripOption()` - Ajouter une option
- `bookTrip()` - Réserver un voyage

## 🧪 Tester l'authentification

### 1. Lancer l'app
```bash
npx expo start
```

### 2. Créer un compte
- L'app démarre sur le **WelcomeScreen**
- Clique sur "S'inscrire"
- Remplis: Nom complet, Email, Mot de passe (min 6 caractères)
- Confirme le mot de passe

### 3. Vérifier dans Supabase
- Dashboard Supabase → Authentication → Users
- Tu devrais voir ton utilisateur créé
- Vérifie aussi dans Database → Table `users`

### 4. Se connecter
- Email et mot de passe utilisés lors de l'inscription
- Une fois connecté, l'app affiche les onglets (Home, Events, Map, Profile)

### 5. Tester le profil
- Onglet Profile → Ton nom et email s'affichent
- Les stats (événements rejoints, créés, covoiturages) proviennent de la DB
- Bouton "Déconnexion" → retour au WelcomeScreen

## 🔑 Variables d'environnement

Fichier: `.env` (à la racine)
```env
EXPO_PUBLIC_SUPABASE_URL=https://hnpewfssuwtxdooqiqkj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ta_clé_anon>
```

## ✅ Prochaines étapes

1. ✅ Authentification complète
2. ⏳ Création d'événements (formulaire CreateEventModal)
3. ⏳ Inscription aux événements
4. ⏳ Upload d'images (avatars, événements)
5. ⏳ Notifications push
6. ⏳ Carte interactive
7. ⏳ Covoiturage
