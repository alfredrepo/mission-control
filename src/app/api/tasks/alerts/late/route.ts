import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import type { Task } from '@/lib/types';

interface LateTask extends Task {
  assigned_agent_name?: string;
}

/**
 * GET /api/tasks/alerts/late
 * Returns tasks past due (or due now) for orchestration alerts.
 */
export async function GET() {
  try {
    const now = new Date().toISOString();

    const lateTasks = queryAll<LateTask>(
      `SELECT
        t.*,
        a.name as assigned_agent_name
       FROM tasks t
       LEFT JOIN agents a ON t.assigned_agent_id = a.id
       WHERE t.due_date IS NOT NULL
         AND t.due_date <= ?
         AND t.status IN ('assigned', 'in_progress', 'review')
       ORDER BY t.due_date ASC`,
      [now]
    );

    const grouped = {
      assigned: lateTasks.filter(t => t.status === 'assigned'),
      in_progress: lateTasks.filter(t => t.status === 'in_progress'),
      review: lateTasks.filter(t => t.status === 'review'),
    };

    return NextResponse.json({
      now,
      total: lateTasks.length,
      grouped,
      tasks: lateTasks,
    });
  } catch (error) {
    console.error('Failed to fetch late task alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch late task alerts' }, { status: 500 });
  }
}
