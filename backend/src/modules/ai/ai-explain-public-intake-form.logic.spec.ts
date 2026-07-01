import { handleExplainPublicIntakeFormLogic } from './ai-explain-public-intake-form.logic.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS } from './ai-explain-public-intake-form.fixtures.js';

describe('ai-explain-public-intake-form.logic (ai-cmd-customer-4.14.1)', () => {
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
    EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS.slice(0, 4).map(
      (row) => [row.id, row] as const,
    ),
  )('explains public intake form for $id', async (_id, row) => {
    const result = await handleExplainPublicIntakeFormLogic(
      buildDeps(),
      'biz-1',
      {},
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_public_intake_form');
    expect(result.details?.aspect).toBe(row.aspect);
    expect(result.summary.length).toBeGreaterThan(20);
    expect(result.details?.publicIntakeCheckout).toBe(true);
  });

  it('rejects non-clinic businesses', async () => {
    const result = await handleExplainPublicIntakeFormLogic(
      buildDeps({
        id: 'biz-1',
        settings: { businessType: 'salon' },
      }),
      'biz-1',
      {},
      'Why these health questions?',
    );
    expect(result.success).toBe(false);
  });

  it('clarifies unrelated prompts', async () => {
    const result = await handleExplainPublicIntakeFormLogic(
      buildDeps(),
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('uses intake context and handles missing business', async () => {
    const intakeResult = await handleExplainPublicIntakeFormLogic(
      buildDeps(),
      'biz-1',
      {
        bookingPhase: 'intake',
        offersPreVisitIntake: true,
        serviceId: 'svc-lab-1',
      },
      'Can I skip the form?',
    );
    expect(intakeResult.success).toBe(true);
    expect(intakeResult.details?.intakeInProgress).toBe(true);
    expect(intakeResult.details?.navigate).toEqual({
      path: 'book',
      query: { serviceId: 'svc-lab-1' },
    });

    const deps = buildDeps();
    deps.businessRepo.findOne.mockResolvedValue(null);
    const missing = await handleExplainPublicIntakeFormLogic(
      deps,
      'biz-1',
      {},
      'Why these health questions?',
    );
    expect(missing.success).toBe(false);
  });
});
