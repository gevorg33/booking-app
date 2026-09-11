import { Test } from '@nestjs/testing';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import {
  BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS,
  BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS,
} from './ai-book-package-with-nearest-slot.fixtures.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';
import { executePublicAssistantCompoundFromSteps } from '../public-booking/public-booking-assistant-compound.logic.js';

describe('book_package_with_nearest_slot integration (ai-cmd-customer-4.6.2)', () => {
  const packagesService = {
    listPackages: jest.fn(async () => [{ id: 'pkg-1', name: 'Spa Day' }]),
    listPublicPackages: jest.fn(async () => [{ id: 'pkg-1', name: 'Spa Day' }]),
  };
  const publicBookingService = {
    suggestPackageBlock: jest.fn(async () => ({
      startTime: '2026-06-10T10:00:00.000Z',
      dateKey: '2026-06-10',
      employeeId: 'emp-1',
      employeeName: 'Maria',
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => makeBusiness({ id: 'biz-1', slug: 'salon' })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(
    BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes customer compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('customer', row.prompt);
    expect(golden?.steps.map((step) => step.action)).toEqual(
      row.orderedActions,
    );
    expect(golden?.steps[1]?.params.bookingFirstAvailable).toBe(true);
  });

  it.each(
    BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes public compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('public', row.prompt);
    expect(golden?.recipeId).toBe('public_book_package_with_nearest_slot');
    expect(golden?.steps.map((step) => step.action)).toEqual([
      'discover_packages',
      'book_package',
    ]);
  });

  it('executes public compound steps with package context propagation', async () => {
    const prompt = 'Book the spa package earliest available';
    const decomposition = decomposeDeterministicForSurface('public', prompt);
    expect(decomposition?.steps.length).toBe(2);

    const result = await executePublicAssistantCompoundFromSteps(
      prompt,
      decomposition!.steps,
      {},
      {
        runStep: async (action, params) => {
          if (action === 'discover_packages') {
            return {
              success: true,
              action,
              summary: 'Packages listed.',
              sessionContext: { packageId: 'pkg-1', packageName: 'Spa Day' },
            };
          }
          expect(params.packageName).toBe('Spa Day');
          expect(params.bookingFirstAvailable).toBe(true);
          return {
            success: true,
            action,
            summary: 'Package booked.',
            details: { packageId: 'pkg-1' },
          };
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('compound_intent');
  });

  it('books package with nearest block via self-service logic deps', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AiSelfServiceBookingService,
          useFactory: () =>
            new AiSelfServiceBookingService(
              publicBookingService as any,
              {} as any,
              {} as any,
              {} as any,
              { createPostBookingSupportTicket: jest.fn() } as any,
              {} as any,
              packagesService as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              businessRepo as any,
              { find: jest.fn(async () => []) } as any,
            ),
        },
      ],
    }).compile();

    const service = moduleRef.get(AiSelfServiceBookingService);
    const result = await service.handleBookPackage('biz-1', {
      packageName: 'Spa Day',
      bookingFirstAvailable: true,
    });

    expect(result.success).toBe(true);
    expect(result.details?.blockStartTime).toBe('2026-06-10T10:00:00.000Z');
    expect(publicBookingService.suggestPackageBlock).toHaveBeenCalledWith(
      'salon',
      'pkg-1',
    );
  });
});
