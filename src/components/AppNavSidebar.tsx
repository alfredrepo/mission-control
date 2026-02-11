'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Users, Clock3, Settings } from 'lucide-react';

interface AppNavSidebarProps {
  workspaceSlug?: string;
}

export function AppNavSidebar({ workspaceSlug = 'default' }: AppNavSidebarProps) {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: `/workspace/${workspaceSlug}#tasks`, label: 'Tasks', icon: CheckSquare },
    { href: `/workspace/${workspaceSlug}#agents`, label: 'Agents', icon: Users },
    { href: '/settings#cron-jobs', label: 'Cron', icon: Clock3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 border-r border-mc-border bg-mc-bg-secondary/60 p-3 hidden lg:block">
      <div className="text-xs uppercase tracking-wide text-mc-text-secondary px-3 py-2">Navigation</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                active ? 'bg-mc-accent/20 text-mc-text' : 'text-mc-text-secondary hover:bg-mc-bg-tertiary hover:text-mc-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
