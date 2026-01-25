import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface TripOption {
  id: string;
  trip_id: string;
  name: string;
  price: number;
  features: string[];
  available_spots: number | null;
  created_at: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  duration: string;
  image_url: string | null;
  min_price: number;
  max_price: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  trip_options?: TripOption[];
}

/**
 * Hook pour récupérer tous les voyages publiés
 * Cache pendant 10 minutes
 */
export function useTrips(): UseQueryResult<Trip[], Error> {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_options (*)
        `)
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) {
        throw new Error(`Erreur lors du chargement des voyages: ${error.message}`);
      }

      return data as Trip[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer un voyage par ID avec ses options
 * @param tripId ID du voyage
 */
export function useTrip(tripId: string): UseQueryResult<Trip | null, Error> {
  return useQuery({
    queryKey: ['trips', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_options (*)
        `)
        .eq('id', tripId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Voyage non trouvé
        }
        throw new Error(`Erreur lors du chargement du voyage: ${error.message}`);
      }

      return data as Trip;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!tripId,
  });
}

/**
 * Hook pour récupérer les options d'un voyage
 * @param tripId ID du voyage
 */
export function useTripOptions(tripId: string): UseQueryResult<TripOption[], Error> {
  return useQuery({
    queryKey: ['trips', tripId, 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_options')
        .select('*')
        .eq('trip_id', tripId)
        .order('price', { ascending: true });

      if (error) {
        throw new Error(`Erreur lors du chargement des options: ${error.message}`);
      }

      return data as TripOption[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!tripId,
  });
}

/**
 * Hook pour récupérer les statistiques des voyages
 */
export function useTripsStats(): UseQueryResult<{ total: number; upcoming: number }, Error> {
  return useQuery({
    queryKey: ['trips', 'stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Voyages publiés à venir
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .gte('start_date', today);

      if (upcomingError) {
        throw new Error(`Erreur lors du comptage des voyages: ${upcomingError.message}`);
      }

      // Total des voyages publiés
      const { count: totalCount, error: totalError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      if (totalError) {
        throw new Error(`Erreur lors du comptage total: ${totalError.message}`);
      }

      return {
        total: totalCount || 0,
        upcoming: upcomingCount || 0,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
