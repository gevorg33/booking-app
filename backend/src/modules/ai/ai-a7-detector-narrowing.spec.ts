/**
 * tech-debt A7 / e2e-bug.380 — the two detectors narrowed, pinned directly.
 *
 * `ai-command-eval.spec-coverage.spec.ts` guards the *aggregate* (a stolen
 * ceiling that may only fall). An aggregate cannot say which fix is holding: if
 * one of these narrowings were reverted and some other detector widened by the
 * same amount, the ceiling would not move. These assert the two specific
 * behaviours, so a revert names itself.
 */
import { isExplainProviderAvailabilityPrompt } from './ai-explain-provider-availability.util.js';
import { isMarkPaidPrompt } from './ai-booking-depth.util.js';

describe('explain_provider_availability no longer answers sign-in handoffs', () => {
  it.each([
    'sign in with Apple',
    'sign in with Google',
    'Sign in with Google',
    'Log in using my Google account',
    'log-in with phone',
  ])('declines %j', (prompt) => {
    expect(isExplainProviderAvailabilityPrompt(prompt)).toBe(false);
  });

  it('still answers the availability questions it exists for', () => {
    // The decline requires the sign-in verb *and* a preposition *and* a named
    // auth provider. These carry at most two of the three, and must be
    // unaffected — a decline that costs the detector its own traffic is not a
    // narrowing, it is a deletion.
    expect(isExplainProviderAvailabilityPrompt('Is Karo Mazmanyan free tomorrow?')).toBe(
      true,
    );
    expect(isExplainProviderAvailabilityPrompt('When is Mariam available this week?')).toBe(
      true,
    );
    expect(isExplainProviderAvailabilityPrompt('who has openings today')).toBe(true);
  });
});

describe('mark_paid no longer claims a status change as a payment', () => {
  it.each([
    "mark Karo's 10am as completed",
    'mark the 3pm massage as done',
    'mark that appointment finished',
  ])('declines %j — no payment word anywhere', (prompt) => {
    expect(isMarkPaidPrompt(prompt)).toBe(false);
  });

  it.each([
    'mark it paid',
    'mark the booking as paid',
    "make Karo's appointment done and paid",
    'set the 2pm to completed and paid',
    "mark Karo Mazmanyan's appointment as done and paid on 5 june",
  ])('still claims %j — payment is named', (prompt) => {
    expect(isMarkPaidPrompt(prompt)).toBe(true);
  });

  it('leaves the in-progress guard intact', () => {
    expect(isMarkPaidPrompt('mark it in-progress')).toBe(false);
  });
});
