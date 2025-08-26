export const API_KEYS = {
  GEMINI: process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'demo-mode',
  ELEVEN_LABS: process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY || 'demo-mode',
  BLACK_FOREST: process.env.NEXT_PUBLIC_BLACK_FOREST_API_KEY || 'demo-mode',
  RECRAFT: process.env.NEXT_PUBLIC_RECRAFT_API_KEY || 'demo-mode'
} as const;

// Validate API keys for debugging
const validateKey = (key: string, name: string): void => {
  if (!key || key === 'demo-mode' || key === 'your_api_key_here') {
    console.warn(`${name} API key is not set or is using placeholder. Running in demo mode.`);
  } else {
    console.log(`${name} API key is configured.`);
  }
};

// Only in client
if (typeof window !== 'undefined') {
  validateKey(API_KEYS.GEMINI, 'Gemini');
  validateKey(API_KEYS.ELEVEN_LABS, 'ElevenLabs');
  validateKey(API_KEYS.RECRAFT, 'Recraft');
}