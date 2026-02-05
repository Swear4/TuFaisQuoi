# 📱 Guide Simple - Pour Présenter l'App à vos Clients

## 🎯 Objectif
Avoir un lien web que vos clients peuvent ouvrir dans leur navigateur pour tester l'application.

---

## 🚀 Déploiement Rapide (15 minutes)

### Étape 1 : Créer un compte Vercel
1. Allez sur **[vercel.com](https://vercel.com)**
2. Cliquez sur **"Sign Up"**
3. Choisissez **"Continue with GitHub"** (recommandé)
4. Autorisez Vercel à accéder à GitHub

### Étape 2 : Préparer le code sur GitHub

**Option A - Via GitHub Desktop (le plus simple) :**
1. Téléchargez [GitHub Desktop](https://desktop.github.com/)
2. Installez et ouvrez GitHub Desktop
3. Cliquez sur **File → Add Local Repository**
4. Sélectionnez le dossier : `C:\Users\maxou\Application_Evenementielle\web-preview`
5. Si demandé, cliquez **"Create a repository"**
6. Cliquez sur **"Publish repository"**
7. Décochez **"Keep this code private"** (ou laissez coché si vous préférez)
8. Cliquez **"Publish repository"**

**Option B - En ligne (si vous préférez) :**
1. Allez sur [github.com/new](https://github.com/new)
2. Nom du repo : `events-app-demo`
3. Privé ou Public : votre choix
4. Cliquez **"Create repository"**
5. Suivez les instructions pour uploader le dossier `web-preview`

### Étape 3 : Déployer sur Vercel
1. Sur [vercel.com](https://vercel.com), cliquez **"New Project"**
2. Vous verrez vos repositories GitHub
3. Trouvez votre repo (ex: `events-app-demo`)
4. Cliquez **"Import"**
5. Dans la configuration :
   - **Framework Preset** : Sélectionnez **"Expo"** ou laissez **"Other"**
   - **Build Command** : `npx expo export:web`
   - **Output Directory** : `web-build`
   - **Install Command** : `npm install` (devrait être automatique)
6. Cliquez **"Deploy"** 🚀

⏳ Le déploiement prend 2-3 minutes...

### Étape 4 : Récupérer votre lien
Une fois le déploiement terminé :
- Vercel affiche votre lien : `https://votre-app-xyz.vercel.app`
- Copiez ce lien
- **C'est ce lien que vous partagerez à vos clients !**

---

## 📲 Comment vos clients vont l'utiliser

1. Ils reçoivent le lien par email/SMS
2. Ils cliquent dessus
3. L'app s'ouvre dans leur navigateur (Chrome, Safari, etc.)
4. Ils peuvent :
   - Créer un compte
   - Naviguer dans les événements
   - Voir les détails
   - Tester les fonctionnalités

**Pas d'installation, juste un lien !** 🎉

---

## 💡 Message type à envoyer aux clients

```
Bonjour,

Je vous présente notre nouvelle application d'événements !

🔗 Testez-la ici : https://votre-app.vercel.app

C'est une démo interactive, vous pouvez :
- Créer un compte test
- Parcourir les événements
- Tester toutes les fonctionnalités

Pas besoin d'installation, ça fonctionne dans votre navigateur.

À bientôt !
```

---

## 🎨 Personnalisation (optionnel)

### Changer le nom affiché
1. Ouvrez le fichier `web-preview/app.json`
2. Modifiez la ligne :
```json
"name": "Events App Demo",
```
3. Remettez à jour sur GitHub
4. Vercel redéploiera automatiquement

### Domaine personnalisé (optionnel - ~10€/an)
Au lieu de `https://votre-app.vercel.app`, avoir `https://mon-app.com`
1. Sur Vercel, allez dans **Settings → Domains**
2. Ajoutez votre domaine
3. Suivez les instructions

---

## ⚠️ Important à savoir

### ✅ Ce qui fonctionne
- Toute la navigation
- Authentification
- Événements
- Profils
- Recherche
- Thème clair/sombre

### ⚠️ Limitations web
- **Carte** : Affiche une liste au lieu d'une carte interactive
- **Photos** : Upload peut être différent
- **Notifications push** : Non disponibles

---

## 🆘 Problèmes ?

### L'app ne s'affiche pas
1. Ouvrez la console (F12 dans le navigateur)
2. Cherchez les erreurs en rouge
3. Vérifiez que le build s'est bien passé sur Vercel

### Le build échoue sur Vercel
1. Vérifiez **Build Command** : `npx expo export:web`
2. Vérifiez **Output Directory** : `web-build`
3. Consultez les logs de build sur Vercel

### Données ne s'affichent pas
- Vérifiez que Supabase est bien configuré
- Les clés Supabase sont dans `src/lib/supabase.ts`

---

## 📞 Support

Si vous avez un souci :
1. Consultez [DEPLOIEMENT.md](DEPLOIEMENT.md) pour le guide détaillé
2. Vérifiez les logs sur Vercel
3. Testez d'abord en local avec `start-local.bat`

---

## 📊 Checklist rapide

- [ ] Compte Vercel créé
- [ ] Code sur GitHub
- [ ] Projet déployé sur Vercel
- [ ] Lien récupéré
- [ ] Testé le lien dans le navigateur
- [ ] Message préparé pour les clients

---

**Temps total : 15-20 minutes max** ⏱️

**Résultat : Un lien à partager immédiatement** 🎉
