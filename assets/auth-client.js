import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './auth-config.js';

export const authConfigured = SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('YOUR_PROJECT') && !SUPABASE_PUBLISHABLE_KEY.startsWith('YOUR_');

let clientPromise;
export function getClient() {
  if (!authConfigured) return Promise.resolve(null);
  if (!clientPromise) clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
  return clientPromise;
}
