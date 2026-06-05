import {
  handleListProductsLogic,
  handleCreateProductLogic,
  handleLinkProductToServiceLogic,
  handleAdjustInventoryLogic,
  handleAddRetailSaleToBookingLogic,
  handleRemoveRetailLineLogic,
  handleRecordExpenseLogic,
  handleListExpensesLogic,
  handleSummarizePlLogic,
  handleCommissionReportLogic,
  handlePayoutExportLogic,
  handleSuggestRetailUpsellLogic,
  handleAddRetailToMyBookingLogic,
  handleRetailFinanceCompoundLogic,
  mergeRetailFinanceCompoundContext,
  type RetailFinanceLogicDeps,
} from './ai-retail-finance.logic.js';

const product = {
  id: 'prod-1',
  businessId: 'biz-1',
  name: 'Shampoo',
  sku: 'SH-01',
  retailPrice: 25,
  quantityOnHand: 10,
  isActive: true,
};

const service = {
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
  customerId: 'c1',
  status: 'confirmed',
  startTime: new Date('2026-06-05T10:00:00Z'),
  endTime: new Date('2026-06-05T11:00:00Z'),
  customer: { id: 'c1', name: 'Anna' },
  service,
};

function buildDeps(
  overrides: Partial<RetailFinanceLogicDeps> = {},
): RetailFinanceLogicDeps {
  return {
    inventoryService: {
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
    } as any,
    retailPosService: {
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
    } as any,
    expensesService: {
      list: jest.fn(async () => [
        { id: 'exp-1', category: 'Supplies', amount: 50 },
      ]),
      create: jest.fn(async (_, dto) => ({ id: 'exp-2', ...dto })),
    } as any,
    analyticsService: {
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
    } as any,
    commissionsService: {
      list: jest.fn(async () => [
        { id: 'rule-1', employeeId: 'e1', type: 'percent', value: 10 },
      ]),
      exportPayoutCsv: jest.fn(async () => ({
        filename: 'payout.csv',
        content: 'rows',
        rowCount: 2,
      })),
    } as any,
    bookingRepo: {
      findOne: jest.fn(async ({ where }: any) => {
        if (where.id === 'b1' || where.id?.startsWith?.('b1'))
          return { ...booking };
        return null;
      }),
      find: jest.fn(async () => [{ ...booking }]),
    } as any,
    serviceRepo: {
      findOne: jest.fn(async () => service),
      find: jest.fn(async () => [service]),
    } as any,
    productRepo: {
      findOne: jest.fn(async () => product),
    } as any,
    employeeRepo: {
      find: jest.fn(async () => [
        { id: 'e1', name: 'Alex', businessId: 'biz-1', isActive: true },
      ]),
    } as any,
    ...overrides,
  };
}

describe('ai-retail-finance.logic', () => {
  it('lists and creates products', async () => {
    const deps = buildDeps();
    expect((await handleListProductsLogic(deps, 'biz-1', {})).success).toBe(
      true,
    );

    const empty = buildDeps({
      inventoryService: { listProducts: jest.fn(async () => []) } as any,
    });
    expect(
      (await handleListProductsLogic(empty, 'biz-1', {})).summary,
    ).toContain('No products');

    expect(
      (
        await handleCreateProductLogic(deps, 'biz-1', {
          name: 'Gel',
          sku: 'G-1',
          retailPrice: 15,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleCreateProductLogic(
          deps,
          'biz-1',
          {},
          'create product Shampoo sku SH-01 retail 25',
        )
      ).success,
    ).toBe(true);
    expect((await handleCreateProductLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleCreateProductLogic(
          buildDeps({
            inventoryService: {
              createProduct: jest.fn(async () => {
                throw new Error('fail');
              }),
            } as any,
          }),
          'biz-1',
          { name: 'X' },
        )
      ).success,
    ).toBe(false);
  });

  it('links products and adjusts inventory', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleLinkProductToServiceLogic(deps, 'biz-1', {
          productName: 'Shampoo',
          serviceName: 'Haircut',
        })
      ).success,
    ).toBe(true);
    expect(
      (await handleLinkProductToServiceLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleLinkProductToServiceLogic(deps, 'biz-1', {
          productName: 'Shampoo',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleLinkProductToServiceLogic(
          buildDeps({
            productRepo: { findOne: jest.fn(async () => null) } as any,
          }),
          'biz-1',
          { productName: 'Missing', serviceName: 'Haircut' },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleLinkProductToServiceLogic(
          buildDeps({
            linkToService: undefined,
            inventoryService: {
              ...buildDeps().inventoryService,
              linkToService: jest.fn(async () => {
                throw new Error('link fail');
              }),
            } as any,
          }),
          'biz-1',
          { productName: 'Shampoo', serviceName: 'Haircut' },
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handleAdjustInventoryLogic(deps, 'biz-1', {
          productName: 'Shampoo',
          delta: 10,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAdjustInventoryLogic(
          deps,
          'biz-1',
          {},
          'adjust inventory by 10',
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAdjustInventoryLogic(deps, 'biz-1', {
          productName: 'Shampoo',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAdjustInventoryLogic(
          buildDeps({
            inventoryService: {
              ...buildDeps().inventoryService,
              adjustStock: jest.fn(async () => {
                throw new Error('adjust fail');
              }),
            } as any,
          }),
          'biz-1',
          { productName: 'Shampoo', delta: 1 },
        )
      ).success,
    ).toBe(false);
  });

  it('manages booking retail sales', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          deps,
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          deps,
          'biz-1',
          { productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          deps,
          'biz-1',
          { bookingId: 'b1' },
          'u1',
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          buildDeps({
            retailPosService: {
              ...buildDeps().retailPosService,
              setBookingRetailSales: jest.fn(async () => {
                throw new Error('pos fail');
              }),
            } as any,
          }),
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handleRemoveRetailLineLogic(
          deps,
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect((await handleRemoveRetailLineLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleRemoveRetailLineLogic(
          buildDeps({
            retailPosService: {
              getBookingRetailSales: jest.fn(async () => ({
                lines: [],
                retailTotal: 0,
                currency: 'USD',
              })),
              setBookingRetailSales: jest.fn(async () => ({
                lines: [],
                retailTotal: 0,
                currency: 'USD',
              })),
            } as any,
          }),
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
          'u1',
        )
      ).summary,
    ).toContain('cart cleared');
    expect(
      (
        await handleRemoveRetailLineLogic(
          buildDeps({
            retailPosService: {
              ...buildDeps().retailPosService,
              setBookingRetailSales: jest.fn(async () => {
                throw new Error('remove fail');
              }),
            } as any,
          }),
          'biz-1',
          { bookingId: 'b1', productName: 'Shampoo' },
        )
      ).success,
    ).toBe(false);
  });

  it('records and lists expenses', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleRecordExpenseLogic(deps, 'biz-1', {
          category: 'Rent',
          amount: 500,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRecordExpenseLogic(
          deps,
          'biz-1',
          {},
          'record expense supplies $45',
        )
      ).success,
    ).toBe(true);
    expect((await handleRecordExpenseLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (await handleRecordExpenseLogic(deps, 'biz-1', { category: 'Rent' }))
        .success,
    ).toBe(false);
    expect(
      (
        await handleRecordExpenseLogic(
          buildDeps({
            expensesService: {
              create: jest.fn(async () => {
                throw new Error('expense fail');
              }),
            } as any,
          }),
          'biz-1',
          { category: 'Rent', amount: 1 },
        )
      ).success,
    ).toBe(false);
    expect((await handleListExpensesLogic(deps, 'biz-1', {})).success).toBe(
      true,
    );
    expect(
      (
        await handleListExpensesLogic(
          buildDeps({
            expensesService: { list: jest.fn(async () => []) } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toContain('No expenses');
  });

  it('summarizes P&L, commission report, and payout export', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleSummarizePlLogic(
          deps,
          'biz-1',
          {},
          'summarize P&L this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizePlLogic(
          buildDeps({
            analyticsService: {
              profitAndLoss: jest.fn(async () => {
                throw new Error('pl fail');
              }),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handleCommissionReportLogic(
          deps,
          'biz-1',
          {},
          'commission report this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleCommissionReportLogic(
          buildDeps({
            analyticsService: {
              staffPerformance: jest.fn(async () => {
                throw new Error('report fail');
              }),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).success,
    ).toBe(false);

    expect(
      (
        await handlePayoutExportLogic(
          deps,
          'biz-1',
          {},
          'payout export this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handlePayoutExportLogic(
          buildDeps({
            commissionsService: {
              exportPayoutCsv: jest.fn(async () => {
                throw new Error('export fail');
              }),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).success,
    ).toBe(false);
  });

  it('handles provider retail upsell and my booking', async () => {
    const deps = buildDeps();
    expect(
      (await handleSuggestRetailUpsellLogic(deps, 'biz-1', { bookingId: 'b1' }))
        .success,
    ).toBe(true);
    expect(
      (
        await handleSuggestRetailUpsellLogic(
          deps,
          'biz-1',
          { sessionEmployeeId: 'e1', myAppointment: true },
          'my appointment',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSuggestRetailUpsellLogic(deps, 'biz-1', {
          serviceName: 'Haircut',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSuggestRetailUpsellLogic(
          buildDeps({
            retailPosService: {
              listSellableProducts: jest.fn(async () => []),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toContain('No sellable');

    expect(
      (
        await handleAddRetailToMyBookingLogic(
          deps,
          'biz-1',
          { sessionEmployeeId: 'e1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleAddRetailToMyBookingLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleAddRetailToMyBookingLogic(
          buildDeps({
            bookingRepo: {
              find: jest.fn(async () => []),
              findOne: jest.fn(async () => null),
            } as any,
          }),
          'biz-1',
          { sessionEmployeeId: 'e1', productName: 'Shampoo' },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAddRetailToMyBookingLogic(
          buildDeps({
            bookingRepo: {
              find: jest.fn(async () => [{ ...booking, employeeId: 'other' }]),
              findOne: jest.fn(async () => ({
                ...booking,
                employeeId: 'other',
              })),
            } as any,
          }),
          'biz-1',
          { sessionEmployeeId: 'e1', productName: 'Shampoo' },
        )
      ).success,
    ).toBe(false);
  });

  it('resolves bookings and products via ids and partial matches', async () => {
    const deps = buildDeps({
      bookingRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => [{ ...booking, id: 'b1-full-uuid' }]),
      } as any,
      productRepo: {
        findOne: jest.fn(async () => null),
      } as any,
      inventoryService: {
        ...buildDeps().inventoryService,
        listProducts: jest.fn(async () => [{ ...product, id: 'b1-full-uuid' }]),
      } as any,
    });
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          deps,
          'biz-1',
          { bookingId: 'b1', productId: 'b1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          deps,
          'biz-1',
          { customerName: 'Anna', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);
  });

  it('merges compound context and runs compound flows', async () => {
    const deps = buildDeps();
    const merged = mergeRetailFinanceCompoundContext(
      {},
      { action: 'list_products', params: {}, segment: 'list' },
      {
        success: true,
        action: 'list_products',
        summary: '',
        details: { products: [{ id: 'prod-1', name: 'Shampoo' }] },
      },
    );
    expect(merged.productId).toBe('prod-1');

    const createMerged = mergeRetailFinanceCompoundContext(
      {},
      { action: 'create_product', params: {}, segment: 'create' },
      {
        success: true,
        action: 'create_product',
        summary: '',
        details: { productId: 'prod-2' },
      },
    );
    expect(createMerged.productId).toBe('prod-2');

    const linkMerged = mergeRetailFinanceCompoundContext(
      {},
      { action: 'link_product_to_service', params: {}, segment: 'link' },
      {
        success: true,
        action: 'link_product_to_service',
        summary: '',
        details: { productId: 'p1', serviceId: 's1' },
      },
    );
    expect(linkMerged.serviceId).toBe('s1');

    const retailMerged = mergeRetailFinanceCompoundContext(
      {},
      { action: 'add_retail_sale_to_booking', params: {}, segment: 'add' },
      {
        success: true,
        action: 'add_retail_sale_to_booking',
        summary: '',
        details: { bookingId: 'b1' },
      },
    );
    expect(retailMerged.bookingId).toBe('b1');

    const compound = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'List products and create product Shampoo sku SH-01 retail 25',
      {},
      'u1',
    );
    expect(compound.success).toBe(true);
    expect((compound.details as any).retailFinanceCompound).toBe(true);

    const linkAdjust = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'Link shampoo to haircut service and adjust inventory by 10',
      {},
    );
    expect(linkAdjust.success).toBe(true);

    const stopped = await handleRetailFinanceCompoundLogic(
      buildDeps({
        inventoryService: {
          listProducts: jest.fn(async () => [product]),
          createProduct: jest.fn(async () => {
            throw new Error('create fail');
          }),
        } as any,
      }),
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

    const tooShort = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'List products',
      {},
    );
    expect(tooShort.success).toBe(false);

    const unsupported = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_products', params: {}, segment: 'a' },
          { action: 'not_real' as any, params: {}, segment: 'b' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);

    const allSteps = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_expenses', params: {}, segment: 'a' },
          {
            action: 'commission_report',
            params: { from: '2026-06-01', to: '2026-06-30' },
            segment: 'b',
          },
          { action: 'payout_export', params: {}, segment: 'c' },
          {
            action: 'remove_retail_line',
            params: { bookingId: 'b1', productName: 'Gel' },
            segment: 'd',
          },
        ],
        sessionEmployeeId: 'e1',
      },
    );
    expect(allSteps.success).toBe(true);

    const providerCompound = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'suggest_retail_upsell',
            params: { serviceId: 'svc-1' },
            segment: 'a',
          },
          {
            action: 'add_retail_to_my_booking',
            params: { sessionEmployeeId: 'e1', productName: 'Shampoo' },
            segment: 'b',
          },
        ],
      },
    );
    expect(providerCompound.success).toBe(true);
  });

  it('covers id-based resolution and partial retail removal', async () => {
    const deps = buildDeps({
      productRepo: { findOne: jest.fn(async () => product) } as any,
      serviceRepo: {
        findOne: jest.fn(async () => service),
        find: jest.fn(async () => [service]),
      } as any,
      retailPosService: {
        ...buildDeps().retailPosService,
        getBookingRetailSales: jest.fn(async () => ({
          lines: [
            {
              id: 'l1',
              productId: 'prod-1',
              productName: 'Shampoo',
              quantity: 1,
              unitPrice: 25,
              lineTotal: 25,
            },
            {
              id: 'l2',
              productId: 'prod-2',
              productName: 'Gel',
              quantity: 1,
              unitPrice: 15,
              lineTotal: 15,
            },
          ],
          retailTotal: 40,
          currency: 'USD',
        })),
        setBookingRetailSales: jest.fn(async () => ({
          lines: [
            {
              id: 'l1',
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
      } as any,
    });

    expect(
      (
        await handleLinkProductToServiceLogic(deps, 'biz-1', {
          productId: 'prod-1',
          serviceId: 'svc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSummarizePlLogic(deps, 'biz-1', {
          from: '2026-06-01',
          to: '2026-06-30',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRemoveRetailLineLogic(
          deps,
          'biz-1',
          { bookingId: 'b1', productName: 'Gel' },
          'u1',
        )
      ).summary,
    ).toContain('remain');
    expect(
      (
        await handleSuggestRetailUpsellLogic(deps, 'biz-1', {
          serviceId: 'svc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSuggestRetailUpsellLogic(
          buildDeps({
            serviceRepo: {
              findOne: jest.fn(async () => null),
              find: jest.fn(async () => []),
            } as any,
          }),
          'biz-1',
          { serviceId: 'missing' },
        )
      ).success,
    ).toBe(true);

    const emptyListMerge = mergeRetailFinanceCompoundContext(
      { productId: 'existing' },
      { action: 'list_products', params: {}, segment: 'list' },
      {
        success: true,
        action: 'list_products',
        summary: '',
        details: { products: undefined },
      },
    );
    expect(emptyListMerge.productId).toBe('existing');

    expect(
      (
        await handleSummarizePlLogic(
          deps,
          'biz-1',
          {},
          'summarize P&L from June 1 to June 15',
        )
      ).success,
    ).toBe(true);

    const upsellDeps = buildDeps({
      retailPosService: {
        listSellableProducts: jest.fn(async () => [
          { id: 'prod-2', name: 'Balsam', retailPrice: 20, quantityOnHand: 5 },
          {
            id: 'prod-1',
            name: 'Shampoo',
            retailPrice: 25,
            quantityOnHand: 10,
          },
        ]),
        getBookingRetailSales: jest.fn(async () => ({
          lines: [],
          retailTotal: 0,
          currency: 'USD',
        })),
        setBookingRetailSales: jest.fn(async () => ({
          lines: [],
          retailTotal: 0,
          currency: 'USD',
        })),
      } as any,
      inventoryService: {
        ...buildDeps().inventoryService,
        listServiceLinks: jest.fn(async () => [
          {
            id: 'link-2',
            serviceId: 'svc-1',
            serviceName: 'Haircut',
            productId: 'prod-2',
            productName: 'Balsam',
            quantityPerService: 1,
          },
        ]),
      } as any,
    });
    const upsell = await handleSuggestRetailUpsellLogic(upsellDeps, 'biz-1', {
      bookingId: 'b1',
    });
    expect((upsell.details as any).suggestions[0].name).toBe('Balsam');

    const expenseCompound = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'record_expense',
            params: { category: 'Rent', amount: 100 },
            segment: 'a',
          },
          { action: 'list_expenses', params: {}, segment: 'b' },
        ],
      },
    );
    expect(expenseCompound.success).toBe(true);
  });

  it('covers remaining resolver and error branches', async () => {
    const prefixDeps = buildDeps({
      productRepo: { findOne: jest.fn(async () => null) } as any,
      inventoryService: {
        listProducts: jest.fn(async () => [{ ...product, id: 'prod-1-full' }]),
        createProduct: jest.fn(async () => product),
        linkToService: jest.fn(async () => ({ id: 'link-1' })),
        listServiceLinks: jest.fn(async () => []),
        adjustStock: jest.fn(async () => product),
      } as any,
      bookingRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => [{ ...booking, id: 'b1-full-uuid' }]),
      } as any,
      serviceRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => [service]),
      } as any,
    });
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          prefixDeps,
          'biz-1',
          { bookingId: 'b1', productId: 'prod-1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleLinkProductToServiceLogic(prefixDeps, 'biz-1', {
          productId: 'prod-1',
          serviceName: 'Haircut',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleLinkProductToServiceLogic(prefixDeps, 'biz-1', {
          productName: 'Shampoo',
          serviceId: 'missing',
        })
      ).success,
    ).toBe(false);

    const errDeps = (field: string) =>
      buildDeps({
        inventoryService: {
          ...buildDeps().inventoryService,
          createProduct:
            field === 'create'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().inventoryService.createProduct,
          linkToService:
            field === 'link'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().inventoryService.linkToService,
          adjustStock:
            field === 'adjust'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().inventoryService.adjustStock,
        } as any,
        retailPosService: {
          ...buildDeps().retailPosService,
          setBookingRetailSales:
            field === 'add' || field === 'remove'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().retailPosService.setBookingRetailSales,
        } as any,
        expensesService: {
          create:
            field === 'expense'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().expensesService.create,
          list: buildDeps().expensesService.list,
        } as any,
        analyticsService: {
          profitAndLoss:
            field === 'pl'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().analyticsService.profitAndLoss,
          staffPerformance:
            field === 'commission'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().analyticsService.staffPerformance,
        } as any,
        commissionsService: {
          list: buildDeps().commissionsService.list,
          exportPayoutCsv:
            field === 'payout'
              ? jest.fn(async () => {
                  throw {};
                })
              : buildDeps().commissionsService.exportPayoutCsv,
        } as any,
      });

    expect(
      (
        await handleCreateProductLogic(errDeps('create'), 'biz-1', {
          name: 'X',
        })
      ).summary,
    ).toContain('Could not create');
    expect(
      (
        await handleLinkProductToServiceLogic(errDeps('link'), 'biz-1', {
          productName: 'Shampoo',
          serviceName: 'Haircut',
        })
      ).summary,
    ).toContain('Could not link');
    expect(
      (
        await handleAdjustInventoryLogic(errDeps('adjust'), 'biz-1', {
          productName: 'Shampoo',
          delta: 1,
        })
      ).summary,
    ).toContain('Could not adjust');
    expect(
      (
        await handleAddRetailSaleToBookingLogic(errDeps('add'), 'biz-1', {
          bookingId: 'b1',
          productName: 'Shampoo',
        })
      ).summary,
    ).toContain('Could not add');
    expect(
      (
        await handleRemoveRetailLineLogic(errDeps('remove'), 'biz-1', {
          bookingId: 'b1',
          productId: 'prod-2',
        })
      ).summary,
    ).toContain('Could not remove');
    expect(
      (
        await handleRecordExpenseLogic(errDeps('expense'), 'biz-1', {
          category: 'X',
          amount: 1,
        })
      ).summary,
    ).toContain('Could not record');
    expect(
      (await handleSummarizePlLogic(errDeps('pl'), 'biz-1', {})).summary,
    ).toContain('Could not summarize');
    expect(
      (await handleCommissionReportLogic(errDeps('commission'), 'biz-1', {}))
        .summary,
    ).toContain('Could not build');
    expect(
      (await handlePayoutExportLogic(errDeps('payout'), 'biz-1', {})).summary,
    ).toContain('Payout export failed');

    const removeDeps = buildDeps({
      retailPosService: {
        getBookingRetailSales: jest.fn(async () => ({
          lines: [
            {
              id: 'l1',
              productId: 'prod-1',
              productName: 'Shampoo',
              quantity: 1,
              unitPrice: 25,
              lineTotal: 25,
            },
            {
              id: 'l2',
              productId: 'prod-2',
              productName: 'Gel',
              quantity: 1,
              unitPrice: 15,
              lineTotal: 15,
            },
          ],
          retailTotal: 40,
          currency: 'USD',
        })),
        setBookingRetailSales: jest.fn(async () => ({
          lines: [],
          retailTotal: 0,
          currency: 'USD',
        })),
      } as any,
    });
    expect(
      (
        await handleRemoveRetailLineLogic(
          removeDeps,
          'biz-1',
          { bookingId: 'b1', productId: 'prod-2' },
          'u1',
        )
      ).success,
    ).toBe(true);

    const listMerge = mergeRetailFinanceCompoundContext(
      {},
      { action: 'list_products', params: {}, segment: 'list' },
      {
        success: true,
        action: 'list_products',
        summary: '',
        details: { products: [{ id: 'prod-9', name: 'Comb' }] },
      },
    );
    expect(listMerge.productId).toBe('prod-9');

    const linkMerge = mergeRetailFinanceCompoundContext(
      {},
      { action: 'link_product_to_service', params: {}, segment: 'link' },
      {
        success: true,
        action: 'link_product_to_service',
        summary: '',
        details: { productId: 'p1', serviceId: 's1' },
      },
    );
    expect(linkMerge).toMatchObject({ productId: 'p1', serviceId: 's1' });

    const sortDeps = buildDeps({
      retailPosService: {
        listSellableProducts: jest.fn(async () => [
          { id: 'prod-2', name: 'Balsam', retailPrice: 20, quantityOnHand: 5 },
          { id: 'prod-3', name: 'Comb', retailPrice: 10, quantityOnHand: 5 },
        ]),
        getBookingRetailSales: jest.fn(async () => ({
          lines: [],
          retailTotal: 0,
          currency: 'USD',
        })),
        setBookingRetailSales: jest.fn(async () => ({
          lines: [],
          retailTotal: 0,
          currency: 'USD',
        })),
      } as any,
      inventoryService: {
        ...buildDeps().inventoryService,
        listServiceLinks: jest.fn(async () => []),
      } as any,
    });
    expect(
      (await handleSuggestRetailUpsellLogic(sortDeps, 'biz-1', {})).success,
    ).toBe(true);

    const exactIdDeps = buildDeps({
      productRepo: { findOne: jest.fn(async () => null) } as any,
      inventoryService: {
        listProducts: jest.fn(async () => [{ ...product, id: 'prod-1' }]),
        createProduct: jest.fn(async () => product),
        linkToService: jest.fn(async () => ({ id: 'link-1' })),
        listServiceLinks: jest.fn(async () => []),
        adjustStock: jest.fn(async () => product),
      } as any,
      bookingRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => [{ ...booking, id: 'b1' }]),
      } as any,
    });
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          exactIdDeps,
          'biz-1',
          { bookingId: 'b1', productId: 'prod-1' },
          'u1',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleLinkProductToServiceLogic(
          buildDeps({ serviceRepo: { find: jest.fn(async () => []) } as any }),
          'biz-1',
          {
            productName: 'Shampoo',
            serviceName: 'Missing',
          },
        )
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAddRetailSaleToBookingLogic(buildDeps(), 'biz-1', {
          customerName: 'Nobody',
          productName: 'Shampoo',
        })
      ).success,
    ).toBe(false);

    expect(
      (
        await handleAddRetailToMyBookingLogic(
          buildDeps({
            bookingRepo: {
              find: jest.fn(async () => [{ ...booking, employeeId: 'e1' }]),
              findOne: jest.fn(async () => ({ ...booking, employeeId: 'e1' })),
            } as any,
          }),
          'biz-1',
          { employeeId: 'e1', productName: 'Shampoo' },
          'u1',
        )
      ).success,
    ).toBe(true);

    expect(
      mergeRetailFinanceCompoundContext(
        {},
        { action: 'list_products', params: {}, segment: 'list' },
        {
          success: true,
          action: 'list_products',
          summary: '',
          details: { products: [] },
        },
      ).productId,
    ).toBeUndefined();
    expect(
      mergeRetailFinanceCompoundContext(
        {},
        { action: 'link_product_to_service', params: {}, segment: 'link' },
        {
          success: true,
          action: 'link_product_to_service',
          summary: '',
          details: { productId: 'p1' },
        },
      ),
    ).toMatchObject({ productId: 'p1' });
    expect(
      mergeRetailFinanceCompoundContext(
        {},
        { action: 'link_product_to_service', params: {}, segment: 'link' },
        {
          success: true,
          action: 'link_product_to_service',
          summary: '',
          details: { serviceId: 's1' },
        },
      ),
    ).toMatchObject({ serviceId: 's1' });

    expect(
      (
        await handleAddRetailSaleToBookingLogic(buildDeps(), 'biz-1', {
          bookingId: 'missing',
          productName: 'Shampoo',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleAddRetailSaleToBookingLogic(
          buildDeps({
            productRepo: { findOne: jest.fn(async () => null) } as any,
            inventoryService: {
              listProducts: jest.fn(async () => [{ ...product, id: 'prod-1' }]),
            } as any,
          }),
          'biz-1',
          { bookingId: 'b1', productId: 'missing' },
        )
      ).success,
    ).toBe(false);

    expect(
      mergeRetailFinanceCompoundContext(
        {},
        { action: 'list_products', params: {}, segment: 'list' },
        { success: true, action: 'list_products', summary: '', details: {} },
      ).productId,
    ).toBeUndefined();
  });
});
