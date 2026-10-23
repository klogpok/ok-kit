// PreToolUse and PostToolUse hook of this repo (`.claude/settings.json`): the heartbeat of
// `/orchestrate-spec`. When a ticket agent of a running orchestration calls a tool, it finds the
// spec whose running ticket names that agent among every `.orchestrator/<feature>/state.json`,
// writes `.orchestrator/<feature>/<ticket>.json` (time, tool, still in the call or not, the agent's
// folder) and re-renders that spec's `progress.md`, so a silent agent is a hung one, whatever the
// agent remembers to do. It never blocks and never fails: no orchestration, no agent, a broken
// state or any other error ends with exit 0.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { agentSpec, heartbeatFor, renderProgress } from './orchestrator.lib.mjs';

try {
  const base = join(process.env.CLAUDE_PROJECT_DIR ?? '.', '.orchestrator');
  if (existsSync(base)) {
    const event = JSON.parse(readFileSync(0, 'utf8'));
    const states = {};
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        states[entry.name] = JSON.parse(readFileSync(join(base, entry.name, 'state.json'), 'utf8'));
      } catch {
        // No orchestration in this folder, or a broken one: the others still beat.
      }
    }
    const feature = agentSpec(states, event.agent_id);
    if (feature) {
      const dir = join(base, feature);
      const state = states[feature];
      const read = (id) => {
        const file = join(dir, `${id}.json`);
        return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
      };
      const beats = Object.fromEntries(
        Object.keys(state.tickets ?? {}).flatMap((id) => (read(id) ? [[id, read(id)]] : [])),
      );
      const next = heartbeatFor(state, beats, event, Date.now());
      if (next) {
        writeFileSync(join(dir, `${next.id}.json`), `${JSON.stringify(next.beat, null, 2)}\n`);
        beats[next.id] = next.beat;
        writeFileSync(join(dir, 'progress.md'), renderProgress(state, beats, Date.now()));
      }
    }
  }
} catch {
  // A heartbeat must never disturb the agent.
}
process.exit(0);
