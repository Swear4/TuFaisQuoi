import { useQuery, UseQueryResult } from '@tanstack/react-query';
import * as eventsService from '../services/eventsService';
import { Event } from '../types';

/**
 * Hook pour récupérer tous les événements à venir
 * Cache pendant 5 minutes
 */
export function useEvents(): UseQueryResult<Event[], Error> {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => eventsService.fetchEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  });
}

/**
 * Hook pour récupérer les événements par catégorie
 * @param category Catégorie à filtrer (null = tous)
 */
export function useEventsByCategory(
  category: string | null,
  enabled: boolean = true
): UseQueryResult<Event[], Error> {
  return useQuery({
    queryKey: ['events', 'category', category],
    queryFn: () => category ? eventsService.fetchEventsByCategory(category) : eventsService.fetchEvents(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled,
  });
}

/**
 * Hook pour récupérer les événements populaires (les plus remplis)
 * @param limit Nombre d'événements à retourner
 */
export function usePopularEvents(limit: number = 10): UseQueryResult<Event[], Error> {
  return useQuery({
    queryKey: ['events', 'popular', limit],
    queryFn: () => eventsService.fetchPopularEvents(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes pour les populaires
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer un événement par ID
 * @param eventId ID de l'événement
 */
export function useEvent(eventId: string | null): UseQueryResult<Event | null, Error> {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      try {
        return await eventsService.fetchEventById(eventId);
      } catch (error: any) {
        if (error.message.includes('not found')) return null;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!eventId, // Ne lance la requête que si eventId existe
  });
}

/**
 * Hook pour récupérer les statistiques des événements
 */
export function useEventsStats(): UseQueryResult<{ total: number; upcoming: number }, Error> {
  return useQuery({
    queryKey: ['events', 'stats'],
    queryFn: () => eventsService.fetchEventsStats(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer le nombre d'événements à venir par catégorie
 */
export function useUpcomingCountByCategory(category: string, enabled: boolean = true): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: ['events', 'count', 'upcoming', 'category', category],
    queryFn: () => eventsService.fetchUpcomingCountByCategory(category),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!category && enabled,
  });
}

/**
 * Hook pour récupérer les événements auxquels un utilisateur est inscrit
 * @param userId ID de l'utilisateur
 * @param limit Nombre d'événements à retourner
 */
export function useUserEvents(userId: string | null, limit: number = 10): UseQueryResult<Event[], Error> {
  return useQuery({
    queryKey: ['events', 'user', userId, limit],
    queryFn: () => userId ? eventsService.fetchUserEvents(userId, limit) : Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Hook pour récupérer les statistiques d'un utilisateur
 * @param userId ID de l'utilisateur
 */
export function useUserStats(userId: string | null): UseQueryResult<{
  eventsJoined: number;
  eventsCreated: number;
  carpools: number;
}, Error> {
  return useQuery({
    queryKey: ['stats', 'user', userId],
    queryFn: () => userId ? eventsService.fetchUserStats(userId) : Promise.resolve({ eventsJoined: 0, eventsCreated: 0, carpools: 0 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Hook pour récupérer les événements créés par un utilisateur
 * @param userId ID de l'utilisateur
 * @param limit Nombre d'événements à retourner
 */
export function useUserCreatedEvents(userId: string | null, limit: number = 10): UseQueryResult<Event[], Error> {
  return useQuery({
    queryKey: ['events', 'created', userId, limit],
    queryFn: () => userId ? eventsService.fetchUserCreatedEvents(userId, limit) : Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!userId,
  });
}
