import { NotFoundException } from '@nestjs/common';
import { ClinicLabChangeHistoryService } from './clinic-lab-change-history.service.js';

describe('ClinicLabChangeHistoryService', () => {
  const orderRepo = { findOne: jest.fn(), find: jest.fn() };
  const orderHistoryRepo = { find: jest.fn() };
  const resultRepo = { findOne: jest.fn(), find: jest.fn() };
  const resultHistoryRepo = { find: jest.fn() };
  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };
  const clinicLabPhiService = {
    decryptStatusHistoryNoteForStaff: jest.fn(async (_b, note) => note),
  };

  const service = new ClinicLabChangeHistoryService(
    orderRepo as any,
    orderHistoryRepo as any,
    resultRepo as any,
    resultHistoryRepo as any,
    businessService as any,
    clinicLabPhiService as any,
  );

  const staffCtx = {
    userId: 'user-1',
    membershipRole: 'manager',
    employeeId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists order change history mapped from status history rows', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      bookingId: 'booking-1',
    });
    orderHistoryRepo.find.mockResolvedValue([
      {
        id: 'hist-1',
        orderId: 'order-1',
        status: 'Collecting',
        previousStatus: 'NotCollected',
        note: 'Started draw',
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        employeeId: 'emp-1',
        employee: { id: 'emp-1', name: 'Nurse A' },
      },
    ]);

    const rows = await service.listOrderChangeHistory(
      'biz-1',
      'order-1',
      staffCtx,
      { employeeId: 'emp-1', linkedEmployeeIds: [] },
    );

    expect(rows).toEqual([
      expect.objectContaining({
        entityType: 'order',
        entityId: 'order-1',
        action: 'StatusChanged',
        note: 'Started draw',
      }),
    ]);
  });

  it('lists result change history with release action', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      bookingId: 'booking-1',
    });
    resultHistoryRepo.find.mockResolvedValue([
      {
        id: 'hist-2',
        resultId: 'result-1',
        status: 'Released',
        previousStatus: 'Reviewed',
        note: null,
        createdAt: new Date('2026-06-07T12:00:00.000Z'),
        employeeId: 'emp-2',
        employee: { id: 'emp-2', name: 'Dr Smith' },
      },
    ]);

    const rows = await service.listResultChangeHistory(
      'biz-1',
      'result-1',
      staffCtx,
      { employeeId: 'emp-1', linkedEmployeeIds: [] },
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        action: 'ResultReleased',
        changes: [{ propertyName: 'status', from: 'Reviewed', to: 'Released' }],
      }),
    );
  });

  it('merges booking order and result history', async () => {
    orderRepo.find.mockResolvedValue([{ id: 'order-1' }]);
    resultRepo.find.mockResolvedValue([{ id: 'result-1' }]);
    orderHistoryRepo.find.mockResolvedValue([
      {
        id: 'hist-order',
        orderId: 'order-1',
        status: 'AwaitingResults',
        previousStatus: 'Collecting',
        note: null,
        createdAt: new Date('2026-06-01T11:00:00.000Z'),
        employeeId: null,
        employee: null,
      },
    ]);
    resultHistoryRepo.find.mockResolvedValue([
      {
        id: 'hist-result',
        resultId: 'result-1',
        status: 'Reviewed',
        previousStatus: 'Completed',
        note: null,
        createdAt: new Date('2026-06-07T13:00:00.000Z'),
        employeeId: null,
        employee: null,
      },
    ]);

    const rows = await service.listBookingLabChangeHistory(
      'biz-1',
      'booking-1',
      staffCtx,
      { employeeId: 'emp-1', linkedEmployeeIds: [] },
    );

    expect(rows.map((row) => row.id)).toEqual(['hist-result', 'hist-order']);
  });

  it('throws when order is missing', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(
      service.listOrderChangeHistory('biz-1', 'missing', staffCtx, null),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
