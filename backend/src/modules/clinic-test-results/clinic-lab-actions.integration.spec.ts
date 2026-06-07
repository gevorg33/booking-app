import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventType } from '../../events/event-types.js';
import {
  SKIPPED_POLLIN_ORDER_ACTION_SCENARIOS,
  PORTED_ORDER_STATUS_ACTION_REJECT_SCENARIOS,
  PORTED_ORDER_STATUS_ACTION_SCENARIOS,
  PORTED_RESULT_STATUS_REJECT_SCENARIOS,
  PORTED_RESULT_STATUS_TRANSITION_SCENARIOS,
  PORTED_TEST_RESULT_ACTION_NOT_FOUND_SCENARIOS,
  PORTED_TEST_RESULT_ACTION_SCENARIOS,
} from './clinic-lab-actions.fixtures.js';
import { ClinicTestOrderStatusService } from './order/clinic-test-order-status.service.js';
import { ClinicTestResultActionService } from './test-result/clinic-test-result-action.service.js';
import { ClinicTestResultStatusService } from './test-result/clinic-test-result-status.service.js';

describe('clinic lab actions integration (vert-clinic-2.0.9)', () => {
  describe('skipped Pollin order-actions UI scenarios', () => {
    it.each(SKIPPED_POLLIN_ORDER_ACTION_SCENARIOS)(
      'documents skipped fertility scenario $id',
      ({ id, reason }) => {
        expect(id).toBe('pollin-get-order-actions');
        expect(reason).toContain('milestone');
      },
    );
  });

  describe('order status actions (Pollin order-actions → Booking status service)', () => {
    const orderRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
    };
    const historyRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const businessService = {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { businessType: 'clinic' },
      })),
    };
    const clinicLabPhiService = {
      encryptStatusHistoryNoteForStorage: jest.fn(async (_b, note) => note),
    };
    const clinicTestResultService = {
      ensureResultForOrder: jest.fn(async () => ({ id: 'result-1' })),
    };

    const service = new ClinicTestOrderStatusService(
      orderRepo as any,
      historyRepo as any,
      businessService as any,
      clinicLabPhiService as any,
      clinicTestResultService as any,
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it.each(PORTED_ORDER_STATUS_ACTION_SCENARIOS)(
      'allows order transition $id ($from → $to)',
      async ({ from, to }) => {
        orderRepo.findOne.mockResolvedValue({
          id: 'order-1',
          businessId: 'biz-1',
          status: from,
        });

        const updated = await service.transitionOrderStatus({
          businessId: 'biz-1',
          orderId: 'order-1',
          toStatus: to,
          employeeId: 'emp-1',
          note: 'Action note',
        });

        expect(updated.status).toBe(to);
        expect(historyRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: 'order-1',
            status: to,
            previousStatus: from,
          }),
        );
      },
    );

    it.each(PORTED_ORDER_STATUS_ACTION_REJECT_SCENARIOS)(
      'rejects invalid order transition $id ($from → $to)',
      async ({ from, to }) => {
        orderRepo.findOne.mockResolvedValue({
          id: 'order-1',
          businessId: 'biz-1',
          status: from,
        });

        await expect(
          service.transitionOrderStatus({
            businessId: 'biz-1',
            orderId: 'order-1',
            toStatus: to,
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    it('creates result stub when order reaches AwaitingResults', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        businessId: 'biz-1',
        status: 'Collecting',
      });

      await service.transitionOrderStatus({
        businessId: 'biz-1',
        orderId: 'order-1',
        toStatus: 'AwaitingResults',
      });

      expect(clinicTestResultService.ensureResultForOrder).toHaveBeenCalledWith(
        'order-1',
      );
    });
  });

  describe('test result actions (Pollin test-result-actions.test.ts)', () => {
    const resultRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (value) => value),
    };
    const historyRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const businessService = {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { businessType: 'clinic' },
      })),
    };
    const clinicLabPhiService = {
      encryptStatusHistoryNoteForStorage: jest.fn(async (_b, note) => note),
      encryptTestResultForStorage: jest.fn(async (_b, result) => result),
      auditTestResultPhiWrite: jest.fn(async () => undefined),
    };
    const eventStore = {
      publish: jest.fn(async () => ({ id: 'evt-1' })),
    };

    const statusService = new ClinicTestResultStatusService(
      resultRepo as any,
      historyRepo as any,
      businessService as any,
      clinicLabPhiService as any,
      eventStore as any,
    );
    const actionService = new ClinicTestResultActionService(statusService);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it.each(PORTED_TEST_RESULT_ACTION_SCENARIOS)(
      'executes pollin scenario $id via action service',
      async ({
        action,
        fromStatus,
        comment,
        employeeId,
        expectReleasedAt,
        expectPatientVisibilityNew,
        expectEventPublish,
      }) => {
        resultRepo.findOne.mockResolvedValue({
          id: 'result-1',
          businessId: 'biz-1',
          customerId: 'cust-1',
          status: fromStatus,
        });

        const updated =
          action === 'markAsReleased'
            ? await actionService.markAsReleased({
                businessId: 'biz-1',
                resultId: 'result-1',
                employeeId,
                comment,
              })
            : await actionService.markAsReviewed({
                businessId: 'biz-1',
                resultId: 'result-1',
                employeeId,
                comment,
              });

        expect(updated.status).toBe(
          action === 'markAsReleased' ? 'Released' : 'Reviewed',
        );
        if (comment) {
          if (action === 'markAsReleased') {
            expect(updated.releaseComment).toBe(comment);
          } else {
            expect(updated.reviewComment).toBe(comment);
          }
        }
        if (expectReleasedAt) {
          expect(updated.releasedAt).toBeInstanceOf(Date);
        }
        if (expectPatientVisibilityNew) {
          expect(updated.patientVisibility).toBe('New');
        }
        if (expectEventPublish) {
          expect(eventStore.publish).toHaveBeenCalledWith(
            expect.objectContaining({
              eventType: EventType.TEST_RESULT_RELEASED,
              aggregateId: 'result-1',
            }),
          );
        }
        expect(historyRepo.save).toHaveBeenCalled();
      },
    );

    it.each(PORTED_TEST_RESULT_ACTION_NOT_FOUND_SCENARIOS)(
      'throws when result missing ($id)',
      async ({ action, resultId }) => {
        resultRepo.findOne.mockResolvedValue(null);

        const call =
          action === 'markAsReleased'
            ? actionService.markAsReleased({
                businessId: 'biz-1',
                resultId,
              })
            : actionService.markAsReviewed({
                businessId: 'biz-1',
                resultId,
              });

        await expect(call).rejects.toBeInstanceOf(NotFoundException);
        await expect(call).rejects.toThrow(/Clinic test result not found/);
      },
    );

    it.each(PORTED_RESULT_STATUS_TRANSITION_SCENARIOS)(
      'allows direct status transition $id ($from → $to)',
      async ({ from, to }) => {
        resultRepo.findOne.mockResolvedValue({
          id: 'result-1',
          businessId: 'biz-1',
          customerId: 'cust-1',
          status: from,
        });

        const updated = await statusService.transitionResultStatus({
          businessId: 'biz-1',
          resultId: 'result-1',
          toStatus: to,
        });

        expect(updated.status).toBe(to);
        expect(historyRepo.save).toHaveBeenCalled();
      },
    );

    it.each(PORTED_RESULT_STATUS_REJECT_SCENARIOS)(
      'rejects invalid result transition $id ($from → $to)',
      async ({ from, to }) => {
        resultRepo.findOne.mockResolvedValue({
          id: 'result-1',
          businessId: 'biz-1',
          status: from,
        });

        await expect(
          statusService.transitionResultStatus({
            businessId: 'biz-1',
            resultId: 'result-1',
            toStatus: to,
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );
  });
});
