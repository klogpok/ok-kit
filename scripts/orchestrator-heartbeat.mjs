// PreToolUse and PostToolUse hook of this repo (`.claude/settings.json`): the heartbeat of
// `/orchestrate-spec`. When a ticket agent of the running orchestration calls a tool, it writes
// `.orchestrator/<ticket>.json` (time, tool, still in the call or not, the agent's folder) and
// re-renders `progress.md`, so a silent agent is a hung one, whatever the agent remembers to do.
// It never blocks and never fails: no orchestration, no agent or any error ends with exit 0.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { heartbeatFor, renderProgress } from './orchestrator.lib.mjs';

try {
  const dir = join(process.env.CLAUDE_PROJECT_DIR ?? '.', '.orchestrator');
  const stateFile = join(dir, 'state.json');
  if (existsSync(stateFile)) {
    const event = JSON.parse(readFileSync(0, 'utf8'));
    const state = JSON.parse(readFileSync(stateFile, 'utf8'));
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
} catch {
  // A heartbeat must never disturb the agent.
}
process.exit(0);
