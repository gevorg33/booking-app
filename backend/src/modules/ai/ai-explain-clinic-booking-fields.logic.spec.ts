import { handleExplainClinicBookingFieldsLogic } from './ai-explain-clinic-booking-fields.logic.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS } from './ai-explain-clinic-booking-fields.fixtures.js';

describe('ai-explain-clinic-booking-fields.logic (ai-cmd-customer-4.7.4)', () => {
  const clinicBusiness = {
    id: 'biz-1',
    settings: { businessType: 'clinic' },
  };

  function buildDeps(business = clinicBusiness) {
    return {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(business),
      },
      serviceService: {
        findAll: jest.fn().mockResolvedValue([]),
      },
    };
  }

  it.each(
    EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS.slice(0, 4).map(
      (row) => [row.id, row] as const,
    ),
  )('explains clinic booking field for $id', async (_id, row) => {
    const result = await handleExplainClinicBookingFieldsLogic(
      buildDeps(),
      'biz-1',
      {},
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_clinic_booking_fields');
    expect(result.details?.aspect).toBe(row.aspect);
    expect(result.summary.length).toBeGreaterThan(20);
  });

  it('rejects non-clinic businesses', async () => {
    const result = await handleExplainClinicBookingFieldsLogic(
      buildDeps({
        id: 'biz-1',
        settings: { businessType: 'salon' },
      }),
      'biz-1',
      {},
      'Why do you ask for my ID?',
    );
    expect(result.success).toBe(false);
  });

  it('clarifies unrelated prompts', async () => {
    const result = await handleExplainClinicBookingFieldsLogic(
      buildDeps(),
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns all-aspect summary and handles missing business', async () => {
    const allResult = await handleExplainClinicBookingFieldsLogic(
      buildDeps(),
      'biz-1',
      { aspect: 'all' },
      'Explain the identity fields on the clinic booking page',
    );
    expect(allResult.success).toBe(true);
    expect(allResult.details?.aspect).toBe('all');

    const deps = buildDeps();
    deps.businessRepo.findOne.mockResolvedValue(null);
    const missing = await handleExplainClinicBookingFieldsLogic(
      deps,
      'biz-1',
      {},
      'Why do you ask for my ID?',
    );
    expect(missing.success).toBe(false);
  });
});
