import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { autoRouteTask } from '@/lib/auto-routing';
import { run } from '@/lib/db';
import { getMissionControlUrl } from '@/lib/config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/[id]/auto-route
 * Auto-assigns a task based on keyword/profile scoring.
 * Body:
 *  - apply?: boolean (default true)
 *  - dispatch?: boolean (default true)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      apply?: boolean;
      dispatch?: boolean;
    };

    const apply = body.apply ?? true;
    const dispatch = body.dispatch ?? true;

    const { task, selected, ranked } = autoRouteTask(id);

    if (!apply) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        taskId: task.id,
        selected: {
          agentId: selected.agent.id,
          agentName: selected.agent.name,
          score: selected.score,
          reasons: selected.reasons,
        },
        ranked: ranked.slice(0, 5).map((r) => ({
          agentId: r.agent.id,
          agentName: r.agent.name,
          score: r.score,
          reasons: r.reasons,
        })),
      });
    }

    const now = new Date().toISOString();

    // Assign and move to assigned state if needed
    run(
      `UPDATE tasks
       SET assigned_agent_id = ?,
           status = CASE WHEN status IN ('inbox', 'planning') THEN 'assigned' ELSE status END,
           updated_at = ?
       WHERE id = ?`,
      [selected.agent.id, now, task.id]
    );

    run(
      `INSERT INTO events (id, type, agent_id, task_id, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'task_assigned',
        selected.agent.id,
        task.id,
        `Auto-routed "${task.title}" to ${selected.agent.name}`,
        now,
      ]
    );

    run(
      `INSERT INTO task_activities (id, task_id, agent_id, activity_type, message, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        task.id,
        selected.agent.id,
        'updated',
        `Auto-routed to ${selected.agent.name}`,
        JSON.stringify({
          action: 'auto_route',
          selectedScore: selected.score,
          selectedReasons: selected.reasons,
          topCandidates: ranked.slice(0, 3).map((r) => ({
            agentId: r.agent.id,
            name: r.agent.name,
            score: r.score,
          })),
        }),
        now,
      ]
    );

    if (dispatch) {
      const missionControlUrl = getMissionControlUrl();
      fetch(`${missionControlUrl}/api/tasks/${task.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.error('Auto-route dispatch failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      assignedAgent: {
        id: selected.agent.id,
        name: selected.agent.name,
      },
      score: selected.score,
      reasons: selected.reasons,
      dispatched: dispatch,
    });
  } catch (error) {
    console.error('Failed to auto-route task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to auto-route task' },
      { status: 500 }
    );
  }
}
