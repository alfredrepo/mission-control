import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

// GET /api/agents/[id]/mentions?unread=true
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const agentId = params.id;
    const unread = new URL(request.url).searchParams.get('unread') === 'true';
    const db = getDb();

    const mentions = db.prepare(`
      SELECT m.*, fa.name as from_agent_name, fa.avatar_emoji as from_agent_avatar
      FROM agent_mentions m
      LEFT JOIN agents fa ON fa.id = m.from_agent_id
      WHERE m.to_agent_id = ?
        AND (? = 0 OR m.read_at IS NULL)
      ORDER BY m.created_at DESC
      LIMIT 100
    `).all(agentId, unread ? 1 : 0);

    return NextResponse.json(mentions);
  } catch (error) {
    console.error('Failed to fetch mentions:', error);
    return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 });
  }
}

// PATCH /api/agents/[id]/mentions  { mentionIds?: string[]; markAll?: boolean }
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const agentId = params.id;
    const body = await request.json().catch(() => ({})) as { mentionIds?: string[]; markAll?: boolean };
    const db = getDb();
    const now = new Date().toISOString();

    if (body.markAll) {
      db.prepare('UPDATE agent_mentions SET read_at = ? WHERE to_agent_id = ? AND read_at IS NULL').run(now, agentId);
      return NextResponse.json({ success: true, marked: 'all' });
    }

    const ids = Array.isArray(body.mentionIds) ? body.mentionIds : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'mentionIds or markAll required' }, { status: 400 });
    }

    const stmt = db.prepare('UPDATE agent_mentions SET read_at = ? WHERE id = ? AND to_agent_id = ?');
    for (const id of ids) {
      stmt.run(now, id, agentId);
    }

    return NextResponse.json({ success: true, marked: ids.length });
  } catch (error) {
    console.error('Failed to update mentions:', error);
    return NextResponse.json({ error: 'Failed to update mentions' }, { status: 500 });
  }
}
