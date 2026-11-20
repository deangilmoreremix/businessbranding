import { transformImage } from '@/lib/services/openai-images';
import html2canvas from 'html2canvas';

// Define ImageAsset interface locally to avoid Supabase import issues
interface ImageAsset {
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
}

/**
 * Extract tags from a prompt to use for categorization
 */
export function extractTagsFromPrompt(prompt: string): string[] {
  if (!prompt) return [];
  
  // Common design-related terms to extract as tags
  const designTerms = [
    'logo', 'branding', 'mascot', 'icon', 'banner', 
    'poster', 'flyer', 'minimalist', 'modern', 'vintage',
    'retro', 'corporate', 'professional', 'playful', 'elegant',
    'bold', 'colorful', 'monochrome', 'abstract', 'geometric',
    'illustration', 'character', 'typography', 'layout', 'palette',
    '3d', 'flat', 'gradient', 'texture', 'pattern'
  ];
  
  // Convert prompt to lowercase for case-insensitive matching
  const promptLower = prompt.toLowerCase();
  
  // Extract colors
  const colorRegex = /\b(red|orange|yellow|green|blue|purple|pink|black|white|grey|gray|brown|teal|cyan|magenta|gold|silver)\b/g;
  const colorMatches = promptLower.match(colorRegex) || [];
  const colors = Array.from(new Set(colorMatches));

  // Extract design terms
  const extractedTerms = designTerms.filter(term =>
    promptLower.includes(term.toLowerCase())
  );

  // Combine all tags and remove duplicates
  return Array.from(new Set([...colors, ...extractedTerms]));
}

/**
 * Export a chart element as a PNG image
 */
export async function exportChartAsPNG(elementId: string, fileName: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Chart element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    return true;
  } catch (error) {
    console.error('Failed to export chart:', error);
    throw error;
  }
}