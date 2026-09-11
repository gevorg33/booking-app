/**
 * AI-ROADMAP Phase 7 — "self-verify blocks execute on fail (not log-only)".
 *
 * The gap: `shouldEmitSelfVerifyClarify` required `confidence < 0.55` *as well
 * as* the verification having failed. So a self-verify failure at confidence
 * ≥ 0.55 was written to the trace and then ignored — the check was weakest
 * exactly where it matters, because a confident wrong answer is the case
 * self-verify exists to catch.
 *
 * The fix is risk-proportionate rather than absolute: reads keep the confidence
 * gate (a wrong read is recoverable by asking again), mutations do not.
 */
import {
  SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD,
  shouldEmitSelfVerifyClarify,
} from './ai-unknown-intent.util.js';
import { isRegistryMutating } from './ai-command-registry.util.js';

const failed = { passed: false } as never;
const passedResult = { passed: true } as never;
const corrected = { passed: false, correctedAction: 'x' } as never;

describe('shouldEmitSelfVerifyClarify', () => {
  describe('a failed verification on a mutating command', () => {
    it('blocks regardless of how confident the classifier was', () => {
      // The gap this closes. Before, 0.95 sailed through.
      for (const confidence of [0.55, 0.7, 0.95, 1]) {
        expect(
          shouldEmitSelfVerifyClarify(failed, confidence, { mutating: true }),
        ).toBe(true);
      }
    });

    it('blocks at low confidence too', () => {
      expect(shouldEmitSelfVerifyClarify(failed, 0.2, { mutating: true })).toBe(
        true,
      );
    });
  });

  describe('a failed verification on a read', () => {
    it('still blocks below the confidence threshold', () => {
      expect(
        shouldEmitSelfVerifyClarify(
          failed,
          SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD - 0.01,
          { mutating: false },
        ),
      ).toBe(true);
    });

    it('still proceeds above it', () => {
      // Deliberate: a wrong read is recoverable by asking again, and blocking
      // every confident read would make the assistant useless at answering.
      expect(
        shouldEmitSelfVerifyClarify(
          failed,
          SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD,
          { mutating: false },
        ),
      ).toBe(false);
    });

    it('defaults to read behaviour when no risk signal is supplied', () => {
      // Callers that have not been updated keep the old semantics rather than
      // silently becoming stricter.
      expect(shouldEmitSelfVerifyClarify(failed, 0.9)).toBe(false);
    });
  });

  describe('verifications that did not fail', () => {
    it('never blocks when the check passed', () => {
      expect(
        shouldEmitSelfVerifyClarify(passedResult, 0.1, { mutating: true }),
      ).toBe(false);
    });

    it('never blocks when a correction was available', () => {
      // A corrected action is self-verify doing its job, not failing at it.
      expect(
        shouldEmitSelfVerifyClarify(corrected, 0.1, { mutating: true }),
      ).toBe(false);
    });
  });

  it('is strictly more protective than before, never less', () => {
    // Every input that used to block must still block: this may only add
    // clarifications, never remove one.
    for (const confidence of [0, 0.3, 0.54, 0.55, 0.8, 1]) {
      const wasBlocked = confidence < SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD;
      for (const mutating of [true, false]) {
        const nowBlocked = shouldEmitSelfVerifyClarify(failed, confidence, {
          mutating,
        });
        if (wasBlocked) expect(nowBlocked).toBe(true);
      }
    }
  });
});

describe('the mutating signal comes from the registry', () => {
  it('recognises a real mutating command', () => {
    expect(isRegistryMutating('create_booking')).toBe(true);
  });

  it('recognises a real read', () => {
    expect(isRegistryMutating('list_bookings')).toBe(false);
  });

  it('treats an unknown action as non-mutating', () => {
    // The conservative direction here is *not* to block: an unrecognised
    // action is rejected by validation anyway, and treating it as mutating
    // would make every unknown command clarify twice.
    expect(isRegistryMutating('not_a_real_command')).toBe(false);
  });
});
