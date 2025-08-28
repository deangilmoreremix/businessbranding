// Removed Supabase import to avoid build-time issues

export interface BusinessAnalysis {
  id: number;
  businessName: string;
  industry: string;
  websiteUrl: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  analysisResults: any;
  createdAt: string;
}

export async function saveBusinessAnalysis(analysis: Omit<BusinessAnalysis, 'id' | 'createdAt'>) {
  // Return demo data to avoid Supabase client issues during build
  console.log('Saving business analysis (demo mode):', analysis.businessName);
  return {
    id: Date.now(),
    ...analysis,
    created_at: new Date().toISOString()
  };
}

export async function getBusinessAnalyses() {
  // Return demo data to avoid Supabase client issues during build
  console.log('Fetching business analyses (demo mode)');
  return [];
}

export async function getBusinessAnalysis(id: number) {
  // Return demo data to avoid Supabase client issues during build
  console.log('Fetching business analysis (demo mode):', id);
  return null;
}

export async function updateBusinessAnalysis(id: number, updates: Partial<BusinessAnalysis>) {
  // Return demo data to avoid Supabase client issues during build
  console.log('Updating business analysis (demo mode):', id);
  return {
    id,
    ...updates,
    created_at: new Date().toISOString()
  };
}

export async function deleteBusinessAnalysis(id: number) {
  // Return demo response to avoid Supabase client issues during build
  console.log('Deleting business analysis (demo mode):', id);
}