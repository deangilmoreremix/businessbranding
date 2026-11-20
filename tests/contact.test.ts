import { describe, expect, it } from 'vitest';
import { clientAddress, validateContact } from '@/lib/contact';

describe('contact form', () => {
  it('validates name, email and message', () => {
    expect(validateContact({ name: '', email: 'x', message: 'short' })).toEqual({ name: expect.any(String), email: expect.any(String), message: expect.any(String) });
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'Hello, this is long enough.' })).toEqual({});
    expect(validateContact({ name: 'Ann', email: 'ann@example.com', message: 'x'.repeat(5001) }).message).toMatch(/5000/);
  });
});

describe('client address for rate limiting', () => {
  const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
  it('ignores spoofed left-hand X-Forwarded-For values (rightmost hop wins)', () => {
    expect(clientAddress(h({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 203.0.113.9' }))).toBe('203.0.113.9');
    const spoofed = ['9.9.9.1', '9.9.9.2', '9.9.9.3'].map((ip) => clientAddress(h({ 'x-forwarded-for': `${ip}, 203.0.113.9` })));
    expect(new Set(spoofed).size).toBe(1); // eight different spoofed values must still be ONE client
  });
  it('prefers platform headers over forwarded ones', () => {
    expect(clientAddress(h({ 'x-nf-client-connection-ip': '198.51.100.4', 'x-real-ip': '10.0.0.1', 'x-forwarded-for': '6.6.6.6' }))).toBe('198.51.100.4');
    expect(clientAddress(h({ 'x-real-ip': '10.0.0.1', 'x-forwarded-for': '6.6.6.6' }))).toBe('10.0.0.1');
    expect(clientAddress(h({}))).toBe('unknown');
  });
});
