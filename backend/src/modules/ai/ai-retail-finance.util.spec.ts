import {
  rescueRetailFinanceIntent,
  isRetailFinanceCompoundPrompt,
  decomposeRetailFinanceCompoundPrompt,
  isListServicesCatalogPrompt,
  isListProductsPrompt,
  isCreateProductPrompt,
  isLinkProductToServicePrompt,
  isAdjustInventoryPrompt,
  isAddRetailSaleToBookingPrompt,
  isRemoveRetailLinePrompt,
  isRecordExpensePrompt,
  isDeleteExpensePrompt,
  isListExpensesPrompt,
  isSummarizePlPrompt,
  isCommissionReportPrompt,
  isListRefundsPrompt,
  isPayoutExportPrompt,
  isCreateCommissionRulePrompt,
  isExportAnalyticsReportPrompt,
  parseCreateCommissionRuleFromPrompt,
  parseExportAnalyticsReportFromPrompt,
  isSuggestRetailUpsellPrompt,
  isAddRetailToMyBookingPrompt,
  isSearchRetailSkuPrompt,
  isSetRetailSalesLinesFinancePrompt,
  extractProductNameFromPrompt,
  extractRetailSearchQuery,
  extractSkuFromPrompt,
  extractRetailPriceFromPrompt,
  enrichCreateProductParamsFromPrompt,
  extractQuantityFromPrompt,
  extractInventoryDeltaFromPrompt,
  extractServiceNameFromPrompt,
  extractBookingIdFromPrompt,
  extractCustomerNameFromPrompt,
  extractExpenseCategoryFromPrompt,
  extractExpenseAmountFromPrompt,
  extractExpenseDescriptionFromPrompt,
  enrichDeleteExpenseParamsFromPrompt,
  enrichRecordExpenseParamsFromPrompt,
  normalizeExpenseCategory,
  extractProductIdFromPrompt,
  parseFirstProduct,
  parseRetailSalesLinesFromPrompt,
  RETAIL_FINANCE_INTENTS,
  isRetailFinanceIntent,
} from './ai-retail-finance.util.js';

describe('ai-retail-finance.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard retail and finance prompts', () => {
      expect(isListProductsPrompt('List products')).toBe(true);
      expect(isListProductsPrompt('List services')).toBe(false);
      expect(isListServicesCatalogPrompt('List services')).toBe(true);
      expect(isCreateProductPrompt('Create product Shampoo')).toBe(true);
      expect(
        isLinkProductToServicePrompt('Link shampoo to haircut service'),
      ).toBe(true);
      expect(isAdjustInventoryPrompt('Adjust inventory by 10')).toBe(true);
      expect(
        isAddRetailSaleToBookingPrompt('Add retail sale shampoo to booking b1'),
      ).toBe(true);
      expect(
        isRemoveRetailLinePrompt('Remove retail line shampoo from booking'),
      ).toBe(true);
      expect(isRecordExpensePrompt('Record expense supplies 120')).toBe(true);
      expect(isListExpensesPrompt('List expenses')).toBe(true);
      expect(isListExpensesPrompt('Record expense supplies')).toBe(false);
      expect(isSummarizePlPrompt('Summarize P&L this month')).toBe(true);
      expect(isCommissionReportPrompt('Commission report this month')).toBe(
        true,
      );
      expect(isCommissionReportPrompt('Staff commissions summary')).toBe(true);
      expect(isCommissionReportPrompt('Summary of commissions')).toBe(true);
      expect(isCommissionReportPrompt('Export commissions CSV')).toBe(false);
      expect(
        isListRefundsPrompt('How many refunds have I issued this month?'),
      ).toBe(true);
      expect(isListRefundsPrompt('Refund report for last month')).toBe(true);
      expect(isListRefundsPrompt('List refunds')).toBe(true);
      expect(isListRefundsPrompt('Export refunds CSV')).toBe(false);
      expect(
        isListRefundsPrompt('Refund GIFT1234 because the item arrived damaged'),
      ).toBe(false);
      expect(isPayoutExportPrompt('Payout export this month')).toBe(true);
      expect(isPayoutExportPrompt('Export payout csv for May')).toBe(true);
      expect(
        isSetRetailSalesLinesFinancePrompt(
          'Set retail cart to 2 shampoo, 1 conditioner for booking b1',
        ),
      ).toBe(true);
      expect(isSetRetailSalesLinesFinancePrompt('Set the business name')).toBe(
        false,
      );
    });

    it('detects provider retail prompts', () => {
      expect(
        isSuggestRetailUpsellPrompt('Suggest retail upsell for my appointment'),
      ).toBe(true);
      expect(isAddRetailToMyBookingPrompt('Add shampoo to my booking')).toBe(
        true,
      );
    });

    it('e2e-bug.146 — rescues create_commission_rule and export_analytics_report', () => {
      const commissionPrompt =
        'Set commission rate for Gevorg Gasparyan to 20 percent';
      expect(isCreateCommissionRulePrompt(commissionPrompt)).toBe(true);
      expect(isCommissionReportPrompt(commissionPrompt)).toBe(false);
      expect(parseCreateCommissionRuleFromPrompt(commissionPrompt)).toEqual({
        employeeName: 'Gevorg Gasparyan',
        value: 20,
        type: 'percent',
      });
      expect(rescueRetailFinanceIntent(commissionPrompt, 'unknown')).toEqual({
        action: 'create_commission_rule',
        rescueReason: 'create_commission_rule',
      });

      const exportPrompt = 'Export my analytics report for this quarter';
      expect(isExportAnalyticsReportPrompt(exportPrompt)).toBe(true);
      expect(parseExportAnalyticsReportFromPrompt(exportPrompt)).toEqual({
        dateRange: 'this_quarter',
      });
      expect(rescueRetailFinanceIntent(exportPrompt, 'unknown')).toEqual({
        action: 'export_analytics_report',
        rescueReason: 'export_analytics_report',
      });
    });

    it('detects search_retail_sku prompts (ai-cmd-provider-5.4.5)', () => {
      expect(isSearchRetailSkuPrompt('Find SKU 12345')).toBe(true);
      expect(isSearchRetailSkuPrompt('Do we carry bond builder?')).toBe(true);
      expect(isSearchRetailSkuPrompt('Do we have olaplex in stock?')).toBe(
        true,
      );
      expect(isSearchRetailSkuPrompt('Search inventory for hair serum')).toBe(
        true,
      );
      expect(extractRetailSearchQuery('Find SKU 12345')).toBe('12345');
      expect(extractRetailSearchQuery('Do we carry bond builder?')).toBe(
        'bond builder',
      );
    });

    it('does not let search_retail_sku steal integration/settings queries', () => {
      expect(isSearchRetailSkuPrompt('Do we have API keys set up?')).toBe(
        false,
      );
      expect(isSearchRetailSkuPrompt('Are webhooks configured?')).toBe(false);
    });
  });

  describe('extractors and helpers', () => {
    it('extracts product, booking, expense, and inventory fields', () => {
      expect(
        extractProductNameFromPrompt('Create product Shampoo sku SH-01'),
      ).toBe('Shampoo');
      expect(extractProductNameFromPrompt('product "Conditioner"')).toBe(
        'Conditioner',
      );
      expect(
        extractProductNameFromPrompt('Add retail sale Shampoo to booking'),
      ).toBe('Shampoo');
      expect(
        extractProductNameFromPrompt('Link shampoo to haircut service'),
      ).toBe('shampoo');
      expect(
        extractProductNameFromPrompt('Adjust inventory Shampoo by 5'),
      ).toBe('Shampoo');
      expect(
        extractProductNameFromPrompt('Remove retail line Shampoo from booking'),
      ).toBe('Shampoo');
      expect(extractSkuFromPrompt('sku SH-01')).toBe('SH-01');
      expect(extractRetailPriceFromPrompt('retail 25')).toBe(25);
      expect(extractRetailPriceFromPrompt('price 19.99')).toBe(19.99);
      expect(
        extractRetailPriceFromPrompt(
          'Add a retail product called QA Test Product priced at 5 dollars',
        ),
      ).toBe(5);
      expect(
        extractRetailPriceFromPrompt(
          'Add a retail product called QA Test Product 2, price $5',
        ),
      ).toBe(5);
      expect(extractQuantityFromPrompt('quantity 12')).toBe(12);
      expect(extractQuantityFromPrompt('on hand 8')).toBe(8);
      expect(extractInventoryDeltaFromPrompt('adjust inventory by 10')).toBe(
        10,
      );
      expect(extractInventoryDeltaFromPrompt('increase inventory by 3')).toBe(
        3,
      );
      expect(extractInventoryDeltaFromPrompt('decrease stock by 2')).toBe(-2);
      expect(extractServiceNameFromPrompt('to haircut service')).toBe(
        'haircut',
      );
      expect(extractServiceNameFromPrompt('service manicure and adjust')).toBe(
        'manicure',
      );
      expect(
        extractBookingIdFromPrompt(
          'booking 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(extractBookingIdFromPrompt('booking b1')).toBe('b1');
      expect(extractCustomerNameFromPrompt('for Anna Smith at 3pm')).toBe(
        'Anna Smith',
      );
      expect(extractExpenseCategoryFromPrompt('category "Supplies"')).toBe(
        'Supplies',
      );
      expect(
        extractExpenseCategoryFromPrompt(
          'Add a $20 business expense today for QA test cleaning supplies',
        ),
      ).toBeNull();
      expect(
        normalizeExpenseCategory(
          'today',
          'Add a $20 business expense today for QA test cleaning supplies',
        ),
      ).toBe('supplies');
      expect(
        enrichRecordExpenseParamsFromPrompt(
          { category: 'today', amount: 20 },
          'Add a $20 business expense today for QA test cleaning supplies',
        ),
      ).toMatchObject({
        category: 'supplies',
        amount: 20,
        description: 'QA test cleaning supplies',
      });
      expect(extractExpenseAmountFromPrompt('expense supplies $120')).toBe(120);
      expect(
        extractExpenseDescriptionFromPrompt('description "Office rent"'),
      ).toBe('Office rent');
      expect(
        extractExpenseDescriptionFromPrompt(
          'Delete the $20 QA test cleaning supplies expense I just added',
        ),
      ).toBe('QA test cleaning supplies');
      expect(
        enrichDeleteExpenseParamsFromPrompt(
          {},
          'Delete the $20 QA test cleaning supplies expense I just added',
        ),
      ).toMatchObject({ description: 'QA test cleaning supplies' });
      expect(
        isDeleteExpensePrompt(
          'Delete the $20 QA test cleaning supplies expense I just added',
        ),
      ).toBe(true);
      expect(
        isRecordExpensePrompt(
          'Delete the $20 QA test cleaning supplies expense I just added',
        ),
      ).toBe(false);
      expect(
        extractProductIdFromPrompt(
          'product 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(parseFirstProduct([{ id: 'p1', name: 'Shampoo' }])).toMatchObject({
        id: 'p1',
      });
      expect(parseFirstProduct([])).toBeNull();
      expect(extractProductNameFromPrompt('no product')).toBeNull();
      expect(extractSkuFromPrompt('no sku')).toBeNull();
      expect(extractRetailPriceFromPrompt('no price')).toBeNull();
      expect(extractQuantityFromPrompt('no qty')).toBeNull();
    });

    it('e2e-bug.148 — priced at N dollars enriches create_product price + retailPrice', () => {
      const prompt =
        'Add a retail product called QA Test Product priced at 5 dollars';
      expect(enrichCreateProductParamsFromPrompt({}, prompt)).toMatchObject({
        productName: expect.stringMatching(/QA Test Product/i),
        price: 5,
        retailPrice: 5,
      });
      expect(
        decomposeRetailFinanceCompoundPrompt(prompt)[0]?.params,
      ).toMatchObject({
        price: 5,
        retailPrice: 5,
      });
    });

    it('keeps null extraction helpers after e2e-148 cases', () => {
      expect(extractQuantityFromPrompt('no qty')).toBeNull();
      expect(extractInventoryDeltaFromPrompt('no delta')).toBeNull();
      expect(extractServiceNameFromPrompt('no service')).toBeNull();
      expect(extractBookingIdFromPrompt('no booking')).toBeNull();
      expect(extractCustomerNameFromPrompt('no customer')).toBeNull();
      expect(extractExpenseCategoryFromPrompt('no category')).toBeNull();
      expect(extractExpenseAmountFromPrompt('no amount')).toBeNull();
      expect(extractExpenseDescriptionFromPrompt('no description')).toBeNull();
      expect(extractProductIdFromPrompt('no id')).toBeNull();
    });
  });

  describe('rescueRetailFinanceIntent', () => {
    it('rescues all retail/finance intents from unknown', () => {
      expect(
        rescueRetailFinanceIntent('List products', 'unknown')?.action,
      ).toBe('list_products');
      expect(
        rescueRetailFinanceIntent('Create product Shampoo', 'unknown')?.action,
      ).toBe('create_product');
      expect(
        rescueRetailFinanceIntent('Link shampoo to haircut service', 'unknown')
          ?.action,
      ).toBe('link_product_to_service');
      expect(
        rescueRetailFinanceIntent('Adjust inventory by 10', 'unknown')?.action,
      ).toBe('adjust_inventory');
      expect(
        rescueRetailFinanceIntent('Add retail sale to booking b1', 'unknown')
          ?.action,
      ).toBe('add_retail_sale_to_booking');
      expect(
        rescueRetailFinanceIntent('Remove retail line shampoo', 'unknown')
          ?.action,
      ).toBe('remove_retail_line');
      expect(
        rescueRetailFinanceIntent('Record expense supplies 50', 'unknown')
          ?.action,
      ).toBe('record_expense');
      expect(
        rescueRetailFinanceIntent('List expenses', 'unknown')?.action,
      ).toBe('list_expenses');
      expect(
        rescueRetailFinanceIntent('Summarize P&L this month', 'unknown')
          ?.action,
      ).toBe('summarize_pl');
      expect(
        rescueRetailFinanceIntent('Commission report', 'unknown')?.action,
      ).toBe('commission_report');
      expect(
        rescueRetailFinanceIntent('Payout export this month', 'unknown')
          ?.action,
      ).toBe('payout_export');
      expect(
        rescueRetailFinanceIntent('Suggest retail upsell', 'unknown')?.action,
      ).toBe('suggest_retail_upsell');
      expect(
        rescueRetailFinanceIntent('Add shampoo to my booking', 'unknown')
          ?.action,
      ).toBe('add_retail_to_my_booking');
    });

    it('skips rescue for list_services and payments export_commissions', () => {
      expect(rescueRetailFinanceIntent('List services', 'unknown')).toBeNull();
      expect(
        rescueRetailFinanceIntent('Export commissions for May', 'unknown'),
      ).toBeNull();
      expect(
        rescueRetailFinanceIntent('List products', 'list_products'),
      ).toBeNull();
      expect(
        rescueRetailFinanceIntent(
          'List products and create product Shampoo',
          'compound_intent',
        ),
      ).toBeNull();
      expect(
        rescueRetailFinanceIntent('Book a haircut tomorrow', 'unknown'),
      ).toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it('detects retail/finance compound prompts', () => {
      expect(
        isRetailFinanceCompoundPrompt(
          'List products and create product Shampoo sku SH-01 retail 25',
        ),
      ).toBe(true);
      expect(isRetailFinanceCompoundPrompt('List services')).toBe(false);
      expect(isRetailFinanceCompoundPrompt('short')).toBe(false);
    });

    it('decomposes compound prompts into steps', () => {
      const inventory = decomposeRetailFinanceCompoundPrompt(
        'List products and create product Shampoo sku SH-01 retail 25',
      );
      expect(inventory.map((s) => s.action)).toEqual([
        'list_products',
        'create_product',
      ]);
      expect(inventory[1].params).toMatchObject({
        productName: 'Shampoo',
        sku: 'SH-01',
        retailPrice: 25,
      });

      const linkAdjust = decomposeRetailFinanceCompoundPrompt(
        'Link shampoo to haircut service and adjust inventory by 10',
      );
      expect(linkAdjust.map((s) => s.action)).toEqual([
        'link_product_to_service',
        'adjust_inventory',
      ]);

      const retailPl = decomposeRetailFinanceCompoundPrompt(
        'Add retail sale shampoo to booking b1 and summarize P&L this month',
      );
      expect(retailPl.map((s) => s.action)).toEqual([
        'add_retail_sale_to_booking',
        'summarize_pl',
      ]);

      const provider = decomposeRetailFinanceCompoundPrompt(
        'Suggest retail upsell for my appointment and add shampoo to my booking',
      );
      expect(provider.map((s) => s.action)).toEqual([
        'suggest_retail_upsell',
        'add_retail_to_my_booking',
      ]);

      const retailCheckout = decomposeRetailFinanceCompoundPrompt(
        'For booking b1, set retail cart to 2 shampoo and mark it paid',
      );
      expect(retailCheckout.map((s) => s.action)).toEqual([
        'set_retail_sales_lines',
        'mark_paid',
      ]);
      expect(retailCheckout[0].params).toMatchObject({
        lines: [{ productName: 'shampoo', quantity: 2 }],
      });
    });

    it('covers intent registry and single-segment decomposition', () => {
      expect(RETAIL_FINANCE_INTENTS.length).toBe(26);
      expect(isRetailFinanceIntent('list_products')).toBe(true);
      expect(isRetailFinanceIntent('not_real')).toBe(false);
      expect(decomposeRetailFinanceCompoundPrompt('')).toEqual([]);
      expect(
        decomposeRetailFinanceCompoundPrompt('unrelated prompt text only'),
      ).toEqual([]);
      expect(
        decomposeRetailFinanceCompoundPrompt(
          'List products; create product Gel',
        ),
      ).toHaveLength(2);
      expect(
        decomposeRetailFinanceCompoundPrompt('record expense supplies $45').map(
          (s) => s.action,
        ),
      ).toEqual(['record_expense']);
      expect(
        decomposeRetailFinanceCompoundPrompt('commission report this month')[0]
          .params.dateRange,
      ).toBe('this_month');
      expect(
        decomposeRetailFinanceCompoundPrompt('payout export this month')[0]
          .action,
      ).toBe('payout_export');
      expect(
        decomposeRetailFinanceCompoundPrompt(
          'list products; ; list expenses',
        ).map((s) => s.action),
      ).toEqual(['list_products', 'list_expenses']);
      expect(
        decomposeRetailFinanceCompoundPrompt(
          'list products; random gibberish only here',
        ).length,
      ).toBe(1);
      expect(extractCustomerNameFromPrompt('customer Maria at 3pm')).toBe(
        'Maria',
      );
      expect(
        extractExpenseCategoryFromPrompt('record expense Supplies $10'),
      ).toBe('Supplies');
      expect(
        decomposeRetailFinanceCompoundPrompt(
          'remove retail line shampoo from booking b1; record expense supplies $10',
        )[0].action,
      ).toBe('remove_retail_line');
      expect(
        decomposeRetailFinanceCompoundPrompt(
          'list expenses and commission report this month',
        ).map((s) => s.action),
      ).toEqual(['list_expenses', 'commission_report']);
      expect(
        decomposeRetailFinanceCompoundPrompt(
          'suggest retail upsell for my appointment and payout export this month',
        ).map((s) => s.action),
      ).toEqual(['suggest_retail_upsell', 'payout_export']);

      const rich = decomposeRetailFinanceCompoundPrompt(
        'create product Gel quantity 5 description "Styling gel" product 550e8400-e29b-41d4-a716-446655440000',
      )[0];
      expect(rich.params).toMatchObject({
        productName: 'Gel',
        quantityOnHand: 5,
        description: 'Styling gel',
        productId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(
        decomposeRetailFinanceCompoundPrompt(
          'create product link item quantity 3',
        )[0].action,
      ).toBe('create_product');
    });
  });

  describe('parseRetailSalesLinesFromPrompt', () => {
    it('parses multiple quantity+product lines from a bulk cart replace prompt', () => {
      expect(
        parseRetailSalesLinesFromPrompt(
          'Set retail cart to 2 shampoo and 1 conditioner',
        ),
      ).toEqual([
        { quantity: 2, productName: 'shampoo' },
        { quantity: 1, productName: 'conditioner' },
      ]);
    });

    it('parses a single-line replace prompt', () => {
      expect(
        parseRetailSalesLinesFromPrompt(
          'Replace the retail cart with 3 candles',
        ),
      ).toEqual([{ quantity: 3, productName: 'candles' }]);
    });

    it('defaults to quantity 1 when no number is given', () => {
      expect(
        parseRetailSalesLinesFromPrompt('Set retail cart to shampoo'),
      ).toEqual([{ quantity: 1, productName: 'shampoo' }]);
    });

    it('returns empty array when prompt has no replace clause', () => {
      expect(
        parseRetailSalesLinesFromPrompt('Add shampoo to this booking'),
      ).toEqual([]);
    });
  });
});
