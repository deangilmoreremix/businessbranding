import { API_KEYS } from '../api-config';

export async function analyzeContent(content: string, type: 'brand' | 'visual' | 'voice') {
  try {
    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, type })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

export async function analyzeBrandStrategy(content: string) {
  return analyzeContent(content, 'brand');
}

export async function analyzeVisualIdentity(content: string) {
  return analyzeContent(content, 'visual');
}

export async function analyzeVoiceContent(content: string) {
  return analyzeContent(content, 'voice');
}