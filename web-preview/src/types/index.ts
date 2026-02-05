export type EventCategory = 
  | 'culturel'
  | 'concert'
  | 'sport'
  | 'nature'
  | 'gastronomie'
  | 'festival'
  | 'shopping'
  | 'nocturne'
  | 'famille'
  | 'bien-etre';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  participants_count: number;
  favorites_count: number;
  image_url: string | null;
  category: EventCategory;
  is_premium_only: boolean;
  is_hidden: boolean;
  organizer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Carpool {
  id: string;
  eventId: string;
  driverName: string;
  departureLocation: string;
  departureTime: Date;
  availableSeats: number;
  pricePerSeat?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscriptionType?: 'free' | 'premium';
}

export interface Message {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name?: string;
    avatar_url?: string;
  };
}
