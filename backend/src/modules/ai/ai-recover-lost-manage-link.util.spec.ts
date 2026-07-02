import {
  RECOVER_LOST_MANAGE_LINK_PROMPTS,
  RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS,
} from './ai-recover-lost-manage-link.fixtures.js';
import { RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS } from './ai-recover-lost-manage-link-multilingual.fixtures.js';
import {
  isGetManageLinkPrompt,
  extractGuestContactFromPrompt,
} from './ai-get-manage-link.util.js';
import {
  hasRecoverLostManageLinkCue,
  isRecoverLostManageLinkIntent,
  isRecoverLostManageLinkPrompt,
  parseRecoverLostManageLinkFromPrompt,
  rescueRecoverLostManageLinkIntent,
} from './ai-recover-lost-manage-link.util.js';

describe('ai-recover-lost-manage-link.util (ai-cmd-customer-4.17.3)', () => {
  it.each(RECOVER_LOST_MANAGE_LINK_PROMPTS)(
    'detects prompt $id',
    ({ prompt }) => {
      expect(isRecoverLostManageLinkPrompt(prompt)).toBe(true);
      expect(parseRecoverLostManageLinkFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isRecoverLostManageLinkPrompt(prompt)).toBe(true);
    },
  );

  it.each(RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueRecoverLostManageLinkIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'recover_manage_link',
      });
    },
  );

  it('extracts guest email and phone from prompt', () => {
    expect(
      parseRecoverLostManageLinkFromPrompt(
        'Resend manage link to john@example.com',
      ),
    ).toMatchObject({
      email: 'john@example.com',
      guestLookup: true,
      delivery: 'email',
    });
    expect(
      parseRecoverLostManageLinkFromPrompt(
        'Text me the booking manage link at 5551234567',
      ),
    ).toMatchObject({
      phone: '5551234567',
      guestLookup: true,
      delivery: 'sms',
    });
  });

  it('does not steal signed-in get_manage_link prompts', () => {
    expect(
      isRecoverLostManageLinkPrompt('Get manage link for my booking'),
    ).toBe(false);
    expect(isGetManageLinkPrompt('Get manage link for my booking')).toBe(true);
  });

  it('does not steal sign_in_to_manage_booking prompts', () => {
    expect(
      isRecoverLostManageLinkPrompt('Sign in to change my appointment'),
    ).toBe(false);
  });

  it('does not steal explain_notification_currency prompts', () => {
    expect(
      isRecoverLostManageLinkPrompt(
        'Why does my booking confirmation email show euros (€)?',
      ),
    ).toBe(false);
  });

  it('covers isRecoverLostManageLinkIntent guard paths', () => {
    expect(
      rescueRecoverLostManageLinkIntent(
        'Resend manage link to john@example.com',
        'recover_lost_manage_link',
      ),
    ).toBeNull();
    expect(isRecoverLostManageLinkIntent('recover_lost_manage_link')).toBe(
      true,
    );
    expect(isRecoverLostManageLinkIntent('get_manage_link')).toBe(false);
  });

  it('covers hasRecoverLostManageLinkCue heuristic branches', () => {
    expect(
      hasRecoverLostManageLinkCue('I lost the link to manage my booking'),
    ).toBe(true);
    expect(
      hasRecoverLostManageLinkCue(
        'I booked as a guest — send me the manage link',
      ),
    ).toBe(true);
    expect(hasRecoverLostManageLinkCue('Get manage link for my booking')).toBe(
      false,
    );
  });

  it('rejects empty, share, and sign-in-manage prompts', () => {
    expect(isRecoverLostManageLinkPrompt('')).toBe(false);
    expect(
      isRecoverLostManageLinkPrompt('Share my appointment with my partner'),
    ).toBe(false);
    expect(
      isRecoverLostManageLinkPrompt('Sign in to change my appointment'),
    ).toBe(false);
  });

  it('detects heuristic guest recovery without exact fixture match', () => {
    expect(
      isRecoverLostManageLinkPrompt(
        'Can you resend my appointment manage link to sarah@test.com?',
      ),
    ).toBe(true);
  });

  it('parses params email and phone overrides', () => {
    expect(
      parseRecoverLostManageLinkFromPrompt(
        'I lost my booking confirmation email',
        {
          email: 'john@example.com',
        },
      ),
    ).toMatchObject({ email: 'john@example.com', guestLookup: true });
    expect(
      parseRecoverLostManageLinkFromPrompt('Text me the booking manage link', {
        phone: '5551234567',
      }),
    ).toMatchObject({ phone: '5551234567', guestLookup: true });
  });

  it('detects contact plus manage-link resend cues', () => {
    expect(
      hasRecoverLostManageLinkCue('Send manage link to sarah@test.com'),
    ).toBe(true);
  });

  it('returns null when prompt is not recover lost manage link', () => {
    expect(
      parseRecoverLostManageLinkFromPrompt('Get manage link for my booking'),
    ).toBeNull();
  });

  it.each(
    RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.locale === 'ru',
    ),
  )('detects ru lost-email heuristic $id', ({ prompt }) => {
    expect(isRecoverLostManageLinkPrompt(prompt)).toBe(true);
  });
});
