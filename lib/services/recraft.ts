import { API_KEYS } from '../api-config';

const isDemoMode = !API_KEYS.RECRAFT || API_KEYS.RECRAFT === 'demo-mode';
const RECRAFT_API_URL = 'https://api.recraft.ai/v1';

interface ImageTransformOptions {
  image_url: string;
  prompt: string;
  style_preset?: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  seed?: number;
  cfg_scale?: number;
  steps?: number;
}

interface ImageEditOptions {
  image_url: string;
  mask_url?: string;
  prompt: string;
  style?: string;
  strength?: number;
  guidance_scale?: number;
  seed?: number;
  num_outputs?: number;
}

interface ImageStyleOptions {
  image_url: string;
  style: string;
  strength?: number;
  preserve_color?: boolean;
  num_outputs?: number;
}

export async function transformImage(imageUrl: string, prompt: string, style?: string) {
  if (isDemoMode) {
    console.log('Running in demo mode - returning mock image data');
    return {
      images: [
        'https://images.unsplash.com/photo-1557683316-973673baf926',
        'https://images.unsplash.com/photo-1557683311-eac922347aa1'
      ]
    };
  }

  try {
    const options: ImageTransformOptions = {
      image_url: imageUrl,
      prompt,
      style_preset: style,
      width: 1024,
      height: 1024,
      num_outputs: 2,
      cfg_scale: 7.5,
      steps: 30
    };

    const response = await fetch(`${RECRAFT_API_URL}/transform`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.RECRAFT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Recraft API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to transform image:', error);
    throw error;
  }
}

export async function editImage(imageUrl: string, maskUrl: string | undefined, prompt: string, options: Partial<ImageEditOptions> = {}) {
  if (isDemoMode) {
    return {
      images: [
        'https://images.unsplash.com/photo-1557683316-973673baf926',
        'https://images.unsplash.com/photo-1557683311-eac922347aa1'
      ]
    };
  }

  try {
    const requestOptions: ImageEditOptions = {
      image_url: imageUrl,
      mask_url: maskUrl,
      prompt,
      style: options.style,
      strength: options.strength || 0.75,
      guidance_scale: options.guidance_scale || 7.5,
      seed: options.seed,
      num_outputs: options.num_outputs || 2
    };

    const response = await fetch(`${RECRAFT_API_URL}/edit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.RECRAFT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestOptions),
    });

    if (!response.ok) {
      throw new Error(`Recraft API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to edit image:', error);
    throw error;
  }
}

export async function applyStyle(imageUrl: string, style: string, options: Partial<ImageStyleOptions> = {}) {
  if (isDemoMode) {
    return {
      images: [
        'https://images.unsplash.com/photo-1557683316-973673baf926',
        'https://images.unsplash.com/photo-1557683311-eac922347aa1'
      ]
    };
  }

  try {
    const requestOptions: ImageStyleOptions = {
      image_url: imageUrl,
      style,
      strength: options.strength || 0.75,
      preserve_color: options.preserve_color || false,
      num_outputs: options.num_outputs || 2
    };

    const response = await fetch(`${RECRAFT_API_URL}/style`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.RECRAFT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestOptions),
    });

    if (!response.ok) {
      throw new Error(`Recraft API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to apply style:', error);
    throw error;
  }
}

export async function generateBrandAssets(options: ImageTransformOptions) {
  if (isDemoMode) {
    return {
      images: [
        'https://images.unsplash.com/photo-1557683316-973673baf926',
        'https://images.unsplash.com/photo-1557683311-eac922347aa1',
        'https://images.unsplash.com/photo-1557683304-673a23048d34',
        'https://images.unsplash.com/photo-1557683325-3ba8f0df79de'
      ]
    };
  }

  try {
    const response = await fetch(`${RECRAFT_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.RECRAFT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Recraft API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to generate brand assets:', error);
    throw error;
  }
}