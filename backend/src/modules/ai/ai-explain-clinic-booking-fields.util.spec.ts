import {
  EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS,
  EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS,
} from './ai-explain-clinic-booking-fields.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS } from './ai-explain-clinic-booking-fields-multilingual.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_PROMPTS } from './ai-clinic-booking.fixtures.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isExplainWhySignInPrompt } from './ai-explain-why-sign-in.util.js';
import {
  enrichExplainClinicBookingFieldsParamsFromPrompt,
  extractClinicBookingFieldsAspectFromPrompt,
  isExplainClinicBookingFieldsPrompt,
  parseExplainClinicBookingFieldsFromPrompt,
  rescueExplainClinicBookingFieldsIntent,
  detectExplainClinicBookingFieldsAction,
} from './ai-explain-clinic-booking-fields.util.js';

describe('ai-explain-clinic-booking-fields.util (ai-cmd-customer-4.7.4)', () => {
  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain_clinic_booking_fields for $id on $surface', (_id, row) => {
    expect(isExplainClinicBookingFieldsPrompt(row.prompt)).toBe(true);
    const parsed = parseExplainClinicBookingFieldsFromPrompt(row.prompt);
    expect(parsed).not.toBeNull();
    if (row.aspect) {
      expect(parsed?.aspect).toBe(row.aspect);
    }
  });

  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual clinic booking fields for $id', (_id, row) => {
    expect(isExplainClinicBookingFieldsPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueExplainClinicBookingFieldsIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('explain_clinic_booking_fields');
  });

  it('extracts aspects and enriches params', () => {
    expect(
      extractClinicBookingFieldsAspectFromPrompt(
        'Why is date of birth required on clinic checkout?',
      ),
    ).toBe('dateOfBirth');
    expect(
      enrichExplainClinicBookingFieldsParamsFromPrompt(
        {},
        'Why do you ask for my ID?',
      ).aspect,
    ).toBe('governmentId');
  });

  it('does not steal clinic checkout or guest contact prompts', () => {
    for (const row of EXPLAIN_CLINIC_BOOKING_PROMPTS) {
      expect(isExplainClinicBookingFieldsPrompt(row.prompt)).toBe(false);
      expect(isExplainClinicBookingPrompt(row.prompt)).toBe(true);
    }
    expect(isExplainWhySignInPrompt('Can I book without an account?')).toBe(
      true,
    );
    expect(
      isExplainGuestCheckoutFieldsPrompt('Can I book without an account?'),
    ).toBe(false);
    expect(
      isExplainClinicBookingFieldsPrompt('Why do you need my email?'),
    ).toBe(false);
    expect(
      isExplainClinicBookingFieldsPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe(false);
    expect(
      rescueExplainClinicBookingFieldsIntent(
        'Why do you ask for my ID?',
        'explain_clinic_booking_fields',
      ),
    ).toBeNull();
    expect(
      detectExplainClinicBookingFieldsAction('Why do you ask for my ID?'),
    ).toBe('explain_clinic_booking_fields');
  });

  it('covers heuristic detection paths and guards', () => {
    expect(
      isExplainClinicBookingFieldsPrompt('Why do you ask for my ID?'),
    ).toBe(true);
    expect(
      isExplainClinicBookingFieldsPrompt(
        'Why do you need my email on checkout?',
      ),
    ).toBe(false);
    expect(isExplainClinicBookingFieldsPrompt('')).toBe(false);
    expect(
      extractClinicBookingFieldsAspectFromPrompt(
        'Explain the identity fields on the clinic booking page',
      ),
    ).toBe('all');
    expect(
      extractClinicBookingFieldsAspectFromPrompt(
        'Why is emergency contact required on clinic intake?',
      ),
    ).toBe('emergencyContact');
    expect(
      isExplainClinicBookingFieldsPrompt(
        'Why must I show my passport when registering at the clinic?',
      ),
    ).toBe(true);
    expect(
      extractClinicBookingFieldsAspectFromPrompt(
        'Why fill out the pre-visit intake questionnaire?',
      ),
    ).toBe('intakeQuestion');
    expect(
      isExplainClinicBookingFieldsPrompt(
        'Why complete the registration form before checkout?',
      ),
    ).toBe(true);
  });
});
