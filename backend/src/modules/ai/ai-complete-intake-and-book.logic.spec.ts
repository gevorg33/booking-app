import { handleCompleteIntakeAndBookLogic } from './ai-complete-intake-and-book.logic.js';
import { COMPLETE_INTAKE_AND_BOOK_PROMPTS } from './ai-complete-intake-and-book.fixtures.js';

describe('ai-complete-intake-and-book.logic (ai-cmd-customer-4.14.2)', () => {
  const clinicBusiness = {
    id: 'biz-1',
    slug: 'salon',
    settings: { businessType: 'clinic' },
  };

  const labService = {
    id: 'svc-lab-1',
    name: 'Blood Draw',
    metadata: { serviceType: 'lab_test' },
  };

  function buildDeps(business = clinicBusiness) {
    return {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(business),
      },
      serviceService: {
        findAll: jest.fn().mockResolvedValue([labService]),
      },
      publicPreVisitIntakeService: {
        ensureCustomerDraft: jest.fn().mockResolvedValue({
          id: 'intake-1',
          status: 'assigned',
          questionnaire: { title: 'Lab Intake' },
        }),
        getCustomerFlow: jest.fn(),
        startCustomerIntake: jest.fn(),
        submitCustomerAnswers: jest.fn(),
        getCheckoutConfig: jest.fn(),
      },
    };
  }

  it.each(
    COMPLETE_INTAKE_AND_BOOK_PROMPTS.slice(0, 4).map(
      (row) => [row.id, row] as const,
    ),
  )('starts intake and book flow for $id', async (_id, row) => {
    const result = await handleCompleteIntakeAndBookLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('complete_intake_and_book');
    expect(result.details?.serviceId).toBe('svc-lab-1');
    expect(result.details?.clientAction).toBe('startConsumerPreVisitIntake');
    expect(result.details?.navigate).toEqual({
      path: 'book',
      query: {
        serviceId: 'svc-lab-1',
        bookingPhase: 'intake',
        completeIntakeAndBook: '1',
      },
    });
  });

  it('rejects unsigned and non-clinic requests', async () => {
    const unsigned = await handleCompleteIntakeAndBookLogic(
      buildDeps(),
      'biz-1',
      {},
      'Fill intake and book blood draw',
    );
    expect(unsigned.success).toBe(false);
    expect(unsigned.details?.missing).toContain('sessionCustomerId');

    const salon = await handleCompleteIntakeAndBookLogic(
      buildDeps({
        id: 'biz-1',
        slug: 'salon',
        settings: { businessType: 'salon' },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Fill intake and book blood draw',
    );
    expect(salon.success).toBe(false);
  });

  it('clarifies unrelated prompts and handles missing business or services', async () => {
    const clarify = await handleCompleteIntakeAndBookLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Book a haircut tomorrow',
    );
    expect(clarify.success).toBe(false);
    expect(clarify.details?.clarify).toBe(true);

    const deps = buildDeps();
    deps.businessRepo.findOne.mockResolvedValue(null);
    const missingBusiness = await handleCompleteIntakeAndBookLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Fill intake and book blood draw',
    );
    expect(missingBusiness.success).toBe(false);

    const noLabDeps = buildDeps();
    noLabDeps.serviceService.findAll.mockResolvedValue([]);
    const noLab = await handleCompleteIntakeAndBookLogic(
      noLabDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Fill intake and book blood draw',
    );
    expect(noLab.success).toBe(false);
    expect(noLab.details?.clarify).toBe(true);
  });

  it('e2e-bug.201 — seeded step accepts pay-bearing intake+lab prompt', async () => {
    const payPrompt = 'Fill intake and book blood draw, pay online';
    const blocked = await handleCompleteIntakeAndBookLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      payPrompt,
    );
    expect(blocked.success).toBe(false);
    expect(String(blocked.summary)).toMatch(/Ask to fill the pre-visit intake/i);

    const seeded = await handleCompleteIntakeAndBookLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1', completeIntakeAndBook: true },
      payPrompt,
    );
    expect(seeded.success).toBe(true);
    expect(seeded.action).toBe('complete_intake_and_book');
    expect(seeded.details?.serviceId).toBe('svc-lab-1');
  });

  it('e2e-bug.201 — seeded but non-intake prompt still clarifies', async () => {
    const result = await handleCompleteIntakeAndBookLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1', completeIntakeAndBook: true },
      'Pay online for my booking',
    );
    expect(result.success).toBe(false);
    expect(String(result.summary)).toMatch(/Ask to fill the pre-visit intake/i);
  });
});
