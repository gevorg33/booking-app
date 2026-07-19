import { BadRequestException } from '@nestjs/common';
import { handleCompleteIntakeAndBookLogic } from './ai-complete-intake-and-book.logic.js';
import { E2E98_COMPLETE_INTAKE_DRAFT_FAILURE_SCENARIOS } from './ai-e2e98-complete-intake-draft-failure.fixtures.js';

describe('e2e-bug.98 complete_intake_and_book draft failure', () => {
  const clinicBusiness = {
    id: 'biz-1',
    slug: 'clinic',
    settings: { businessType: 'clinic' },
  };

  const labService = {
    id: 'svc-lab-1',
    name: 'Blood Draw',
    metadata: { serviceType: 'lab_test' },
  };

  function buildDeps(thrownMessage: string) {
    return {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(clinicBusiness),
      },
      serviceService: {
        findAll: jest.fn().mockResolvedValue([labService]),
      },
      publicPreVisitIntakeService: {
        ensureCustomerDraft: jest
          .fn()
          .mockRejectedValue(new BadRequestException(thrownMessage)),
        getCustomerFlow: jest.fn(),
        startCustomerIntake: jest.fn(),
        submitCustomerAnswers: jest.fn(),
        getCheckoutConfig: jest.fn(),
      },
    };
  }

  it.each(
    E2E98_COMPLETE_INTAKE_DRAFT_FAILURE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'surfaces ensureCustomerDraft failure for %s (no false success)',
    async (_id, row) => {
      const result = await handleCompleteIntakeAndBookLogic(
        buildDeps(row.thrownMessage),
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        row.prompt,
      );

      expect(result.success).toBe(false);
      expect(result.action).toBe('complete_intake_and_book');
      expect(result.summary).toBe(row.thrownMessage);
      expect(result.details?.draftFailed).toBe(true);
      expect(result.details?.intakeId).toBeUndefined();
      expect(result.summary.toLowerCase()).not.toContain('completed');
      expect(result.summary.toLowerCase()).not.toContain('starting the');
    },
  );

  it('still succeeds when the draft is created', async () => {
    const deps = buildDeps('unused');
    deps.publicPreVisitIntakeService.ensureCustomerDraft.mockResolvedValue({
      id: 'intake-1',
      status: 'assigned',
    });

    const result = await handleCompleteIntakeAndBookLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Fill intake and book blood draw',
    );

    expect(result.success).toBe(true);
    expect(result.details?.intakeId).toBe('intake-1');
  });
});
