# 📱 Version Web - Documentation

## 📂 Nouveau Dossier Créé

Un nouveau dossier **`web-preview`** a été créé dans votre projet.

**Emplacement :** `C:\Users\maxou\Application_Evenementielle\web-preview\`

---

## 🎯 Objectif

Ce dossier contient une version web de votre application qui peut être :
- Testée en local dans un navigateur
- Déployée gratuitement sur Vercel
- Partagée via un simple lien web

**Parfait pour présenter l'app à des clients sans installation !**

---

## 📁 Ce qui a été ajouté

```
Application_Evenementielle/
├── ... (votre code existant, non modifié)
└── web-preview/              ← NOUVEAU DOSSIER
    ├── README.md             ← Documentation principale
    ├── GUIDE_SIMPLE.md       ← Guide pour présentation clients
    ├── DEPLOIEMENT.md        ← Guide technique détaillé
    ├── RECAP.md              ← Récapitulatif et timeline
    ├── start-local.bat       ← Lancer en local (double-clic)
    ├── build-for-vercel.bat  ← Build pour production
    ├── package.json          ← Dépendances web
    ├── app.json             ← Config Expo
    ├── vercel.json          ← Config Vercel
    ├── assets/              ← Icônes et images
    ├── web/                 ← Config web HTML
    └── src/                 ← Code source (copie)
```

---

## ✅ Votre Code Original

**Aucune modification** n'a été faite au code original dans :
- `Application_Evenementielle/src/`
- `Application_Evenementielle/App.js`
- etc.

Tout est séparé dans `web-preview/` !

---

## 🚀 Prochaines Étapes

### 1. Tester en Local (5 min)
Dans le dossier `web-preview/` :
- Double-cliquez sur **`start-local.bat`**
- OU lancez `npm run web`
- L'app s'ouvrira dans votre navigateur

### 2. Déployer sur Vercel (15 min)
Suivez le guide : **`web-preview/GUIDE_SIMPLE.md`**

Résumé ultra-rapide :
1. Compte Vercel (gratuit)
2. Push sur GitHub
3. Connect sur Vercel
4. Deploy !
5. Récupérer le lien : `https://votre-app.vercel.app`

---

## 📖 Documentation

Selon votre besoin :

| Guide | Quand l'utiliser |
|-------|------------------|
| **[GUIDE_SIMPLE.md](web-preview/GUIDE_SIMPLE.md)** | Pour déployer et présenter aux clients |
| **[DEPLOIEMENT.md](web-preview/DEPLOIEMENT.md)** | Pour les détails techniques |
| **[RECAP.md](web-preview/RECAP.md)** | Pour voir ce qui a été fait |
| **[README.md](web-preview/README.md)** | Vue d'ensemble du dossier |

---

## 💡 Cas d'Usage

### Pour votre mère :
Elle peut partager un lien à ses clients :
```
🔗 https://votre-app.vercel.app

"Testez notre application directement dans votre navigateur !"
```

### Pour vous :
- Tester rapidement des changements
- Démo pour investisseurs
- Portfolio en ligne
- Preview avant build mobile

---

## 🎨 Modifications

### Changer le nom affiché
Éditez `web-preview/app.json` :
```json
{
  "expo": {
    "name": "Mon App Events"
  }
}
```

### Adapter les couleurs
Éditez `web-preview/src/constants/colors.ts`

### Personnaliser les icônes
Remplacez dans `web-preview/assets/`

---

## ⚠️ Important

### Séparation du code
- **Développement mobile** : Dossier principal `Application_Evenementielle/`
- **Preview web** : Dossier `web-preview/`

Les deux sont indépendants !

### Synchronisation
Si vous modifiez le code principal et voulez mettre à jour la version web :
```bash
# Copier les changements
xcopy "src" "web-preview\src\" /E /I /H /Y
```

---

## 🆓 Coûts

**TOUT GRATUIT :**
- ✅ Hébergement Vercel
- ✅ Bande passante illimitée
- ✅ SSL/HTTPS inclus
- ✅ Déploiements illimités

---

## 🆘 Problèmes ?

1. Consultez les guides dans `web-preview/`
2. Vérifiez que les dépendances sont installées : `npm install`
3. Testez en local d'abord : `start-local.bat`

---

## 📊 Timeline

- ✅ Setup dossier : **FAIT**
- ✅ Adaptation code : **FAIT**
- ✅ Installation : **FAIT**
- 🔄 Test local : **EN COURS**
- ⏳ Déploiement : **15 min** (votre part)

---

## 🎉 Résultat

**Avant :** Application mobile uniquement
**Après :** Application mobile + Version web partageable

**Impact :** Présentation clients facilitée, zéro friction !

---

Pour commencer : **[web-preview/GUIDE_SIMPLE.md](web-preview/GUIDE_SIMPLE.md)** 🚀
