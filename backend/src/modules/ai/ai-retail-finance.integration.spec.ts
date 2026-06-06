import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiRetailFinanceService } from './ai-retail-finance.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { RetailPosService } from '../retail-pos/retail-pos.service.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { CommissionsService } from '../commissions/commissions.service.js';

describe('Sprint 33 retail/finance AI scenarios', () => {
  const product = {
    id: 'prod-1',
    businessId: 'biz-1',
    name: 'Shampoo',
    sku: 'SH-01',
    retailPrice: 25,
    quantityOnHand: 10,
    isActive: true,
  };
  const serviceEntity = {
    id: 'svc-1',
    businessId: 'biz-1',
    name: 'Haircut',
    isActive: true,
  };
  const booking = {
    id: 'b1',
    businessId: 'biz-1',
    employeeId: 'e1',
    serviceId: 'svc-1',
    status: 'confirmed',
    startTime: new Date('2026-06-05T10:00:00Z'),
    endTime: new Date('2026-06-05T11:00:00Z'),
    customer: { id: 'c1', name: 'Anna' },
    service: { currency: 'USD' },
  };

  const inventoryService = {
    listProducts: jest.fn(async () => [product]),
    createProduct: jest.fn(async () => product),
    linkToService: jest.fn(async () => ({
      id: 'link-1',
      serviceId: 'svc-1',
      productId: 'prod-1',
    })),
    listServiceLinks: jest.fn(async () => [
      {
        id: 'link-1',
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        productId: 'prod-1',
        productName: 'Shampoo',
        quantityPerService: 1,
      },
    ]),
    adjustStock: jest.fn(async () => ({ ...product, quantityOnHand: 20 })),
  };
  const retailPosService = {
    listSellableProducts: jest.fn(async () => [
      {
        id: 'prod-1',
        name: 'Shampoo',
        sku: 'SH-01',
        retailPrice: 25,
        quantityOnHand: 10,
      },
    ]),
    getBookingRetailSales: jest.fn(async () => ({
      lines: [
        {
          id: 'line-1',
          productId: 'prod-1',
          productName: 'Shampoo',
          quantity: 1,
          unitPrice: 25,
          lineTotal: 25,
        },
      ],
      retailTotal: 25,
      currency: 'USD',
    })),
    setBookingRetailSales: jest.fn(async () => ({
      lines: [
        {
          id: 'line-1',
          productId: 'prod-1',
          productName: 'Shampoo',
          quantity: 2,
          unitPrice: 25,
          lineTotal: 50,
        },
      ],
      retailTotal: 50,
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
      period: { from: '2026-06-01', to: '2026-06-30' },
    })),
    staffPerformance: jest.fn(async () => ({
      currency: 'USD',
      rows: [
        {
          employeeId: 'e1',
          employeeName: 'Alex',
          bookings: 10,
          completed: 8,
          noShows: 1,
          revenue: 800,
          hoursBooked: 20,
          utilizationPercent: 50,
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
      content: 'employeeName\nAlex',
      rowCount: 1,
    })),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => booking),
    find: jest.fn(async () => [booking]),
  };
  const serviceRepo = {
    findOne: jest.fn(async () => serviceEntity),
    find: jest.fn(async () => [serviceEntity]),
  };
  const productRepo = { findOne: jest.fn(async () => product) };
  const employeeRepo = {
    find: jest.fn(async () => [
      { id: 'e1', name: 'Alex', businessId: 'biz-1', isActive: true },
    ]),
  };

  let retailFinance: AiRetailFinanceService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AiRetailFinanceService,
        AiIntentRescueService,
        { provide: InventoryService, useValue: inventoryService },
        { provide: RetailPosService, useValue: retailPosService },
        { provide: ExpensesService, useValue: expensesService },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: CommissionsService, useValue: commissionsService },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Service), useValue: serviceRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
      ],
    }).compile();

    retailFinance = module.get(AiRetailFinanceService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue', () => {
    it('rescues retail/finance intents before integrations and payments rescue', () => {
      expect(
        retailFinance.rescueRetailFinanceIntent('List products', 'unknown')
          ?.action,
      ).toBe('list_products');
      expect(
        rescue.rescue({
          prompt: 'Payout export this month',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('payout_export');
      expect(
        rescue.rescue({
          prompt: 'Export commissions for May',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('export_commissions');
      expect(
        retailFinance.rescueRetailFinanceIntent('List services', 'unknown'),
      ).toBeNull();
      expect(
        rescue.rescue({
          prompt: 'Commission report this month',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('commission_report');
      expect(
        rescue.rescue({
          prompt: 'Remove retail line from booking b1',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('remove_retail_line');
      expect(
        rescue.rescue({
          prompt: 'Record expense for supplies',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('record_expense');
      expect(
        rescue.rescue({
          prompt: 'Link shampoo to haircut service',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('link_product_to_service');
      expect(
        retailFinance.isRetailFinanceCompound(
          'Link shampoo to haircut and adjust inventory by 10',
        ),
      ).toBe(true);
    });
  });

  describe('handlers', () => {
    it('runs dashboard retail and finance handlers', async () => {
      expect(
        (await retailFinance.handleListProducts('biz-1', {})).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleCreateProduct('biz-1', {
            name: 'Shampoo',
            sku: 'SH-01',
            retailPrice: 25,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleLinkProductToService('biz-1', {
            productName: 'Shampoo',
            serviceName: 'Haircut',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleAdjustInventory('biz-1', {
            productName: 'Shampoo',
            delta: 10,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleAddRetailSaleToBooking(
            'biz-1',
            { bookingId: 'b1', productName: 'Shampoo' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleRemoveRetailLine(
            'biz-1',
            { bookingId: 'b1', productName: 'Shampoo' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(retailPosService.setBookingRetailSales).toHaveBeenCalled();
      expect(
        (
          await retailFinance.handleRecordExpense('biz-1', {
            category: 'Supplies',
            amount: 45,
          })
        ).success,
      ).toBe(true);
      expect(
        (await retailFinance.handleListExpenses('biz-1', {})).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleSummarizePl(
            'biz-1',
            {},
            'summarize P&L this month',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleCommissionReport(
            'biz-1',
            {},
            'commission report this month',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handlePayoutExport(
            'biz-1',
            {},
            'payout export this month',
          )
        ).success,
      ).toBe(true);
    });

    it('runs provider retail handlers', async () => {
      expect(
        (
          await retailFinance.handleSuggestRetailUpsell('biz-1', {
            bookingId: 'b1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await retailFinance.handleAddRetailToMyBooking(
            'biz-1',
            { sessionEmployeeId: 'e1', productName: 'Shampoo' },
            'u1',
          )
        ).success,
      ).toBe(true);
    });
  });

  describe('compound', () => {
    it('completes inventory compound flow with context merge', async () => {
      const result = await retailFinance.handleRetailFinanceCompound(
        'biz-1',
        'List products and create product Shampoo sku SH-01 retail 25',
        {},
        'u1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).retailFinanceCompound).toBe(true);
      expect((result.details as any).steps.length).toBe(2);
    });

    it('completes link and inventory adjust compound flow', async () => {
      const linkAdjust = await retailFinance.handleRetailFinanceCompound(
        'biz-1',
        'Link shampoo to haircut service and adjust inventory by 10',
        {},
        'u1',
      );
      expect(linkAdjust.success).toBe(true);
      expect((linkAdjust.details as any).steps.length).toBe(2);
      expect(inventoryService.linkToService).toHaveBeenCalled();
      expect(inventoryService.adjustStock).toHaveBeenCalled();
    });

    it('completes retail and finance compound flows', async () => {
      const retailPl = await retailFinance.handleRetailFinanceCompound(
        'biz-1',
        'Add retail sale shampoo to booking b1 and summarize P&L this month',
        {},
        'u1',
      );
      expect(retailPl.success).toBe(true);

      const provider = await retailFinance.handleRetailFinanceCompound(
        'biz-1',
        'Suggest retail upsell for my appointment and add shampoo to my booking',
        { sessionEmployeeId: 'e1' },
        'u1',
      );
      expect(provider.success).toBe(true);
    });

    it('stops compound on failure', async () => {
      inventoryService.createProduct.mockRejectedValueOnce(
        new Error('create failed'),
      );
      const stopped = await retailFinance.handleRetailFinanceCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            {
              action: 'create_product',
              params: { name: 'X' },
              segment: 'create',
            },
            { action: 'list_products', params: {}, segment: 'list' },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('create_product');
    });
  });
});
