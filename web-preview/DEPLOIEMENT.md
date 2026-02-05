# 🚀 Guide de Déploiement sur Vercel

## Méthode 1 : Via l'interface web Vercel (RECOMMANDÉ - 10 min) ⭐

### Étape 1 : Préparer le dossier
1. ✅ C'est déjà fait ! Le dossier `web-preview` est prêt
2. Les dépendances sont installées

### Étape 2 : Créer un compte Vercel
1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "Sign Up"
3. Se connecter avec GitHub (recommandé) ou email

### Étape 3 : Créer un repository GitHub (optionnel mais recommandé)
**Option A : Via GitHub Desktop (plus simple)**
1. Télécharger [GitHub Desktop](https://desktop.github.com/)
2. Ouvrir GitHub Desktop
3. File → Add Local Repository → Sélectionner `web-preview`
4. Publish repository (cocher "Private" si vous voulez)

**Option B : En ligne de commande**
```bash
cd c:\Users\maxou\Application_Evenementielle\web-preview
git init
git add .
git commit -m "Initial commit"
# Créer un repo sur github.com puis :
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git push -u origin main
```

### Étape 4 : Déployer sur Vercel
1. Sur [vercel.com](https://vercel.com), cliquer "New Project"
2. Importer votre repository GitHub
3. Configurer le projet :
   - **Framework Preset** : Expo
   - **Root Directory** : `.` (laisser par défaut)
   - **Build Command** : `npx expo export:web`
   - **Output Directory** : `web-build`
4. Cliquer "Deploy" 🚀

### Étape 5 : Partager le lien
- Vercel vous donnera un lien genre : `https://votre-app.vercel.app`
- Partagez ce lien à votre mère ! 🎉

---

## Méthode 2 : Via Vercel CLI (pour les plus techniques)

### Installation
```bash
npm install -g vercel
```

### Déploiement
```bash
cd c:\Users\maxou\Application_Evenementielle\web-preview
vercel
```

Suivre les instructions dans le terminal.

---

## 🔧 Configuration Supabase (IMPORTANT)

Votre app utilise Supabase. Pour que ça fonctionne en production :

### Option A : Utiliser la même base que le dev (plus simple)
Les clés Supabase sont déjà dans `src/lib/supabase.ts`, ça devrait fonctionner directement.

### Option B : Séparer dev et prod (recommandé)
1. Sur Vercel, aller dans Settings → Environment Variables
2. Ajouter :
   - `EXPO_PUBLIC_SUPABASE_URL` = votre URL Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = votre clé anonyme

---

## 📱 Test en local avant de déployer

```bash
cd c:\Users\maxou\Application_Evenementielle\web-preview
npm run web
```

L'app s'ouvrira dans votre navigateur à `http://localhost:8081`

---

## ⚠️ Points d'attention

1. **Carte Maps** : Adaptée pour le web (liste au lieu de carte interactive)
2. **Notifications** : Peuvent ne pas fonctionner sur web
3. **Image Upload** : Peut nécessiter des ajustements
4. **Performance** : Première visite peut être lente, ensuite c'est rapide

---

## 🎨 Personnalisation

### Changer le nom affiché
Éditer `app.json` → `expo.name`

### Changer l'icône/favicon
Remplacer les fichiers dans `assets/`

---

## 🆘 Problèmes courants

### Build échoue sur Vercel
- Vérifier que `Build Command` = `npx expo export:web`
- Vérifier que `Output Directory` = `web-build`

### App blanche
- Ouvrir la console du navigateur (F12)
- Chercher les erreurs liées à Supabase ou autres APIs

### Trop lent
- Première fois est normale (télécharge tout)
- Ensuite c'est mis en cache

---

## 📞 Support

En cas de problème, partager :
1. L'URL Vercel
2. Les logs de build (sur Vercel)
3. Les erreurs de la console navigateur (F12)
