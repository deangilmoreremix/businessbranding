import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if values are valid (not placeholder or missing)
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  if (url === 'your_supabase_url') return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  if (!key) return false;
  if (key === 'your_supabase_anon_key') return false;
  return true;
};

// Initialize with demo mode if environment variables are missing or invalid
const isDemoMode = !isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey);

// Create a client with safeguards for demo mode
let supabase: any;

if (isDemoMode) {
  // Create a mock client that returns demo data and never throws network errors
  supabase = {
    from: (table: string) => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    }),
    rpc: (fnName: string, params: any) => Promise.resolve({ data: null, error: null })
  };
} else {
  // Create real client
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    // Fallback to demo mode if client creation fails
    supabase = {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null })
        })
      }),
      rpc: (fnName: string, params: any) => Promise.resolve({ data: null, error: null })
    };
  }
}

export { supabase, isDemoMode };

// Add demo mode warning
if (isDemoMode) {
  console.warn('Running in demo mode - Supabase connection not available');
} else {
  console.log('Supabase connection established successfully.');
}

export type ContentItem = {
  id: string;
  title: string;
  type: 'podcast' | 'audiobook' | 'video' | 'voice_over';
  url: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type VoiceProfile = {
  id: string;
  name: string;
  voice_id: string;
  settings: Record<string, any>;
  created_at: string;
  user_id: string;
};

export type ImageAsset = {
  id: string;
  title: string;
  url: string;
  prompt?: string;
  style?: string;
  source?: 'openai' | 'upload' | 'other';
  tags?: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
};

// ---- data access: the signed-in user's own rows (RLS enforces ownership) -------------------------------------------
// No sample rows are ever fabricated here. Without a configured Supabase project the lists are empty; a failed read or write
// throws a DataError so the UI can say so instead of pretending something was saved.

export class DataError extends Error {
  constructor(message: string, public code: 'NOT_CONFIGURED' | 'NOT_SIGNED_IN' | 'FAILED' = 'FAILED') {
    super(message);
    this.name = 'DataError';
  }
}

type Table = 'content_items' | 'voice_profiles' | 'image_assets';

// The signed-in session lives in the cookie created by AuthProvider (auth-helpers), so data calls use that same client.
// (The plain `supabase` export above has its own, separate storage and would always look signed out.)
async function sessionClient(): Promise<any> {
  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
  return createClientComponentClient();
}

async function currentUser(): Promise<{ client: any; id: string }> {
  if (isDemoMode) throw new DataError('Saving needs a connected Supabase project.', 'NOT_CONFIGURED');
  const client = await sessionClient();
  const { data } = await client.auth.getUser().catch(() => ({ data: null as any }));
  const id = data?.user?.id;
  if (!id) throw new DataError('Sign in to save your work.', 'NOT_SIGNED_IN');
  return { client, id };
}

async function listRows<T>(table: Table): Promise<T[]> {
  if (isDemoMode) return [];
  const client = await sessionClient();
  const { data: auth } = await client.auth.getUser().catch(() => ({ data: null as any }));
  if (!auth?.user) return []; // signed out: nothing is theirs to show
  const { data, error } = await client.from(table).select('*').order('created_at', { ascending: false });
  if (error) throw new DataError(`Could not load your saved items (${error.message}).`);
  return (data ?? []) as T[];
}

async function insertRow<T>(table: Table, row: Record<string, unknown>): Promise<T> {
  const { client, id: user_id } = await currentUser();
  const { data, error } = await client.from(table).insert([{ ...row, user_id }]).select().single();
  if (error) throw new DataError(`Could not save (${error.message}).`);
  return data as T;
}

async function deleteRow(table: Table, id: string): Promise<void> {
  const { client } = await currentUser();
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) throw new DataError(`Could not delete (${error.message}).`);
}

export const getContentItems = () => listRows<ContentItem>('content_items');
export const getVoiceProfiles = () => listRows<VoiceProfile>('voice_profiles');
export const getImageAssets = () => listRows<ImageAsset>('image_assets');

type NewRow<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id?: string };
export const createContentItem = (item: NewRow<ContentItem>) => insertRow<ContentItem>('content_items', item);
export const createVoiceProfile = (profile: Omit<NewRow<VoiceProfile>, 'updated_at'>) => insertRow<VoiceProfile>('voice_profiles', profile);
export const createImageAsset = (asset: NewRow<ImageAsset>) => insertRow<ImageAsset>('image_assets', asset);
export const deleteContentItem = (id: string) => deleteRow('content_items', id);
export const deleteVoiceProfile = (id: string) => deleteRow('voice_profiles', id);
export const deleteImageAsset = (id: string) => deleteRow('image_assets', id);

/** Check whether the required tables exist (admin/diagnostic use). */
export async function checkRequiredTables() {
  const all = ['content_items', 'voice_profiles', 'image_assets'];
  if (isDemoMode) return { exists: false, missingTables: all, error: 'Supabase is not configured' };
  const checks = await Promise.all(all.map((t) => supabase.from(t).select('id').limit(1)));
  const missingTables = all.filter((_, i) => checks[i].error);
  return { exists: missingTables.length === 0, missingTables };
}
