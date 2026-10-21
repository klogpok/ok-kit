---
name: orchestrate-spec
description: Implement a whole spec folder (`.scratch/<feature>/`) with parallel worktree agents - batches of non-overlapping tickets, TDD, heartbeats, serial merges, spec and standards review, full checks. Use when the user asks to orchestrate, run or implement an entire spec or all its tickets.
argument-hint: <spec folder, e.g. .scratch/phase-10>
---

# Orchestrate a spec

You are the orchestrator. You plan, launch, watch, merge and report; ticket agents write the code. Keep messages to agents short and point at files (spec, ticket, rules) instead of copying them.

`ORCH` below means `node <main checkout>/scripts/orchestrator.mjs`, with the absolute path of the main checkout (agents run it from their worktrees). It keeps everything in `.orchestrator/` of the main checkout and re-renders `.orchestrator/progress.md` on every write. Run `pnpm` only from the PowerShell tool (Bash gets "Access denied").

## 1. Lock and preconditions

1. `ORCH lock acquire`. If it fails, another session is orchestrating this checkout: stop and tell the user which one. Every way this skill ends (done, stopped by the user, given up) ends with `ORCH lock release`.
2. The main checkout is on `master` with a clean `git status`. Otherwise stop and ask.
3. Tell the user the path of `.orchestrator/progress.md`: they can read it at any time.

## 2. Choose the tickets — one question

`ORCH tickets <spec folder>` lists every ticket with `status`, `open`, `deferred` and `blockedBy`.

Show the open tickets as a table (number, title, status, deferred, blocked by). Deferred and `needs-info` tickets are open: list them, never drop them silently. Then ask once with AskUserQuestion: "all open tickets, deferred included" (recommended), "only ready-for-agent", "all except deferred"; the user can type numbers instead. A `needs-info` ticket the user includes still needs its answer: put the question in the same message.

## 3. Predict files and batch

Launch one Explore agent per ~8 selected tickets, in parallel. Each reads the spec, its tickets and the code, and returns for every ticket the files and folders it will create or change (tests, stories and `visual/` baselines included). Files that every ticket appends to — `CHANGELOG.md`, the component reference in `projects/ui-kit/README.md`, `docs/DECISIONS.md`, the `storySort` list in `.storybook/preview.ts` — are not listed: merges resolve those.

Write `.orchestrator/plan.json`:

```json
{ "spec": ".scratch/<feature>", "base": "master", "branch": "spec/<feature>",
  "tickets": [{ "id": "03", "files": ["projects/ui-kit/dialog", "projects/ui-kit/popover/popover.scss"] }] }
```

`ORCH init` checks blockers (a blocker that is neither selected nor done is an error: report it and ask) and prints the batches. Create the integration branch without checking it out: `git branch spec/<feature> master`.

## 4. Run a batch

For each ticket of the batch, launch a `general-purpose` agent with `isolation: "worktree"` and `run_in_background: true`, then `ORCH set <id> running --agent <agent id>`. The prompt:

> Implement ticket `<ticket path>` of spec `<spec path>`. Follow `CLAUDE.md` and `.claude/rules/`.
> - Setup: `git merge --ff-only spec/<feature>`, then `pnpm install --frozen-lockfile --prefer-offline` from the PowerShell tool.
> - Heartbeat: run `node <main>/scripts/orchestrator.mjs beat <id> "<step>"` after every TDD step, at least every ~10 tool calls, and right before any command that can take minutes. A silent agent is treated as hung after 5 minutes.
> - Build it with the Skill tool `mattpocock-skills:tdd`. Commit after every green step (`feat(<name>): ...`); hooks must run.
> - In the ticket file tick the done items in both languages and set `Status: done` / `Статус: сделано`.
> - Before reporting, `pnpm check` (PowerShell) must pass. Do not merge into `spec/<feature>`.
> - Stop every process you started. Never kill one you did not start.
> - Report: branch, worktree path, commits, test counts, deviations from the ticket, open questions.

Then start the watcher with the Bash tool, `run_in_background: true`: `ORCH watch --stale 300 --every 300`. It checks the heartbeats every 5 minutes and exits with one line:

- `STALE <ids>` — for each id, the first time: SendMessage the agent ("no heartbeat for 5 minutes: beat, report your state in one line, continue"), `ORCH log "<id> nudged"`. The second time in a row: TaskStop it and launch a replacement the same way, told to continue from the old branch (`git merge --ff-only <old branch>`), to look at uncommitted work with `git -C <old worktree> diff`, and given the last `step` of `.orchestrator/<id>.json`. `ORCH set <id> running --agent <new id> --note "restarted"`. Start the watcher again.
- `IDLE` — nothing runs; do not restart it until the next batch.

When an agent reports, `ORCH set <id> review --worktree <path> --branch <branch>`, or `failed --note "<why>"`. Retry a failed ticket once with a fresh agent and the failure in the prompt; failed twice, it stays `failed` and goes into the final report.

## 5. Merge the batch, serially

When every agent of the batch has reported, merge its tickets in ticket order. For each: `ORCH set <id> merging`, then

1. `git -C <worktree> rebase spec/<feature>`. On a conflict, `git -C <worktree> rebase --abort` and launch a foreground merger agent in that worktree: rebase, keep the intent of both sides, run `pnpm check`, commit.
2. `pnpm check` in the worktree (PowerShell). Red: a foreground fixer agent in the worktree; still red after it, `failed`.
3. From the main checkout, `git fetch . <branch>:spec/<feature>`. It only fast-forwards; if it refuses, go back to 1.
4. `ORCH set <id> merged`. Remove the worktree from the main checkout: `node scripts/remove-worktree.mjs <name>` (PowerShell).

Then the next batch (step 4): its worktrees start from the updated `spec/<feature>`.

## 6. Review and fix

`ORCH phase review`. Call the Skill tool `mattpocock-skills:code-review` for the changes of `spec/<feature>` since `master`, with the spec folder as the spec: it runs the standards and the spec reviewers in parallel. Hand every finding to one fixer agent (`isolation: "worktree"`, based on `spec/<feature>`, same rules as a ticket agent, heartbeat id `review`), then merge its branch as in step 5. Findings that need a decision of the user are not fixed: collect them for the report.

## 7. Verify

`ORCH phase verify`. In a worktree on `spec/<feature>`, run the automated chain of section 1 of `.claude/skills/phase-check/SKILL.md` (all tests, builds, stories, visual, host CSS). On failure, a fixer agent and step 5 again; after two rounds still red, stop and report the failures with their output.

## 8. Report and hand over

`ORCH phase done`. Report in Russian: merged, failed and skipped tickets, test counts, review findings fixed and left, decisions the user must make (each as a `needs-info` ticket, see `docs/agents/issue-tracker.md`). Then ask with AskUserQuestion: "fast-forward `master` to `spec/<feature>`" (recommended when everything is green) or "keep the branch". On yes: `git merge --ff-only spec/<feature>` in the main checkout. Remove the remaining worktrees, then `ORCH lock release`.
