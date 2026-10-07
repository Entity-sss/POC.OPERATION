export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName:
    | 'LayoutDashboard'
    | 'Users'
    | 'Box'
    | 'FileCheck'
    | 'Settings'
    | 'Shield'
    | 'Target'
    | 'TrendingUp'
    | 'CheckSquare'
    | 'Building'
    | 'FolderKanban'
    | 'Truck'
    | 'IndianRupee'
    | 'Ticket'
    | 'AlertTriangle'
    | 'Lock'
    | 'BarChart2'
    | 'Briefcase'
    | 'ChevronRight';
  requiredPermission?: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Full navigation definition.
 * Each item maps to exactly ONE hash which maps to exactly ONE workspace state in DashboardShell.
 */
export const MAIN_NAVIGATION: NavSection[] = [
  {
    title: 'Executive',
    items: [
      {
        id: 'executive',
        label: 'Executive Center',
        href: '/dashboard#executive',
        iconName: 'TrendingUp',
        requiredPermission: 'company.view',
      },
    ],
  },
  {
    title: 'Core Operations',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Overview',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
      },
      {
        id: 'my-tasks',
        label: 'My Tasks & Targets',
        href: '/dashboard#tasks',
        iconName: 'CheckSquare',
        requiredPermission: 'task.execute',
      },
      {
        id: 'team-management',
        label: 'Team Operations',
        href: '/dashboard#team',
        iconName: 'Users',
        requiredPermission: 'team.manage',
      },
    ],
  },
  {
    title: 'Revenue & CRM',
    items: [
      {
        id: 'clients',
        label: 'Client Accounts',
        href: '/dashboard#clients',
        iconName: 'Building',
        requiredPermission: 'client.read',
      },
      {
        id: 'opportunities',
        label: 'Deal Pipeline',
        href: '/dashboard#opportunities',
        iconName: 'Target',
        requiredPermission: 'opportunity.read',
      },
    ],
  },
  {
    title: 'Governance & SLA',
    items: [
      {
        id: 'reports-review',
        label: 'Daily Work Reports',
        href: '/dashboard#reports',
        iconName: 'FileCheck',
        requiredPermission: 'report.review',
      },
      {
        id: 'delays-review',
        label: 'Delay Requests & SLA',
        href: '/dashboard#delays',
        iconName: 'AlertTriangle',
        requiredPermission: 'delay.approve',
      },
    ],
  },
  {
    title: 'Delivery & Execution',
    items: [
      {
        id: 'projects',
        label: 'Projects & Milestones',
        href: '/dashboard#projects',
        iconName: 'FolderKanban',
        requiredPermission: 'project.read',
      },
      {
        id: 'vendors',
        label: 'Vendor Management',
        href: '/dashboard#vendors',
        iconName: 'Truck',
        requiredPermission: 'vendor.read',
      },
    ],
  },
  {
    title: 'Finance & Billing',
    items: [
      {
        id: 'finance-invoices',
        label: 'Invoices & Ageing',
        href: '/dashboard#invoices',
        iconName: 'IndianRupee',
        requiredPermission: 'finance.read',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        id: 'employees',
        label: 'Workforce Directory',
        href: '/dashboard#employees',
        iconName: 'Users',
        requiredPermission: 'employee.read.company',
      },
      {
        id: 'registrations',
        label: 'Registration Approvals',
        href: '/dashboard#registrations',
        iconName: 'FileCheck',
        requiredPermission: 'employee.approve_registration',
      },
      {
        id: 'roles',
        label: 'Roles & Permissions',
        href: '/dashboard#roles',
        iconName: 'Shield',
        requiredPermission: 'role.manage',
      },
      {
        id: 'settings',
        label: 'System Settings',
        href: '/dashboard#settings',
        iconName: 'Settings',
        requiredPermission: 'permission.manage',
      },
    ],
  },
];

/**
 * Filter navigation items based on user's granted permissions array.
 * Respects granular permissions; wildcard '*' or 'admin' grants broad access.
 * 'company.view' provides executive business visibility only and does NOT grant administrative or operational access.
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

/**
 * Returns the matching nav item href for the current URL.
 * Compares full href (path + hash) against current location.
 */
export function getActiveHref(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const path = window.location.pathname;
  const hash = window.location.hash.toLowerCase();
  if (!hash || hash === '#') return path;
  return path + hash;
}
