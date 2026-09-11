import {
  UPDATE_MY_PROFILE_PROMPTS,
  UPDATE_MY_PROFILE_RESCUE_SCENARIOS,
  CUSTOMER_UPDATE_MY_PROFILE_CLASSIFIER_RULES,
} from './ai-update-my-profile.fixtures.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-update-my-profile-multilingual.fixtures.js';
import {
  buildUpdateMyProfileEmailUnsupportedSummary,
  buildUpdateMyProfileMissingValueSummary,
  buildUpdateMyProfileNavigate,
  buildUpdateMyProfileSummary,
  enrichUpdateMyProfileParamsFromPrompt,
  extractProfileEmailFromPrompt,
  extractProfileNameFromPrompt,
  extractProfilePhoneFromPrompt,
  inferUpdateMyProfileField,
  isUpdateMyProfileIntent,
  isUpdateMyProfilePrompt,
  normalizeProfilePhone,
  parseUpdateMyProfileFromPrompt,
  rescueUpdateMyProfileIntent,
} from './ai-update-my-profile.util.js';
import {
  isMyProfilePrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-update-my-profile.util (ai-cmd-customer-4.5.6)', () => {
  it('exports classifier rules for update_my_profile', () => {
    expect(CUSTOMER_UPDATE_MY_PROFILE_CLASSIFIER_RULES).toContain(
      'update_my_profile',
    );
    expect(CUSTOMER_UPDATE_MY_PROFILE_CLASSIFIER_RULES).toMatch(
      /email changes are not supported/i,
    );
  });

  it.each(UPDATE_MY_PROFILE_PROMPTS.map((row) => [row.id, row] as const))(
    'detects update_my_profile for $id',
    (_id, row) => {
      expect(isUpdateMyProfilePrompt(row.prompt)).toBe(true);
      expect(rescueUpdateMyProfileIntent(row.prompt, 'unknown')?.action).toBe(
        'update_my_profile',
      );
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        'update_my_profile',
      );
      if (row.field) {
        expect(inferUpdateMyProfileField(row.prompt)).toBe(row.field);
      }
    },
  );

  it.each(
    UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual update_my_profile for $id', (_id, row) => {
    expect(isUpdateMyProfilePrompt(row.prompt)).toBe(true);
    expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
      'update_my_profile',
    );
  });

  it.each(
    UPDATE_MY_PROFILE_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueUpdateMyProfileIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('update_my_profile');
    expect(
      rescueCustomerCrmIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('update_my_profile');
  });

  it('does not classify read-only or how-to prompts as update', () => {
    expect(isUpdateMyProfilePrompt('Show my profile')).toBe(false);
    expect(isMyProfilePrompt('Show my profile')).toBe(true);
    expect(isUpdateMyProfilePrompt('How do I update my profile?')).toBe(false);
    expect(isUpdateMyProfilePrompt('What is my profile?')).toBe(false);
  });

  it('extracts inline values and keeps legacy navigate helper (unused by handler)', () => {
    const parsed = parseUpdateMyProfileFromPrompt('Update my name to Jane Doe');
    expect(parsed).toEqual({
      field: 'name',
      name: 'Jane Doe',
    });
    expect(buildUpdateMyProfileNavigate(parsed!)).toEqual({
      path: 'account',
      query: { section: 'profile', field: 'name' },
    });
    expect(buildUpdateMyProfileMissingValueSummary(parsed!)).toContain(
      'new name',
    );
  });

  it('summarizes email updates as unsupported without promising Account UI (e2e-bug.40)', () => {
    const parsed = parseUpdateMyProfileFromPrompt(
      'Update my contact email to jane@example.com',
    );
    expect(parsed?.field).toBe('email');
    expect(buildUpdateMyProfileSummary(parsed!)).toMatch(
      /aren't supported yet/i,
    );
    expect(buildUpdateMyProfileEmailUnsupportedSummary(parsed!)).toContain(
      'jane@example.com',
    );
    expect(buildUpdateMyProfileSummary(parsed!)).not.toMatch(/Open Account/i);
  });

  it('extracts phone and email values', () => {
    expect(
      extractProfilePhoneFromPrompt('Change my phone number to 555-123-4567'),
    ).toBe('5551234567');
    expect(normalizeProfilePhone('+1 (555) 123-4567')).toBe('15551234567');
    expect(
      extractProfileEmailFromPrompt(
        'Update my contact email to jane@example.com',
      ),
    ).toBe('jane@example.com');
    expect(extractProfileNameFromPrompt('Update my name to Jane Doe')).toBe(
      'Jane Doe',
    );
  });

  it('enriches params from prompt', () => {
    expect(enrichUpdateMyProfileParamsFromPrompt({}, 'Edit my email')).toEqual({
      field: 'email',
    });
  });

  it('recognizes update_my_profile intent', () => {
    expect(isUpdateMyProfileIntent('update_my_profile')).toBe(true);
    expect(isUpdateMyProfileIntent('my_profile')).toBe(false);
  });

  it('infers field from prompt without fixture match', () => {
    expect(inferUpdateMyProfileField('Fix my contact email')).toBe('email');
    expect(inferUpdateMyProfileField('Set my mobile number')).toBe('phone');
    expect(inferUpdateMyProfileField('Change my account details')).toBe(
      'profile',
    );
  });

  it('detects HY/RU mutate cues without exact fixture match', () => {
    expect(isUpdateMyProfilePrompt('փոխել իմ email')).toBe(true);
    expect(isUpdateMyProfilePrompt('Изменить мой номер телефона')).toBe(true);
  });

  it('ignores phone values that are too short', () => {
    expect(
      extractProfilePhoneFromPrompt('Change my phone to 12345'),
    ).toBeUndefined();
  });

  it('rejects empty prompt', () => {
    expect(isUpdateMyProfilePrompt('')).toBe(false);
    expect(parseUpdateMyProfileFromPrompt('')).toBeNull();
  });

  describe('e2e-bug.441 — a supplied value is honoured', () => {
    it('prefers a supplied name over one found in the message', () => {
      const parsed = parseUpdateMyProfileFromPrompt(
        'Update my name to Jane Doe',
        { name: 'Mariam Petrosyan' },
      );
      expect(parsed?.name).toBe('Mariam Petrosyan');
    });

    it('honours a supplied phone the message does not mention', () => {
      const parsed = parseUpdateMyProfileFromPrompt('update my profile', {
        phone: '+37411223344',
      });
      expect(parsed?.phone).toBe('+37411223344');
      // The message names no field, so the supplied value picks it.
      expect(parsed?.field).toBe('phone');
    });

    it('lets an explicit param satisfy the prompt gate on its own', () => {
      // Before the fix this returned null and the caller was asked to say
      // what to update, having just said it.
      expect(
        parseUpdateMyProfileFromPrompt('do the thing', { name: 'Jane' }),
      ).not.toBeNull();
    });

    it('still returns null with neither a matching prompt nor a value', () => {
      expect(parseUpdateMyProfileFromPrompt('do the thing', {})).toBeNull();
      expect(
        parseUpdateMyProfileFromPrompt('do the thing', { name: '   ' }),
      ).toBeNull();
    });

    it('leaves the message-only path exactly as it was', () => {
      // The regression guard: every existing caller passes no params.
      const parsed = parseUpdateMyProfileFromPrompt(
        'Update my name to Jane Doe',
      );
      expect(parsed?.name).toBe('Jane Doe');
      expect(parsed?.field).toBe('name');
    });
  });

  it('registers eval golden cases for every fixture scenario', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES.map((row) => row.id),
    );
    for (const row of UPDATE_MY_PROFILE_PROMPTS) {
      expect(ids.has(`update-my-profile-${row.id}`)).toBe(true);
    }
    for (const row of UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS) {
      expect(ids.has(`update-my-profile-${row.id}`)).toBe(true);
    }
    for (const row of UPDATE_MY_PROFILE_RESCUE_SCENARIOS) {
      expect(ids.has(`update-my-profile-rescue-${row.id}`)).toBe(true);
    }
    expect(AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES.length).toBe(
      UPDATE_MY_PROFILE_PROMPTS.length +
        UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS.length +
        UPDATE_MY_PROFILE_RESCUE_SCENARIOS.length,
    );
  });
});
