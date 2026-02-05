/**
 * Service d'authentification
 * Gère toutes les opérations liées à l'authentification avec Supabase
 */

import { supabase } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  bio?: string;
}

/**
 * Créer un nouveau compte utilisateur
 */
export async function signUp({ email, password, fullName }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { data: null, error };

    // Créer le profil dans la table users
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Erreur création profil:', profileError);
        return { data, error: profileError };
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Se connecter avec email et mot de passe
 */
export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Se déconnecter
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
}

/**
 * Récupérer la session actuelle
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    return { session: null, error };
  }
}

/**
 * Mettre à jour le profil utilisateur
 */
export async function updateProfile(userId: string, updates: UpdateProfileData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Récupérer le profil utilisateur
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Réinitialiser le mot de passe
 */
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'eventhub://reset-password',
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
