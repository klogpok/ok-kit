---
name: orchestrate-spec
description: Implement a whole spec folder (`.scratch/<feature>/`) with parallel worktree agents - a frontier of ready tickets whose files do not overlap, TDD, automatic heartbeats, serial merges, spec and standards review, full checks; resumes an interrupted run. Use when the user asks to orchestrate, run or implement an entire spec or all its tickets, or to resume an orchestration.
argument-hint: <spec folder, e.g. .scratch/phase-10>
---

# Orchestrate a spec

You are the orchestrator. You plan, launch, watch, merge and report; ticket agents write the code. Keep messages to agents short and point at files (spec, ticket, rules) instead of copying them.

`<feature>` is the folder name of the spec under `.scratch/`. `ORCH <command>` below means `node <main checkout>/scripts/orchestrator.mjs <command> --spec <feature>`, with the absolute path of the main checkout: append `--spec <feature>` to every command but `tickets`. Other sessions may orchestrate other specs of this checkout at the same time. Each orchestration keeps everything in `.orchestrator/<feature>/` of the main checkout (`lock`, `plan.json`, `state.json`, heartbeats, `progress.md`, logs) and re-renders `.orchestrator/<feature>/progress.md` and the index `.orchestrator/progress.md` (one line per spec) on every write. Write the logs of your checks into `.orchestrator/<feature>/` too. Run `pnpm` only from the PowerShell tool (Bash gets "Access denied").

Heartbeats are automatic: the hook `scripts/orchestrator-heartbeat.mjs` finds the spec by the agent id and writes `.orchestrator/<feature>/<ticket>.json` on every tool call of the agent bound to a running ticket (`ORCH set <id> running --agent <agent id>`), with the agent's folder in `cwd`. A silent agent is a hung one.

## Models

- Fixer, merger and Explore agents: `model: "sonnet"`, `effort: "high"`.
- Ticket agents: the session model by default. In the table of step 2 add a `model` column: propose `sonnet` for a mechanical ticket (one binding, a rename, docs, tests only) and the session model for one that makes design decisions; the user confirms it with the ticket choice.
- A replacement for a `STALE` agent keeps the model of the agent it replaces.
- A retry after a failure (a failed ticket, a merge still red after a Sonnet fixer) runs on the session model.

## 1. Lock, preconditions, resume

1. `ORCH lock acquire`. The lock belongs to this spec only. If it fails, another session is orchestrating this spec: stop and tell the user which one. Every way this skill ends (done, stopped by the user, given up) ends with `ORCH lock release`.
2. If `.orchestrator/<feature>/state.json` exists and its phase is not `done`, an orchestration of this spec was interrupted: go to "Resume" below instead of steps 2–3. (The first `ORCH` command moves a top-level `.orchestrator/state.json` of an earlier run into the folder of its spec.)
3. The main checkout is on `master` with a clean `git status`. Otherwise stop and ask.
4. Tell the user the path of `.orchestrator/<feature>/progress.md`, and of the index `.orchestrator/progress.md` when other specs are orchestrated: they can read them at any time. `progress.md` also draws the dependency graph, the times and the forecast in Mermaid, and the status line of this repo (`scripts/orchestrator-statusline.mjs`) sums up every running spec.

## 2. Choose the tickets — one question

`ORCH tickets <spec folder>` lists every ticket with `status`, `open`, `deferred` and `blockedBy`.

Show the open tickets as a table (number, title, status, deferred, blocked by, model — see "Models"). Deferred and `needs-info` tickets are open: list them, never drop them silently. Then ask once with AskUserQuestion: "all open tickets, deferred included" (recommended), "only ready-for-agent", "all except deferred"; the user can type numbers instead. A `needs-info` ticket the user includes still needs its answer: put the question in the same message.

## 3. Predict files and plan

Launch one Explore agent per ~8 selected tickets, in parallel. Each reads the spec, its tickets and the code, and returns for every ticket the files and folders it will create or change (tests, stories and `visual/` baselines included). Files that every ticket appends to — `CHANGELOG.md`, the component reference in `projects/ui-kit/README.md`, `docs/DECISIONS.md`, the `storySort` list in `.storybook/preview.ts` — are not listed: merges resolve those.

Write `.orchestrator/<feature>/plan.json`:

```json
{ "spec": ".scratch/<feature>", "base": "master", "branch": "spec/<feature>",
  "tickets": [{ "id": "03", "files": ["projects/ui-kit/dialog", "projects/ui-kit/popover/popover.scss"] }] }
```

`ORCH init` checks the blockers (one that is neither selected nor done is an error: report it and ask). Create the integration branch without checking it out: `git branch spec/<feature> master`.

## 4. The loop

Repeat until this spec has nothing in flight and nothing pending (`inFlight` and `pending` of `ORCH next` are 0), apart from the `blockedForGood` tickets.

**Launch.** `ORCH next` prints `launch`: the pending tickets whose blockers are merged and whose files overlap nothing in flight, at most 4 in flight across every spec of the checkout (`elsewhere` counts those of the other specs). For each, launch a `general-purpose` agent with `isolation: "worktree"` and `run_in_background: true`, then at once `ORCH set <id> running --agent <agent id>`. The prompt:

> Implement ticket `<ticket path>` of spec `<spec path>`. Follow `CLAUDE.md` and `.claude/rules/`.
> - Setup: `git merge --ff-only spec/<feature>`, then `pnpm install --frozen-lockfile --prefer-offline` from the PowerShell tool.
> - Build it with the Skill tool `mattpocock-skills:tdd`. Commit after every green step (`feat(<name>): ...`); hooks must run.
> - At each TDD step run `node <main>/scripts/orchestrator.mjs beat <id> "<red|green|refactor>: <what>" --spec <feature>`; it describes your progress to the user.
> - In the ticket file tick the done items in both languages and set `Status: done` / `Статус: сделано`.
> - Before reporting, `pnpm check` (PowerShell) must pass. Do not merge into `spec/<feature>`.
> - A ticket item asking for `/phase-check` or a full `test-visual` / `test-host-css` run belongs to the orchestrator: its verify runs them once for the whole spec. Leave that item unticked and run the `--filter` variants for the stories you changed.
> - Stop every process you started. Never kill one you did not start.
> - Report: branch, worktree path, commits, test counts, deviations from the ticket, open questions.

**Watch.** While a ticket runs, keep one watcher: the Bash tool with `run_in_background: true`, `ORCH watch --stale 600 --every 300`. It exits with one line:

- `STALE <ids>` — no tool call for 10 minutes (20 inside one call). For each id: TaskStop the agent, then launch a replacement the same way, told to continue from the old branch (`git merge --ff-only <old branch>`; the old worktree is `cwd` in `ORCH status`), to recover uncommitted work with `git -C <old worktree> diff`, and given the last `step`. `ORCH set <id> running --agent <new id> --note "restarted"`. Start a new watcher.
- `IDLE` — nothing runs; start a new one with the next launch. When `next` launches nothing because other specs fill the shared limit (`elsewhere`) and nothing of this spec is in flight, start the watcher anyway: it exits `IDLE` after `--every` seconds, then ask `next` again.
- `REPLACED by a newer watcher` — another watcher of this spec runs; nothing to do.

**Merge, as soon as an agent reports**, one merge at a time (finish the current one first). `ORCH set <id> merging --worktree <path> --branch <branch>`, then:

1. `git -C <worktree> rebase spec/<feature>`. On a conflict, `git -C <worktree> rebase --abort` and launch a foreground merger agent in that worktree: rebase, keep the intent of both sides, run `pnpm check`, commit.
2. `pnpm check` in the worktree (PowerShell). Red: a foreground fixer agent in the worktree; still red after it, the ticket fails.
3. From the main checkout, `git fetch . <branch>:spec/<feature>`. It only fast-forwards; if it refuses, go back to 1.
4. `ORCH set <id> merged`. Remove the worktree from the main checkout: `node scripts/remove-worktree.mjs <name>` (PowerShell).
5. Launch again: a merge frees files and unblocks tickets.

**Failures.** An agent that reports it could not finish, or a merge that stays red: `ORCH set <id> failed --note "<why>"`. Retry once with a fresh agent and the failure in the prompt (`ORCH set <id> pending`, then launch); failed twice, it stays `failed`. Tickets behind a failed one are listed in `blockedForGood` by `ORCH next`: they go into the report.

## 5. Review and fix

`ORCH phase review`. Call the Skill tool `mattpocock-skills:code-review` for the changes of `spec/<feature>` since `master`, with the spec folder as the spec: it runs the standards and the spec reviewers in parallel. Hand every finding to one foreground fixer agent (`isolation: "worktree"`, based on `spec/<feature>`, same rules as a ticket agent), then merge its branch as in step 4. Findings that need a decision of the user are not fixed: collect them for the report.

## 6. Verify

`ORCH verify-lock acquire` with the Bash tool and `run_in_background: true`: it waits while another spec is in verify, so two full visual and host-CSS runs never load the machine at once (it prints `waiting: <feature> is in verify …` meanwhile), and exits once it holds the lock, with the last line `acquired` or `took over a stale verify lock of <feature>`. Then `ORCH phase verify`. Leaving verify (`ORCH phase done`, or any other phase) releases the lock; when you stop inside verify, `ORCH verify-lock release`. In a worktree on `spec/<feature>`, run the automated chain of section 1 of `.claude/skills/phase-check/SKILL.md` (all tests, builds, stories, visual, host CSS). On failure, a fixer agent and the merge of step 4 again; after two rounds still red, stop and report the failures with their output. Green: in that worktree tick the `/phase-check` items the ticket agents left open (both languages), commit and fast-forward `spec/<feature>`.

## 7. Report and hand over

`ORCH phase done`. Report in Russian: merged, failed and blocked tickets, test counts, review findings fixed and left, decisions the user must make (each as a `needs-info` ticket, see `docs/agents/issue-tracker.md`). Then ask with AskUserQuestion: "fast-forward `master` to `spec/<feature>`" (recommended when everything is green) or "keep the branch". On yes: `git merge --ff-only spec/<feature>` in the main checkout. Remove the remaining worktrees, then `ORCH lock release`.

## Resume

`ORCH status` lists every ticket with its status, agent, worktree (`cwd` of its last heartbeat) and last heartbeat. Tell the user what was done and what is left, then continue:

- `running` — if `lock acquire` took over a stale lock, the previous session is gone and its agents with it: launch replacements at once, as for `STALE`. If this session already held the lock (after `/compact`), its agents may still be alive: start the watcher and let it decide.
- `merging` or `review` — do the merge of step 4 again from its first step.
- `pending`, `merged`, `failed` — nothing to repair; the loop picks them up.

Then go on with the phase in `.orchestrator/<feature>/state.json`: step 4, 5 or 6. A resume into step 6 starts with `ORCH verify-lock acquire`; it returns at once when this spec already holds the lock.
