import { supabase } from '@/lib/supabase';

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
  try {
    const { data, error } = await supabase
      .from('business_analyzer')
      .insert({
        business_name: analysis.businessName,
        industry: analysis.industry,
        website_url: analysis.websiteUrl,
        social_links: analysis.socialLinks,
        analysis_results: analysis.analysisResults
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving business analysis:', error);
    throw error;
  }
}

export async function getBusinessAnalyses() {
  try {
    const { data, error } = await supabase
      .from('business_analyzer')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business analyses:', error);
    throw error;
  }
}

export async function getBusinessAnalysis(id: number) {
  try {
    const { data, error } = await supabase
      .from('business_analyzer')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business analysis:', error);
    throw error;
  }
}

export async function updateBusinessAnalysis(id: number, updates: Partial<BusinessAnalysis>) {
  try {
    const { data, error } = await supabase
      .from('business_analyzer')
      .update({
        business_name: updates.businessName,
        industry: updates.industry,
        website_url: updates.websiteUrl,
        social_links: updates.socialLinks,
        analysis_results: updates.analysisResults
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating business analysis:', error);
    throw error;
  }
}

export async function deleteBusinessAnalysis(id: number) {
  try {
    const { error } = await supabase
      .from('business_analyzer')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting business analysis:', error);
    throw error;
  }
}