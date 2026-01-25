/**
 * Service Carpools
 * Gère toutes les requêtes liées aux covoiturages
 */

import { supabase } from '../lib/supabase';

export interface Carpool {
  id: string;
  event_id: string;
  driver_id: string;
  departure_location: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  price_per_seat: number;
  notes: string | null;
  created_at: string;
  driver_name?: string;
  driver_avatar?: string;
}

export interface CarpoolPassenger {
  id: string;
  carpool_id: string;
  user_id: string;
  seats_reserved: number;
  created_at: string;
  user_name?: string;
}

/**
 * Récupérer les covoiturages pour un événement
 */
export async function fetchCarpoolsByEvent(eventId: string) {
  const { data, error } = await supabase
    .from('carpools')
    .select(`
      *,
      users:driver_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('event_id', eventId)
    .gte('departure_time', new Date().toISOString())
    .order('departure_time', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors du chargement des covoiturages: ${error.message}`);
  }

  return (data || []).map((carpool: any) => ({
    ...carpool,
    driver_name: carpool.users?.name,
    driver_avatar: carpool.users?.avatar_url,
  })) as Carpool[];
}

/**
 * Créer un covoiturage
 */
export async function createCarpool(carpoolData: {
  event_id: string;
  driver_id: string;
  departure_location: string;
  departure_time: string;
  total_seats: number;
  price_per_seat: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('carpools')
    .insert({
      ...carpoolData,
      available_seats: carpoolData.total_seats,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création du covoiturage: ${error.message}`);
  }

  return data as Carpool;
}

/**
 * Rejoindre un covoiturage
 */
export async function joinCarpool(carpoolId: string, userId: string, seatsReserved: number = 1) {
  // Vérifier si l'utilisateur n'est pas déjà inscrit
  const { data: existing } = await supabase
    .from('carpool_passengers')
    .select('id')
    .eq('carpool_id', carpoolId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('Vous êtes déjà inscrit à ce covoiturage');
  }

  // Récupérer le covoiturage pour vérifier les places disponibles
  const { data: carpool, error: carpoolError } = await supabase
    .from('carpools')
    .select('available_seats')
    .eq('id', carpoolId)
    .single();

  if (carpoolError) {
    throw new Error(`Erreur: ${carpoolError.message}`);
  }

  if (carpool.available_seats < seatsReserved) {
    throw new Error('Pas assez de places disponibles');
  }

  // Ajouter le passager
  const { data, error } = await supabase
    .from('carpool_passengers')
    .insert({
      carpool_id: carpoolId,
      user_id: userId,
      seats_reserved: seatsReserved,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de l'inscription: ${error.message}`);
  }

  // Mettre à jour les places disponibles
  await supabase
    .from('carpools')
    .update({ available_seats: carpool.available_seats - seatsReserved })
    .eq('id', carpoolId);

  return data as CarpoolPassenger;
}

/**
 * Quitter un covoiturage
 */
export async function leaveCarpool(carpoolId: string, userId: string) {
  // Récupérer le nombre de places réservées
  const { data: passenger, error: passengerError } = await supabase
    .from('carpool_passengers')
    .select('seats_reserved')
    .eq('carpool_id', carpoolId)
    .eq('user_id', userId)
    .single();

  if (passengerError) {
    throw new Error(`Erreur: ${passengerError.message}`);
  }

  // Supprimer le passager
  const { error: deleteError } = await supabase
    .from('carpool_passengers')
    .delete()
    .eq('carpool_id', carpoolId)
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Erreur lors du départ: ${deleteError.message}`);
  }

  // Récupérer le covoiturage pour mettre à jour les places
  const { data: carpool } = await supabase
    .from('carpools')
    .select('available_seats, total_seats')
    .eq('id', carpoolId)
    .single();

  if (carpool) {
    // Remettre les places disponibles
    await supabase
      .from('carpools')
      .update({ 
        available_seats: Math.min(carpool.total_seats, carpool.available_seats + passenger.seats_reserved)
      })
      .eq('id', carpoolId);
  }
}

/**
 * Récupérer les passagers d'un covoiturage
 */
export async function fetchCarpoolPassengers(carpoolId: string) {
  const { data, error } = await supabase
    .from('carpool_passengers')
    .select(`
      *,
      users:user_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('carpool_id', carpoolId);

  if (error) {
    throw new Error(`Erreur lors du chargement des passagers: ${error.message}`);
  }

  return (data || []).map((passenger: any) => ({
    ...passenger,
    user_name: passenger.users?.name,
  })) as CarpoolPassenger[];
}

/**
 * Vérifier si un utilisateur a rejoint un covoiturage
 */
export async function isUserInCarpool(carpoolId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('carpool_passengers')
    .select('id')
    .eq('carpool_id', carpoolId)
    .eq('user_id', userId)
    .single();

  return !!data;
}
