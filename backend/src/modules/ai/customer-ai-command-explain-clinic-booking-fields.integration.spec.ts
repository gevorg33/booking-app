import {
  EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS,
  EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS,
} from './ai-explain-clinic-booking-fields.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS } from './ai-explain-clinic-booking-fields-multilingual.fixtures.js';
import { rescueExplainClinicBookingFieldsIntent } from './ai-explain-clinic-booking-fields.util.js';

describe('customer/public explain_clinic_booking_fields integration (ai-cmd-customer-4.7.4)', () => {
  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_clinic_booking_fields for $id on $surface', (_id, row) => {
    expect(
      rescueExplainClinicBookingFieldsIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_clinic_booking_fields');
  });

  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues multilingual explain_clinic_booking_fields for $id',
    (_id, row) => {
      expect(
        rescueExplainClinicBookingFieldsIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_clinic_booking_fields');
    },
  );

  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues misclassified explain_clinic_booking_fields for $id',
    (_id, row) => {
      expect(
        rescueExplainClinicBookingFieldsIntent(
          row.prompt,
          row.misclassifiedAction,
        )?.action,
      ).toBe('explain_clinic_booking_fields');
    },
  );
});
