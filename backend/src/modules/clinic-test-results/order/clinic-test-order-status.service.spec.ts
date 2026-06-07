import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClinicTestOrderStatusService } from './clinic-test-order-status.service.js';

describe('ClinicTestOrderStatusService', () => {
  const orderRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (v) => v),
  };
  const historyRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
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

  it('transitions order status and writes history', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      status: 'NotCollected',
    });

    const updated = await service.transitionOrderStatus({
      businessId: 'biz-1',
      orderId: 'order-1',
      toStatus: 'Collecting',
      employeeId: 'emp-1',
      note: 'Started draw',
    });

    expect(updated.status).toBe('Collecting');
    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        status: 'Collecting',
        previousStatus: 'NotCollected',
        employeeId: 'emp-1',
      }),
    );
  });

  it('returns same order when status unchanged', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      status: 'Collecting',
    });

    const updated = await service.transitionOrderStatus({
      businessId: 'biz-1',
      orderId: 'order-1',
      toStatus: 'Collecting',
    });

    expect(updated.status).toBe('Collecting');
    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  it('sets cancelledAt when cancelling', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      status: 'Collecting',
    });

    const updated = await service.transitionOrderStatus({
      businessId: 'biz-1',
      orderId: 'order-1',
      toStatus: 'Cancelled',
    });

    expect(updated.cancelledAt).toBeInstanceOf(Date);
  });

  it('rejects invalid transitions', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      status: 'NotCollected',
    });

    await expect(
      service.transitionOrderStatus({
        businessId: 'biz-1',
        orderId: 'order-1',
        toStatus: 'Completed',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when order missing', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await expect(
      service.transitionOrderStatus({
        businessId: 'biz-1',
        orderId: 'missing',
        toStatus: 'Collecting',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ensures result row when order reaches awaiting results', async () => {
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
