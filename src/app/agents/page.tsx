'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';
import type { Agent } from '@/lib/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/agents?workspace_id=default');
        if (res.ok) setAgents(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-mc-bg">
      <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
        <div className="flex items-center gap-2 text-mc-text">
          <Users className="w-5 h-5 text-mc-accent" />
          <h1 className="text-xl font-semibold">Agents</h1>
        </div>
      </div>

      <div className="flex">
        <AppNavSidebar workspaceSlug="default" />
        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <p className="text-mc-text-secondary">Loading agents...</p>}
          {!loading && agents.map((a) => (
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
