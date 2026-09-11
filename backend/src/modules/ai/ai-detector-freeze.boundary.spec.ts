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

/**
 * The whole backend tree, not just `modules/ai`.
 *
 * The original scan root was this directory, which left four detectors —
 * `isFillGapPrompt`, `isWhosNextPrompt`, `isTeamWhosNextPrompt` (provider-mobile)
 * and `isServiceTierFilterPrompt` (common/utils) — outside the freeze entirely.
 * A new paraphrase detector added there passed CI. Found by the Phase 0
 * inventory scan, which refused to inherit the blind spot.
 */
const SCAN_ROOT = join(__dirname, '..', '..');

/**
 * Frozen at the AI-ROADMAP merge point (2026-08-03). Lower these, never raise.
 *
 * `isPromptDetectors` moved 790 → 777 on 2026-08-08: e2e-bug.354 deleted 13
 * detectors with no production caller. The ratchet is meant to fall this way —
 * Phase 8's whole direction — so this is the first time it has.
 *
 * `isPromptDetectors` moved 786 → 790 on 2026-08-05 when the scan root widened
 * from `modules/ai` to `src`. That is the four detectors named above becoming
 * visible, not four new ones: no detector was added. This is the only reason a
 * baseline may ever go up, and it must be argued in the commit that does it.
 */
const BASELINE = {
  isPromptDetectors: 777,
  tryRescueMethods: 163,
} as const;

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
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
  for (const file of walkTsFiles(SCAN_ROOT)) {
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

    console.log(
      `[AI-ROADMAP burn-down] is*Prompt ${detectors}/${BASELINE.isPromptDetectors} · ` +
        `tryRescue* ${rescues}/${BASELINE.tryRescueMethods}`,
    );
    expect(detectors).toBeGreaterThan(0);
  });
});
