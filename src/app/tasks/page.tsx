'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, RefreshCw, Send, Route } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';
import type { Task } from '@/lib/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/tasks?workspace_id=default');
      if (res.ok) setTasks(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const quickDispatch = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}/dispatch`, { method: 'POST' });
    setRefreshing(true);
    await load();
  };

  const quickAutoRoute = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}/auto-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apply: true, dispatch: true }),
    });
    setRefreshing(true);
    await load();
  };

  return (
    <div className="min-h-screen bg-mc-bg">
      <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-mc-text">
            <CheckSquare className="w-5 h-5 text-mc-accent" />
            <h1 className="text-xl font-semibold">Tasks</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-mc-bg border border-mc-border rounded text-sm"
            >
              <option value="all">All statuses</option>
              <option value="inbox">Inbox</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
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
        <main className="flex-1 p-6">
          {loading ? (
            <p className="text-mc-text-secondary">Loading tasks...</p>
          ) : (
            <div className="bg-mc-bg-secondary border border-mc-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-mc-bg-tertiary text-mc-text-secondary">
                  <tr>
                    <th className="text-left px-4 py-2">Title</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Priority</th>
                    <th className="text-left px-4 py-2">Due</th>
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="border-t border-mc-border">
                      <td className="px-4 py-2">{t.title}</td>
                      <td className="px-4 py-2">{t.status}</td>
                      <td className="px-4 py-2">{t.priority}</td>
                      <td className="px-4 py-2">{t.due_date || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => quickAutoRoute(t)}
                            className="px-2 py-1 text-xs border border-mc-border rounded hover:bg-mc-bg-tertiary flex items-center gap-1"
                            title="Auto-route + dispatch"
                          >
                            <Route className="w-3 h-3" /> Route
                          </button>
                          <button
                            onClick={() => quickDispatch(t)}
                            className="px-2 py-1 text-xs border border-mc-border rounded hover:bg-mc-bg-tertiary flex items-center gap-1"
                            title="Dispatch"
                          >
                            <Send className="w-3 h-3" /> Dispatch
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-mc-text-secondary">No tasks found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
