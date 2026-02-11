import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';

interface NumberRow { value: number }
interface StatusRow { status: string; count: number }

/**
 * GET /api/reports/metrics?windowDays=7
 * Minimal ops metrics for Mission Control.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const windowDays = Math.max(Number(searchParams.get('windowDays') || '7'), 1);
    const now = new Date();
    const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const reviewAge = queryOne<NumberRow>(
      `SELECT COALESCE(AVG((julianday(?) - julianday(updated_at)) * 24), 0) as value
       FROM tasks
       WHERE status = 'review'`,
      [nowIso]
    );

    const lateByStatus = queryAll<StatusRow>(
      `SELECT status, COUNT(*) as count
       FROM tasks
       WHERE due_date IS NOT NULL
         AND due_date <= ?
         AND status IN ('assigned','in_progress','review')
       GROUP BY status`,
      [nowIso]
    );

    const dispatchAttempts = queryOne<NumberRow>(
      `SELECT COALESCE(SUM(COALESCE(dispatch_count, 0)), 0) as value
       FROM tasks
       WHERE updated_at >= ?`,
      [since]
    );

    const dispatchFailures = queryOne<NumberRow>(
      `SELECT COUNT(*) as value
       FROM task_activities
       WHERE activity_type = 'status_changed'
         AND message LIKE 'Dispatch failed%'
         AND created_at >= ?`,
      [since]
    );

    const countsMap = Object.fromEntries(
      lateByStatus.map((row) => [row.status, row.count])
    ) as Record<string, number>;

    const attempts = dispatchAttempts?.value || 0;
    const failures = dispatchFailures?.value || 0;
    const successRate = attempts > 0 ? ((attempts - failures) / attempts) * 100 : 100;

    return NextResponse.json({
      generated_at: nowIso,
      window_days: windowDays,
      metrics: {
        avg_review_age_hours: Number((reviewAge?.value || 0).toFixed(2)),
        late_tasks: {
          assigned: countsMap.assigned || 0,
          in_progress: countsMap.in_progress || 0,
          review: countsMap.review || 0,
          total: (countsMap.assigned || 0) + (countsMap.in_progress || 0) + (countsMap.review || 0),
        },
        dispatch: {
          attempts,
          failures,
          success_rate_pct: Number(successRate.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Failed to generate metrics report:', error);
    return NextResponse.json({ error: 'Failed to generate metrics report' }, { status: 500 });
  }
}
