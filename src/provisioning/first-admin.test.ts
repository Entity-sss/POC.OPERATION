import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import worker from './first-admin-worker';
import { AuthError, provisionFirstAdmin } from '@/lib/auth/service';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { registrationSchema } from '@/lib/auth/validation';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const wranglerFirstAdminConfig = JSON.parse(
  readFileSync(resolve(process.cwd(), 'wrangler.first-admin.jsonc'), 'utf-8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
);

describe('First-Admin Provisioning Security & Secret Handling', () => {
  test('wrangler.first-admin.jsonc is non-routable (workers_dev: false, no routes)', () => {
    assert.equal(wranglerFirstAdminConfig.workers_dev, false);
    assert.equal((wranglerFirstAdminConfig as Record<string, unknown>).routes, undefined);
    assert.equal((wranglerFirstAdminConfig as Record<string, unknown>).route, undefined);
  });

  test('.dev.vars and local secrets are strictly ignored by Git', () => {
    const isIgnoredByGit = (path: string): boolean => {
      try {
        execSync(`git check-ignore -q "${path}"`);
        return true;
      } catch {
        return false;
      }
    };

    assert.equal(isIgnoredByGit('.dev.vars'), true, '.dev.vars must be ignored by .gitignore');
    assert.equal(isIgnoredByGit('.dev.vars.local'), true, '.dev.vars.local must be ignored by .gitignore');
    assert.equal(isIgnoredByGit('.dev.vars.remote'), true, '.dev.vars.remote must be ignored by .gitignore');
    assert.equal(isIgnoredByGit('.dev.vars.example'), false, '.dev.vars.example must not be ignored (safe template)');
  });

  test('non-POST requests are rejected with 405', async () => {
    const req = new Request('http://localhost:8787/', { method: 'GET' });
    const res = await worker.fetch(req, {
      poc_operation_db: {} as unknown as D1Database,
      FIRST_ADMIN_PROVISION_TOKEN: 'correct-token',
    });
    assert.equal(res.status, 405);
  });

  test('missing provisioning token in env fails closed (403)', async () => {
    const req = new Request('http://localhost:8787/', {
      method: 'POST',
      headers: {
        authorization: 'Bearer supplied-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await worker.fetch(req, {
      poc_operation_db: {} as unknown as D1Database,
      FIRST_ADMIN_PROVISION_TOKEN: undefined,
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.deepEqual(body, { success: false, error: 'PROVISIONING_UNAUTHORIZED' });
  });

  test('missing authorization header in request fails closed (403)', async () => {
    const req = new Request('http://localhost:8787/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await worker.fetch(req, {
      poc_operation_db: {} as unknown as D1Database,
      FIRST_ADMIN_PROVISION_TOKEN: 'correct-secret-token',
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.deepEqual(body, { success: false, error: 'PROVISIONING_UNAUTHORIZED' });
  });

  test('invalid / mismatched authorization token is rejected (403)', async () => {
    const req = new Request('http://localhost:8787/', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await worker.fetch(req, {
      poc_operation_db: {} as unknown as D1Database,
      FIRST_ADMIN_PROVISION_TOKEN: 'correct-secret-token',
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.deepEqual(body, { success: false, error: 'PROVISIONING_UNAUTHORIZED' });
  });

  test('provisionFirstAdmin service rejects missing or mismatched tokens', async () => {
    const mockDb = {} as never;
    const dummyInput = {
      fullName: 'Admin User',
      mobile: '+919876543210',
      email: 'admin@pinnacle.com',
      currentAddress: 'Bangalore',
      permanentAddress: 'Bangalore',
      education: 'B.Tech',
      priorExperience: '10 years',
      password: 'SecureAdminPassword123!',
    };

    // Missing expected token
    await assert.rejects(
      async () => provisionFirstAdmin(mockDb, 'supplied', undefined, dummyInput),
      (err: unknown) => err instanceof AuthError && err.status === 403 && err.code === 'PROVISIONING_UNAUTHORIZED'
    );

    // Missing supplied token
    await assert.rejects(
      async () => provisionFirstAdmin(mockDb, undefined, 'expected', dummyInput),
      (err: unknown) => err instanceof AuthError && err.status === 403 && err.code === 'PROVISIONING_UNAUTHORIZED'
    );

    // Mismatched tokens
    await assert.rejects(
      async () => provisionFirstAdmin(mockDb, 'wrong-token', 'correct-token', dummyInput),
      (err: unknown) => err instanceof AuthError && err.status === 403 && err.code === 'PROVISIONING_UNAUTHORIZED'
    );
  });

  test('password hashing and verification function correctly with PBKDF2', async () => {
    const rawPassword = 'StrongPassword2026!';
    const hash = await hashPassword(rawPassword);

    assert.ok(hash.startsWith('pbkdf2$SHA-256$600000$'), 'Hash should use PBKDF2 with SHA-256 and 600,000 iterations');
    assert.notEqual(hash, rawPassword);

    const isMatch = await verifyPassword(rawPassword, hash);
    assert.equal(isMatch, true);

    const isMismatch = await verifyPassword('WrongPassword123!', hash);
    assert.equal(isMismatch, false);
  });

  test('registration validation schema enforces required fields and rejects invalid passwords', () => {
    const validData = {
      fullName: 'First Admin',
      mobile: '+919999988888',
      email: 'ADMIN@PINNACLE.COM',
      currentAddress: 'Pinnacle Tower, Sector 5',
      permanentAddress: 'Pinnacle Tower, Sector 5',
      education: 'Master in Management',
      priorExperience: 'Operations Director',
      password: 'AdminSuperSecretPassword99!',
    };

    const parsed = registrationSchema.parse(validData);
    assert.equal(parsed.email, 'admin@pinnacle.com', 'Email should be normalized to lowercase');

    // Short password (< 10 chars) must be rejected
    assert.throws(() => {
      registrationSchema.parse({ ...validData, password: 'short' });
    });
  });
});
