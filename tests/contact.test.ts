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
  it('prefers the platform header over everything else', () => {
    expect(clientAddress(h({ 'x-nf-client-connection-ip': '198.51.100.4', 'x-real-ip': '10.0.0.1', 'x-forwarded-for': '6.6.6.6' }))).toBe('198.51.100.4');
  });
  it('does NOT trust a directly spoofed X-Real-IP unless TRUST_PROXY_HEADERS=true', () => {
    const spoofed = ['1.1.1.1', '2.2.2.2', '3.3.3.3'].map((ip) => clientAddress(h({ 'x-real-ip': ip, 'user-agent': 'curl' })));
    expect(new Set(spoofed).size).toBe(1); // rotating X-Real-IP does not create new buckets
    expect(spoofed[0].startsWith('fp:')).toBe(true);
    expect(clientAddress(h({ 'x-real-ip': '10.0.0.1' }), { TRUST_PROXY_HEADERS: 'true' })).toBe('10.0.0.1');
    expect(clientAddress(h({ 'x-real-ip': '10.0.0.1' }), { TRUST_PROXY_HEADERS: 'false' }).startsWith('fp:')).toBe(true);
  });
  it('a single directly spoofed X-Forwarded-For value is the client address (it cannot be left-extended into a new bucket)', () => {
    const one = clientAddress(h({ 'x-forwarded-for': '7.7.7.7' }));
    expect(one).toBe('7.7.7.7');
    expect(clientAddress(h({ 'x-forwarded-for': '8.8.8.8, 7.7.7.7' }))).toBe('7.7.7.7');
  });
  it('falls back to a header fingerprint, never one global bucket', () => {
    expect(clientAddress(h({})).startsWith('fp:')).toBe(true);
    expect(clientAddress(h({ 'user-agent': 'a' }))).not.toBe(clientAddress(h({ 'user-agent': 'b' })));
  });
});
