import {
  COMPLETE_INTAKE_AND_BOOK_PROMPTS,
  COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS,
} from './ai-complete-intake-and-book.fixtures.js';
import { handleCompleteIntakeAndBookLogic } from './ai-complete-intake-and-book.logic.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

describe('complete_intake_and_book integration (ai-cmd-customer-4.14.2)', () => {
  const clinicBusiness = {
    id: 'biz-1',
    settings: { businessType: 'clinic' },
  };

  const labService = {
    id: 'svc-lab-1',
    name: 'Blood Draw',
    metadata: { serviceType: 'lab_test' },
  };

  function buildDeps() {
    return {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(clinicBusiness),
      },
      serviceService: {
        findAll: jest.fn().mockResolvedValue([labService]),
      },
    };
  }

  it.each(
    COMPLETE_INTAKE_AND_BOOK_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes customer compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('customer', row.prompt);
    expect(golden?.recipeId).toBe('complete_intake_and_book');
    expect(golden?.steps.map((step) => step.action)).toEqual(
      row.orderedActions,
    );
    expect(golden?.steps[0]?.params.completeIntakeAndBook).toBe(true);
  });

  it.each(
    COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes public compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('public', row.prompt);
    expect(golden?.recipeId).toBe('public_complete_intake_and_book');
    expect(golden?.steps.map((step) => step.action)).toEqual([
      'complete_intake_and_book',
      'book_appointment',
    ]);
  });

  it('executes intake step and propagates service context for booking', async () => {
    const prompt = 'Fill intake and book blood draw';
    const decomposition = decomposeDeterministicForSurface('customer', prompt);
    expect(decomposition?.steps.length).toBe(2);

    const deps = buildDeps();
    const intakeResult = await handleCompleteIntakeAndBookLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        ...decomposition!.steps[0].params,
      },
      prompt,
    );
    expect(intakeResult.success).toBe(true);
    expect(intakeResult.details?.serviceId).toBe('svc-lab-1');
    expect(intakeResult.details?.sessionContext).toMatchObject({
      serviceId: 'svc-lab-1',
      completeIntakeAndBook: true,
    });
    expect(decomposition?.steps[1]?.action).toBe('book_nearest_slot');
    expect(decomposition?.steps[1]?.params.serviceName).toBe('blood draw');
  });
});
