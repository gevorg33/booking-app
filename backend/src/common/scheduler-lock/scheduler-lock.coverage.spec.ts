import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * e2e-bug.497 — every scheduled job goes through the lock.
 *
 * Wrapping the eleven jobs that existed is the easy half; the half that decays
 * is the twelfth. A new `@Cron` method written the obvious way runs on every
 * instance, and nothing about it looks wrong — it looks exactly like the ten
 * that were correct before this ticket. The failure only shows up once the
 * deployment is scaled, as duplicate customer-visible sends, which is both the
 * worst place to find it and the hardest to trace back to a scheduler.
 *
 * So the rule is asserted over the source rather than trusted to review.
 */
const MODULES_DIR = path.join(__dirname, '..', '..', 'modules');

function schedulerFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...schedulerFiles(full));
    else if (entry.name.endsWith('.scheduler.ts')) out.push(full);
  }
  return out;
}

/** The method body immediately following each `@Cron(...)` decorator. */
function cronMethods(src: string): Array<{ name: string; body: string }> {
  const out: Array<{ name: string; body: string }> = [];
  const re = /@Cron\([^\n]*\)\s*\n\s*async ([A-Za-z0-9_]+)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const open = src.indexOf('{', re.lastIndex);
    let depth = 0;
    let i = open;
    for (; i < src.length; i += 1) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    out.push({ name: m[1], body: src.slice(open, i + 1) });
  }
  return out;
}

describe('e2e-bug.497 — no scheduled job runs unlocked', () => {
  const files = schedulerFiles(MODULES_DIR);

  it('finds the scheduler files', () => {
    // Guards the assertions below against passing because the walk found
    // nothing — a rename of the `.scheduler.ts` convention would do that.
    expect(files.length).toBeGreaterThanOrEqual(9);
  });

  it('every @Cron method delegates through the scheduler lock', () => {
    const unlocked: string[] = [];
    let checked = 0;
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      for (const method of cronMethods(src)) {
        checked += 1;
        if (!method.body.includes('runExclusively')) {
          unlocked.push(`${path.basename(file)} › ${method.name}`);
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(11);
    expect(unlocked).toEqual([]);
  });

  it('each lock key is unique, so two jobs cannot exclude each other', () => {
    // Two jobs sharing a key would make one silently skip whenever the other is
    // running — a scheduling bug that looks like "the job sometimes does not
    // run", which is much harder to diagnose than a duplicate.
    const keys: string[] = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(/runExclusively\(\s*'([^']+)'/g)) {
        keys.push(m[1]);
      }
    }
    expect(keys.length).toBeGreaterThanOrEqual(11);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
