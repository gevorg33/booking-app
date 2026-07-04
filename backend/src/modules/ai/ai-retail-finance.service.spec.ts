import { AiRetailFinanceService } from './ai-retail-finance.service.js';

describe('AiRetailFinanceService', () => {
  const inventoryService = {
    listProducts: jest.fn(async () => [
      { id: 'prod-1', name: 'Shampoo', quantityOnHand: 10 },
    ]),
    createProduct: jest.fn(async () => ({ id: 'prod-1', name: 'Shampoo' })),
    linkToService: jest.fn(async () => ({ id: 'link-1' })),
    listServiceLinks: jest.fn(async () => []),
    adjustStock: jest.fn(async () => ({
      id: 'prod-1',
      name: 'Shampoo',
      quantityOnHand: 20,
    })),
  };
  const retailPosService = {
    listSellableProducts: jest.fn(async () => [
      { id: 'prod-1', name: 'Shampoo', retailPrice: 25, quantityOnHand: 10 },
    ]),
    getBookingRetailSales: jest.fn(async () => ({
      lines: [],
      retailTotal: 0,
      currency: 'USD',
    })),
    setBookingRetailSales: jest.fn(async () => ({
      lines: [{ productId: 'prod-1', quantity: 1, lineTotal: 25 }],
      retailTotal: 25,
      currency: 'USD',
    })),
  };
  const expensesService = {
    list: jest.fn(async () => [
      { id: 'exp-1', category: 'Supplies', amount: 50 },
    ]),
    create: jest.fn(async (_, dto) => ({ id: 'exp-2', ...dto })),
  };
  const analyticsService = {
    profitAndLoss: jest.fn(async () => ({
      revenue: 1000,
      expenses: 200,
      commissions: 100,
      netProfit: 700,
      currency: 'USD',
    })),
    staffPerformance: jest.fn(async () => ({
      currency: 'USD',
      rows: [
        {
          employeeId: 'e1',
          employeeName: 'Alex',
          revenue: 800,
          bookings: 5,
          completed: 4,
          noShows: 0,
          hoursBooked: 10,
          utilizationPercent: 40,
        },
      ],
    })),
  };
  const commissionsService = {
    list: jest.fn(async () => [
      { id: 'rule-1', employeeId: 'e1', type: 'percent', value: 10 },
    ]),
    exportPayoutCsv: jest.fn(async () => ({
      filename: 'payout.csv',
      content: 'rows',
      rowCount: 1,
    })),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => ({
      id: 'b1',
      businessId: 'biz-1',
      employeeId: 'e1',
      serviceId: 'svc-1',
      status: 'confirmed',
      startTime: new Date('2026-06-05T10:00:00Z'),
      endTime: new Date('2026-06-05T11:00:00Z'),
      customer: { name: 'Anna' },
      service: { currency: 'USD' },
    })),
    find: jest.fn(async () => []),
  };
  const serviceRepo = {
    findOne: jest.fn(async () => ({
      id: 'svc-1',
      name: 'Haircut',
      businessId: 'biz-1',
      isActive: true,
    })),
    find: jest.fn(async () => [
      { id: 'svc-1', name: 'Haircut', businessId: 'biz-1', isActive: true },
    ]),
  };
  const productRepo = {
    findOne: jest.fn(async () => ({
      id: 'prod-1',
      name: 'Shampoo',
      businessId: 'biz-1',
      isActive: true,
    })),
  };
  const employeeRepo = {
    find: jest.fn(async () => [{ id: 'e1', name: 'Alex' }]),
  };

  let service: AiRetailFinanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        businessId: 'biz-1',
        employeeId: 'e1',
        serviceId: 'svc-1',
        status: 'confirmed',
        startTime: new Date('2026-06-05T10:00:00Z'),
        endTime: new Date('2026-06-05T11:00:00Z'),
        customer: { name: 'Anna' },
        service: { currency: 'USD' },
      },
    ]);
    service = new AiRetailFinanceService(
      inventoryService as any,
      retailPosService as any,
      expensesService as any,
      analyticsService as any,
      commissionsService as any,
      bookingRepo as any,
      serviceRepo as any,
      productRepo as any,
      employeeRepo as any,
      { handleMarkPaid: jest.fn(async () => ({ success: true, action: 'mark_paid', summary: 'ok', details: {} })) } as any,
    );
  });

  it('delegates rescue and compound helpers', () => {
    expect(
      service.rescueRetailFinanceIntent('List products', 'unknown')?.action,
    ).toBe('list_products');
    expect(
      service.isRetailFinanceCompound(
        'List products and create product Shampoo sku SH-01 retail 25',
      ),
    ).toBe(true);
    expect(
      service.decomposeRetailFinanceCompound(
        'Link shampoo to haircut service and adjust inventory by 10',
      ).length,
    ).toBe(2);
  });

  it('delegates all retail/finance handlers', async () => {
    expect((await service.handleListProducts('biz-1', {})).success).toBe(true);
    expect(
      (
        await service.handleCreateProduct('biz-1', {
          name: 'Shampoo',
          sku: 'SH-01',
          retailPrice: 25,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleLinkProductToService('biz-1', {
          productName: 'Shampoo',
          serviceName: 'Haircut',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleAdjustInventory('biz-1', {
          productName: 'Shampoo',
          delta: 10,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleAddRetailSaleToBooking(
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleRemoveRetailLine(
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleRecordExpense('biz-1', {
          category: 'Rent',
          amount: 500,
        })
      ).success,
    ).toBe(true);
    expect((await service.handleListExpenses('biz-1', {})).success).toBe(true);
    expect(
      (await service.handleSummarizePl('biz-1', {}, 'summarize P&L this month'))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleCommissionReport(
          'biz-1',
          {},
          'commission report this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handlePayoutExport(
          'biz-1',
          {},
          'payout export this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (await service.handleSuggestRetailUpsell('biz-1', { bookingId: 'b1' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleAddRetailToMyBooking(
          'biz-1',
          { sessionEmployeeId: 'e1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);

    const compound = await service.handleRetailFinanceCompound(
      'biz-1',
      'List products and create product Shampoo sku SH-01 retail 25',
      {},
      'u1',
    );
    expect(compound.success).toBe(true);
  });
});
