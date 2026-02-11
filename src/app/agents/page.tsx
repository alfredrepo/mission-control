'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';
import type { Agent } from '@/lib/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/agents?workspace_id=default');
      if (res.ok) setAgents(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAgents = useMemo(() => {
    if (statusFilter === 'all') return agents;
    return agents.filter((a) => a.status === statusFilter);
  }, [agents, statusFilter]);

  return (
    <div className="min-h-screen bg-mc-bg">
      <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-mc-text">
            <Users className="w-5 h-5 text-mc-accent" />
            <h1 className="text-xl font-semibold">Agents</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-mc-bg border border-mc-border rounded text-sm"
            >
              <option value="all">All statuses</option>
              <option value="standby">Standby</option>
              <option value="working">Working</option>
              <option value="offline">Offline</option>
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
        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <p className="text-mc-text-secondary">Loading agents...</p>}
          {!loading && filteredAgents.map((a) => (
            <div key={a.id} className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
              <div className="text-lg mb-1">{a.avatar_emoji} {a.name}</div>
              <div className="text-sm text-mc-text-secondary">{a.role}</div>
              <div className="mt-2 text-xs uppercase text-mc-text-secondary">{a.status}</div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
