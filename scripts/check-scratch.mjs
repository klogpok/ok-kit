// Checks the local issue tracker under `.scratch/` (see docs/agents/issue-tracker.md):
// - every file has a `## Русский перевод` section;
// - every issue has a `Status:` line with a known value and a `Статус:` line that matches it;
// - the English and the Russian checklists agree: as many ticked and as many open items in each.
//
// Usage:
//   node scripts/check-scratch.mjs   (also run by the pre-commit hook)
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

/** English status → its Russian form; the triage roles stay in English in both. */
const STATUSES = {
  'needs-triage': 'needs-triage',
  'needs-info': 'needs-info',
  'ready-for-agent': 'ready-for-agent',
  'ready-for-human': 'ready-for-human',
  wontfix: 'wontfix',
  claimed: 'claimed',
  resolved: 'resolved',
  done: 'сделано',
};

const root = '.scratch';
const CYRILLIC = /[а-яё]/i;

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return markdownFiles(path);
      return entry.name.endsWith('.md') ? [path] : [];
    }),
  );
  return nested.flat();
}

function statusValue(text, label) {
  const match = new RegExp(`^(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*(.+?)\\s*$`, 'm').exec(text);
  return match?.[1];
}

function checkboxes(lines, russian) {
  const items = lines.filter((line) => /^\s*- \[[ x]\]/.test(line));
  const own = items.filter((line) => CYRILLIC.test(line) === russian);
  return {
    done: own.filter((line) => /^\s*- \[x\]/.test(line)).length,
    open: own.filter((line) => /^\s*- \[ \]/.test(line)).length,
  };
}

const problems = [];
for (const file of await markdownFiles(root)) {
  const name = relative('.', file).replaceAll('\\', '/');
  const text = await readFile(file, 'utf8');
  const report = (message) => problems.push(`${name}: ${message}`);

  if (!/^## Русский перевод\s*$/m.test(text)) report('no "## Русский перевод" section');

  const status = statusValue(text, 'Status');
  const russianStatus = statusValue(text, 'Статус');
  const isIssue = name.includes('/issues/');
  if (status === undefined) {
    if (isIssue) report('no "Status:" line');
  } else if (!(status in STATUSES)) {
    report(`unknown status "${status}" (allowed: ${Object.keys(STATUSES).join(', ')})`);
  } else if (russianStatus !== STATUSES[status]) {
    report(`"Статус:" is "${russianStatus ?? 'missing'}", expected "${STATUSES[status]}"`);
  }

  const lines = text.split(/\r?\n/);
  const english = checkboxes(lines, false);
  const russian = checkboxes(lines, true);
  if (english.done !== russian.done || english.open !== russian.open) {
    report(
      `checklists differ: English ${english.done} done / ${english.open} open, ` +
        `Russian ${russian.done} done / ${russian.open} open`,
    );
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
