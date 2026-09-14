export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: 'LayoutDashboard' | 'Users' | 'Box' | 'FileCheck' | 'Settings' | 'Shield';
  requiredPermission?: string;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const MAIN_NAVIGATION: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
      },
      {
        id: 'employees',
        label: 'Workforce & Directory',
        href: '/dashboard#employees',
        iconName: 'Users',
        requiredPermission: 'employee.view',
      },
      {
        id: 'registrations',
        label: 'Registration Approvals',
        href: '/dashboard#registrations',
        iconName: 'FileCheck',
        requiredPermission: 'employee.approve_registration',
      },
      {
        id: 'assets',
        label: 'Assets & Hardware',
        href: '/dashboard#assets',
        iconName: 'Box',
        requiredPermission: 'asset.view',
      },
    ],
  },
  {
    title: 'System & Governance',
    items: [
      {
        id: 'roles',
        label: 'Role & Scope Governance',
        href: '/dashboard#roles',
        iconName: 'Shield',
        requiredPermission: 'role.manage',
      },
      {
        id: 'settings',
        label: 'System Settings',
        href: '/dashboard#settings',
        iconName: 'Settings',
      },
    ],
  },
];

/**
 * Filter navigation items based on user's granted permissions array.
 * If user has wildcard '*' permission or specific permission, item is visible.
 */
export function getFilteredNavigation(permissions: string[] = []): NavSection[] {
  const permSet = new Set(permissions);
  const isSuperUser = permSet.has('*') || permSet.has('admin');

  return MAIN_NAVIGATION.map((section) => {
    const visibleItems = section.items.filter((item) => {
      if (!item.requiredPermission) return true;
      if (isSuperUser) return true;
      return permSet.has(item.requiredPermission);
    });
    return { ...section, items: visibleItems };
  }).filter((section) => section.items.length > 0);
}
