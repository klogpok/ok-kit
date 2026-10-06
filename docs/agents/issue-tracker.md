# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings), mirrored by a `Статус:` line in the translation. A finished ticket is `done` (`сделано` in Russian); the triage roles stay in English in both lines
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- `node scripts/check-scratch.mjs` checks the status lines, the translation section and that both checklists tick the same items; the pre-commit hook runs it

## Open review questions

Every question a phase report leaves to the user is its own ticket in that feature's `issues/`, with `Status: needs-info`, the facts in the body and the options to choose from. Answered, it becomes `done`, and the answer goes to `docs/DECISIONS.md`. So "what is still open" is the list of `needs-info` tickets: `DECISIONS.md` holds answers only.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.

## Language

This repo's root `CLAUDE.md` requires every issue/ticket markdown file to keep its original
English content and add a full Russian translation below it, under a `## Русский перевод`
heading. That applies to every file written under `.scratch/`, including specs and map files.
