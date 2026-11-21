import { describe, expect, it } from 'vitest';
import { cleanNotifications, cleanProfile, DEFAULT_NOTIFICATIONS, validateWebsite } from '@/lib/settings-profile';

describe('profile settings', () => {
  it('trims, strips control characters and caps lengths', () => {
    const { value } = cleanProfile({ firstName: '  Ann\u0000\n ', lastName: 'x'.repeat(500), company: 5, website: ' https://a.example ' });
    expect(value.firstName).toBe('Ann');
    expect(value.lastName).toHaveLength(100);
    expect(value.company).toBe('');
    expect(value.website).toBe('https://a.example');
  });
  it('validates the website (http/https only)', () => {
    expect(validateWebsite('')).toBeNull();
    expect(validateWebsite('https://example.com')).toBeNull();
    expect(validateWebsite('javascript:alert(1)')).toMatch(/http/);
    expect(validateWebsite('not a url')).toMatch(/full address/);
    expect(cleanProfile({ website: 'ftp://x' }).errors.website).toBeTruthy();
  });
  it('notifications keep booleans and default the rest', () => {
    expect(cleanNotifications(undefined)).toEqual(DEFAULT_NOTIFICATIONS);
    expect(cleanNotifications({ marketing: true, productUpdates: 'yes' })).toEqual({ ...DEFAULT_NOTIFICATIONS, marketing: true });
  });
});
