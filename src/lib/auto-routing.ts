import { queryAll, queryOne } from '@/lib/db';
import type { Agent, Task } from '@/lib/types';

interface RoutingProfile {
  id: string;
  keywords: string[];
  affinityHints: string[];
}

export interface RoutingDecision {
  agent: Agent;
  score: number;
  reasons: string[];
}

const routingProfiles: RoutingProfile[] = [
  {
    id: 'regional-news',
    keywords: ['news', 'trend', 'x trend', 'twitter', 'weather', 'forecast', 'election', 'results', 'research', 'portugal'],
    affinityHints: ['news', 'research', 'scout', 'analyst', 'regional', 'weather'],
  },
  {
    id: 'ops',
    keywords: ['api', 'integration', 'deploy', 'vercel', 'server', 'database', 'script', 'automation', 'cron', 'webhook', 'bug', 'fix', 'build'],
    affinityHints: ['ops', 'engineer', 'developer', 'dev', 'backend', 'automation', 'executor'],
  },
  {
    id: 'platform-builder',
    keywords: ['platform', 'backend', 'architecture', 'api', 'database', 'scalable', 'microservice', 'service', 'infra', 'integration'],
    affinityHints: ['platform', 'backend', 'architect', 'architecture', 'builder', 'design', 'product'],
  },
  {
    id: 'briefing',
    keywords: ['summary', 'brief', 'format', 'rewrite', 'polish', 'digest', 'telegram copy'],
    affinityHints: ['brief', 'editor', 'writer', 'copy', 'content', 'synthesizer'],
  },
];

function countHits(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(term));
}

function scoreAgent(taskText: string, agent: Agent): RoutingDecision {
  let score = 0;
  const reasons: string[] = [];

  const agentText = `${agent.name} ${agent.role} ${agent.description || ''}`.toLowerCase();

  const isPlatformTask = ['api', 'backend', 'platform'].some((k) => taskText.includes(k));
  const isPlatformBuilderPro = agent.name.toLowerCase() === 'platform builder pro';
  if (isPlatformTask && isPlatformBuilderPro) {
    score += 20;
    reasons.push('platform-default: prioritized for api/backend/platform tasks');
  }

  for (const profile of routingProfiles) {
    const keywordHits = countHits(taskText, profile.keywords);
    const affinityHits = countHits(agentText, profile.affinityHints);

    if (keywordHits.length > 0) {
      score += keywordHits.length * 2;
      reasons.push(`${profile.id}: keyword match (${keywordHits.slice(0, 3).join(', ')})`);
    }

    if (affinityHits.length > 0) {
      score += affinityHits.length * 3;
      reasons.push(`${profile.id}: agent affinity (${affinityHits.slice(0, 3).join(', ')})`);
    }

    if (keywordHits.length > 0 && affinityHits.length > 0) {
      score += 4;
      reasons.push(`${profile.id}: strong profile fit`);
    }
  }

  if (agent.is_master) {
    score += 1; // weak tie-break only
  }

  return { agent, score, reasons };
}

export function autoRouteTask(taskId: string): {
  task: Task;
  selected: RoutingDecision;
  ranked: RoutingDecision[];
} {
  const task = queryOne<Task>('SELECT * FROM tasks WHERE id = ?', [taskId]);
  if (!task) {
    throw new Error('Task not found');
  }

  const agents = queryAll<Agent>('SELECT * FROM agents WHERE status != ?', ['offline']);
  if (agents.length === 0) {
    throw new Error('No available agents');
  }

  const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
  const ranked = agents
    .map((agent) => scoreAgent(taskText, agent))
    .sort((a, b) => b.score - a.score || Number(b.agent.is_master) - Number(a.agent.is_master));

  const selected = ranked[0];

  return { task, selected, ranked };
}
