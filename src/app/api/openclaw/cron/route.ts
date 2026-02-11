import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/lib/openclaw/client';

/**
 * GET /api/openclaw/cron
 * Lists cron jobs configured in OpenClaw Gateway.
 */
export async function GET() {
  try {
    const client = getOpenClawClient();
    if (!client.isConnected()) {
      await client.connect();
    }

    const response = await client.call<{ jobs?: unknown[]; entries?: unknown[] } | unknown[]>('cron.list');

    const jobs = Array.isArray(response)
      ? response
      : Array.isArray((response as { jobs?: unknown[] })?.jobs)
      ? (response as { jobs?: unknown[] }).jobs
      : Array.isArray((response as { entries?: unknown[] })?.entries)
      ? (response as { entries?: unknown[] }).entries
      : [];

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Failed to list OpenClaw cron jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list cron jobs' },
      { status: 500 }
    );
  }
}
