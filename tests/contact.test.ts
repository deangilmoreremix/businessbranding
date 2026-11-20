import { describe, expect, it } from 'vitest';
import { contactMailto, validateContact } from '@/lib/contact';

describe('contact form', () => {
  it('validates name, email and message', () => {
    expect(validateContact({ name: '', email: 'x', message: 'short' })).toEqual({ name: expect.any(String), email: expect.any(String), message: expect.any(String) });
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hello, this is long enough.' })).toEqual({});
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'x'.repeat(5001) }).message).toMatch(/5000/);
  });
  it('builds a mailto link without header injection', () => {
    const url = contactMailto('hello@example.com', { name: 'Ann\r\nBcc: evil@x.com', email: 'ann@example.com', message: 'Hi there, a message.' });
    expect(url.startsWith('mailto:hello@example.com?subject=')).toBe(true);
    expect(decodeURIComponent(url)).not.toMatch(/\nBcc:/);
    expect(url).toContain('&body=');
  });
});
