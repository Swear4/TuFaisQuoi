# Plan — Création d’événements réservée aux « Premium vérifiés »

Date: 2026-02-16

## Objectif
Permettre la monétisation via une offre Premium, tout en empêchant qu’un utilisateur puisse simplement payer puis publier n’importe quel événement.

**Principe:** l’accès à la création d’événements nécessite **(1) vérification manuelle** + **(2) abonnement Premium actif**.

- La **vérification** est un statut de confiance (restaurant/organisateur visité, partenaire validé, etc.).
- Le **Premium** est un achat numérique (abonnement) qui doit être conforme App Store / Google Play (In‑App Purchase / Google Play Billing).

## Pourquoi ce plan est adapté (stores + anti-abus)
- Les stores autorisent qu’une fonctionnalité soit conditionnée à des critères de modération/validation (ex: comptes “vérifiés”, “partenaires”).
- Ce qui est sensible côté stores, c’est la **transparence**: si un paiement n’ouvre pas réellement l’accès à une fonctionnalité annoncée, cela peut générer des plaintes/remboursements.

En faisant **vérification d’abord, abonnement ensuite**, on réduit:
- les cas “j’ai payé mais je ne peux pas utiliser”,
- l’incitation à payer pour spammer,
- la charge de modération.

## Résultat attendu (règle simple)
Un utilisateur peut **créer / publier un événement** uniquement si:
- `is_verified = true` (et éventuellement `is_professional = true` si vous voulez limiter aux pros)
- ET `subscription_type` (ou équivalent) indique un abonnement Premium actif.

Important: cette règle doit être appliquée **côté serveur** (Supabase/RLS) et reflétée **côté app** (UX).

## Architecture fonctionnelle (sans code)
### 1) Statuts côté utilisateur
On distingue 2 notions indépendantes:

1. **Statut de vérification (confiance)**
   - Non demandé
   - En attente
   - Vérifié
   - Refusé (optionnel)

2. **Statut d’abonnement (paiement)**
   - Free
   - Premium

**Recommandation:** utiliser un statut explicite pour la vérification (ex: `verification_status`) plutôt qu’un simple booléen.

### 2) Flux utilisateur (Mobile)
#### A. Utilisateur non vérifié
- Le bouton “Créer un événement” est **désactivé/masqué**.
- On affiche un CTA clair: **“Demander l’accès créateur”**.
- L’utilisateur remplit un formulaire (ex: nom établissement, ville, téléphone, instagram/site, message, disponibilités).
- Après envoi: état **“Demande en cours”**.

#### B. Utilisateur vérifié mais non Premium
- La création reste verrouillée.
- CTA: **“Passer Premium (réservé aux créateurs vérifiés)”**.
- L’abonnement (quand implémenté) se fait via IAP/Billing.

#### C. Utilisateur vérifié + Premium
- Accès normal à la création d’événements.

### 3) Flux admin (hors app utilisateur)
Il faut un endroit pour:
- voir les demandes,
- contacter l’utilisateur,
- marquer “vérifié/refusé”,
- (optionnel) laisser une note interne.

Options possibles:
- un mini backoffice (web)
- la console Supabase (au début)
- un écran admin dans l’app (réservé à un rôle admin), si vous préférez.

## Modèle de données (concept)
### Table `users`
Déjà présente dans le schéma.
Champs utiles/à confirmer:
- `subscription_type`: `free|premium|premium_plus` (déjà dans votre schema)
- `is_verified`: booléen (déjà dans votre schema)
- `is_professional`: booléen (déjà dans votre schema)

**Évolution recommandée:**
- Ajouter (ou remplacer) par `verification_status`:
  - `none`, `pending`, `verified`, `rejected`
- Ajouter `verified_at`, `verified_by` (optionnel)

### Table `creator_verification_requests` (recommandée)
Une table dédiée pour tracer les demandes:
- `id`, `user_id`, `status` (pending/approved/rejected)
- champs du formulaire (texte)
- `admin_notes`
- timestamps

Pourquoi une table dédiée?
- historique (qui a demandé quoi)
- audit simple
- évite que l’utilisateur modifie rétroactivement son “dossier”

## Sécurité et enforcement (le point le plus important)
### Règle d’or
Tout ce qui est “contrôle d’accès” doit être appliqué **au niveau DB**.

Même si l’app cache le bouton, un utilisateur peut:
- appeler l’API directement,
- modifier l’app,
- automatiser des requêtes.

### Supabase RLS (concept)
Sur `events`:
- SELECT: inchangé (selon vos règles actuelles)
- INSERT: autoriser seulement si
  - `auth.uid() = organizer_id`
  - ET l’utilisateur est `verified`
  - ET l’utilisateur est `premium`
- UPDATE/DELETE: garder `auth.uid() = organizer_id` + appliquer la même contrainte si vous voulez empêcher un downgrade (ex: si Premium expiré)

**Décision produit à prendre:**
- Si un créateur perd Premium, peut-il:
  - modifier/supprimer ses événements existants?
  - créer seulement? (souvent oui: on bloque la création, mais on autorise l’édition minimale)

## Paiement Premium (principes stores)
Quand vous implémenterez la partie Premium:
- iOS: StoreKit / In‑App Purchase
- Android: Google Play Billing

Points UX importants:
- Ne pas promettre “créer des événements en Premium” si ce n’est pas vrai pour les non vérifiés.
- Toujours afficher avant achat: “Disponible uniquement pour les créateurs vérifiés”.

## Textes/UX (proposition de wording)
### États du bouton
- Non vérifié: **“Demander l’accès créateur”**
- En attente: **“Demande en cours”** (désactivé)
- Vérifié, free: **“Passer Premium”** + sous-texte “Réservé aux créateurs vérifiés”
- Vérifié, premium: **“+ Créer un événement”**

### Message explicatif (court)
“Pour garantir la qualité des événements, la création est réservée aux créateurs vérifiés. Faites une demande, puis activez Premium une fois validé.”

## Étapes d’implémentation (ordre conseillé)
1. **Clarifier la règle finale**
   - Condition exacte: `verified` + `premium` (et `professional` oui/non)
   - Que faire si Premium expire

2. **Base de données**
   - Ajouter table `creator_verification_requests`
   - Ajouter (ou formaliser) `verification_status`

3. **RLS / sécurité**
   - Bloquer INSERT sur `events` pour non‑autorisés
   - Ajouter policy pour créer une demande de vérification (INSERT request)

4. **App mobile (UX)**
   - Afficher l’état (non demandé / en attente / vérifié)
   - Bloquer l’accès au modal de création si non éligible
   - Ajouter écran formulaire “Demande d’accès créateur”

5. **Admin**
   - Procédure interne (qui vérifie, en combien de temps)
   - Outil de validation (backoffice ou Supabase)

6. **Premium (plus tard)**
   - IAP/Billing
   - Synchronisation du statut subscription côté DB

## Risques et mitigations
- **Friction**: moins de conversions → rendre la demande très simple et expliquer le bénéfice.
- **Support**: gérer les refus → prévoir un message “refusé” + possibilité de re-demander.
- **Incohérence DB/app**: éviter les statuts côté `user_metadata` seulement → utiliser la table `users`.

## Checklist discussion (pour valider avec ta mère)
- Souhaite-t-on limiter aux restaurants/pros uniquement (`is_professional`)?
- On accepte quels justificatifs? (site, SIRET, réseaux, adresse)
- Délai de réponse cible?
- Que se passe-t-il si Premium est annulé? (création bloquée seulement, ou édition bloquée aussi)
- Qui a accès à l’admin et comment on garde une trace (notes internes)?

---

Si vous confirmez les décisions de la checklist, la suite logique sera de:
- formaliser les champs DB (request + status),
- appliquer RLS stricte sur `events`,
- puis implémenter l’UX mobile correspondant.
