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
  const [mentionCounts, setMentionCounts] = useState<Record<string, number>>({});
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/agents?workspace_id=default');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);

        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (a: Agent) => {
            try {
              const mr = await fetch(`/api/agents/${a.id}/mentions?unread=true`);
              if (mr.ok) {
                const mentions = await mr.json();
                counts[a.id] = Array.isArray(mentions) ? mentions.length : 0;
              }
            } catch {
              counts[a.id] = 0;
            }
          })
        );
        setMentionCounts(counts);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unreadOnlyParam = new URLSearchParams(window.location.search).get('unreadOnly') === '1';
    if (unreadOnlyParam) {
      setUnreadOnly(true);
      setStatusFilter('all');
    }
  }, []);

  const filteredAgents = useMemo(() => {
    let result = statusFilter === 'all' ? agents : agents.filter((a) => a.status === statusFilter);
    if (unreadOnly) {
      result = result.filter((a) => (mentionCounts[a.id] || 0) > 0);
    }
    return result;
  }, [agents, statusFilter, unreadOnly, mentionCounts]);

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
              onClick={() => setUnreadOnly((v) => !v)}
              className={`px-3 py-1.5 border rounded text-sm ${unreadOnly ? 'border-mc-accent bg-mc-accent/20 text-mc-text' : 'border-mc-border text-mc-text-secondary'}`}
            >
              @{unreadOnly ? 'Unread only' : 'Unread'}
            </button>
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
              onClick={async () => {
                setEditingAgent(a);
                if ((mentionCounts[a.id] || 0) > 0) {
                  await fetch(`/api/agents/${a.id}/mentions`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ markAll: true }),
                  });
                  setMentionCounts((prev) => ({ ...prev, [a.id]: 0 }));
                }
              }}
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
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded uppercase ${getStatusBadge(a.status)}`}>
                    {a.status}
                  </span>
                  {(mentionCounts[a.id] || 0) > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-mc-accent/20 text-mc-accent">
                      @{mentionCounts[a.id]} unread
                    </span>
                  )}
                </div>
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
