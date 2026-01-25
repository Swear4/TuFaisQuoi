# Gestion des Transactions de Paiement

## 🎫 Problématiques Critiques

### Scénarios catastrophes à éviter

#### 1. **Double charge** (overbooking financier)
```
User A et User B achètent simultanément le dernier billet
→ Les 2 paiements passent ✓
→ Les 2 sont débités 💰💰
→ Mais seulement 1 place disponible
→ Remboursement obligatoire + mécontentement
```

#### 2. **Paiement OK mais pas d'inscription** (perte sèche)
```
1. Stripe débite le user ✓
2. Crash serveur / timeout réseau ⚠️
3. Pas d'INSERT dans event_registrations
→ User payé mais pas inscrit
→ Litige, SAV, galère
```

#### 3. **Inscription OK mais pas de paiement** (fraude)
```
1. INSERT event_registrations ✓
2. API Stripe timeout/échec
→ User inscrit mais pas payé
→ Perte de revenu
```

#### 4. **Remboursement frauduleux**
```
User demande remboursement après l'événement
→ Comment prouver qu'il était bien inscrit ?
→ Double remboursement si pas bien tracé
```

## 🔐 Architecture Transactionnelle Sécurisée

### 1. Table `orders` (commandes)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence
  event_id UUID REFERENCES events(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Montant
  amount DECIMAL(10, 2) NOT NULL, -- En euros (ex: 25.00)
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  
  -- Paiement Stripe
  stripe_payment_intent_id VARCHAR(255) UNIQUE, -- Intent ID de Stripe
  stripe_charge_id VARCHAR(255), -- Charge ID après succès
  
  -- État de la commande (machine à états)
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: En attente paiement
  -- processing: Paiement en cours
  -- completed: Payé et inscrit
  -- failed: Échec paiement
  -- refunded: Remboursé
  -- cancelled: Annulé
  
  -- Idempotence (éviter doubles créations)
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  
  -- Métadonnées
  metadata JSONB, -- Infos supplémentaires (nom billet, etc.)
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- Quand le paiement est finalisé
  refunded_at TIMESTAMPTZ -- Quand le remboursement est fait
);

-- Index critiques
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_event ON orders(event_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe_intent ON orders(stripe_payment_intent_id);
CREATE INDEX idx_orders_idempotency ON orders(idempotency_key);

-- Contraintes
ALTER TABLE orders
ADD CONSTRAINT check_amount_positive CHECK (amount > 0);

ALTER TABLE orders
ADD CONSTRAINT check_status_valid CHECK (
  status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')
);
```

### 2. Fonction de création de commande (IDEMPOTENTE)

```sql
CREATE OR REPLACE FUNCTION create_order_safe(
  p_event_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_idempotency_key VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_order_id UUID;
  v_existing_order orders;
  v_event events;
  v_already_registered BOOLEAN;
BEGIN
  -- 1. Vérifier idempotence (si déjà créée, retourner l'existante)
  SELECT * INTO v_existing_order
  FROM orders
  WHERE idempotency_key = p_idempotency_key;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'order_id', v_existing_order.id,
      'status', v_existing_order.status,
      'is_duplicate', true
    );
  END IF;
  
  -- 2. Verrouiller l'événement
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE; -- LOCK pessimiste
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND'
    );
  END IF;
  
  -- 3. Vérifier capacité
  IF v_event.capacity IS NOT NULL AND 
     v_event.participants_count >= v_event.capacity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'Événement complet'
    );
  END IF;
  
  -- 4. Vérifier si déjà inscrit (éviter double achat)
  SELECT EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id
  ) INTO v_already_registered;
  
  IF v_already_registered THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_REGISTERED',
      'message', 'Déjà inscrit à cet événement'
    );
  END IF;
  
  -- 5. Créer la commande (état pending)
  INSERT INTO orders (
    event_id,
    user_id,
    amount,
    status,
    idempotency_key
  ) VALUES (
    p_event_id,
    p_user_id,
    p_amount,
    'pending',
    p_idempotency_key
  )
  RETURNING id INTO v_order_id;
  
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'status', 'pending',
    'is_duplicate', false
  );
  
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
```

### 3. Fonction de finalisation (après paiement Stripe)

```sql
CREATE OR REPLACE FUNCTION complete_order(
  p_order_id UUID,
  p_stripe_charge_id VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_order orders;
  v_registration_id UUID;
BEGIN
  -- 1. Verrouiller la commande
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;
  
  -- 2. Vérifier l'état (éviter double finalisation)
  IF v_order.status = 'completed' THEN
    RETURN json_build_object(
      'success', true,
      'already_completed', true,
      'message', 'Commande déjà finalisée'
    );
  END IF;
  
  IF v_order.status != 'processing' AND v_order.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'message', 'Statut invalide: ' || v_order.status
    );
  END IF;
  
  -- 3. Créer l'inscription
  INSERT INTO event_registrations (event_id, user_id, created_at)
  VALUES (v_order.event_id, v_order.user_id, NOW())
  ON CONFLICT (event_id, user_id) DO NOTHING -- Idempotence
  RETURNING id INTO v_registration_id;
  
  -- 4. Mettre à jour la commande
  UPDATE orders
  SET 
    status = 'completed',
    stripe_charge_id = p_stripe_charge_id,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- 5. Le trigger increment_event_participants se déclenche automatiquement
  
  RETURN json_build_object(
    'success', true,
    'order_id', p_order_id,
    'registration_id', v_registration_id,
    'status', 'completed'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automatique
    RETURN json_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
```

## 🔄 Flow Complet de Paiement

### Étape 1 : Création de commande (frontend)

```typescript
// src/services/paymentsService.ts

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function createOrder(
  eventId: string,
  userId: string,
  amount: number
) {
  // Générer clé d'idempotence (unique par tentative)
  const idempotencyKey = uuidv4();
  
  // Créer commande en DB (avec lock)
  const { data, error } = await supabase.rpc('create_order_safe', {
    p_event_id: eventId,
    p_user_id: userId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
  });
  
  if (error || !data.success) {
    throw new Error(data.error || 'Erreur création commande');
  }
  
  return {
    orderId: data.order_id,
    isDuplicate: data.is_duplicate,
  };
}
```

### Étape 2 : Créer Payment Intent Stripe

```typescript
// Backend (Edge Function Supabase ou API Node.js)

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(orderId: string) {
  // Récupérer commande
  const { data: order } = await supabase
    .from('orders')
    .select('*, events(title)')
    .eq('id', orderId)
    .single();
    
  if (!order || order.status !== 'pending') {
    throw new Error('Commande invalide');
  }
  
  // Créer Payment Intent Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.amount * 100), // Centimes
    currency: 'eur',
    metadata: {
      order_id: orderId,
      event_id: order.event_id,
      user_id: order.user_id,
    },
    idempotency_key: order.idempotency_key, // Idempotence Stripe
  });
  
  // Mettre à jour commande avec Intent ID
  await supabase
    .from('orders')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      status: 'processing',
    })
    .eq('id', orderId);
  
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}
```

### Étape 3 : Frontend - Paiement Stripe

```typescript
// src/screens/CheckoutScreen.tsx

import { useStripe, useConfirmPayment } from '@stripe/stripe-react-native';

export default function CheckoutScreen() {
  const { confirmPayment } = useConfirmPayment();
  
  const handlePayment = async () => {
    // 1. Créer commande
    const { orderId } = await createOrder(eventId, userId, 25.00);
    
    // 2. Créer Payment Intent
    const { clientSecret } = await fetch('/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }).then(r => r.json());
    
    // 3. Confirmer paiement
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });
    
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    
    if (paymentIntent.status === 'Succeeded') {
      // 4. Finaliser commande
      await completeOrder(orderId, paymentIntent.id);
      navigation.navigate('OrderConfirmation', { orderId });
    }
  };
}
```

### Étape 4 : Webhook Stripe (sécurisé)

```typescript
// Backend - Webhook endpoint

import { createHmac } from 'crypto';

export async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Vérifier signature (CRITIQUE pour sécurité)
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Traiter événement
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.order_id;
      
      // Finaliser commande (idempotent)
      await supabase.rpc('complete_order', {
        p_order_id: orderId,
        p_stripe_charge_id: paymentIntent.id,
      });
      break;
      
    case 'payment_intent.payment_failed':
      // Marquer commande en échec
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', paymentIntent.id);
      break;
      
    case 'charge.refunded':
      // Gérer remboursement
      const charge = event.data.object;
      await handleRefund(charge);
      break;
  }
  
  res.json({ received: true });
}
```

### Étape 5 : Réconciliation automatique

```sql
-- Cron job quotidien : vérifier cohérence
CREATE OR REPLACE FUNCTION reconcile_payments()
RETURNS void AS $$
BEGIN
  -- Marquer comme failed les commandes bloquées en processing > 1h
  UPDATE orders
  SET status = 'failed'
  WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '1 hour';
    
  -- Alerter sur inscriptions sans paiement
  -- (Cas où INSERT registration OK mais pas de commande)
  SELECT 
    r.id,
    r.user_id,
    r.event_id
  FROM event_registrations r
  LEFT JOIN orders o ON o.event_id = r.event_id 
    AND o.user_id = r.user_id 
    AND o.status = 'completed'
  WHERE o.id IS NULL
    AND r.created_at > NOW() - INTERVAL '24 hours';
    -- → Envoyer alerte admin
END;
$$ LANGUAGE plpgsql;
```

## 🛡️ Sécurité Additionnelle

### 1. Rate Limiting
```typescript
// Éviter spam de tentatives de paiement
const attempts = await redis.incr(`payment_attempts:${userId}:${eventId}`);
if (attempts > 5) {
  throw new Error('Trop de tentatives, réessayez dans 15 minutes');
}
await redis.expire(`payment_attempts:${userId}:${eventId}`, 900); // 15min
```

### 2. Vérification 3D Secure
```typescript
// Stripe Payment Intent avec SCA (Strong Customer Authentication)
const paymentIntent = await stripe.paymentIntents.create({
  // ...
  payment_method_options: {
    card: {
      request_three_d_secure: 'automatic', // Force 3DS si nécessaire
    },
  },
});
```

### 3. Logs d'audit
```sql
CREATE TABLE payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'completed', 'refunded'
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger automatique
CREATE TRIGGER audit_orders
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_change();
```

## 📊 Dashboard de Monitoring

### Métriques critiques à suivre

```sql
-- Taux de conversion (commandes → paiement)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as conversion_rate
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Revenu par événement
SELECT 
  e.title,
  COUNT(o.id) as total_sales,
  SUM(o.amount) as revenue
FROM orders o
JOIN events e ON e.id = o.event_id
WHERE o.status = 'completed'
GROUP BY e.id, e.title
ORDER BY revenue DESC;

-- Transactions suspectes (à investiguer)
SELECT *
FROM orders
WHERE 
  status = 'processing' 
  AND created_at < NOW() - INTERVAL '1 hour'
  OR (status = 'completed' AND completed_at IS NULL)
  OR (stripe_charge_id IS NULL AND status = 'completed');
```

## 🚨 Checklist de Déploiement

Avant de lancer la billetterie payante :

- [ ] Exécuter migration SQL (tables orders, audit_logs)
- [ ] Configurer Stripe (clés API, webhooks)
- [ ] Tester mode Stripe Test avec cartes test
- [ ] Implémenter idempotency_key partout
- [ ] Configurer alertes (transactions bloquées > 1h)
- [ ] Tester remboursements end-to-end
- [ ] Vérifier RLS policies sur table orders
- [ ] Load test : 100 users achètent 1 dernier billet simultanément
- [ ] Documentation SAV (process remboursement)
- [ ] Monitoring Stripe webhook delivery

## 🎯 Résumé des Protections

| Problème | Solution |
|----------|----------|
| Race condition capacité | `SELECT FOR UPDATE` sur events |
| Double création commande | `idempotency_key UNIQUE` |
| Paiement OK, pas d'inscription | Webhook Stripe → `complete_order()` |
| Inscription OK, pas de paiement | Réconciliation quotidienne + alertes |
| Double remboursement | Check status dans refund function |
| Fraude carte | 3D Secure automatique |
| Spam tentatives | Rate limiting Redis |
| Perte de logs | Audit trail immutable |

**Niveau d'isolation recommandé** : `READ COMMITTED` + `SELECT FOR UPDATE`
**Journalisation** : WAL + audit_logs custom
**Réconciliation** : Cron quotidien + alertes temps réel
