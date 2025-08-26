export interface StoredAnalysis {
  websiteUrl: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  lastUpdated: string;
}

const STORAGE_KEYS = {
  WEBSITE_ANALYSIS: 'website_analysis',
  SOCIAL_LINKS: 'social_links'
} as const;

export function saveAnalysis(analysis: Omit<StoredAnalysis, 'lastUpdated'>) {
  try {
    const storedData: StoredAnalysis = {
      ...analysis,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.WEBSITE_ANALYSIS, JSON.stringify(storedData));
    return true;
  } catch (error) {
    console.error('Failed to save analysis:', error);
    return false;
  }
}

export function getStoredAnalysis(): StoredAnalysis | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEBSITE_ANALYSIS);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to retrieve analysis:', error);
    return null;
  }
}

export function clearStoredAnalysis() {
  try {
    localStorage.removeItem(STORAGE_KEYS.WEBSITE_ANALYSIS);
    return true;
  } catch (error) {
    console.error('Failed to clear analysis:', error);
    return false;
  }
}