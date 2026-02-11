'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';
import { AgentModal } from '@/components/AgentModal';
import type { Agent, AgentStatus } from '@/lib/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

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

  const getStatusBadge = (status: AgentStatus) => {
    const styles = {
      standby: 'status-standby',
      working: 'status-working',
      offline: 'status-offline',
    };
    return styles[status] || styles.standby;
  };

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
            <button
              key={a.id}
              onClick={() => setEditingAgent(a)}
              className="text-left bg-mc-bg-secondary border border-mc-border rounded-lg p-4 hover:border-mc-accent/40 hover:bg-mc-bg-tertiary transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg mb-1">{a.avatar_emoji} {a.name} {a.is_master ? '★' : ''}</div>
                  <div className="text-sm text-mc-text-secondary">{a.role}</div>
                  {a.description && (
                    <div className="text-xs text-mc-text-secondary mt-1 line-clamp-2">{a.description}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded uppercase ${getStatusBadge(a.status)}`}>
                  {a.status}
                </span>
              </div>
            </button>
          ))}
          {!loading && filteredAgents.length === 0 && (
            <p className="text-mc-text-secondary">No agents for this filter.</p>
          )}
        </main>
      </div>

      {editingAgent && (
        <AgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          workspaceId="default"
        />
      )}
    </div>
  );
}
