import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error('Missing Vaultify mobile Supabase configuration');
}

const CHUNK_SIZE = 1800;
const manifestKey = (key: string) => `vaultify:ss:${key}:manifest`;
const chunkKey = (key: string, index: number) => `vaultify:ss:${key}:${index}`;

async function removeChunks(key: string) {
  const raw = await SecureStore.getItemAsync(manifestKey(key));
  const count = Number(raw || 0);
  for (let i = 0; i < count; i += 1) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
  await SecureStore.deleteItemAsync(manifestKey(key));
}

const secureStorage = {
  async getItem(key: string) {
    const raw = await SecureStore.getItemAsync(manifestKey(key));
    const count = Number(raw || 0);
    if (!count) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i)))
    );
    if (chunks.some((x) => x == null)) return null;
    return chunks.join('');
  },
  async setItem(key: string, value: string) {
    await removeChunks(key);
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) || [''];
    for (let i = 0; i < chunks.length; i += 1) {
      await SecureStore.setItemAsync(chunkKey(key, i), chunks[i], {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    await SecureStore.setItemAsync(manifestKey(key), String(chunks.length), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key: string) {
    await removeChunks(key);
  },
};

export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: secureStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
