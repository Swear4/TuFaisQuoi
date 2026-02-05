import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import * as carpoolsService from '../services/carpoolsService';
import { Carpool, CarpoolPassenger } from '../services/carpoolsService';

/**
 * Hook pour récupérer les covoiturages d'un événement
 */
export function useCarpoolsByEvent(eventId: string | null): UseQueryResult<Carpool[], Error> {
  return useQuery({
    queryKey: ['carpools', 'event', eventId],
    queryFn: () => eventId ? carpoolsService.fetchCarpoolsByEvent(eventId) : Promise.resolve([]),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    enabled: !!eventId,
  });
}

/**
 * Hook pour récupérer les passagers d'un covoiturage
 */
export function useCarpoolPassengers(carpoolId: string | null): UseQueryResult<CarpoolPassenger[], Error> {
  return useQuery({
    queryKey: ['carpool-passengers', carpoolId],
    queryFn: () => carpoolId ? carpoolsService.fetchCarpoolPassengers(carpoolId) : Promise.resolve([]),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!carpoolId,
  });
}

/**
 * Hook pour vérifier si l'utilisateur a rejoint un covoiturage
 */
export function useIsUserInCarpool(carpoolId: string | null, userId: string | null): UseQueryResult<boolean, Error> {
  return useQuery({
    queryKey: ['carpool-membership', carpoolId, userId],
    queryFn: () => {
      if (!carpoolId || !userId) return Promise.resolve(false);
      return carpoolsService.isUserInCarpool(carpoolId, userId);
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
    enabled: !!carpoolId && !!userId,
  });
}

/**
 * Hook pour créer un covoiturage
 */
export function useCreateCarpool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: carpoolsService.createCarpool,
    onSuccess: (_, variables) => {
      // Invalider les covoiturages de l'événement
      queryClient.invalidateQueries({ queryKey: ['carpools', 'event', variables.event_id] });
    },
  });
}

/**
 * Hook pour rejoindre un covoiturage
 */
export function useJoinCarpool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ carpoolId, userId, seatsReserved }: { carpoolId: string; userId: string; seatsReserved?: number }) => 
      carpoolsService.joinCarpool(carpoolId, userId, seatsReserved),
    onSuccess: (_, variables) => {
      // Invalider les queries pertinentes
      queryClient.invalidateQueries({ queryKey: ['carpools'] });
      queryClient.invalidateQueries({ queryKey: ['carpool-passengers', variables.carpoolId] });
      queryClient.invalidateQueries({ queryKey: ['carpool-membership', variables.carpoolId, variables.userId] });
    },
  });
}

/**
 * Hook pour quitter un covoiturage
 */
export function useLeaveCarpool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ carpoolId, userId }: { carpoolId: string; userId: string }) => 
      carpoolsService.leaveCarpool(carpoolId, userId),
    onSuccess: (_, variables) => {
      // Invalider les queries pertinentes
      queryClient.invalidateQueries({ queryKey: ['carpools'] });
      queryClient.invalidateQueries({ queryKey: ['carpool-passengers', variables.carpoolId] });
      queryClient.invalidateQueries({ queryKey: ['carpool-membership', variables.carpoolId, variables.userId] });
    },
  });
}
