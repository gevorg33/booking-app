import {
  DEFAULT_BUSINESS_TAX_SETTINGS,
  DEFAULT_TAX_NAME,
  applyServiceTaxRateToMetadata,
  applyTaxToCheckoutAmount,
  assertBusinessTaxSettings,
  businessTaxIsActive,
  calculateStackedTaxBreakdown,
  calculateTaxBreakdown,
  formatAggregateTaxName,
  formatInclusiveTaxBadge,
  getEffectiveTaxRate,
  hasStackedTaxRules,
  mergeBusinessTaxSettings,
  normalizeTaxPricingModel,
  normalizeTaxRatePercent,
  normalizeTaxRule,
  normalizeTaxRules,
  readBusinessTaxSettings,
  readServiceTaxRatePercent,
  resolveCheckoutTaxRules,
  resolveEffectiveTaxRate,
  sumTaxRuleRates,
  toPublicBusinessTaxSettings,
} from './business-tax.util.js';

describe('business-tax.util', () => {
  describe('normalizeTaxPricingModel', () => {
    it.each([
      ['inclusive', 'inclusive'],
      [' EXCLUSIVE ', 'exclusive'],
      ['bad', null],
      [null, null],
      [undefined, null],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeTaxPricingModel(input)).toBe(expected);
    });

    it('rejects non-string values', () => {
      expect(normalizeTaxPricingModel(42 as never)).toBeNull();
    });
  });

  describe('normalizeTaxRatePercent', () => {
    it.each([
      [20, 20],
      [' 7.5 ', 7.5],
      [0, 0],
      [100, 100],
      [-1, null],
      [101, null],
      ['bad', null],
      [null, null],
      ['', null],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeTaxRatePercent(input)).toBe(expected);
    });
  });

  describe('readBusinessTaxSettings', () => {
    it('returns defaults when tax block is missing', () => {
      expect(readBusinessTaxSettings({})).toEqual(
        DEFAULT_BUSINESS_TAX_SETTINGS,
      );
    });

    it('reads persisted tax settings', () => {
      expect(
        readBusinessTaxSettings({
          tax: {
            enabled: true,
            name: ' GST ',
            rate: 10,
            model: 'inclusive',
            taxNumber: ' VAT-123 ',
          },
        }),
      ).toEqual({
        enabled: true,
        name: 'GST',
        rate: 10,
        model: 'inclusive',
        taxNumber: 'VAT-123',
      });
    });

    it('falls back when fields are invalid', () => {
      expect(
        readBusinessTaxSettings({
          tax: { enabled: 'yes', name: '  ', rate: 'bad', model: 'nope' },
        }),
      ).toEqual({
        enabled: false,
        name: DEFAULT_TAX_NAME,
        rate: 0,
        model: 'exclusive',
        taxNumber: '',
      });
    });
  });

  describe('toPublicBusinessTaxSettings', () => {
    it('omits tax when disabled or rate is zero', () => {
      expect(
        toPublicBusinessTaxSettings({
          enabled: false,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: '',
        }),
      ).toBeUndefined();
      expect(
        toPublicBusinessTaxSettings({
          enabled: true,
          name: 'VAT',
          rate: 0,
          model: 'exclusive',
          taxNumber: '',
        }),
      ).toBeUndefined();
    });

    it('exposes public tax summary when enabled', () => {
      expect(
        toPublicBusinessTaxSettings({
          enabled: true,
          name: 'GST',
          rate: 5,
          model: 'inclusive',
          taxNumber: 'REG-1',
        }),
      ).toEqual({
        enabled: true,
        name: 'GST',
        rate: 5,
        model: 'inclusive',
      });
    });
  });

  describe('assertBusinessTaxSettings', () => {
    it('normalizes and trims tax settings', () => {
      expect(
        assertBusinessTaxSettings({
          enabled: true,
          name: ' Sales Tax ',
          rate: 8.25,
          model: 'exclusive',
          taxNumber: ' AB-1234567890123456789012345678901234567890 ',
        }),
      ).toEqual({
        enabled: true,
        name: 'Sales Tax',
        rate: 8.25,
        model: 'exclusive',
        taxNumber: 'AB-1234567890123456789012345678901234567890',
      });
    });

    it('rejects enabled tax without a positive rate', () => {
      expect(() =>
        assertBusinessTaxSettings({ enabled: true, rate: 0 }),
      ).toThrow('Tax rate must be greater than 0 when tax is enabled');
      expect(() =>
        assertBusinessTaxSettings({
          enabled: true,
          rules: [{ id: 'x', name: 'X', rate: 0 }],
        }),
      ).toThrow('Tax rate must be greater than 0 when tax is enabled');
    });

    it('defaults missing optional fields', () => {
      expect(assertBusinessTaxSettings({ enabled: false })).toEqual({
        enabled: false,
        name: DEFAULT_TAX_NAME,
        rate: 0,
        model: 'exclusive',
        taxNumber: '',
      });
      expect(
        assertBusinessTaxSettings({
          enabled: false,
          name: 42 as never,
          model: 'bad',
          taxNumber: 99 as never,
        }),
      ).toEqual({
        enabled: false,
        name: DEFAULT_TAX_NAME,
        rate: 0,
        model: 'exclusive',
        taxNumber: '',
      });
    });
  });

  describe('mergeBusinessTaxSettings', () => {
    it('merges tax block into settings', () => {
      const tax = assertBusinessTaxSettings({
        enabled: true,
        rate: 20,
        name: 'VAT',
        model: 'exclusive',
        taxNumber: 'X',
      });
      expect(mergeBusinessTaxSettings({ locale: 'en' }, tax)).toEqual({
        locale: 'en',
        tax,
      });
    });
  });

  describe('service tax override helpers', () => {
    it('reads and applies service tax rate metadata', () => {
      expect(readServiceTaxRatePercent({ taxRatePercent: 5 })).toBe(5);
      expect(readServiceTaxRatePercent(null)).toBeNull();
      expect(readServiceTaxRatePercent({ taxRatePercent: 'bad' })).toBeNull();

      expect(applyServiceTaxRateToMetadata({ note: 'x' }, undefined)).toEqual({
        note: 'x',
      });
      expect(applyServiceTaxRateToMetadata({ note: 'x' }, null)).toEqual({
        note: 'x',
      });
      expect(applyServiceTaxRateToMetadata({ note: 'x' }, 0)).toEqual({
        note: 'x',
        taxRatePercent: 0,
      });
      expect(applyServiceTaxRateToMetadata({ taxRatePercent: 5 }, 12)).toEqual({
        taxRatePercent: 12,
      });
      expect(
        applyServiceTaxRateToMetadata({ taxRatePercent: 5 }, 'bad'),
      ).toEqual({});
    });

    it('resolveEffectiveTaxRate prefers service override', () => {
      expect(resolveEffectiveTaxRate(20, 5)).toBe(5);
      expect(resolveEffectiveTaxRate(20, null)).toBe(20);
      expect(resolveEffectiveTaxRate(-5, null)).toBe(0);
      expect(resolveEffectiveTaxRate(20, 0)).toBe(0);
    });
  });

  describe('calculateTaxBreakdown scenario matrix', () => {
    it.each([
      {
        id: 'exclusive-20-on-100',
        amount: 100,
        rate: 20,
        model: 'exclusive' as const,
        net: 100,
        tax: 20,
        gross: 120,
      },
      {
        id: 'inclusive-20-on-120',
        amount: 120,
        rate: 20,
        model: 'inclusive' as const,
        net: 100,
        tax: 20,
        gross: 120,
      },
      {
        id: 'exclusive-7.5-on-200',
        amount: 200,
        rate: 7.5,
        model: 'exclusive' as const,
        net: 200,
        tax: 15,
        gross: 215,
      },
      {
        id: 'inclusive-5-on-105',
        amount: 105,
        rate: 5,
        model: 'inclusive' as const,
        net: 100,
        tax: 5,
        gross: 105,
      },
      {
        id: 'zero-rate',
        amount: 100,
        rate: 0,
        model: 'exclusive' as const,
        net: 100,
        tax: 0,
        gross: 100,
      },
      {
        id: 'zero-amount',
        amount: 0,
        rate: 20,
        model: 'exclusive' as const,
        net: 0,
        tax: 0,
        gross: 0,
      },
    ])('splits $id', ({ amount, rate, model, net, tax, gross }) => {
      const breakdown = calculateTaxBreakdown(amount, rate, model, 'VAT');
      expect(breakdown.netAmount).toBe(net);
      expect(breakdown.taxAmount).toBe(tax);
      expect(breakdown.grossAmount).toBe(gross);
      expect(breakdown.taxModel).toBe(model);
    });
  });

  describe('calculateTaxBreakdown', () => {
    it('returns unchanged amounts when rate or amount is zero', () => {
      expect(calculateTaxBreakdown(100, 0, 'exclusive')).toEqual({
        netAmount: 100,
        taxAmount: 0,
        grossAmount: 100,
        taxRate: 0,
        taxModel: 'exclusive',
        taxName: DEFAULT_TAX_NAME,
      });
      expect(calculateTaxBreakdown(0, 20, 'exclusive')).toEqual({
        netAmount: 0,
        taxAmount: 0,
        grossAmount: 0,
        taxRate: 20,
        taxModel: 'exclusive',
        taxName: DEFAULT_TAX_NAME,
      });
      expect(calculateTaxBreakdown(-10, 20, 'exclusive').netAmount).toBe(0);
    });

    it('calculates exclusive tax on top', () => {
      expect(calculateTaxBreakdown(100, 20, 'exclusive', 'VAT')).toEqual({
        netAmount: 100,
        taxAmount: 20,
        grossAmount: 120,
        taxRate: 20,
        taxModel: 'exclusive',
        taxName: 'VAT',
      });
    });

    it('calculates inclusive tax embedded in price', () => {
      const breakdown = calculateTaxBreakdown(120, 20, 'inclusive', 'VAT');
      expect(breakdown.netAmount).toBe(100);
      expect(breakdown.taxAmount).toBe(20);
      expect(breakdown.grossAmount).toBe(120);
    });

    it('clamps rate above 100', () => {
      const breakdown = calculateTaxBreakdown(100, 150, 'exclusive');
      expect(breakdown.taxRate).toBe(100);
      expect(breakdown.grossAmount).toBe(200);
    });
  });

  describe('applyTaxToCheckoutAmount', () => {
    const enabledTax = {
      enabled: true,
      name: 'VAT',
      rate: 20,
      model: 'exclusive' as const,
      taxNumber: '',
    };

    it('returns null when tax is disabled or rate resolves to zero', () => {
      expect(
        applyTaxToCheckoutAmount(100, { ...enabledTax, enabled: false }),
      ).toBeNull();
      expect(
        applyTaxToCheckoutAmount(100, { ...enabledTax, rate: 0 }),
      ).toBeNull();
      expect(applyTaxToCheckoutAmount(100, enabledTax, 0)).toBeNull();
    });

    it('applies business tax to discounted checkout amount', () => {
      expect(applyTaxToCheckoutAmount(100, enabledTax)).toEqual({
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
        taxModel: 'exclusive',
        taxAmount: 20,
        netAmount: 100,
        paymentAmount: 120,
      });
    });

    it('uses service override rate when provided', () => {
      const overlay = applyTaxToCheckoutAmount(100, enabledTax, 5);
      expect(overlay?.taxRate).toBe(5);
      expect(overlay?.taxAmount).toBe(5);
      expect(overlay?.paymentAmount).toBe(105);
    });
  });

  describe('formatInclusiveTaxBadge', () => {
    it('formats badge with trimmed name and integer rate', () => {
      expect(formatInclusiveTaxBadge({ name: ' VAT ', rate: 20 })).toBe(
        'incl. 20% VAT',
      );
    });

    it('formats decimal rates and falls back to default tax name', () => {
      expect(formatInclusiveTaxBadge({ name: '  ', rate: 7.5 })).toBe(
        'incl. 7.5% VAT',
      );
    });

    it('formats stacked inclusive badge with combined rate', () => {
      expect(
        formatInclusiveTaxBadge({
          name: 'Tax',
          rate: 13,
          rules: [
            { name: 'GST', rate: 5 },
            { name: 'PST', rate: 8 },
          ],
        }),
      ).toBe('incl. 13% GST + PST');
    });
  });

  describe('stacked tax rules (tax-1.4)', () => {
    const gst = { id: 'gst', name: 'GST', rate: 5 };
    const pst = { id: 'pst', name: 'PST', rate: 8 };

    it('normalizes tax rules and drops invalid entries', () => {
      expect(normalizeTaxRule(null)).toBeNull();
      expect(normalizeTaxRule({ name: 'GST', rate: 5 }, 1)).toEqual({
        id: 'rule-2',
        name: 'GST',
        rate: 5,
      });
      expect(
        normalizeTaxRule({ id: ' custom ', name: '', rate: 'bad' }),
      ).toBeNull();
      expect(normalizeTaxRule({ rate: 5, name: 42 as never })).toEqual({
        id: 'rule-1',
        name: DEFAULT_TAX_NAME,
        rate: 5,
      });
      expect(
        normalizeTaxRules([
          { id: 'a', name: 'GST', rate: 5 },
          { name: 'bad', rate: 0 },
          null,
        ]),
      ).toEqual([{ id: 'a', name: 'GST', rate: 5 }]);
    });

    it('sums rule rates and formats aggregate names', () => {
      expect(sumTaxRuleRates([gst, pst])).toBe(13);
      expect(formatAggregateTaxName([gst, pst])).toBe('GST + PST');
      expect(formatAggregateTaxName([])).toBe(DEFAULT_TAX_NAME);
      expect(getEffectiveTaxRate({ rate: 0, rules: [gst, pst] })).toBe(13);
      expect(getEffectiveTaxRate({ rate: 20, rules: [] })).toBe(20);
    });

    it('detects active stacked business tax', () => {
      const stacked = {
        enabled: true,
        name: 'Tax',
        rate: 13,
        model: 'exclusive' as const,
        taxNumber: '',
        rules: [gst, pst],
      };
      expect(hasStackedTaxRules(stacked)).toBe(true);
      expect(hasStackedTaxRules({})).toBe(false);
      expect(hasStackedTaxRules({ rules: [] })).toBe(false);
      expect(businessTaxIsActive(stacked)).toBe(true);
      expect(businessTaxIsActive({ ...stacked, enabled: false })).toBe(false);
    });

    it('reads stacked rules from persisted settings', () => {
      expect(
        readBusinessTaxSettings({
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'exclusive',
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        }),
      ).toEqual({
        enabled: true,
        name: 'Tax',
        rate: 13,
        model: 'exclusive',
        taxNumber: '',
        rules: [gst, pst],
      });
    });

    it('asserts stacked tax settings and syncs effective rate', () => {
      expect(
        assertBusinessTaxSettings({
          enabled: true,
          rules: [gst, pst],
        }),
      ).toEqual({
        enabled: true,
        name: DEFAULT_TAX_NAME,
        rate: 13,
        model: 'exclusive',
        taxNumber: '',
        rules: [gst, pst],
      });
    });

    it('exposes stacked rules on public tax settings', () => {
      expect(
        toPublicBusinessTaxSettings({
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'inclusive',
          taxNumber: '',
          rules: [gst, pst],
        }),
      ).toEqual({
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'inclusive',
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      });
    });

    it('resolves checkout rules with service override', () => {
      const tax = {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive' as const,
        taxNumber: '',
        rules: [gst, pst],
      };
      expect(resolveCheckoutTaxRules(tax)).toEqual([gst, pst]);
      expect(resolveCheckoutTaxRules(tax, 0)).toEqual([]);
      expect(resolveCheckoutTaxRules(tax, 7)).toEqual([
        { id: 'service-override', name: 'VAT', rate: 7 },
      ]);
      expect(
        resolveCheckoutTaxRules(
          {
            enabled: true,
            name: '  ',
            rate: 20,
            model: 'exclusive',
            taxNumber: '',
          },
          7,
        ),
      ).toEqual([{ id: 'service-override', name: DEFAULT_TAX_NAME, rate: 7 }]);
      expect(
        resolveCheckoutTaxRules({
          enabled: true,
          name: '  ',
          rate: 20,
          model: 'exclusive',
          taxNumber: '',
        }),
      ).toEqual([{ id: 'default', name: DEFAULT_TAX_NAME, rate: 20 }]);
      expect(
        resolveCheckoutTaxRules({
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: '',
        }),
      ).toEqual([{ id: 'default', name: 'VAT', rate: 20 }]);
    });

    it('stacks exclusive taxes in parallel on the same base', () => {
      const breakdown = calculateStackedTaxBreakdown(
        100,
        [gst, pst],
        'exclusive',
      );
      expect(breakdown.netAmount).toBe(100);
      expect(breakdown.taxAmount).toBe(13);
      expect(breakdown.grossAmount).toBe(113);
      expect(breakdown.taxRate).toBe(13);
      expect(breakdown.taxName).toBe('GST + PST');
      expect(breakdown.rules).toEqual([
        { ...gst, amount: 5 },
        { ...pst, amount: 8 },
      ]);
    });

    it('stacks inclusive taxes with proportional split', () => {
      const breakdown = calculateStackedTaxBreakdown(
        113,
        [gst, pst],
        'inclusive',
      );
      expect(breakdown.grossAmount).toBe(113);
      expect(breakdown.taxAmount).toBe(13);
      expect(breakdown.netAmount).toBe(100);
      expect(breakdown.rules).toEqual([
        { ...gst, amount: 5 },
        { ...pst, amount: 8 },
      ]);
    });

    it('returns zero breakdown for empty stacked rules', () => {
      expect(calculateStackedTaxBreakdown(100, [], 'exclusive')).toEqual({
        netAmount: 100,
        taxAmount: 0,
        grossAmount: 100,
        taxRate: 0,
        taxModel: 'exclusive',
        taxName: DEFAULT_TAX_NAME,
        rules: [],
      });
    });

    it('clamps negative taxable amounts and zero-rate rules', () => {
      expect(
        calculateStackedTaxBreakdown(-5, [gst, pst], 'exclusive', 'Custom'),
      ).toEqual({
        netAmount: 0,
        taxAmount: 0,
        grossAmount: 0,
        taxRate: 13,
        taxModel: 'exclusive',
        taxName: 'Custom',
        rules: [
          { ...gst, amount: 0 },
          { ...pst, amount: 0 },
        ],
      });
      expect(
        calculateStackedTaxBreakdown(
          100,
          [{ id: 'x', name: 'X', rate: 0 }],
          'exclusive',
        ),
      ).toMatchObject({
        taxAmount: 0,
        rules: [],
      });
    });

    it('allocates inclusive stacked tax with rounding adjustment across rules', () => {
      const rules = [
        { id: 'a', name: 'A', rate: 5 },
        { id: 'b', name: 'B', rate: 5 },
        { id: 'c', name: 'C', rate: 5 },
      ];
      const breakdown = calculateStackedTaxBreakdown(7.67, rules, 'inclusive');
      expect(breakdown.taxAmount).toBe(1);
      const allocated =
        breakdown.rules?.reduce((sum, rule) => sum + rule.amount, 0) ?? 0;
      expect(allocated).toBeCloseTo(breakdown.taxAmount, 2);
    });

    it('returns zero inclusive rule amounts when tax rounds to zero', () => {
      const breakdown = calculateStackedTaxBreakdown(
        0.01,
        [gst, pst],
        'inclusive',
      );
      expect(breakdown.taxAmount).toBe(0);
      expect(breakdown.rules).toEqual([
        { ...gst, amount: 0 },
        { ...pst, amount: 0 },
      ]);
    });

    it('applies stacked tax at checkout with per-rule lines', () => {
      const overlay = applyTaxToCheckoutAmount(100, {
        enabled: true,
        name: 'Tax',
        rate: 13,
        model: 'exclusive',
        taxNumber: '',
        rules: [gst, pst],
      });
      expect(overlay).toEqual({
        taxEnabled: true,
        taxName: 'GST + PST',
        taxRate: 13,
        taxModel: 'exclusive',
        taxAmount: 13,
        netAmount: 100,
        paymentAmount: 113,
        taxRules: [
          { ...gst, amount: 5 },
          { ...pst, amount: 8 },
        ],
      });
    });

    it('keeps single-rule checkout overlay without taxRules array', () => {
      const overlay = applyTaxToCheckoutAmount(100, {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive',
        taxNumber: '',
      });
      expect(overlay).toEqual({
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
        taxModel: 'exclusive',
        taxAmount: 20,
        netAmount: 100,
        paymentAmount: 120,
      });
      expect(overlay).not.toHaveProperty('taxRules');
    });

    it.each([
      {
        id: 'stacked-inclusive-checkout',
        amount: 113,
        model: 'inclusive' as const,
        taxAmount: 13,
        paymentAmount: 113,
        netAmount: 100,
      },
      {
        id: 'stacked-exclusive-after-discount',
        amount: 80,
        model: 'exclusive' as const,
        taxAmount: 10.4,
        paymentAmount: 90.4,
        netAmount: 80,
      },
    ])(
      'applyTaxToCheckoutAmount for $id',
      ({ amount, model, taxAmount, paymentAmount, netAmount }) => {
        const overlay = applyTaxToCheckoutAmount(amount, {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model,
          taxNumber: '',
          rules: [gst, pst],
        });
        expect(overlay).toMatchObject({
          taxEnabled: true,
          taxName: 'GST + PST',
          taxRate: 13,
          taxModel: model,
          taxAmount,
          netAmount,
          paymentAmount,
        });
        expect(overlay?.taxRules).toHaveLength(2);
        const allocated =
          overlay?.taxRules?.reduce((sum, rule) => sum + rule.amount, 0) ?? 0;
        expect(allocated).toBe(taxAmount);
      },
    );

    it('replaces stacked rules with service override at checkout', () => {
      const overlay = applyTaxToCheckoutAmount(
        100,
        {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          taxNumber: '',
          rules: [gst, pst],
        },
        7,
      );
      expect(overlay).toEqual({
        taxEnabled: true,
        taxName: 'Tax',
        taxRate: 7,
        taxModel: 'exclusive',
        taxAmount: 7,
        netAmount: 100,
        paymentAmount: 107,
      });
      expect(overlay).not.toHaveProperty('taxRules');
    });

    it('exposes stacked exclusive tax on public profile helper', () => {
      expect(
        toPublicBusinessTaxSettings({
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          taxNumber: 'REG-9',
          rules: [gst, pst],
        }),
      ).toEqual({
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'exclusive',
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      });
    });
  });
});
