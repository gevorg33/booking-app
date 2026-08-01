import { handleBookLabCollectionLogic } from './ai-clinic-lab-booking.logic.js';
import {
  extractNamedLabPanelFromPrompt,
  isLabCollectionNearestFillerName,
  parseBookLabCollectionFromPrompt,
} from './ai-clinic-lab-booking.util.js';
import {
  buildBookLabCollectionNearestCompoundParams,
  decomposeCustomerBookLabCollectionNearestCompoundPrompt,
} from './ai-book-lab-collection-nearest.util.js';
import {
  E2E202_NAMED_PANEL_CASES,
  E2E202_UNRESOLVED_ABORT,
} from './ai-e2e202-book-lab-collection-nearest-unicorn.fixtures.js';

describe('e2e-bug.202 book_lab_collection_nearest named panel abort', () => {
  it.each(E2E202_NAMED_PANEL_CASES.map((row) => [row.id, row] as const))(
    'extract + compound params $id',
    (_id, row) => {
      expect(extractNamedLabPanelFromPrompt(row.prompt)).toBe(
        row.expectTestName,
      );

      const params = buildBookLabCollectionNearestCompoundParams(row.prompt);
      if (row.expectTestName) {
        expect(params.testName).toBe(row.expectTestName);
      } else {
        expect(params.testName).toBeUndefined();
      }
      if (row.expectFillerServiceNameCleared) {
        expect(
          typeof params.serviceName === 'string' &&
            isLabCollectionNearestFillerName(params.serviceName),
        ).toBe(false);
      }

      const steps = decomposeCustomerBookLabCollectionNearestCompoundPrompt(
        row.prompt,
      );
      expect(steps).toHaveLength(2);
      expect(steps[1]?.params.testName).toBe(
        row.expectTestName ?? undefined,
      );
      expect(
        parseBookLabCollectionFromPrompt(row.prompt, steps[1]?.params ?? {})
          ?.testName,
      ).toBe(row.expectTestName ?? undefined);
    },
  );

  it('filler names are rejected as panels', () => {
    expect(isLabCollectionNearestFillerName('lab draw earliest')).toBe(true);
    expect(isLabCollectionNearestFillerName('the soonest opening')).toBe(true);
    expect(isLabCollectionNearestFillerName('unicorn-panel-xyzzy')).toBe(false);
    expect(isLabCollectionNearestFillerName('lipid panel')).toBe(false);
  });

  it('handler aborts unicorn and keeps CBC', async () => {
    const clinicBusiness = {
      id: 'biz-1',
      timezone: 'UTC',
      settings: { businessType: 'clinic' },
    };
    const pending = [
      {
        orderId: 'ord-1',
        displayNames: 'CBC',
        collectionServiceName: 'Blood draw',
        collectionServiceId: 'svc-1',
        token: 'tok-1',
        pushedAt: '2026-06-01T10:00:00.000Z',
        collectionBookingId: null,
        bookUrl: 'https://example.com/book',
      },
    ];
    const deps = {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(clinicBusiness),
      },
      clinicTestOrderBookingRequestService: {
        listPendingBookingRequestsForCustomer: jest
          .fn()
          .mockResolvedValue(pending),
      },
    } as any;

    const unicorn = await handleBookLabCollectionLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        bookingFirstAvailable: true,
        testName: 'unicorn-panel-xyzzy',
      },
      'Book lab draw earliest slot for unicorn-panel-xyzzy',
    );
    expect(unicorn.success).toBe(false);
    expect(E2E202_UNRESOLVED_ABORT.test(String(unicorn.summary))).toBe(true);

    const cbc = await handleBookLabCollectionLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        bookingFirstAvailable: true,
        testName: 'CBC',
      },
      'Book lab draw earliest slot for CBC',
    );
    expect(cbc.success).toBe(true);
  });
});
