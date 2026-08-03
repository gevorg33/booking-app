/**
 * AI-ROADMAP Phase 0 — detector freeze (ratchet).
 *
 * The roadmap's core structural problem: ~786 `is*Prompt` paraphrase detectors
 * and ~163 `tryRescue*` methods can each overwrite the others' decision, so the
 * winning command depends on execution order. Measured on production traces,
 * 70% of action changes after classification come from the rescue layer.
 *
 * This gate does not remove any of them — it freezes the counts so they can
 * only go DOWN. A PR that adds a new paraphrase detector fails here; a PR that
 * deletes one is expected to lower the baseline in the same commit.
 *
 * Keep the baseline honest: never raise a number to make this pass. If a new
 * detector is genuinely unavoidable (P0 hotfix), the roadmap requires an
 * inventory row with an owner and a 14-day expiry — and the ratchet should be
 * restored when it expires.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AI_DIR = join(__dirname);

/** Frozen at the AI-ROADMAP merge point (2026-08-03). Lower these, never raise. */
const BASELINE = {
  isPromptDetectors: 786,
  tryRescueMethods: 163,
} as const;

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkTsFiles(full, acc);
      continue;
    }
    if (entry.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

function countMatches(pattern: RegExp): number {
  let total = 0;
  for (const file of walkTsFiles(AI_DIR)) {
    const matches = readFileSync(file, 'utf8').match(pattern);
    total += matches?.length ?? 0;
  }
  return total;
}

describe('AI-ROADMAP Phase 0 — detector freeze', () => {
  it(`does not add new is*Prompt paraphrase detectors (baseline ${BASELINE.isPromptDetectors})`, () => {
    const count = countMatches(/export function is[A-Za-z0-9_]*Prompt/g);
    expect(count).toBeLessThanOrEqual(BASELINE.isPromptDetectors);
  });

  it(`does not add new tryRescue* override methods (baseline ${BASELINE.tryRescueMethods})`, () => {
    const count = countMatches(/private (?:async )?tryRescue[A-Za-z0-9_]*/g);
    expect(count).toBeLessThanOrEqual(BASELINE.tryRescueMethods);
  });

  it('reports the current burn-down so progress is visible in CI output', () => {
    const detectors = countMatches(/export function is[A-Za-z0-9_]*Prompt/g);
    const rescues = countMatches(/private (?:async )?tryRescue[A-Za-z0-9_]*/g);
    // eslint-disable-next-line no-console
    console.log(
      `[AI-ROADMAP burn-down] is*Prompt ${detectors}/${BASELINE.isPromptDetectors} · ` +
        `tryRescue* ${rescues}/${BASELINE.tryRescueMethods}`,
    );
    expect(detectors).toBeGreaterThan(0);
  });
});
