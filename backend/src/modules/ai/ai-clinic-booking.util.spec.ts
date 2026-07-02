import {
  CLINIC_BOOKING_RESCUE_SCENARIOS,
  EXPLAIN_CLINIC_BOOKING_PROMPTS,
} from './ai-clinic-booking.fixtures.js';
import {
  buildClinicBookingFixtureExpectations,
  extractClinicBookingAspectFromPrompt,
  extractServiceNameFromClinicBookingPrompt,
  isExplainClinicBookingPrompt,
  parseExplainClinicBookingFromPrompt,
  rescueExplainClinicBookingIntent,
} from './ai-clinic-booking.util.js';

describe('ai-clinic-booking.util', () => {
  it.each(EXPLAIN_CLINIC_BOOKING_PROMPTS)('detects $id', ({ prompt }) => {
    expect(isExplainClinicBookingPrompt(prompt)).toBe(true);
    expect(parseExplainClinicBookingFromPrompt(prompt)).not.toBeNull();
  });

  it('extracts aspects from prompts', () => {
    expect(
      extractClinicBookingAspectFromPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe('symptoms');
    expect(
      extractClinicBookingAspectFromPrompt(
        'What are referral notes for on the booking form?',
      ),
    ).toBe('referralNotes');
    expect(
      extractClinicBookingAspectFromPrompt(
        'Do I need to fast before this blood draw?',
      ),
    ).toBe('preparation');
  });

  it('extracts service names when present', () => {
    expect(
      extractServiceNameFromClinicBookingPrompt(
        'Explain the lab prep for Lipid panel',
      ),
    ).toBe('Lipid panel');
    expect(
      extractServiceNameFromClinicBookingPrompt(
        'Does CBC require fasting on this booking page?',
      ),
    ).toBe('CBC');
    expect(
      extractServiceNameFromClinicBookingPrompt(
        'What is the reason for visit field for on this booking page?',
      ),
    ).toBeNull();
  });

  it('rejects non-clinic checkout topics', () => {
    expect(
      isExplainClinicBookingPrompt('What is the max group size for City Tour?'),
    ).toBe(false);
    expect(isExplainClinicBookingPrompt('Show my lab test results')).toBe(
      false,
    );
    expect(isExplainClinicBookingPrompt('Explain GDPR data rights')).toBe(
      false,
    );
    expect(
      isExplainClinicBookingPrompt('Do I need to fast for blood work?'),
    ).toBe(false);
  });

  it.each(CLINIC_BOOKING_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainClinicBookingIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not rescue when action is already explain_clinic_booking', () => {
    expect(
      rescueExplainClinicBookingIntent(
        'What should I put in the symptoms field on checkout?',
        'explain_clinic_booking',
      ),
    ).toBeNull();
  });

  it('uses aspect from params when prompt is generic', () => {
    expect(
      parseExplainClinicBookingFromPrompt(
        'Explain the clinic checkout fields on this page',
        {
          aspect: 'all',
        },
      ),
    ).toEqual({
      aspect: 'all',
      serviceName: undefined,
      serviceId: undefined,
    });
  });

  it('exports fixture expectations helper', () => {
    expect(
      buildClinicBookingFixtureExpectations().length,
    ).toBeGreaterThanOrEqual(12);
  });
});
