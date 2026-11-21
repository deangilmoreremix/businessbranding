import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  // JSX in test files (React Email template tests); Vite 8 uses oxc for transforms
  oxc: { jsx: { runtime: 'automatic' } },
  test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'] }
} as any);
