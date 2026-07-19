import { describe, expect, it, jest } from '@jest/globals';
import {
  handleExplainLabResultHistoryLogic,
  handleTransitionSpecimenLogic,
  type ClinicTestResultExtLogicDeps,
} from './ai-clinic-test-result-ext.logic.js';

const specimen = {
  id: 'spec-1',
  status: 'Collected',
  specimenIdentifier: 'SP-1',
  orderId: 'order-abc123',
  orderDisplayNames: null,
  bookingId: 'booking-1',
  customerName: 'Maria Lopez',
  bookingStartTime: null,
  employeeName: null,
  department: null,
  collectedAt: null,
  storageLocationName: null,
  transportFolderCode: null,
  createdAt: new Date(),
};

function buildDeps(
  overrides: Record<string, any> = {},
): ClinicTestResultExtLogicDeps {
  return {
    bookingRepo: { find: jest.fn(async () => []) },
    resultRepo: { find: jest.fn(async () => []) } as any,
    orderRepo: { find: jest.fn(async () => []), findOne: jest.fn(async () => null) },
    clinicTestResultService: {} as any,
    clinicCatalogService: {
      updateReferenceRangeByCode: jest.fn(async () => ({}) as any),
    },
    clinicLabAccessService: {
      resolveStaffContext: jest.fn(async () => ({
        userId: 'user-1',
        membershipRole: 'owner',
        employeeId: null,
      })),
      assertResultLabAccess: jest.fn(async () => ({
        ctx: { userId: 'user-1', membershipRole: 'owner', employeeId: null },
        bookingAccess: null,
      })),
      assertSpecimenLabAccess: jest.fn(async () => ({
        userId: 'user-1',
        membershipRole: 'owner',
        employeeId: 'emp-1',
      })),
      ...overrides.clinicLabAccessService,
    },
    clinicLabChangeHistoryService: {
      listResultChangeHistory: jest.fn(async () => [
        {
          id: 'hist-1',
          entityType: 'result',
          entityId: 'result-1',
          action: 'Released',
          date: '2026-06-01T00:00:00.000Z',
          changes: [],
          editedBy: { employeeId: 'emp-1', fullName: 'Dr. Smith', role: 'owner' },
          note: null,
        },
      ]),
      ...overrides.clinicLabChangeHistoryService,
    },
    specimenService: {
      listSpecimens: jest.fn(async () => [specimen]),
      ...overrides.specimenService,
    },
    specimenStatusService: {
      transitionSpecimenStatus: jest.fn(async (input: any) => ({
        ...specimen,
        status: input.toStatus,
      })),
      ...overrides.specimenStatusService,
    },
  } as any;
}

describe('ai-clinic-lab-ops-ext.logic (ai-cmd-dashboard-6.9.3)', () => {
  describe('handleTransitionSpecimenLogic', () => {
    it('fails when toStatus is not a valid specimen status', async () => {
      const deps = buildDeps();
      const result = await handleTransitionSpecimenLogic(deps, 'biz-1', 'user-1', {
        specimenId: 'spec-1',
        toStatus: 'NotAStatus',
      });
      expect(result.success).toBe(false);
    });

    it('fails when the specimen cannot be resolved', async () => {
      const deps = buildDeps();
      const result = await handleTransitionSpecimenLogic(deps, 'biz-1', 'user-1', {
        toStatus: 'InTransit',
      });
      expect(result.success).toBe(false);
    });

    it('resolves by orderId and transitions the specimen', async () => {
      const deps = buildDeps();
      const result = await handleTransitionSpecimenLogic(deps, 'biz-1', 'user-1', {
        orderId: 'abc123',
        toStatus: 'InTransit',
      });
      expect(result.success).toBe(true);
      expect(deps.specimenStatusService.transitionSpecimenStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          specimenId: 'spec-1',
          toStatus: 'InTransit',
          employeeId: 'emp-1',
        }),
      );
    });

    it('resolves by customerName', async () => {
      const deps = buildDeps();
      const result = await handleTransitionSpecimenLogic(deps, 'biz-1', 'user-1', {
        customerName: 'Maria',
        toStatus: 'ReceivedInLab',
      });
      expect(result.success).toBe(true);
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        specimenStatusService: {
          transitionSpecimenStatus: jest.fn(async () => {
            throw new Error('Invalid transition');
          }),
        },
      });
      const result = await handleTransitionSpecimenLogic(deps, 'biz-1', 'user-1', {
        specimenId: 'spec-1',
        toStatus: 'Rejected',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('Invalid transition');
    });
  });

  describe('handleExplainLabResultHistoryLogic', () => {
    it('clarifies when resultId is missing', async () => {
      const deps = buildDeps();
      const result = await handleExplainLabResultHistoryLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('returns the change history', async () => {
      const deps = buildDeps();
      const result = await handleExplainLabResultHistoryLogic(
        deps,
        'biz-1',
        'user-1',
        { resultId: 'result-1' },
      );
      expect(result.success).toBe(true);
      expect(result.details.count).toBe(1);
    });

    it('reports no history gracefully', async () => {
      const deps = buildDeps({
        clinicLabChangeHistoryService: {
          listResultChangeHistory: jest.fn(async () => []),
        },
      });
      const result = await handleExplainLabResultHistoryLogic(
        deps,
        'biz-1',
        'user-1',
        { resultId: 'result-1' },
      );
      expect(result.success).toBe(true);
      expect(result.details.count).toBe(0);
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        clinicLabAccessService: {
          resolveStaffContext: jest.fn(async () => ({
            userId: 'user-1',
            membershipRole: 'owner',
            employeeId: null,
          })),
          assertResultLabAccess: jest.fn(async () => {
            throw new Error('Clinic test result not found');
          }),
          assertSpecimenLabAccess: jest.fn(async () => ({
            userId: 'user-1',
            membershipRole: 'owner',
            employeeId: null,
          })),
        },
      });
      const result = await handleExplainLabResultHistoryLogic(
        deps,
        'biz-1',
        'user-1',
        { resultId: 'result-1' },
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('not found');
    });
  });
});
