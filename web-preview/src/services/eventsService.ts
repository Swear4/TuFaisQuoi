/**
 * Service Events
 * Gère toutes les requêtes liées aux événements
 */

import { supabase } from '../lib/supabase';
import { Event } from '../types';

/**
 * Récupérer tous les événements
 * Filtre les événements masqués et affiche les complets séparément
 */
export async function fetchEvents(limit?: number, includeHidden: boolean = false) {
  const query = supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  // Ne pas afficher les événements masqués dans les listes publiques
  if (!includeHidden) {
    query.eq('is_hidden', false);
  }

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors du chargement des événements: ${error.message}`);
  }

  return data as Event[];
}

/**
 * Récupérer les événements par catégorie
 */
export async function fetchEventsByCategory(category: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .eq('is_hidden', false)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors du chargement des événements: ${error.message}`);
  }

  return data as Event[];
}

/**
 * Récupérer les événements populaires (nombre de participants)
 */
export async function fetchPopularEvents(limit: number = 5) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('participants_count', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erreur lors du chargement des événements populaires: ${error.message}`);
  }

  return data as Event[];
}

/**
 * Récupérer un événement par son ID
 */
export async function fetchEventById(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    throw new Error(`Erreur lors du chargement de l'événement: ${error.message}`);
  }

  return data as Event;
}

/**
 * Récupérer les statistiques des événements
 */
export async function fetchEventsStats() {
  const { count: upcomingCount, error: upcomingError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('date', new Date().toISOString());

  if (upcomingError) {
    throw new Error(`Erreur stats: ${upcomingError.message}`);
  }

  const { count: totalCount, error: totalError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(`Erreur stats: ${totalError.message}`);
  }

  return {
    total: totalCount || 0,
    upcoming: upcomingCount || 0,
  };
}

/**
 * Récupérer les événements auxquels un utilisateur est inscrit
 */
export async function fetchUserEvents(userId: string, limit: number = 10) {
  // Use explicit alias events:events!event_id or just verify the relation
  // Since we already saw it working somewhat, we can just ensure we select properly
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      created_at,
      events:event_id ( * )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchUserEvents Error:', error);
    throw new Error(`Erreur lors du chargement des événements: ${error.message}`);
  }

  // Filtrer les événements nuls et à venir
  // Note: On pourrait filtrer directement dans la requête supabase par le join, 
  // mais Supabase join filters sont un peu tricky parfois.
  const now = new Date().toISOString();
  
  const events = (data || [])
    .map((reg: any) => reg.events)
    .filter((event: any) => !!event); // Filter out nulls first

  // Optionnel: filtrer uniquement ceux à venir si voulu.
  // Pour l'instant on retourne tout pour debug facile dans le profil
  return events as Event[];
}

/**
 * Récupérer les statistiques d'un utilisateur
 */
export async function fetchUserStats(userId: string) {
  // Événements rejoints
  const { count: joinedCount } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Événements créés
  const { count: createdCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', userId);

  // Covoiturages
  const { count: carpoolCount } = await supabase
    .from('carpools')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', userId);

  return {
    eventsJoined: joinedCount || 0,
    eventsCreated: createdCount || 0,
    carpools: carpoolCount || 0,
  };
}

/**
 * Créer un nouvel événement
 */
export async function createEvent(eventData: Partial<Event>, organizerId: string) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      organizer_id: organizerId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de l'événement: ${error.message}`);
  }

  return data as Event;
}

/**
 * Mettre à jour un événement
 */
export async function updateEvent(eventId: string, updates: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de l'événement: ${error.message}`);
  }

  return data as Event;
}

/**
 * Supprimer un événement
 */
export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw new Error(`Erreur lors de la suppression de l'événement: ${error.message}`);
  }
}

/**
 * S'inscrire à un événement (VERSION SÉCURISÉE avec gestion de concurrence)
 * Utilise une fonction PostgreSQL avec SELECT FOR UPDATE pour éviter les race conditions
 */
export async function registerToEvent(eventId: string, userId: string) {
  // Appeler la fonction PostgreSQL sécurisée qui gère le verrouillage
  const { data, error } = await supabase
    .rpc('register_to_event_safe', {
      p_event_id: eventId,
      p_user_id: userId,
    });

  if (error) {
    throw new Error(`Erreur lors de l'inscription: ${error.message}`);
  }

  // La fonction retourne un objet JSON avec le résultat
  if (!data.success) {
    if (data.error === 'EVENT_FULL') {
      throw new Error('Cet événement est complet');
    } else if (data.error === 'ALREADY_REGISTERED') {
      throw new Error('Vous êtes déjà inscrit à cet événement');
    }
    throw new Error(data.message || 'Erreur lors de l\'inscription');
  }

  return data;
}

/**
 * Se désinscrire d'un événement
 */
export async function unregisterFromEvent(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Erreur lors de la désinscription: ${error.message}`);
  }
}

/**
 * Récupérer les événements créés par un utilisateur
 */
export async function fetchUserCreatedEvents(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', userId)
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Erreur lors du chargement des événements créés: ${error.message}`);
  }

  return data as Event[];
}

/**
 * Masquer ou afficher un événement
 */
export async function toggleEventVisibility(eventId: string, isHidden: boolean) {
  const { error } = await supabase
    .from('events')
    .update({ is_hidden: isHidden })
    .eq('id', eventId);

  if (error) {
    throw new Error(`Erreur lors de la modification de la visibilité: ${error.message}`);
  }
}

/**
 * Vérifier si un événement est complet
 */
export function isEventFull(event: Event): boolean {
  if (!event.capacity) return false;
  return event.participants_count >= event.capacity;
}
