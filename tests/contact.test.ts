import { describe, expect, it } from 'vitest';
import { validateContact } from '@/lib/contact';

describe('contact form', () => {
  it('validates name, email and message', () => {
    expect(validateContact({ name: '', email: 'x', message: 'short' })).toEqual({ name: expect.any(String), email: expect.any(String), message: expect.any(String) });
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hello, this is long enough.' })).toEqual({});
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'x'.repeat(5001) }).message).toMatch(/5000/);
  });
});
