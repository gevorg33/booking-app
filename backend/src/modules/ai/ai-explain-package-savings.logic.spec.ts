import {
  buildExplainPackageSavingsSummary,
  handleExplainPackageSavingsLogic,
} from './ai-explain-package-savings.logic.js';
import { EXPLAIN_PACKAGE_SAVINGS_PROMPTS } from './ai-explain-package-savings.fixtures.js';

describe('ai-explain-package-savings.logic (ai-cmd-customer-4.6.5)', () => {
  const spaPackage = {
    id: 'pkg-spa',
    name: 'Spa Day',
    currency: 'USD',
    items: [
      {
        serviceName: 'Swedish Massage',
        quantity: 1,
        lineTotal: 90,
        discountedLineTotal: 72,
        lineSavings: 18,
      },
      {
        serviceName: 'Facial',
        quantity: 1,
        lineTotal: 70,
        discountedLineTotal: 56,
        lineSavings: 14,
      },
    ],
    pricing: {
      regularTotal: 160,
      packagePrice: 128,
      savings: 32,
      savingsPercent: 20,
      discountType: 'percent',
      discountValue: 20,
    },
  };
  const wellnessPackage = {
    ...spaPackage,
    id: 'pkg-wellness',
    name: 'Wellness Package',
  };
  const deluxePackage = {
    ...spaPackage,
    id: 'pkg-deluxe',
    name: 'Deluxe Bundle',
  };

  const packagesService = {
    listPublicPackages: jest.fn(async () => [
      spaPackage,
      wellnessPackage,
      deluxePackage,
    ]),
  };

  const deps = { packagesService } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains package savings vs à la carte', async () => {
    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { _prompt: 'How much do I save on the spa day package?' },
      'How much do I save on the spa day package?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_package_savings');
    expect(result.summary).toContain('Spa Day');
    expect(result.summary).toContain('32 USD');
    expect(result.details?.pricing?.savings).toBe(32);
    expect(result.details?.lines).toHaveLength(2);
  });

  it('clarifies when package is missing', async () => {
    packagesService.listPublicPackages.mockResolvedValueOnce([
      {
        id: 'pkg-1',
        name: 'Wellness',
        pricing: {},
        items: [],
        currency: 'USD',
      },
      { id: 'pkg-2', name: 'Deluxe', pricing: {}, items: [], currency: 'USD' },
    ]);

    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { _prompt: 'Is the bundle cheaper than separate?' },
      'Is the bundle cheaper than separate?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['packageName']);
  });

  it('resolves package by packageId', async () => {
    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { packageId: 'pkg-deluxe', _prompt: 'package savings' },
      'package savings',
    );

    expect(result.success).toBe(true);
    expect(result.details?.packageName).toBe('Deluxe Bundle');
  });

  it('reports no savings when package matches à la carte total', async () => {
    packagesService.listPublicPackages.mockResolvedValueOnce([
      {
        ...spaPackage,
        pricing: {
          regularTotal: 160,
          packagePrice: 160,
          savings: 0,
          savingsPercent: 0,
          discountType: 'percent',
          discountValue: 0,
        },
      },
    ]);

    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { packageName: 'Spa Day', _prompt: 'spa day savings' },
      'spa day savings',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('costs the same');
  });

  it('clarifies when prompt is not a package savings question', async () => {
    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { packageName: 'Spa Day', _prompt: 'Book the spa day package' },
      'Book the spa day package',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('buildExplainPackageSavingsSummary formats line breakdown', () => {
    const comparison = buildExplainPackageSavingsSummary(spaPackage as any);
    expect(comparison.lines).toHaveLength(2);
    expect(comparison.verdict).toContain('saves 32 USD');
  });

  it('resolves package by partial name match', async () => {
    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { _prompt: 'How much do I save if I buy the wellness package?' },
      'How much do I save if I buy the wellness package?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.packageName).toBe('Wellness Package');
  });

  it('auto-selects the only package when none is named', async () => {
    packagesService.listPublicPackages.mockResolvedValueOnce([spaPackage]);

    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { _prompt: 'Is the bundle cheaper than separate?' },
      'Is the bundle cheaper than separate?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.packageName).toBe('Spa Day');
  });

  it('matches catalog package when search name wraps the package title', async () => {
    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      {
        packageName: 'spa day package pricing',
        _prompt: 'Is spa day package savings worth it vs separate?',
      },
      'Is spa day package savings worth it vs separate?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.packageName).toBe('Spa Day');
  });

  it.each(
    EXPLAIN_PACKAGE_SAVINGS_PROMPTS.filter((row) => row.packageName).map(
      (row) => [row.id, row] as const,
    ),
  )('resolves named package for $id', async (_id, row) => {
    const result = await handleExplainPackageSavingsLogic(
      deps,
      'biz-1',
      { _prompt: row.prompt },
      row.prompt,
    );

    expect(result.success).toBe(true);
    const expectedName = row.packageName?.toLowerCase().includes('wellness')
      ? 'Wellness Package'
      : row.packageName?.toLowerCase().includes('deluxe')
        ? 'Deluxe Bundle'
        : 'Spa Day';
    expect(result.details?.packageName).toBe(expectedName);
  });
});
