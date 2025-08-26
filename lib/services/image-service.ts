import { ImageAsset, createImageAsset } from '@/lib/supabase';
import { transformImage } from '@/lib/services/recraft';
import html2canvas from 'html2canvas';

/**
 * Transforms an image using the Recraft API and saves it to the database
 */
export async function transformAndSaveImage(
  imageUrl: string, 
  prompt: string, 
  options: {
    title?: string;
    style?: string;
    tags?: string[];
    userId?: string;
  } = {}
) {
  if (!imageUrl || !prompt) {
    throw new Error('Image URL and prompt are required');
  }

  try {
    // Transform the image using Recraft
    const transformResult = await transformImage(
      imageUrl,
      prompt,
      options.style
    );
    
    if (!transformResult || !transformResult.images || transformResult.images.length === 0) {
      throw new Error('No images were generated');
    }
    
    // Save each generated image to the database
    const savedImages: ImageAsset[] = [];
    
    for (let i = 0; i < transformResult.images.length; i++) {
      const generatedUrl = transformResult.images[i];
      const index = i + 1;
      
      const newAsset: Omit<ImageAsset, 'id' | 'created_at' | 'updated_at'> = {
        title: options.title || `${prompt} (${index})`,
        url: generatedUrl,
        prompt,
        style: options.style,
        source: 'recraft',
        tags: options.tags || ['ai-generated'],
        metadata: {
          width: 1024,
          height: 1024,
          format: 'png',
          generated: true
        },
        user_id: options.userId || 'default'
      };
      
      const savedImage = await createImageAsset(newAsset);
      savedImages.push(savedImage);
    }
    
    return savedImages;
  } catch (error) {
    console.error('Failed to transform and save image:', error);
    throw error;
  }
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
  const colors = [...new Set(promptLower.match(colorRegex) || [])];
  
  // Extract design terms
  const extractedTerms = designTerms.filter(term => 
    promptLower.includes(term.toLowerCase())
  );
  
  // Combine all tags and remove duplicates
  return [...new Set([...colors, ...extractedTerms])];
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