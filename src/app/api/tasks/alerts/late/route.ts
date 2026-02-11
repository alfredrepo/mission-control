import { NextRequest, NextResponse } from 'next/server';
import { queryAll, run } from '@/lib/db';
import type { Task } from '@/lib/types';

interface LateTask extends Task {
  assigned_agent_name?: string;
}

/**
 * GET /api/tasks/alerts/late
 * Returns tasks past due (or due now) for orchestration alerts.
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const { searchParams } = new URL(request.url);
    const mark = searchParams.get('mark') === 'true';
    const repeatAfterMinutes = Number(searchParams.get('repeatAfterMinutes') || '60');
    const thresholdIso = new Date(now.getTime() - Math.max(repeatAfterMinutes, 1) * 60_000).toISOString();

    const lateTasks = queryAll<LateTask>(
      `SELECT
        t.*,
        a.name as assigned_agent_name
       FROM tasks t
       LEFT JOIN agents a ON t.assigned_agent_id = a.id
       WHERE t.due_date IS NOT NULL
         AND t.due_date <= ?
         AND t.status IN ('assigned', 'in_progress', 'review')
         AND (
           t.late_alerted_at IS NULL
           OR t.late_alerted_at <= ?
           OR t.late_alert_status IS NULL
           OR t.late_alert_status != t.status
         )
       ORDER BY t.due_date ASC`,
      [nowIso, thresholdIso]
    );

    const grouped = {
      assigned: lateTasks.filter(t => t.status === 'assigned'),
      in_progress: lateTasks.filter(t => t.status === 'in_progress'),
      review: lateTasks.filter(t => t.status === 'review'),
    };

    if (mark && lateTasks.length > 0) {
      for (const task of lateTasks) {
        run(
          'UPDATE tasks SET late_alerted_at = ?, late_alert_status = ?, updated_at = updated_at WHERE id = ?',
          [nowIso, task.status, task.id]
        );
      }
    }

    return NextResponse.json({
      now: nowIso,
      repeatAfterMinutes,
      marked: mark,
      total: lateTasks.length,
      grouped,
      tasks: lateTasks,
    });
  } catch (error) {
    console.error('Failed to fetch late task alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch late task alerts' }, { status: 500 });
  }
}
