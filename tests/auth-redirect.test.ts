import { describe, expect, it } from 'vitest';
import { loginUrl, MIN_PASSWORD_LENGTH, postLoginDestination, safeNextPath, validatePassword } from '@/lib/auth-redirect';

describe('safeNextPath (post-login redirect)', () => {
  it('keeps same-site relative paths, queries and hashes', () => {
    expect(safeNextPath('/dashboard/planning')).toBe('/dashboard/planning');
    expect(safeNextPath('/settings?tab=ai#ai')).toBe('/settings?tab=ai#ai');
    expect(safeNextPath(encodeURIComponent('/brand-strategy'))).toBe('/brand-strategy');
  });
  it('rejects open-redirect and script payloads', () => {
    for (const bad of ['//evil.example', '/\\evil.example', 'https://evil.example', 'http://evil.example/x', 'javascript:alert(1)', '///evil.example', '/%2F%2Fevil.example', '%2F%2Fevil.example', 'evil.example', '/a\\b', '/a\u0000b', '', null, undefined]) {
      expect(safeNextPath(bad as any)).toBe('/dashboard');
    }
  });
  it('never bounces back into the auth pages', () => {
    for (const p of ['/login', '/login?next=/x', '/sign-up', '/reset-password', '/reset-password/update']) expect(safeNextPath(p)).toBe('/dashboard');
    expect(safeNextPath('/login-help')).toBe('/login-help');
  });
  it('uses the given fallback', () => expect(safeNextPath('//x', '/')).toBe('/'));
});

describe('login helpers', () => {
  it('builds a login URL that carries the page to return to', () => {
    expect(loginUrl('/dashboard/brand-analysis')).toBe('/login?next=%2Fdashboard%2Fbrand-analysis');
    expect(loginUrl('//evil.example')).toBe('/login?next=%2F');
    expect(loginUrl()).toBe('/login');
  });
  it('sends first-time users (no key) to the key prompt and others straight on', () => {
    expect(postLoginDestination(true, '/dashboard/planning')).toBe('/dashboard/planning');
    expect(postLoginDestination(false, '/dashboard/planning')).toBe('/settings?welcome=1&next=%2Fdashboard%2Fplanning#ai');
  });
  it('requires passwords of at least 12 characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(validatePassword('a'.repeat(11))).toMatch(/12/);
    expect(validatePassword('a'.repeat(12))).toBeNull();
  });
});
