'use client';

import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { AppNavSidebar } from '@/components/AppNavSidebar';
import type { Task } from '@/lib/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tasks?workspace_id=default');
        if (res.ok) setTasks(await res.json());
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
          <CheckSquare className="w-5 h-5 text-mc-accent" />
          <h1 className="text-xl font-semibold">Tasks</h1>
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
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-t border-mc-border">
                      <td className="px-4 py-2">{t.title}</td>
                      <td className="px-4 py-2">{t.status}</td>
                      <td className="px-4 py-2">{t.priority}</td>
                      <td className="px-4 py-2">{t.due_date || '—'}</td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-mc-text-secondary">No tasks found.</td>
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
