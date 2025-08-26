import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safely check if we're on the client side
const isClient = typeof window !== 'undefined';

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
let supabase;

// Define a mock client that returns demo data and never throws network errors
const createMockClient = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      order: (column: string, options?: any) => ({
        limit: (limit: number) => Promise.resolve({ data: [], error: null })
      }),
      limit: (limit: number) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: null })
    })
  }),
  rpc: (fnName: string, params: any) => Promise.resolve({ data: null, error: null })
});

try {
  if (isDemoMode) {
    // Use mock client in demo mode
    supabase = createMockClient();
    if (isClient) {
      console.warn('Running in demo mode - Supabase connection not available');
    }
  } else {
    // Create real client
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    if (isClient) {
      console.log('Supabase connection established successfully.');
    }
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Fallback to demo mode if client creation fails
  supabase = createMockClient();
}

export { supabase };

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
  source?: 'recraft' | 'upload' | 'other';
  tags?: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
};

// Demo data
const demoContentItems: ContentItem[] = [
  {
    id: '1',
    title: 'Demo Podcast',
    type: 'podcast',
    url: 'https://example.com/podcast.mp3',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo-user'
  },
  {
    id: '2',
    title: 'Demo Audiobook',
    type: 'audiobook',
    url: 'https://example.com/audiobook.mp3',
    metadata: {},
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'demo-user'
  }
];

const demoVoiceProfiles: VoiceProfile[] = [
  {
    id: '1',
    name: 'Demo Voice',
    voice_id: 'demo-voice-id',
    settings: {},
    created_at: new Date().toISOString(),
    user_id: 'demo-user'
  }
];

const demoImageAssets: ImageAsset[] = [
  {
    id: '1',
    title: 'Modern Brand Logo',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926',
    prompt: 'A modern, minimalist logo for a tech company with blue color scheme',
    style: 'digital-art',
    source: 'recraft',
    tags: ['logo', 'modern', 'tech'],
    metadata: {
      width: 1024,
      height: 1024,
      format: 'png'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo-user'
  },
  {
    id: '2',
    title: 'Brand Mascot Illustration',
    url: 'https://images.unsplash.com/photo-1557683311-eac922347aa1',
    prompt: 'A friendly cartoon fox mascot for a children education brand',
    style: 'comic-book',
    source: 'recraft',
    tags: ['mascot', 'illustration', 'character'],
    metadata: {
      width: 1024,
      height: 1024,
      format: 'png'
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'demo-user'
  },
  {
    id: '3',
    title: 'Brand Color Palette',
    url: 'https://images.unsplash.com/photo-1557683304-673a23048d34',
    prompt: 'A minimal, clean color palette with blue and green tones for a sustainable brand',
    style: 'flat-design',
    source: 'recraft',
    tags: ['colors', 'palette', 'branding'],
    metadata: {
      width: 1024,
      height: 1024,
      format: 'png'
    },
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: 'demo-user'
  }
];

export async function getContentItems() {
  // Always return demo data in demo mode
  if (isDemoMode) {
    return Promise.resolve([...demoContentItems]);
  }

  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching content items:', error.message);
      // Return demo data on any kind of error
      return [...demoContentItems];
    }
    
    return data as ContentItem[];
  } catch (error) {
    console.error('Error fetching content items:', error);
    // Return demo data on any kind of error
    return [...demoContentItems];
  }
}

export async function getVoiceProfiles() {
  // Always return demo data in demo mode
  if (isDemoMode) {
    return Promise.resolve([...demoVoiceProfiles]);
  }

  try {
    const { data, error } = await supabase
      .from('voice_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching voice profiles:', error.message);
      // Return demo data on any kind of error
      return [...demoVoiceProfiles];
    }
    
    return data as VoiceProfile[];
  } catch (error) {
    console.error('Error fetching voice profiles:', error);
    // Return demo data on any kind of error
    return [...demoVoiceProfiles];
  }
}

export async function getImageAssets() {
  // Always return demo data in demo mode
  if (isDemoMode) {
    return Promise.resolve([...demoImageAssets]);
  }

  try {
    const { data, error } = await supabase
      .from('image_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching image assets:', error.message);
      // Return demo data on any kind of error
      return [...demoImageAssets];
    }
    
    return data as ImageAsset[];
  } catch (error) {
    console.error('Error fetching image assets:', error);
    // Return demo data on any kind of error
    return [...demoImageAssets];
  }
}

export async function createContentItem(item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>) {
  if (isDemoMode) {
    const demoItem = {
      ...item,
      id: 'demo-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ContentItem;
    
    // Add to demo items if in demo mode
    demoContentItems.push(demoItem);
    return demoItem;
  }

  try {
    const { data, error } = await supabase
      .from('content_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.warn('Error creating content item:', error.message);
      // Create demo item on error
      const demoItem = {
        ...item,
        id: 'demo-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as ContentItem;
      
      return demoItem;
    }
    
    return data as ContentItem;
  } catch (error) {
    console.error('Error creating content item:', error);
    
    // Create demo item on error
    const demoItem = {
      ...item,
      id: 'demo-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ContentItem;
    
    return demoItem;
  }
}

export async function createVoiceProfile(profile: Omit<VoiceProfile, 'id' | 'created_at'>) {
  if (isDemoMode) {
    const demoProfile = {
      ...profile,
      id: 'demo-' + Date.now(),
      created_at: new Date().toISOString()
    } as VoiceProfile;
    
    // Add to demo profiles if in demo mode
    demoVoiceProfiles.push(demoProfile);
    return demoProfile;
  }

  try {
    const { data, error } = await supabase
      .from('voice_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.warn('Error creating voice profile:', error.message);
      // Create demo profile on error
      const demoProfile = {
        ...profile,
        id: 'demo-' + Date.now(),
        created_at: new Date().toISOString()
      } as VoiceProfile;
      
      return demoProfile;
    }
    
    return data as VoiceProfile;
  } catch (error) {
    console.error('Error creating voice profile:', error);
    
    // Create demo profile on error
    const demoProfile = {
      ...profile,
      id: 'demo-' + Date.now(),
      created_at: new Date().toISOString()
    } as VoiceProfile;
    
    return demoProfile;
  }
}

export async function createImageAsset(asset: Omit<ImageAsset, 'id' | 'created_at' | 'updated_at'>) {
  if (isDemoMode) {
    const demoAsset = {
      ...asset,
      id: 'demo-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ImageAsset;
    
    // Add to demo assets if in demo mode
    demoImageAssets.push(demoAsset);
    return demoAsset;
  }

  try {
    const { data, error } = await supabase
      .from('image_assets')
      .insert([asset])
      .select()
      .single();

    if (error) {
      console.warn('Error creating image asset:', error.message);
      // Create demo asset on error
      const demoAsset = {
        ...asset,
        id: 'demo-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as ImageAsset;
      
      return demoAsset;
    }
    
    return data as ImageAsset;
  } catch (error) {
    console.error('Error creating image asset:', error);
    
    // Create demo asset on error
    const demoAsset = {
      ...asset,
      id: 'demo-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ImageAsset;
    
    return demoAsset;
  }
}

export async function deleteContentItem(id: string) {
  if (isDemoMode) {
    // Remove from demo items if in demo mode
    const index = demoContentItems.findIndex(item => item.id === id);
    if (index !== -1) {
      demoContentItems.splice(index, 1);
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error deleting content item:', error.message);
    }
  } catch (error) {
    console.error('Error deleting content item:', error);
  }
}

export async function deleteVoiceProfile(id: string) {
  if (isDemoMode) {
    // Remove from demo profiles if in demo mode
    const index = demoVoiceProfiles.findIndex(profile => profile.id === id);
    if (index !== -1) {
      demoVoiceProfiles.splice(index, 1);
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('voice_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error deleting voice profile:', error.message);
    }
  } catch (error) {
    console.error('Error deleting voice profile:', error);
  }
}

export async function deleteImageAsset(id: string) {
  if (isDemoMode) {
    // Remove from demo assets if in demo mode
    const index = demoImageAssets.findIndex(asset => asset.id === id);
    if (index !== -1) {
      demoImageAssets.splice(index, 1);
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('image_assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error deleting image asset:', error.message);
    }
  } catch (error) {
    console.error('Error deleting image asset:', error);
  }
}

/**
 * Check if required tables exist in the database
 */
export async function checkRequiredTables() {
  if (isDemoMode) {
    return {
      exists: false,
      missingTables: ['content_items', 'voice_profiles', 'image_assets']
    };
  }

  try {
    // Try to query each table to check if they exist
    try {
      const checks = await Promise.all([
        supabase.from('content_items').select('id').limit(1),
        supabase.from('voice_profiles').select('id').limit(1),
        supabase.from('image_assets').select('id').limit(1)
      ]);

      const missingTables = [
        checks[0].error ? 'content_items' : null,
        checks[1].error ? 'voice_profiles' : null,
        checks[2].error ? 'image_assets' : null
      ].filter(Boolean) as string[];

      return {
        exists: missingTables.length === 0,
        missingTables
      };
    } catch (e) {
      console.error('Error checking tables:', e);
      return {
        exists: false,
        missingTables: ['content_items', 'voice_profiles', 'image_assets'],
        error: 'Failed to check tables'
      };
    }
  } catch (error) {
    console.error('Error checking required tables:', error);
    // Assume tables don't exist if there's an error
    return {
      exists: false,
      missingTables: ['content_items', 'voice_profiles', 'image_assets'],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}