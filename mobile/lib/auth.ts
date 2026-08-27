import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export const AUTH_CALLBACK = Linking.createURL('/auth/callback');

export async function sendMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('INVALID_EMAIL');
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: AUTH_CALLBACK,
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

export async function handleAuthCallback(url: string) {
  const parsed = Linking.parse(url);
  const query = parsed.queryParams || {};
  const code = typeof query.code === 'string' ? query.code : null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const tokenHash = typeof query.token_hash === 'string' ? query.token_hash : null;
  const type = typeof query.type === 'string' ? query.type : null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    });
    if (error) throw error;
    return true;
  }

  // Compatibility with implicit-style links if encountered.
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return true;
  }

  throw new Error('AUTH_CALLBACK_INVALID');
}
