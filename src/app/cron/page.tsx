'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';

type CronJob = {
  id?: string;
  name?: string;
  enabled?: boolean;
  schedule?: { kind?: string; expr?: string; tz?: string; everyMs?: number };
  state?: { nextRunAtMs?: number; lastRunAtMs?: number; lastStatus?: string };
};

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabledFilter, setEnabledFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/openclaw/cron');
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredJobs = useMemo(() => {
    if (enabledFilter === 'all') return jobs;
    if (enabledFilter === 'enabled') return jobs.filter((j) => !!j.enabled);
    return jobs.filter((j) => !j.enabled);
  }, [jobs, enabledFilter]);

  return (
    <div className="min-h-screen bg-mc-bg">
      <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-mc-text">
            <Clock3 className="w-5 h-5 text-mc-accent" />
            <h1 className="text-xl font-semibold">Cron Jobs</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value)}
              className="px-3 py-1.5 bg-mc-bg border border-mc-border rounded text-sm"
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <button
              onClick={() => { setRefreshing(true); load(); }}
              className="px-3 py-1.5 border border-mc-border rounded text-sm flex items-center gap-2 hover:bg-mc-bg-tertiary"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        <AppNavSidebar workspaceSlug="default" />
        <main className="flex-1 p-6 space-y-3">
          {loading && <p className="text-mc-text-secondary">Loading cron jobs...</p>}
          {!loading && filteredJobs.map((job, i) => (
            <div key={job.id || i} className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{job.name || job.id || `job-${i + 1}`}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${job.enabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {job.enabled ? 'enabled' : 'disabled'}
                </span>
              </div>
              <div className="text-xs text-mc-text-secondary mt-1">
                {job.schedule?.kind === 'cron' ? `${job.schedule.expr} (${job.schedule.tz || 'UTC'})` : job.schedule?.kind || 'n/a'}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
