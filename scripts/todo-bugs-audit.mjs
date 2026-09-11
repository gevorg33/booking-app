/**
 * Recompute the index summary at the top of `TODO.BUGS.MD` from the file itself.
 *
 * The summary drifted badly: it claimed 289 unique IDs / 20 Open / 269 Fixed and
 * "154 with a write-up, 89 mention-only" — the last pair not even summing to its
 * own total. Measured, the file holds 443 IDs in 427 index rows. Two sessions
 * appending rows and hand-incrementing a counter is how that happens, and a
 * hand-incremented counter is exactly the thing to stop hand-incrementing.
 *
 *   node scripts/todo-bugs-audit.mjs            # print the measured summary
 *   node scripts/todo-bugs-audit.mjs --check     # exit 1 if the file disagrees
 */
import { readFileSync } from 'node:fs';

const ID = /(?:e2e|api)-bug\.\d+/g;
const num = (id) => Number(id.split('.')[1]);
const bugs = readFileSync(new URL('../TODO.BUGS.MD', import.meta.url), 'utf8');
const todo = readFileSync(new URL('../TODO.md', import.meta.url), 'utf8');

// Prose that *discusses* ticket ids — the correction note below the summary, for
// one — must not count as the file referencing them. Writing the list of
// unindexed ids into the file changed the very count that produced the list.
const IGNORE = /<!-- audit:ignore-start -->[\s\S]*?<!-- audit:ignore-end -->/g;
const scanned = bugs.replace(IGNORE, '');

const inBugs = new Set(scanned.match(ID) ?? []);
const inTodo = new Set(todo.match(ID) ?? []);
const rows = [...scanned.matchAll(/^\| `((?:e2e|api)-bug\.\d+)` \|([^|]*)\|/gm)];
const indexed = new Set(rows.map((r) => r[1]));
const writeups = new Set(
  [...todo.matchAll(/^#{2,4} ((?:e2e|api)-bug\.\d+)/gm)].map((m) => m[1]),
);

const status = new Map();
for (const [, , cell] of rows) {
  const label = /\*\*([A-Za-z-]+)/.exec(cell)?.[1] ?? 'UNTAGGED';
  status.set(label, (status.get(label) ?? 0) + 1);
}
const sorted = [...status.entries()].sort((a, b) => b[1] - a[1]);
const diff = (a, b) => [...a].filter((x) => !b.has(x)).sort((x, y) => num(x) - num(y));

const summary = {
  'Total unique IDs': inBugs.size,
  Open: status.get('Open') ?? 0,
  Fixed: status.get('Fixed') ?? 0,
  'Resolved under another label': rows.length - (status.get('Open') ?? 0) - (status.get('Fixed') ?? 0),
  'Index rows': rows.length,
  'With dedicated write-up in TODO.md': writeups.size,
  'Mention-only (no write-up)': inTodo.size - writeups.size,
};

console.log('| | Count |\n|---|---:|');
for (const [k, v] of Object.entries(summary)) console.log(`| ${k} | ${v} |`);
console.log('\nstatus labels in use:');
for (const [k, v] of sorted) console.log(`  ${k.padEnd(14)} ${v}`);

const unindexed = diff(inBugs, indexed);
const missing = diff(inTodo, inBugs);
console.log(`\nreferenced but no index row (${unindexed.length}): ${unindexed.join(', ') || 'none'}`);
console.log(`in TODO.md but absent here (${missing.length}): ${missing.join(', ') || 'none'}`);

if (process.argv.includes('--check')) {
  const wrong = Object.entries(summary).filter(([k, v]) => {
    const m = new RegExp(`^\\| ${k.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')} \\| (\\d+) \\|`, 'm').exec(bugs);
    return m && Number(m[1]) !== v;
  });
  if (wrong.length) {
    console.error('\nSUMMARY IS STALE:');
    for (const [k, v] of wrong) console.error(`  ${k}: file says something else, measured ${v}`);
    process.exit(1);
  }
  console.log('\nsummary matches the file.');
}
