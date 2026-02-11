import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';
import type { AgentMemory } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/agents/[id]/memory
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const memory = queryOne<AgentMemory>(
      'SELECT * FROM agent_memories WHERE agent_id = ?',
      [id]
    );

    if (!memory) {
      return NextResponse.json({
        agent_id: id,
        working_memory: '',
        long_term_memory: '',
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Failed to fetch agent memory:', error);
    return NextResponse.json({ error: 'Failed to fetch agent memory' }, { status: 500 });
  }
}

// PUT /api/agents/[id]/memory
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      working_memory?: string;
      long_term_memory?: string;
    };

    const now = new Date().toISOString();
    const existing = queryOne<AgentMemory>('SELECT * FROM agent_memories WHERE agent_id = ?', [id]);

    if (existing) {
      run(
        `UPDATE agent_memories
         SET working_memory = COALESCE(?, working_memory),
             long_term_memory = COALESCE(?, long_term_memory),
             updated_at = ?
         WHERE agent_id = ?`,
        [body.working_memory ?? null, body.long_term_memory ?? null, now, id]
      );
    } else {
      run(
        `INSERT INTO agent_memories (agent_id, working_memory, long_term_memory, updated_at)
         VALUES (?, ?, ?, ?)`,
        [id, body.working_memory || '', body.long_term_memory || '', now]
      );
    }

    const updated = queryOne<AgentMemory>('SELECT * FROM agent_memories WHERE agent_id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update agent memory:', error);
    return NextResponse.json({ error: 'Failed to update agent memory' }, { status: 500 });
  }
}
