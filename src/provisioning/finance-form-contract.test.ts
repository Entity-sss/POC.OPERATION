import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Finance form contract', () => {
  test('invoice creation request includes issue date required by the backend schema', () => {
    const componentPath = resolve(process.cwd(), 'src/components/dashboard/FinanceWorkspace.tsx');
    const source = readFileSync(componentPath, 'utf-8');

    assert.match(source, /issueDate:\s*new Date\(invoiceForm\.issueDate\)\.getTime\(\)|issueDate:\s*Date\.now\(\)|issueDate\s*:/i);
    assert.doesNotMatch(source, /body:\s*JSON\.stringify\(\{\s*clientId: invoiceForm\.clientId,\s*amount: Number\(invoiceForm\.amount\),\s*dueDate: new Date\(invoiceForm\.dueDate\)\.getTime\(\),\s*notes: invoiceForm\.notes \|\| undefined\s*\}\)/i);
  });
});
