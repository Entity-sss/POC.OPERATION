import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Architecture documentation and demo seed guard', () => {
  test('blueprint markdown and pdf are present in docs/architecture', () => {
    const mdPath = resolve(process.cwd(), 'docs/architecture/POC_OPERATION_ARCHITECTURE.md');
    const pdfPath = resolve(process.cwd(), 'docs/architecture/POC_OPERATION_VISUAL_ARCHITECTURE_BLUEPRINT.pdf');

    assert.equal(existsSync(mdPath), true, 'Architecture markdown document must exist');
    assert.equal(existsSync(pdfPath), true, 'Architecture PDF blueprint must exist');

    const markdown = readFileSync(mdPath, 'utf-8');
    assert.match(markdown, /Application architecture/i);
    assert.match(markdown, /Authentication/i);
    assert.match(markdown, /RBAC/i);
    assert.match(markdown, /Finance/i);
    assert.match(markdown, /Cloudflare/i);
  });

  test('demo seeding is explicitly guarded and cannot run silently', () => {
    const seedPath = resolve(process.cwd(), 'scripts/seed-demo-accounts.mjs');
    assert.equal(existsSync(seedPath), true, 'Seed script must exist');

    const seedSource = readFileSync(seedPath, 'utf-8');
    assert.match(seedSource, /ALLOW_DEMO_SEED|--force|--allow-demo-seed|production/i);
  });
});
