/**
 * AI-ROADMAP Phase 9 — the committed floors and the cron gate agree with the
 * rules they claim to enforce.
 *
 * `scripts/ai-completion-floor-gate.mjs` is plain ESM so it can run in a cron
 * job without a build step, which means it restates the margin and volume
 * threshold instead of importing them. That duplication is fine only while
 * something notices when it drifts. This is that something.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  checkCompletionFloors,
  COMPLETION_FLOOR_MARGIN,
  COMPLETION_FLOOR_MIN_CALLS,
  type CompletionFloors,
} from './ai-completion-floor.util.js';
import { COMPLETION_RATE_TARGET } from './ai-completion-rate.util.js';

const floors = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ai-completion-floors.json'), 'utf8'),
) as CompletionFloors & Record<string, unknown>;

const gateSource = fs.readFileSync(
  path.resolve(__dirname, '../../../../scripts/ai-completion-floor-gate.mjs'),
  'utf8',
);

describe('the cron gate matches the util it duplicates', () => {
  it('uses the same margin', () => {
    expect(gateSource).toContain(`const MARGIN = ${COMPLETION_FLOOR_MARGIN};`);
  });

  it('uses the same volume threshold', () => {
    expect(gateSource).toContain(
      `const MIN_CALLS = ${COMPLETION_FLOOR_MIN_CALLS};`,
    );
  });

  it('has no path that lowers a floor', () => {
    // `--update` ratchets. Giving ground has to be a hand edit to the committed
    // JSON so it appears in review.
    expect(gateSource).toContain('proposed > existing');
    expect(gateSource).toContain('proposedOverall > current.overall');
  });
});

describe('the committed floors', () => {
  it('records the margin they were built with', () => {
    expect(floors.marginUsed).toBe(COMPLETION_FLOOR_MARGIN);
  });

  it('covers every surface that carries real traffic', () => {
    // §28: customer 3,703 calls, dashboard 1,161, provider 498. All three are
    // well above the threshold, so all three must be held.
    expect(Object.keys(floors.bySurface).sort()).toEqual([
      'customer',
      'dashboard',
      'provider',
    ]);
  });

  it('sits below §7 target, so the ratchet still has somewhere to go', () => {
    // If a floor ever reaches 92 the north star is met and this gate has done
    // its job. Until then a floor at or above target would be unmeetable.
    expect(floors.overall).toBeLessThan(COMPLETION_RATE_TARGET);
    for (const value of Object.values(floors.bySurface)) {
      expect(value).toBeLessThan(COMPLETION_RATE_TARGET);
    }
  });

  it('is a floor, not a target — every value is a plausible rate', () => {
    expect(floors.overall).toBeGreaterThan(0);
    for (const value of Object.values(floors.bySurface)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('passes against the traffic it was seeded from', () => {
    // The seed measurement must not breach its own floors on day one — a gate
    // that is red the moment it lands gets disabled rather than fixed.
    const seeded = {
      overall: { calls: 5362, completionRate: 64.0 },
      bySurface: [
        { surface: 'customer', calls: 3703, completionRate: 60.6 },
        { surface: 'dashboard', calls: 1161, completionRate: 67.1 },
        { surface: 'provider', calls: 498, completionRate: 82.5 },
      ],
    };
    expect(checkCompletionFloors(seeded, floors).passed).toBe(true);
  });

  it('would catch the platform sliding back a further two points', () => {
    // Proves the seeded floors are tight enough to be worth having: the margin
    // absorbs noise, not a real slide.
    const slid = {
      overall: { calls: 5362, completionRate: 60.0 },
      bySurface: [
        { surface: 'customer', calls: 3703, completionRate: 56.0 },
        { surface: 'dashboard', calls: 1161, completionRate: 67.1 },
        { surface: 'provider', calls: 498, completionRate: 82.5 },
      ],
    };
    const result = checkCompletionFloors(slid, floors);
    expect(result.passed).toBe(false);
    expect(result.breaches.map((b) => b.scope).sort()).toEqual([
      'overall',
      'surface:customer',
    ]);
  });
});
