import {
  EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS,
  EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS,
} from './ai-explain-deposit-forfeiture.fixtures.js';
import { EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS } from './ai-explain-deposit-forfeiture-multilingual.fixtures.js';
import {
  isExplainDepositForfeitureIntent,
  isExplainDepositForfeiturePrompt,
  parseExplainDepositForfeitureFromPrompt,
  rescueExplainDepositForfeitureIntent,
} from './ai-explain-deposit-forfeiture.util.js';
import { isExplainCancelPolicyPrompt } from './ai-explain-cancel-policy.util.js';

describe('ai-explain-deposit-forfeiture.util (ai-cmd-customer-4.20.2)', () => {
  it.each(EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS)(
    'detects prompt $id',
    ({ prompt }) => {
      expect(isExplainDepositForfeiturePrompt(prompt)).toBe(true);
      expect(parseExplainDepositForfeitureFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isExplainDepositForfeiturePrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainDepositForfeitureIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'deposit_forfeiture',
      });
    },
  );

  it('does not steal general cancel policy prompts', () => {
    expect(
      isExplainDepositForfeiturePrompt('Explain the cancellation policy'),
    ).toBe(false);
    expect(isExplainCancelPolicyPrompt('Explain the cancellation policy')).toBe(
      true,
    );
    expect(
      isExplainDepositForfeiturePrompt('How much notice do I need to cancel?'),
    ).toBe(false);
  });

  it('does not steal amount-due prompts', () => {
    expect(isExplainDepositForfeiturePrompt('How much do I pay today?')).toBe(
      false,
    );
    expect(
      isExplainDepositForfeiturePrompt('Is the 50% deposit $40 for facial?'),
    ).toBe(false);
  });

  it('parses bookingId from params', () => {
    expect(
      parseExplainDepositForfeitureFromPrompt(
        'Do I lose my deposit if I cancel?',
        {
          bookingId: 'book-1',
        },
      ),
    ).toEqual({ bookingId: 'book-1' });
  });

  it('recognizes explain_deposit_forfeiture intent', () => {
    expect(isExplainDepositForfeitureIntent('explain_deposit_forfeiture')).toBe(
      true,
    );
    expect(isExplainDepositForfeitureIntent('explain_cancel_policy')).toBe(
      false,
    );
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueExplainDepositForfeitureIntent(
        'Do I lose my deposit if I cancel?',
        'explain_deposit_forfeiture',
      ),
    ).toBeNull();
  });

  it('detects heuristic multilingual deposit forfeiture cues', () => {
    expect(
      isExplainDepositForfeiturePrompt('вернут депозит если отменю сейчас'),
    ).toBe(true);
  });
});
