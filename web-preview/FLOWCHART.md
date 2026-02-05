# 🗺️ Flowchart - Du Code au Lien Partageable

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📂 MAINTENANT : Dossier web-preview créé                      │
│                                                                 │
│  ✅ Code adapté pour le web                                    │
│  ✅ Dépendances installées                                     │
│  ✅ Serveur local qui tourne → http://localhost:8081          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🌐 ÉTAPE 1 : Compte Vercel                                    │
│                                                                 │
│  1. Aller sur vercel.com                                       │
│  2. Sign up avec GitHub                                        │
│                                                                 │
│  ⏱️ Temps : 2 minutes                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📤 ÉTAPE 2 : Upload sur GitHub                                │
│                                                                 │
│  Option A : GitHub Desktop (recommandé)                        │
│    1. Télécharger GitHub Desktop                               │
│    2. Add Local Repository → web-preview                       │
│    3. Publish repository                                       │
│                                                                 │
│  Option B : En ligne                                           │
│    1. github.com/new                                           │
│    2. Upload le dossier                                        │
│                                                                 │
│  ⏱️ Temps : 5 minutes                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🚀 ÉTAPE 3 : Déployer sur Vercel                              │
│                                                                 │
│  1. Vercel → New Project                                       │
│  2. Import from GitHub → Sélectionner votre repo              │
│  3. Configuration :                                            │
│     • Framework: Expo                                          │
│     • Build Command: npx expo export:web                       │
│     • Output Directory: web-build                              │
│  4. Cliquer "Deploy"                                           │
│                                                                 │
│  ⏱️ Temps : 5 minutes + 2-3 min de build                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ✅ RÉSULTAT : Lien partageable !                              │
│                                                                 │
│  🔗 https://events-app-demo.vercel.app                         │
│                                                                 │
│  ✨ Caractéristiques :                                         │
│  • Accessible de n'importe où                                  │
│  • Aucune installation nécessaire                              │
│  • SSL/HTTPS inclus                                            │
│  • Gratuit et illimité                                         │
│  • Mise à jour automatique (push GitHub → redéploiement)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📧 PARTAGE : Message aux clients                              │
│                                                                 │
│  "Bonjour,                                                     │
│                                                                 │
│  Découvrez notre application d'événements :                    │
│  🔗 https://votre-app.vercel.app                               │
│                                                                 │
│  Testez directement dans votre navigateur,                     │
│  aucune installation nécessaire !"                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Timeline Visuelle

```
├─ 0 min    ✅ Code adapté (FAIT)
├─ 2 min    🌐 Compte Vercel
├─ 7 min    📤 GitHub upload
├─ 12 min   🚀 Vercel deploy lancé
├─ 15 min   ⏳ Build en cours...
└─ 18 min   🎉 LIEN PRÊT !
```

**Temps total : ~20 minutes** ⏱️

---

## 🔄 Mises à Jour Futures

Une fois configuré, les updates sont automatiques :

```
1. Modifier le code dans web-preview/
2. Commit + Push sur GitHub
3. Vercel détecte et redéploie automatiquement
4. Nouveau lien (même URL) avec les changements

⏱️ Temps : 2-3 minutes (automatique)
```

---

## 💡 Alternatives

### Si vous ne voulez pas GitHub

**Option 1 : Vercel CLI**
```bash
npm install -g vercel
cd web-preview
vercel
```

**Option 2 : Upload direct**
- Vercel accepte aussi les uploads ZIP
- Moins pratique pour les mises à jour

---

## 🎯 Objectif vs Réalité

| Objectif | Statut |
|----------|--------|
| Version web de l'app | ✅ **FAIT** |
| Testable localement | ✅ **EN COURS** |
| Déployable gratuitement | ✅ **PRÊT** |
| Lien partageable | ⏳ **15 min** |
| Présentation clients | ⏳ **20 min** |

---

## 📞 Aide

À chaque étape, consultez :
- **[GUIDE_SIMPLE.md](GUIDE_SIMPLE.md)** - Instructions détaillées
- **[DEPLOIEMENT.md](DEPLOIEMENT.md)** - Troubleshooting

---

**Prêt à démarrer ? → [GUIDE_SIMPLE.md](GUIDE_SIMPLE.md)** 🚀
