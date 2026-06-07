import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleCreateTestOrderLogic,
  handleListTestOrdersLogic,
} from './ai-clinic-test-order.logic.js';
import { CREATE_TEST_ORDER_PROMPTS } from './ai-clinic-test-order.fixtures.js';

describe('ai-clinic-test-order.logic', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      timezone: 'UTC',
      settings: { businessType: 'clinic' },
    })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'booking-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-08T10:00:00.000Z'),
        customer: { id: 'cust-1', name: 'Maria Lopez' },
      },
    ]),
    findOne: jest.fn(async () => ({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-08T10:00:00.000Z'),
      customer: { id: 'cust-1', name: 'Maria Lopez' },
    })),
  };
  const testTypeRepo = {
    find: jest.fn(async () => [
      {
        id: 'type-cbc',
        code: 'CBC',
        title: 'Complete blood count',
        isActive: true,
      },
    ]),
  };
  const testPanelRepo = {
    find: jest.fn(async () => [
      {
        id: 'panel-lipid',
        code: 'LIPID',
        title: 'Lipid panel',
        isActive: true,
      },
    ]),
  };
  const clinicTestOrderService = {
    createCatalogOrderForBooking: jest.fn(async () => ({
      id: 'order-1',
      bookingId: 'booking-1',
      status: 'NotCollected',
      displayNames: 'Complete blood count, Lipid panel',
    })),
    listLabQueue: jest.fn(async () => [
      {
        id: 'order-1',
        status: 'NotCollected',
        displayNames: 'Complete blood count',
        customerName: 'Maria Lopez',
      },
    ]),
    listOrdersForBooking: jest.fn(async () => []),
  };
  const clinicLabAccessService = {
    assertCanCreateManualLabOrder: jest.fn(async () => ({
      userId: 'user-1',
      membershipRole: MemberRole.MANAGER,
      employeeId: 'emp-1',
    })),
    scopeLabQueueFilters: jest.fn(async (_b, _u, filters) => filters),
  };

  const deps = {
    businessRepo,
    bookingRepo,
    testTypeRepo,
    testPanelRepo,
    clinicTestOrderService,
    clinicLabAccessService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires confirmation before creating lab orders', async () => {
    const prompt = CREATE_TEST_ORDER_PROMPTS[0].prompt;
    const preview = await handleCreateTestOrderLogic(
      deps as never,
      'biz-1',
      'user-1',
      {
        testNames: ['CBC', 'lipid panel'],
        customerName: 'Maria',
        date: 'tomorrow',
      },
      prompt,
      false,
    );

    expect(preview.success).toBe(true);
    expect(preview.details.requiresConfirmation).toBe(true);
    expect(
      clinicTestOrderService.createCatalogOrderForBooking,
    ).not.toHaveBeenCalled();
  });

  it('creates catalog lab orders after confirmation', async () => {
    const prompt = CREATE_TEST_ORDER_PROMPTS[0].prompt;
    const result = await handleCreateTestOrderLogic(
      deps as never,
      'biz-1',
      'user-1',
      {
        testNames: ['CBC', 'lipid panel'],
        customerName: 'Maria',
        date: 'tomorrow',
      },
      prompt,
      true,
    );

    expect(result.success).toBe(true);
    expect(result.details.orderId).toBe('order-1');
    expect(
      clinicTestOrderService.createCatalogOrderForBooking,
    ).toHaveBeenCalledWith(
      'biz-1',
      'booking-1',
      expect.arrayContaining([
        expect.objectContaining({ type: 'test_type', testTypeId: 'type-cbc' }),
        expect.objectContaining({
          type: 'test_panel',
          testPanelId: 'panel-lipid',
        }),
      ]),
    );
  });

  it('lists lab orders for a patient visit', async () => {
    const result = await handleListTestOrdersLogic(
      deps as never,
      'biz-1',
      'user-1',
      { customerName: 'Maria', date: 'tomorrow' },
      "Show Maria's lab orders for tomorrow",
    );

    expect(result.success).toBe(true);
    expect(result.details.count).toBe(1);
    expect(clinicTestOrderService.listLabQueue).toHaveBeenCalled();
  });

  it('rejects non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    const result = await handleCreateTestOrderLogic(
      deps as never,
      'biz-1',
      'user-1',
      { testNames: ['CBC'], customerName: 'Maria' },
      'Order CBC for Maria',
      true,
    );

    expect(result.success).toBe(false);
    expect(result.details.clinicOnly).toBe(true);
  });

  it('passes awaitingPatientBooking filter to lab queue', async () => {
    const result = await handleListTestOrdersLogic(
      deps as never,
      'biz-1',
      'user-1',
      {},
      'Show orders awaiting patient booking',
    );

    expect(result.success).toBe(true);
    expect(clinicTestOrderService.listLabQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ awaitingPatientBooking: true }),
    );
  });
});
