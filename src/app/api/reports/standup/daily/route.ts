import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';

interface ItemRow {
  id: string;
  title: string;
  status?: string;
  due_date?: string | null;
  assigned_agent_name?: string | null;
}

/**
 * GET /api/reports/standup/daily?windowHours=24
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const windowHours = Math.max(Number(searchParams.get('windowHours') || '24'), 1);
    const now = new Date();
    const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const completed = queryAll<ItemRow>(
      `SELECT DISTINCT t.id, t.title, a.name as assigned_agent_name
       FROM events e
       JOIN tasks t ON t.id = e.task_id
       LEFT JOIN agents a ON a.id = t.assigned_agent_id
       WHERE e.type = 'task_completed'
         AND e.created_at >= ?
       ORDER BY e.created_at DESC
       LIMIT 12`,
      [since]
    );

    const inProgress = queryAll<ItemRow>(
      `SELECT t.id, t.title, t.status, t.due_date, a.name as assigned_agent_name
       FROM tasks t
       LEFT JOIN agents a ON a.id = t.assigned_agent_id
       WHERE t.status IN ('assigned', 'in_progress')
       ORDER BY COALESCE(t.due_date, '9999-12-31T23:59:59.999Z') ASC, t.updated_at DESC
       LIMIT 12`
    );

    const needsReview = queryAll<ItemRow>(
      `SELECT t.id, t.title, t.due_date, a.name as assigned_agent_name
       FROM tasks t
       LEFT JOIN agents a ON a.id = t.assigned_agent_id
       WHERE t.status = 'review'
       ORDER BY t.updated_at DESC
       LIMIT 12`
    );

    const blocked = queryAll<ItemRow>(
      `SELECT t.id, t.title, t.status, t.due_date, a.name as assigned_agent_name
       FROM tasks t
       LEFT JOIN agents a ON a.id = t.assigned_agent_id
       WHERE t.status IN ('assigned', 'in_progress', 'review')
         AND t.due_date IS NOT NULL
         AND t.due_date <= ?
       ORDER BY t.due_date ASC
       LIMIT 12`,
      [nowIso]
    );

    const totals = queryOne<{ total_open: number; total_done_today: number }>(
      `SELECT
         (SELECT COUNT(*) FROM tasks WHERE status IN ('inbox','assigned','in_progress','review')) as total_open,
         (SELECT COUNT(*) FROM events WHERE type = 'task_completed' AND created_at >= ?) as total_done_today`,
      [since]
    );

    return NextResponse.json({
      generated_at: nowIso,
      window_hours: windowHours,
      totals: {
        open: totals?.total_open || 0,
        done_window: totals?.total_done_today || 0,
      },
      sections: {
        completed,
        in_progress: inProgress,
        blocked,
        needs_review: needsReview,
      },
    });
  } catch (error) {
    console.error('Failed to generate standup report:', error);
    return NextResponse.json({ error: 'Failed to generate standup report' }, { status: 500 });
  }
}
