/**
 * Service Trips/Voyages
 * Gère toutes les requêtes liées aux voyages
 */

import { supabase } from '../lib/supabase';

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  start_date: string;
  end_date: string;
  image_url?: string;
  organizer_id: string;
  created_at: string;
  updated_at?: string;
}

export interface TripOption {
  id: string;
  trip_id: string;
  name: string;
  description?: string;
  price: number;
  available_spots: number;
  created_at: string;
}

/**
 * Récupérer tous les voyages
 */
export async function fetchTrips(limit?: number) {
  const query = supabase
    .from('trips')
    .select('*')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors du chargement des voyages: ${error.message}`);
  }

  return data as Trip[];
}

/**
 * Récupérer un voyage par son ID
 */
export async function fetchTripById(tripId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) {
    throw new Error(`Erreur lors du chargement du voyage: ${error.message}`);
  }

  return data as Trip;
}

/**
 * Récupérer les options d'un voyage
 */
export async function fetchTripOptions(tripId: string) {
  const { data, error } = await supabase
    .from('trip_options')
    .select('*')
    .eq('trip_id', tripId)
    .order('price', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors du chargement des options: ${error.message}`);
  }

  return data as TripOption[];
}

/**
 * Récupérer les statistiques des voyages
 */
export async function fetchTripsStats() {
  const { count: upcomingCount, error: upcomingError } = await supabase
    .from('trips')
    .select('*', { count: 'exact', head: true })
    .gte('start_date', new Date().toISOString());

  if (upcomingError) {
    throw new Error(`Erreur stats: ${upcomingError.message}`);
  }

  const { count: totalCount, error: totalError } = await supabase
    .from('trips')
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
 * Créer un nouveau voyage
 */
export async function createTrip(tripData: Partial<Trip>, organizerId: string) {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      ...tripData,
      organizer_id: organizerId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création du voyage: ${error.message}`);
  }

  return data as Trip;
}

/**
 * Ajouter une option à un voyage
 */
export async function createTripOption(optionData: Partial<TripOption>) {
  const { data, error } = await supabase
    .from('trip_options')
    .insert({
      ...optionData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de l'option: ${error.message}`);
  }

  return data as TripOption;
}

/**
 * Réserver un voyage
 */
export async function bookTrip(tripId: string, userId: string, optionId: string) {
  const { data, error } = await supabase
    .from('trip_bookings')
    .insert({
      trip_id: tripId,
      user_id: userId,
      option_id: optionId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la réservation: ${error.message}`);
  }

  return data;
}
