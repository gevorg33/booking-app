import {
  handleListProductsLogic,
  handleCreateProductLogic,
  handleLinkProductToServiceLogic,
  handleUpdateInventoryProductLogic,
  handleDeleteInventoryProductLogic,
  handleUnlinkInventoryProductLogic,
  handleSetRecommendedProductsLogic,
  handleAdjustInventoryLogic,
  handleAddRetailSaleToBookingLogic,
  handleRemoveRetailLineLogic,
  handleRecordExpenseLogic,
  handleDeleteExpenseLogic,
  handleListExpensesLogic,
  handleSummarizePlLogic,
  handleCommissionReportLogic,
  handleCreateCommissionRuleLogic,
  handleDeleteCommissionRuleLogic,
  handlePayoutExportLogic,
  handleExportAnalyticsReportLogic,
  handleSummarizeAdoptionFunnelLogic,
  handleSummarizeReviewsLogic,
  handleSuggestRetailUpsellLogic,
  handleAddRetailToMyBookingLogic,
  handleSetRetailSalesLinesLogic,
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
      updateProduct: jest.fn(async () => product),
      unlinkServiceProduct: jest.fn(async () => ({ removed: true })),
    } as any,
    productRecommendationService: {
      setServiceRecommendations: jest.fn(async () => ['prod-1']),
      setCategoryRecommendations: jest.fn(async () => ['prod-1']),
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
      remove: jest.fn(async () => undefined),
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
      create: jest.fn(async (_biz: string, dto: any) => ({
        id: 'rule-2',
        ...dto,
      })),
      remove: jest.fn(async () => undefined),
      exportPayoutCsv: jest.fn(async () => ({
        filename: 'payout.csv',
        content: 'rows',
        rowCount: 2,
      })),
    } as any,
    reviewsService: {
      summary: jest.fn(async () => [
        { employeeId: 'e1', employeeName: 'Anna', avgRating: 4.5, reviewCount: 2 },
      ]),
      list: jest.fn(async () => [
        {
          id: 'rev-1',
          rating: 5,
          comment: 'Great!',
          employeeId: 'e1',
          createdAt: new Date('2024-01-01'),
        },
      ]),
    } as any,
    appEventService: {
      getAdoptionDashboard: jest.fn(async () => ({
        periodDays: 30,
        funnel: {
          steps: [
            { step: 'app_installed', count: 100, conversionFromPrevious: null, dropOffFromPrevious: null },
            { step: 'signed_in', count: 50, conversionFromPrevious: 50, dropOffFromPrevious: 50 },
          ],
          breakdowns: [],
        },
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
    bookingDepth: {
      handleMarkPaid: jest.fn(async () => ({
        success: true,
        action: 'mark_paid',
        summary: 'ok',
        details: {},
      })),
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

  it('exports analytics reports as csv or pdf', async () => {
    const deps = buildDeps({
      analyticsService: {
        profitAndLoss: jest.fn(async () => ({
          revenue: 1000,
          expenses: 200,
          commissions: 100,
          netProfit: 700,
          currency: 'USD',
        })),
        staffPerformance: jest.fn(async () => ({
          currency: 'USD',
          rows: [],
        })),
        exportCsv: jest.fn(async () => 'Section,Key,Value1,Value2,Value3\nP&L,Revenue,1000,,'),
        exportPdfHtml: jest.fn(async () => '<html>report</html>'),
      } as any,
    });
    const csvResult = await handleExportAnalyticsReportLogic(deps, 'biz-1', {});
    expect(csvResult.success).toBe(true);
    expect((csvResult.details as any).export.format).toBe('csv');
    expect((csvResult.details as any).export.rowCount).toBe(1);

    const pdfResult = await handleExportAnalyticsReportLogic(deps, 'biz-1', {
      format: 'pdf',
    });
    expect(pdfResult.success).toBe(true);
    expect((pdfResult.details as any).export.format).toBe('pdf');
    expect((pdfResult.details as any).export.content).toContain('<html>');

    const failDeps = buildDeps({
      analyticsService: {
        exportCsv: jest.fn(async () => {
          throw new Error('export fail');
        }),
      } as any,
    });
    expect(
      (await handleExportAnalyticsReportLogic(failDeps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('summarizes reviews overall and per employee', async () => {
    const deps = buildDeps();
    const result = await handleSummarizeReviewsLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect((result.details as any).totalReviews).toBe(2);
    expect((result.details as any).overallAvg).toBe(4.5);

    const scoped = await handleSummarizeReviewsLogic(deps, 'biz-1', {
      employeeId: 'e1',
    });
    expect(scoped.success).toBe(true);

    const emptyDeps = buildDeps({
      reviewsService: {
        summary: jest.fn(async () => []),
        list: jest.fn(async () => []),
      } as any,
    });
    const emptyResult = await handleSummarizeReviewsLogic(
      emptyDeps,
      'biz-1',
      {},
    );
    expect(emptyResult.success).toBe(true);
    expect(emptyResult.summary).toContain('No reviews');

    const failDeps = buildDeps({
      reviewsService: {
        summary: jest.fn(async () => {
          throw new Error('reviews fail');
        }),
      } as any,
    });
    expect(
      (await handleSummarizeReviewsLogic(failDeps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('summarizes the adoption funnel', async () => {
    const deps = buildDeps();
    const result = await handleSummarizeAdoptionFunnelLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect((result.details as any).overallConversion).toBe(50);

    const emptyDeps = buildDeps({
      appEventService: {
        getAdoptionDashboard: jest.fn(async () => ({
          periodDays: 30,
          funnel: { steps: [], breakdowns: [] },
        })),
      } as any,
    });
    const emptyResult = await handleSummarizeAdoptionFunnelLogic(
      emptyDeps,
      'biz-1',
      {},
    );
    expect(emptyResult.success).toBe(true);
    expect(emptyResult.summary).toContain('No adoption funnel activity');

    const failDeps = buildDeps({
      appEventService: {
        getAdoptionDashboard: jest.fn(async () => {
          throw new Error('adoption fail');
        }),
      } as any,
    });
    expect(
      (await handleSummarizeAdoptionFunnelLogic(failDeps, 'biz-1', {})).success,
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

  describe('handleSetRetailSalesLinesLogic', () => {
    const conditioner = {
      id: 'prod-2',
      businessId: 'biz-1',
      name: 'Conditioner',
      sku: 'CO-01',
      retailPrice: 18,
      quantityOnHand: 5,
      isActive: true,
    };

    function buildTwoProductDeps(
      overrides: Partial<RetailFinanceLogicDeps> = {},
    ) {
      return buildDeps({
        inventoryService: {
          ...buildDeps().inventoryService,
          listProducts: jest.fn(async () => [product, conditioner]),
        } as any,
        ...overrides,
      });
    }

    it('replaces the retail cart with explicit structured lines[]', async () => {
      const deps = buildTwoProductDeps();
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        {
          bookingId: 'b1',
          lines: [
            { productId: 'prod-1', quantity: 2 },
            { productName: 'Conditioner', quantity: 1 },
          ],
        },
        'u1',
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('set_retail_sales_lines');
      expect(deps.retailPosService.setBookingRetailSales).toHaveBeenCalledWith(
        'biz-1',
        'b1',
        'u1',
        {
          lines: [
            { productId: 'prod-1', quantity: 2 },
            { productId: 'prod-2', quantity: 1 },
          ],
        },
      );
    });

    it('parses lines from prompt when params.lines is absent', async () => {
      const deps = buildTwoProductDeps();
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        { bookingId: 'b1' },
        'u1',
        'Set retail cart to 2 shampoo and 1 conditioner',
      );

      expect(result.success).toBe(true);
      expect(deps.retailPosService.setBookingRetailSales).toHaveBeenCalledWith(
        'biz-1',
        'b1',
        'u1',
        {
          lines: [
            { productId: 'prod-1', quantity: 2 },
            { productId: 'prod-2', quantity: 1 },
          ],
        },
      );
    });

    it('falls back to the provider own active booking when no bookingId/customerName given', async () => {
      const deps = buildTwoProductDeps();
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        { sessionEmployeeId: 'e1' },
        'u1',
        'Set retail cart to 1 shampoo',
      );

      expect(result.success).toBe(true);
      expect(deps.retailPosService.setBookingRetailSales).toHaveBeenCalledWith(
        'biz-1',
        'b1',
        'u1',
        { lines: [{ productId: 'prod-1', quantity: 1 }] },
      );
    });

    it('clarifies when no booking can be resolved', async () => {
      const deps = buildDeps({
        bookingRepo: {
          findOne: jest.fn(async () => null),
          find: jest.fn(async () => []),
        } as any,
      });
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        {},
        'u1',
        'Set retail cart to 1 shampoo',
      );

      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({
        clarify: true,
        missing: ['bookingId'],
      });
    });

    it('clarifies when no lines can be resolved', async () => {
      const deps = buildTwoProductDeps();
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        { bookingId: 'b1' },
        'u1',
        'Set retail cart to',
      );

      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({
        clarify: true,
        missing: ['lines'],
      });
    });

    it('reports unresolved product names', async () => {
      const deps = buildTwoProductDeps();
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        { bookingId: 'b1' },
        'u1',
        'Set retail cart to 2 unicorn dust',
      );

      expect(result.success).toBe(false);
      expect(result.summary).toContain('unicorn dust');
    });

    it('surfaces errors from setBookingRetailSales', async () => {
      const deps = buildTwoProductDeps({
        retailPosService: {
          ...buildDeps().retailPosService,
          setBookingRetailSales: jest.fn(async () => {
            throw new Error('cart update failed');
          }),
        } as any,
      });
      const result = await handleSetRetailSalesLinesLogic(
        deps,
        'biz-1',
        { bookingId: 'b1' },
        'u1',
        'Set retail cart to 1 shampoo',
      );

      expect(result.success).toBe(false);
      expect(result.summary).toBe('cart update failed');
    });
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

    const retailCheckout = await handleRetailFinanceCompoundLogic(
      deps,
      'biz-1',
      'For booking b1, set retail cart to 2 shampoo and mark it paid',
      {},
      'u1',
    );
    expect(retailCheckout.success).toBe(true);
    expect(
      (retailCheckout.details as any).steps.map((s: any) => s.action),
    ).toEqual(['set_retail_sales_lines', 'mark_paid']);
    expect(deps.bookingDepth.handleMarkPaid).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ bookingId: 'b1' }),
      'u1',
    );

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

  describe('ai-cmd-dashboard-6.12 inventory/expense/commission mutates', () => {
    it('updates an inventory product', async () => {
      const deps = buildDeps();
      expect(
        (await handleUpdateInventoryProductLogic(deps, 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleUpdateInventoryProductLogic(deps, 'biz-1', {
            productName: 'Shampoo',
          })
        ).success,
      ).toBe(false);
      const updated = await handleUpdateInventoryProductLogic(deps, 'biz-1', {
        productName: 'Shampoo',
        retailPrice: 30,
      });
      expect(updated.success).toBe(true);
      expect(deps.inventoryService.updateProduct).toHaveBeenCalledWith(
        'prod-1',
        'biz-1',
        { retailPrice: 30 },
      );
    });

    it('deletes (deactivates) an inventory product', async () => {
      const deps = buildDeps();
      expect(
        (await handleDeleteInventoryProductLogic(deps, 'biz-1', {})).success,
      ).toBe(false);
      const result = await handleDeleteInventoryProductLogic(deps, 'biz-1', {
        productName: 'Shampoo',
      });
      expect(result.success).toBe(true);
      expect(deps.inventoryService.updateProduct).toHaveBeenCalledWith(
        'prod-1',
        'biz-1',
        { isActive: false },
      );
    });

    it('unlinks a product from a service', async () => {
      const deps = buildDeps();
      const byLinkId = await handleUnlinkInventoryProductLogic(deps, 'biz-1', {
        linkId: 'link-1',
      });
      expect(byLinkId.success).toBe(true);
      expect(deps.inventoryService.unlinkServiceProduct).toHaveBeenCalledWith(
        'link-1',
        'biz-1',
      );

      const missing = await handleUnlinkInventoryProductLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(missing.success).toBe(false);

      const byNames = await handleUnlinkInventoryProductLogic(
        buildDeps(),
        'biz-1',
        { productName: 'Shampoo', serviceName: 'Haircut' },
      );
      expect(byNames.success).toBe(true);

      const noLinkFound = await handleUnlinkInventoryProductLogic(
        buildDeps({
          inventoryService: {
            listProducts: jest.fn(async () => [product]),
            listServiceLinks: jest.fn(async () => []),
          } as any,
        }),
        'biz-1',
        { productName: 'Shampoo', serviceName: 'Haircut' },
      );
      expect(noLinkFound.success).toBe(false);
    });

    it('sets recommended products for a service', async () => {
      const deps = buildDeps();
      expect(
        (await handleSetRecommendedProductsLogic(deps, 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleSetRecommendedProductsLogic(deps, 'biz-1', {
            serviceName: 'Haircut',
          })
        ).success,
      ).toBe(false);

      const byIds = await handleSetRecommendedProductsLogic(deps, 'biz-1', {
        serviceName: 'Haircut',
        productIds: ['prod-1'],
      });
      expect(byIds.success).toBe(true);
      expect(
        deps.productRecommendationService.setServiceRecommendations,
      ).toHaveBeenCalledWith('biz-1', 'svc-1', ['prod-1']);

      const byCategory = await handleSetRecommendedProductsLogic(deps, 'biz-1', {
        categoryId: 'cat-1',
        productNames: ['Shampoo'],
      });
      expect(byCategory.success).toBe(true);
      expect(
        deps.productRecommendationService.setCategoryRecommendations,
      ).toHaveBeenCalledWith('biz-1', 'cat-1', ['prod-1']);

      const noMatch = await handleSetRecommendedProductsLogic(deps, 'biz-1', {
        serviceName: 'Haircut',
        productNames: ['Nonexistent'],
      });
      expect(noMatch.success).toBe(false);
    });

    it('deletes an expense', async () => {
      const deps = buildDeps();
      expect(
        (await handleDeleteExpenseLogic(deps, 'biz-1', {})).success,
      ).toBe(false);
      const byId = await handleDeleteExpenseLogic(deps, 'biz-1', {
        expenseId: 'exp-1',
      });
      expect(byId.success).toBe(true);
      expect(deps.expensesService.remove).toHaveBeenCalledWith(
        'exp-1',
        'biz-1',
      );
      const byCategory = await handleDeleteExpenseLogic(deps, 'biz-1', {
        category: 'Supplies',
      });
      expect(byCategory.success).toBe(true);
      const noMatch = await handleDeleteExpenseLogic(
        buildDeps({
          expensesService: {
            list: jest.fn(async () => []),
            remove: jest.fn(),
          } as any,
        }),
        'biz-1',
        { category: 'Nonexistent' },
      );
      expect(noMatch.success).toBe(false);
    });

    it('creates a commission rule', async () => {
      const deps = buildDeps();
      expect(
        (await handleCreateCommissionRuleLogic(deps, 'biz-1', {})).success,
      ).toBe(false);
      const created = await handleCreateCommissionRuleLogic(deps, 'biz-1', {
        employeeName: 'Alex',
        serviceName: 'Haircut',
        value: 15,
      });
      expect(created.success).toBe(true);
      expect(deps.commissionsService.create).toHaveBeenCalledWith('biz-1', {
        employeeId: 'e1',
        serviceId: 'svc-1',
        type: 'percent',
        value: 15,
      });

      const unknownEmployee = await handleCreateCommissionRuleLogic(
        buildDeps(),
        'biz-1',
        { employeeName: 'Nonexistent', value: 10 },
      );
      expect(unknownEmployee.success).toBe(false);
    });

    it('deletes a commission rule', async () => {
      const deps = buildDeps();
      const byId = await handleDeleteCommissionRuleLogic(deps, 'biz-1', {
        ruleId: 'rule-1',
      });
      expect(byId.success).toBe(true);
      expect(deps.commissionsService.remove).toHaveBeenCalledWith(
        'rule-1',
        'biz-1',
      );

      const byEmployee = await handleDeleteCommissionRuleLogic(deps, 'biz-1', {
        employeeName: 'Alex',
      });
      expect(byEmployee.success).toBe(true);

      const missing = await handleDeleteCommissionRuleLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(missing.success).toBe(false);

      const noMatch = await handleDeleteCommissionRuleLogic(
        buildDeps({
          commissionsService: {
            list: jest.fn(async () => []),
            remove: jest.fn(),
          } as any,
        }),
        'biz-1',
        { employeeName: 'Nobody' },
      );
      expect(noMatch.success).toBe(false);
    });
  });
});
