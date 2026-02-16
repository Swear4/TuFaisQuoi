import { supabase } from '../lib/supabase';

export interface CarpoolRequest {
  id: string;
  event_id: string;
  requester_id: string;
  departure_location: string;
  departure_time: string;
  seats_needed: number;
  notes: string | null;
  status: 'open' | 'matched' | 'closed';
  created_at: string;
  requester_name?: string;
  requester_avatar?: string | null;
}

export interface CarpoolInvitation {
  id: string;
  event_id: string;
  carpool_id: string;
  request_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  from_user_name?: string;
  to_user_name?: string;
}

export async function fetchCarpoolRequestsByEvent(eventId: string): Promise<CarpoolRequest[]> {
  const { data, error } = await supabase
    .from('carpool_requests')
    .select(
      `
      *,
      users:requester_id (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq('event_id', eventId)
    .eq('status', 'open')
    .order('departure_time', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors du chargement des demandes: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    ...row,
    requester_name: row.users?.name,
    requester_avatar: row.users?.avatar_url ?? null,
  })) as CarpoolRequest[];
}

export async function createCarpoolRequest(payload: {
  event_id: string;
  requester_id: string;
  departure_location: string;
  departure_time: string; // ISO
  seats_needed: number;
  notes?: string;
}): Promise<CarpoolRequest> {
  const { data, error } = await supabase
    .from('carpool_requests')
    .insert({
      ...payload,
      status: 'open',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de la demande: ${error.message}`);
  }

  return data as CarpoolRequest;
}

export async function fetchInvitationsForUser(eventId: string, userId: string): Promise<CarpoolInvitation[]> {
  const { data, error } = await supabase
    .from('carpool_invitations')
    .select(
      `
      *,
      from_user:users!carpool_invitations_from_user_id_fkey (
        id,
        name
      ),
      to_user:users!carpool_invitations_to_user_id_fkey (
        id,
        name
      )
    `
    )
    .eq('event_id', eventId)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors du chargement des invitations: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    ...row,
    from_user_name: row.from_user?.name,
    to_user_name: row.to_user?.name,
  })) as CarpoolInvitation[];
}

export async function createCarpoolInvitation(payload: {
  event_id: string;
  carpool_id: string;
  request_id: string;
  from_user_id: string;
  to_user_id: string;
}): Promise<CarpoolInvitation> {
  const { data, error } = await supabase
    .from('carpool_invitations')
    .insert({
      ...payload,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de l'envoi de l'invitation: ${error.message}`);
  }

  return data as CarpoolInvitation;
}

export async function respondToCarpoolInvitation(invitationId: string, status: 'accepted' | 'declined') {
  const { data, error } = await supabase
    .from('carpool_invitations')
    .update({ status })
    .eq('id', invitationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la réponse: ${error.message}`);
  }

  return data as CarpoolInvitation;
}

export async function markRequestMatched(requestId: string) {
  const { error } = await supabase
    .from('carpool_requests')
    .update({ status: 'matched' })
    .eq('id', requestId);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la demande: ${error.message}`);
  }
}
