import React from 'react';
import { Icons } from '../ui/Icons';
import type { NavItem } from './navigation';

export interface NavIconProps {
  name: NavItem['iconName'];
  className?: string;
}

export const NavIcon: React.FC<NavIconProps> = ({ name, className = 'w-5 h-5 flex-shrink-0' }) => {
  switch (name) {
    case 'LayoutDashboard': return <Icons.LayoutDashboard className={className} />;
    case 'Users': return <Icons.Users className={className} />;
    case 'Box': return <Icons.Box className={className} />;
    case 'FileCheck': return <Icons.FileCheck className={className} />;
    case 'Settings': return <Icons.Settings className={className} />;
    case 'Shield': return <Icons.Shield className={className} />;
    case 'Target': return <Icons.Target className={className} />;
    case 'TrendingUp': return <Icons.TrendingUp className={className} />;
    case 'CheckSquare': return <Icons.CheckSquare className={className} />;
    case 'Building': return <Icons.Building className={className} />;
    case 'FolderKanban': return <Icons.FolderKanban className={className} />;
    case 'Truck': return <Icons.Truck className={className} />;
    case 'IndianRupee': return <Icons.IndianRupee className={className} />;
    case 'Ticket': return <Icons.Ticket className={className} />;
    case 'AlertTriangle': return <Icons.AlertTriangle className={className} />;
    case 'Lock': return <Icons.Lock className={className} />;
    case 'ChevronRight': return <Icons.ChevronRight className={className} />;
    case 'BarChart2': return <Icons.TrendingUp className={className} />;
    case 'Briefcase': return <Icons.Box className={className} />;
    default: return <Icons.LayoutDashboard className={className} />;
  }
};
