import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export interface DemoLimits {
  maxGenerations: number;
  maxDuration: number;
  maxResolution: number;
  watermark: boolean;
  features: string[];
}

export interface DemoSession {
  generationsLeft: number;
  startTime: Date;
  hasWatermark: boolean;
}

export enum FeatureAccess {
  PUBLIC = 'public',
  DEMO = 'demo',
  AUTHENTICATED = 'auth',
  PREMIUM = 'premium'
}

export interface Feature {
  id: string;
  name: string;
  access: FeatureAccess;
  demoLimits?: DemoLimits;
  component: React.ComponentType;
}

export const FEATURE_CONFIG = {
  brandAnalysis: {
    id: 'brand-analysis',
    name: 'Brand Analysis',
    access: FeatureAccess.DEMO,
    demoLimits: {
      maxGenerations: 1,
      features: ['basic-analysis']
    }
  },
  visualIdentity: {
    id: 'visual-identity',
    name: 'Visual Identity',
    access: FeatureAccess.DEMO,
    demoLimits: {
      maxGenerations: 2,
      maxResolution: 512,
      watermark: true
    }
  },
  voiceContent: {
    id: 'voice-content',
    name: 'Voice Content',
    access: FeatureAccess.DEMO,
    demoLimits: {
      maxDuration: 30,
      maxGenerations: 1
    }
  },
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    access: FeatureAccess.AUTHENTICATED
  }
};

export const getDemoSession = (): DemoSession => {
  const session = localStorage.getItem('demoSession');
  if (session) {
    return JSON.parse(session);
  }
  
  const newSession: DemoSession = {
    generationsLeft: 3,
    startTime: new Date(),
    hasWatermark: true
  };
  
  localStorage.setItem('demoSession', JSON.stringify(newSession));
  return newSession;
};

export const updateDemoSession = (updates: Partial<DemoSession>) => {
  const session = getDemoSession();
  const updatedSession = { ...session, ...updates };
  localStorage.setItem('demoSession', JSON.stringify(updatedSession));
  return updatedSession;
};

export const checkDemoLimits = (feature: Feature): boolean => {
  if (!feature.demoLimits) return true;
  
  const session = getDemoSession();
  return session.generationsLeft > 0;
};

export const decrementDemoGenerations = () => {
  const session = getDemoSession();
  updateDemoSession({
    generationsLeft: Math.max(0, session.generationsLeft - 1)
  });
};