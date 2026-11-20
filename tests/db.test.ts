import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Real Postgres: applies every migration and tests RLS + consume_rate_limit (scripts/db-test.sh). Skipped when no Postgres binaries exist.
const PGBIN = process.env.PGBIN || '/usr/lib/postgresql/16/bin';
const available = existsSync(`${PGBIN}/initdb`);

describe.skipIf(!available)('database migrations + row-level security (real Postgres)', () => {
  it('applies all migrations and every RLS / rate-limit check passes', () => {
    const r = spawnSync('bash', ['scripts/db-test.sh'], { encoding: 'utf8', timeout: 170_000 });
    const out = `${r.stdout}\n${r.stderr}`;
    expect(out, out).toContain('ALL DB CHECKS PASSED');
    expect(r.status).toBe(0);
  }, 180_000);
});
