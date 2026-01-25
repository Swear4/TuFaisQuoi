# Architecture Base de Données - EventLink

## 🎯 Résumé des Optimisations

### 1. Types d'Index Utilisés

#### **Arbres B+ (par défaut PostgreSQL)**
```sql
-- Index simples
CREATE INDEX idx_events_participants_count ON events(participants_count);

-- Index composites (plusieurs colonnes)
CREATE INDEX idx_events_search ON events(date, is_hidden, category);

-- Index partiels (seulement certaines lignes)
CREATE INDEX idx_events_hidden ON events(is_hidden) WHERE is_hidden = FALSE;

-- Index clusterisé (tri physique des données)
CLUSTER events USING idx_events_search;
```

**Avantages B+** :
- Équilibré automatiquement
- Performances prévisibles O(log n)
- Optimal pour range scans (date >= X)
- Supporte ORDER BY efficacement

#### **Index GiST (géospatial)**
```sql
-- Pour recherches géographiques optimales
CREATE INDEX idx_events_location ON events 
USING GIST (ll_to_earth(latitude, longitude));
```

**Utilisation** :
- Requêtes "événements dans un rayon de X km"
- Plus performant que B+ pour données spatiales
- Utilise des bounding boxes

### 2. Stratégies de Join

PostgreSQL choisit automatiquement selon les statistiques :

#### **Nested Loop Join (NLJ)**
```sql
-- Utilisé quand peu de lignes
SELECT * FROM events e
INNER JOIN event_registrations r ON e.id = r.event_id
WHERE e.id = 'specific-uuid'; -- 1 event
```
**Complexité** : O(n × m) mais rapide pour petites tables

#### **Hash Join**
```sql
-- Utilisé pour jointures égalité sur gros volumes
SELECT * FROM events e
INNER JOIN event_registrations r ON e.id = r.event_id;
```
**Complexité** : O(n + m) - optimal pour gros volumes

#### **Merge Join**
```sql
-- Utilisé si données déjà triées
SELECT * FROM events e
INNER JOIN event_registrations r ON e.id = r.event_id
ORDER BY e.date;
```
**Complexité** : O(n log n + m log m) si tri nécessaire

**Notre cas** : Principalement **Hash Join** car :
- Jointures sur UUID (égalité)
- Volumes moyens (milliers d'events)
- Pas de tri massif nécessaire

### 3. Sérialisabilité et Transactions

#### **❌ Problème initial : Race Condition**
```typescript
// UNSAFE : Deux users peuvent s'inscrire simultanément sur la dernière place
async function register() {
  const event = await fetchEvent(id); // Read 1
  if (event.participants_count < event.capacity) { // Check
    await insertRegistration(); // Write (entre temps, autre user a aussi write!)
  }
}
```

#### **✅ Solution : SELECT FOR UPDATE**
```sql
-- Verrouillage pessimiste
BEGIN;
  SELECT capacity, participants_count 
  FROM events 
  WHERE id = $1 
  FOR UPDATE; -- LOCK la ligne jusqu'au COMMIT
  
  -- Maintenant personne d'autre ne peut modifier participants_count
  IF count < capacity THEN
    INSERT INTO event_registrations...;
  END IF;
COMMIT; -- Libère le lock
```

**Types de locks** :
- `FOR UPDATE` : Lock exclusif (écriture)
- `FOR SHARE` : Lock partagé (lecture, bloque écritures)
- `FOR NO KEY UPDATE` : Lock léger (permet FK checks)

#### **Niveaux d'isolation PostgreSQL**

| Niveau | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
|--------|------------|---------------------|--------------|-------------|
| **READ UNCOMMITTED** | ❌ | ❌ | ❌ | ⚡⚡⚡⚡ |
| **READ COMMITTED** (défaut) | ✅ | ❌ | ❌ | ⚡⚡⚡ |
| **REPEATABLE READ** | ✅ | ✅ | ❌* | ⚡⚡ |
| **SERIALIZABLE** | ✅ | ✅ | ✅ | ⚡ |

*PostgreSQL implémente Snapshot Isolation qui évite aussi les phantom reads

**Notre choix** : `READ COMMITTED` + `SELECT FOR UPDATE`
- Bon compromis performance/sécurité
- Évite les deadlocks du SERIALIZABLE
- Suffisant pour inscriptions événements

### 4. Journalisation (Write-Ahead Logging)

#### **WAL : Comment ça marche**
```
1. User insert une registration
2. PostgreSQL écrit dans WAL (fichier append-only)
   → Rapide, séquentiel
3. Puis modifie la page data en mémoire (checkpoint)
4. Plus tard, flush sur disque (background)

En cas de crash → Replay WAL depuis dernier checkpoint
```

**Paramètres Supabase** :
- `wal_level = replica` (activé par défaut)
- Retention : 7 jours (Point-in-Time Recovery)
- `synchronous_commit = on` (sécurité max)

#### **MVCC (Multi-Version Concurrency Control)**
PostgreSQL ne lock pas les lectures :
```sql
-- User A
BEGIN;
UPDATE events SET capacity = 100 WHERE id = 'x';
-- Pas encore COMMIT

-- User B (concurrent)
SELECT capacity FROM events WHERE id = 'x';
-- Voit l'ancienne valeur (avant COMMIT de A)
-- Pas de lock, pas d'attente !
```

**Avantages** :
- Lectures jamais bloquées
- Writers ne bloquent pas readers
- Isolation via snapshots

**Coût** : Vacuum nécessaire (nettoyage versions anciennes)

### 5. Contraintes d'Intégrité

#### **Contraintes appliquées**
```sql
-- Évite surréservation
ALTER TABLE events 
ADD CONSTRAINT check_participants_capacity 
CHECK (capacity IS NULL OR participants_count <= capacity);

-- Évite doublons inscription
ALTER TABLE event_registrations
ADD CONSTRAINT unique_user_event UNIQUE(user_id, event_id);

-- Cascade deletes
ALTER TABLE carpool_passengers
ADD CONSTRAINT fk_carpool 
FOREIGN KEY (carpool_id) 
REFERENCES carpools(id) ON DELETE CASCADE;
```

**Ordre de vérification** :
1. NOT NULL
2. CHECK constraints
3. UNIQUE
4. FOREIGN KEY
5. Triggers

### 6. Performance Monitoring

#### **Requêtes lentes**
```sql
-- Activer pg_stat_statements
CREATE EXTENSION pg_stat_statements;

-- Identifier problèmes
SELECT 
  calls,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- > 100ms
ORDER BY mean_exec_time DESC;
```

#### **Index inutilisés**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan -- Nombre de fois utilisé
FROM pg_stat_user_indexes
WHERE idx_scan = 0 
  AND indexrelname NOT LIKE '%_pkey';
-- DROP les index jamais utilisés
```

#### **Vacuum et Analyze**
```sql
-- Nettoie versions mortes (MVCC)
VACUUM ANALYZE events;

-- Vérifier bloat (gonflement)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 7. Vues Matérialisées (Pré-calcul)

```sql
-- Évite COUNT(*) coûteux
CREATE MATERIALIZED VIEW event_stats AS
SELECT 
  e.id,
  e.title,
  COUNT(DISTINCT r.user_id) as participants,
  COUNT(DISTINCT c.id) as carpools
FROM events e
LEFT JOIN event_registrations r ON r.event_id = e.id
LEFT JOIN carpools c ON c.event_id = e.id
GROUP BY e.id, e.title;

-- Refresh périodique (cron job)
REFRESH MATERIALIZED VIEW event_stats;

-- Ou refresh concurrent (sans lock)
REFRESH MATERIALIZED VIEW CONCURRENTLY event_stats;
```

**Quand utiliser** :
- Agrégations complexes
- Données changent rarement
- Temps réel pas critique
- Dashboard/stats

## 📊 Analyse de Requêtes Typiques

### Requête : "Liste des événements disponibles"
```sql
-- EXPLAIN ANALYZE montre le plan d'exécution
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM events 
WHERE is_hidden = FALSE 
  AND date >= NOW()
ORDER BY date 
LIMIT 20;
```

**Plan optimal** :
```
Limit  (cost=0.29..50.45 rows=20)
  -> Index Scan using idx_events_search on events
     Index Cond: (is_hidden = false AND date >= now())
     Buffers: shared hit=15  -- Tout en cache RAM
```

**Optimisations possibles** :
- ✅ Index composite utilisé (pas de table scan)
- ✅ Limit pusheddown (arrête tôt)
- ✅ Pas de sort nécessaire (index déjà trié)

### Requête : "Événements dans 10km"
```sql
SELECT * FROM events
WHERE ll_to_earth(latitude, longitude) <@
      earth_box(ll_to_earth(47.2, -1.5), 10000); -- 10km radius
```

**Avec index GiST** :
```
Bitmap Index Scan on idx_events_location
  -> Bitmap Heap Scan  -- Accès disque optimisé
```

**Sans index** :
```
Seq Scan on events  -- FULL TABLE SCAN ⚠️
  Filter: (calcul distance pour CHAQUE ligne)
```

## 🔐 Sécurité et RLS (Row Level Security)

```sql
-- Politique : Seul l'organisateur peut modifier
CREATE POLICY "Organizers can update their events"
ON events FOR UPDATE
USING (auth.uid() = organizer_id);

-- Index pour accélérer auth.uid() checks
CREATE INDEX idx_events_organizer ON events(organizer_id);
```

## 🎓 Concepts Théoriques vs. Pratique

| Concept Cours | Implémentation EventLink |
|---------------|--------------------------|
| **Index dense** | Tous les index PostgreSQL sont denses (chaque clé présente) |
| **Index sparse** | N/A (PostgreSQL ne supporte pas) |
| **Index clusterisé** | `CLUSTER events USING idx_events_search` (ponctuel) |
| **Nested Loop Join** | Auto-choisi pour petites tables (event_id = UUID) |
| **Hash Join** | Auto-choisi pour events × registrations |
| **Sort-Merge Join** | Rare (sauf ORDER BY complexe) |
| **Arbre B+** | Tous les index par défaut |
| **Verrouillage 2PL** | `SELECT FOR UPDATE` (2-Phase Locking) |
| **Timestamp Ordering** | MVCC (snapshots) |
| **Journalisation** | WAL activé, 7j retention |
| **Sérialisabilité** | READ COMMITTED + locks explicites |

## 📈 Métriques de Performance Actuelles

**Estimations** (à valider avec données réelles) :
- Liste 20 events : **< 10ms**
- Inscription (avec lock) : **< 50ms**
- Recherche géospatiale 10km : **< 30ms**
- Agrégation stats : **< 100ms** (ou instantané avec vue mat.)

## 🚀 Améliorations Futures

### Priorité 1 (Critique)
- ✅ SELECT FOR UPDATE (implémenté)
- ✅ Index composites (implémenté)
- ⏸️ Exécuter add_concurrency_safety.sql

### Priorité 2 (Performance)
- ⏸️ Vues matérialisées pour stats
- ⏸️ Monitoring pg_stat_statements
- ⏸️ Connection pooling (PgBouncer)

### Priorité 3 (Scale)
- ⏸️ Partitionnement table events (par année)
- ⏸️ Read replicas (Supabase Pro)
- ⏸️ Cache Redis pour hot data

## 📚 Ressources

- [PostgreSQL Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html)
- [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Query Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/postgres)
