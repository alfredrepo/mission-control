'use client';

import { LayoutDashboard } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-mc-bg">
      <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
        <div className="flex items-center gap-2 text-mc-text">
          <LayoutDashboard className="w-5 h-5 text-mc-accent" />
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
      </div>

      <div className="flex">
        <AppNavSidebar workspaceSlug="default" />
        <main className="flex-1 p-6">
          <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-2">Metrics dashboard (coming next)</h2>
            <p className="text-mc-text-secondary text-sm">
              This page is reserved for KPIs and operational metrics. For now, use Tasks / Agents / Cron.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
