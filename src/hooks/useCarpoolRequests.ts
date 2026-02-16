import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import * as carpoolRequestsService from '../services/carpoolRequestsService';
import { CarpoolInvitation, CarpoolRequest } from '../services/carpoolRequestsService';

export function useCarpoolRequestsByEvent(eventId: string | null): UseQueryResult<CarpoolRequest[], Error> {
  return useQuery({
    queryKey: ['carpool-requests', 'event', eventId],
    queryFn: () => (eventId ? carpoolRequestsService.fetchCarpoolRequestsByEvent(eventId) : Promise.resolve([])),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!eventId,
  });
}

export function useCreateCarpoolRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: carpoolRequestsService.createCarpoolRequest,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carpool-requests', 'event', variables.event_id] });
    },
  });
}

export function useInvitationsForUser(eventId: string | null, userId: string | null): UseQueryResult<CarpoolInvitation[], Error> {
  return useQuery({
    queryKey: ['carpool-invitations', 'event', eventId, 'to', userId],
    queryFn: () => {
      if (!eventId || !userId) return Promise.resolve([]);
      return carpoolRequestsService.fetchInvitationsForUser(eventId, userId);
    },
    staleTime: 30 * 1000,
    gcTime: 3 * 60 * 1000,
    enabled: !!eventId && !!userId,
  });
}

export function useCreateCarpoolInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: carpoolRequestsService.createCarpoolInvitation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carpool-invitations', 'event', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['carpool-requests', 'event', variables.event_id] });
    },
  });
}

export function useRespondToCarpoolInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: string; status: 'accepted' | 'declined' }) =>
      carpoolRequestsService.respondToCarpoolInvitation(invitationId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['carpool-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['carpool-requests', 'event', data.event_id] });
    },
  });
}

export function useMarkRequestMatched() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId }: { requestId: string }) => carpoolRequestsService.markRequestMatched(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpool-requests'] });
    },
  });
}
