import {
  EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS,
  EXPLAIN_PACKAGE_VISIT_RULES_RESCUE_SCENARIOS,
} from './ai-explain-package-visit-rules.fixtures.js';
import { handleExplainPackageVisitRulesLogic } from './ai-explain-package-visit-rules.logic.js';
import { rescueExplainPackageVisitRulesIntent } from './ai-explain-package-visit-rules.util.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';

const spaPackage = {
  id: 'pkg-1',
  name: 'Spa Day',
  description: 'Visits must be used within one year of purchase.',
  expiresAt: '2026-12-31T23:59:59.000Z',
  currency: 'USD',
  items: [
    {
      serviceName: 'Massage',
      quantity: 2,
      lineTotal: 160,
      discountedLineTotal: 140,
      lineSavings: 20,
      durationMinutes: 60,
    },
  ],
  pricing: {
    regularTotal: 160,
    packagePrice: 140,
    savings: 20,
    savingsPercent: 12,
  },
};

function buildDeps(
  overrides: Partial<SelfServiceBookingLogicDeps> = {},
): SelfServiceBookingLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue({
        id: 'biz-1',
        settings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
              maxReschedulesPerBooking: 2,
              allowProviderChangeOnReschedule: false,
            },
          },
        },
      }),
    },
    packagesService: {
      listPublicPackages: jest.fn().mockResolvedValue([spaPackage]),
    },
    ...overrides,
  } as SelfServiceBookingLogicDeps;
}

describe('ai-explain-package-visit-rules.logic (ai-cmd-customer-4.15.4)', () => {
  it.each(
    EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_package_visit_rules for $0', async (_id, prompt) => {
    const result = await handleExplainPackageVisitRulesLogic(
      buildDeps(),
      'biz-1',
      {},
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_package_visit_rules');
    expect(result.summary).toContain('Spa Day');
  });

  it('clarifies when package is unknown', async () => {
    const result = await handleExplainPackageVisitRulesLogic(
      buildDeps({
        packagesService: {
          listPublicPackages: jest
            .fn()
            .mockResolvedValue([
              spaPackage,
              { ...spaPackage, id: 'pkg-2', name: 'Wellness Bundle' },
            ]),
        },
      }),
      'biz-1',
      {},
      'What are the package visit rules?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('resolves the only catalog package for generic prompts', async () => {
    const result = await handleExplainPackageVisitRulesLogic(
      buildDeps(),
      'biz-1',
      {},
      'What are the package visit rules?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.packageId).toBe('pkg-1');
  });

  it('resolves package by partial name match', async () => {
    const result = await handleExplainPackageVisitRulesLogic(
      buildDeps({
        packagesService: {
          listPublicPackages: jest
            .fn()
            .mockResolvedValue([
              { ...spaPackage, name: 'Deluxe Spa Day Experience' },
            ]),
        },
      }),
      'biz-1',
      { packageName: 'spa day' },
      'Package visit terms and conditions',
    );
    expect(result.success).toBe(true);
    expect(result.details?.packageName).toContain('Spa Day');
  });

  it('resolves package by id and name', async () => {
    const byId = await handleExplainPackageVisitRulesLogic(
      buildDeps(),
      'biz-1',
      { packageId: 'pkg-1' },
      'Package visit terms and conditions',
    );
    expect(byId.success).toBe(true);
    expect(byId.details?.packageId).toBe('pkg-1');

    const byName = await handleExplainPackageVisitRulesLogic(
      buildDeps(),
      'biz-1',
      {},
      'What happens when I cancel a spa day visit?',
    );
    expect(byName.success).toBe(true);
    expect(byName.details?.packageName).toBe('Spa Day');
  });

  it('handles missing business and invalid prompts', async () => {
    expect(
      (
        await handleExplainPackageVisitRulesLogic(
          buildDeps({
            businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
          }),
          'biz-1',
          {},
          'Do unused visits expire?',
        )
      ).summary,
    ).toContain('Business not found');

    const invalid = await handleExplainPackageVisitRulesLogic(
      buildDeps(),
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(invalid.success).toBe(false);
    expect(invalid.details?.clarify).toBe(true);
  });

  it.each(EXPLAIN_PACKAGE_VISIT_RULES_RESCUE_SCENARIOS)(
    'rescue fixture $id maps to explain_package_visit_rules',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainPackageVisitRulesIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_package_visit_rules');
    },
  );
});
