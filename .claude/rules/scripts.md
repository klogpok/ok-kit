---
paths:
  - "scripts/**"
---

# Repo scripts

- Run their tests with `pnpm test-scripts`.
- `orchestrator.lib.mjs` is pure (no disk, no processes) and tested directly. The CLI and the hooks are tested end to end in `orchestrator.test.mjs`: a temp `git init` repo, with `CLAUDE_CODE_SESSION_ID`, `CLAUDE_PID` and `CLAUDE_PROJECT_DIR` set per spawn.
- `.orchestrator/` is shared state: several sessions, their watchers and the heartbeat hook of every agent touch it at once. Every read tolerates a missing or half-written file. A lock is taken with an exclusive create (`flag: 'wx'`), and a stale one is deleted only while it is still the lock that was read. A move of several files moves its marker file (`state.json`) last.
