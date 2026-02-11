'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';

type MetricsResponse = {
  generated_at: string;
  window_days: number;
  metrics: {
    avg_review_age_hours: number;
    late_tasks: { assigned: number; in_progress: number; review: number; total: number };
    dispatch: { attempts: number; failures: number; success_rate_pct: number };
  };
};

type StandupResponse = {
  generated_at: string;
  totals: { open: number; done_window: number };
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [standup, setStandup] = useState<StandupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [metricsRes, standupRes] = await Promise.all([
        fetch('/api/reports/metrics?windowDays=7'),
        fetch('/api/reports/standup/daily?windowHours=24'),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (standupRes.ok) setStandup(await standupRes.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cardClass = 'bg-mc-bg-secondary border border-mc-border rounded-lg p-5';

  return (
    <div className="min-h-screen bg-mc-bg">
      <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-mc-text">
            <LayoutDashboard className="w-5 h-5 text-mc-accent" />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              load();
            }}
            className="px-3 py-1.5 border border-mc-border rounded text-sm flex items-center gap-2 hover:bg-mc-bg-tertiary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex">
        <AppNavSidebar workspaceSlug="default" />
        <main className="flex-1 p-6">
          {loading ? (
            <p className="text-mc-text-secondary">Loading dashboard...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className={cardClass}>
                <div className="text-sm text-mc-text-secondary">Open Tasks</div>
                <div className="text-3xl font-semibold mt-2">{standup?.totals.open ?? 0}</div>
                <div className="text-xs text-mc-text-secondary mt-2">Current inbox/assigned/in_progress/review</div>
              </div>

              <div className={cardClass}>
                <div className="text-sm text-mc-text-secondary">Done (24h)</div>
                <div className="text-3xl font-semibold mt-2 text-green-400">{standup?.totals.done_window ?? 0}</div>
                <div className="text-xs text-mc-text-secondary mt-2">Completed in last day</div>
              </div>

              <div className={cardClass}>
                <div className="text-sm text-mc-text-secondary">Late Tasks</div>
                <div className="text-3xl font-semibold mt-2 text-yellow-400">{metrics?.metrics.late_tasks.total ?? 0}</div>
                <div className="text-xs text-mc-text-secondary mt-2">
                  A:{metrics?.metrics.late_tasks.assigned ?? 0} · P:{metrics?.metrics.late_tasks.in_progress ?? 0} · R:{metrics?.metrics.late_tasks.review ?? 0}
                </div>
              </div>

              <div className={cardClass}>
                <div className="text-sm text-mc-text-secondary">Dispatch Success (7d)</div>
                <div className="text-3xl font-semibold mt-2 text-cyan-400">{metrics?.metrics.dispatch.success_rate_pct ?? 100}%</div>
                <div className="text-xs text-mc-text-secondary mt-2">
                  Attempts: {metrics?.metrics.dispatch.attempts ?? 0} · Failures: {metrics?.metrics.dispatch.failures ?? 0}
                </div>
              </div>

              <div className={cardClass}>
                <div className="text-sm text-mc-text-secondary">Avg Review Age</div>
                <div className="text-3xl font-semibold mt-2">{metrics?.metrics.avg_review_age_hours ?? 0}h</div>
                <div className="text-xs text-mc-text-secondary mt-2">Mean age of tasks in review</div>
              </div>

              <div className={cardClass}>
                <div className="text-sm text-mc-text-secondary">Last Updated</div>
                <div className="text-sm mt-2 text-mc-text">{metrics?.generated_at || standup?.generated_at || 'n/a'}</div>
                <div className="text-xs text-mc-text-secondary mt-2">UTC timestamp</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
