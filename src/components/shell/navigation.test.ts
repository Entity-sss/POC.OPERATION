import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getFilteredNavigation, MAIN_NAVIGATION } from './navigation';

describe('Global Navigation & Permission Filtering', () => {
  test('MAIN_NAVIGATION contains required core sections', () => {
    assert.ok(MAIN_NAVIGATION.length >= 2, 'Should have at least 2 sections');
    const titles = MAIN_NAVIGATION.map((s) => s.title);
    assert.ok(titles.includes('Core Operations'));
    assert.ok(titles.includes('System & Governance'));
  });

  test('unprivileged user only sees items without required permissions', () => {
    const visible = getFilteredNavigation([]);
    const allItems = visible.flatMap((s) => s.items);
    const itemIds = allItems.map((i) => i.id);

    assert.ok(itemIds.includes('dashboard'), 'Dashboard should always be visible');
    assert.ok(itemIds.includes('settings'), 'Settings should always be visible');
    assert.equal(itemIds.includes('employees'), false, 'Workforce requires employee.view');
    assert.equal(itemIds.includes('registrations'), false, 'Registrations requires employee.approve_registration');
    assert.equal(itemIds.includes('roles'), false, 'Roles requires role.manage');
  });

  test('user with employee.view permission sees workforce section', () => {
    const visible = getFilteredNavigation(['employee.view']);
    const itemIds = visible.flatMap((s) => s.items).map((i) => i.id);

    assert.ok(itemIds.includes('employees'));
    assert.equal(itemIds.includes('registrations'), false);
    assert.equal(itemIds.includes('roles'), false);
  });

  test('admin or wildcard permission sees all items', () => {
    const visibleWithWildcard = getFilteredNavigation(['*']);
    const itemIdsWildcard = visibleWithWildcard.flatMap((s) => s.items).map((i) => i.id);
    const totalConfigItems = MAIN_NAVIGATION.flatMap((s) => s.items).map((i) => i.id);

    assert.deepEqual(itemIdsWildcard, totalConfigItems, 'Wildcard user must see all navigation items');

    const visibleWithAdmin = getFilteredNavigation(['admin']);
    const itemIdsAdmin = visibleWithAdmin.flatMap((s) => s.items).map((i) => i.id);
    assert.deepEqual(itemIdsAdmin, totalConfigItems, 'Admin must see all navigation items');
  });

  test('empty sections are pruned from filtered output', () => {
    // If a section had only permissioned items and none match, section is omitted
    const visible = getFilteredNavigation([]);
    for (const section of visible) {
      assert.ok(section.items.length > 0, 'No empty navigation sections allowed');
    }
  });
});
