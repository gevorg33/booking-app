import { PackageDiscountType } from '../service-packages/entities/service-package.entity.js';
import { CATALOG_NOTIFY_DASHBOARD_SCENARIOS } from './ai-catalog-notify.fixtures.js';
import {
  rescueCatalogIntent,
  isCatalogIntent,
  isBulkCreateCatalogPrompt,
  isCreateServiceCategoryPrompt,
  extractDeactivateServiceNameFromPrompt,
  isDeactivateServicePrompt,
  isCreatePackagePrompt,
  isUpdatePackagePrompt,
  isDeactivatePackagePrompt,
  isDuplicatePackagePrompt,
  isListPackagesPrompt,
  isCreateSubscriptionPlanPrompt,
  isUpdateSubscriptionPlanPrompt,
  isDeactivateSubscriptionPlanPrompt,
  isListSubscriptionPlansPrompt,
  isAssignSubscriptionPrompt,
  isConfigureGiftCardProductsPrompt,
  isCreateGiftCardBundlePrompt,
  isConfigureMultiServiceSettingsPrompt,
  isSetServiceCompatibilityPrompt,
  parseBulkCatalogFromPrompt,
  parseBulkCatalogWithCountFromPrompt,
  parseCatalogServiceCountFromPrompt,
  parseAssignServiceCategoryFromPrompt,
  extractCreateServiceCategoryFromPrompt,
  extractCreateServiceNameFromPrompt,
  enrichServiceCategoryRescueParams,
  enrichCreateServiceParamsFromPrompt,
  reconcileCreateServiceNameFromPrompt,
  isAssignServiceCategoryPrompt,
  parseLocalizedNamesFromPrompt,
  buildCountedCatalogDraft,
  isCatalogCompoundPrompt,
  parseServiceLinesFromText,
  decomposeCatalogCompoundPrompt,
  isCatalogCompoundPrompt,
  extractDiscountFromPrompt,
  extractPresetAmounts,
  extractExpiresAtFromPrompt,
  extractMultiServiceLimits,
  extractPackageServiceNames,
  extractCreatePackageParamsFromPrompt,
  CATALOG_INTENTS,
} from './ai-catalog.util.js';
import {
  E2E157_CREATE_PACKAGE_SCENARIOS,
  E2E157_GIFT_CARD_BUNDLE_STILL_MATCHES,
} from './ai-e2e157-create-package.fixtures.js';

describe('ai-catalog.util', () => {
  describe('prompt classifiers', () => {
    it('detects bulk with counted services and translations', () => {
      const prompt =
        'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian';
      expect(isBulkCreateCatalogPrompt(prompt)).toBe(true);
      expect(parseCatalogServiceCountFromPrompt(prompt)).toBe(10);
      expect(parseLocalizedNamesFromPrompt(prompt)).toEqual({ hy: [], ru: [] });
      const draft = parseBulkCatalogWithCountFromPrompt(prompt);
      expect(draft?.categoryName).toBe('Nails');
      expect(draft?.services).toHaveLength(10);
      expect(isCatalogCompoundPrompt(prompt)).toBe(false);
      expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
        'bulk_create_catalog',
      );
    });

    it('parses explicit locale labels and builds translation templates', () => {
      expect(parseLocalizedNamesFromPrompt('hy: Logo; ru: Logo RU')).toEqual({
        hy: ['Logo'],
        ru: ['Logo RU'],
      });
      expect(
        parseCatalogServiceCountFromPrompt('Spa category with 5 services'),
      ).toBe(5);
      const singleTemplate = buildCountedCatalogDraft('Spa', 2, undefined, {
        hy: ['Logo'],
      });
      expect(singleTemplate.services[0].localizedNames?.hy).toEqual(['Logo']);
      const multiTemplate = buildCountedCatalogDraft('Spa', 2, undefined, {
        hy: ['Logo', 'Logo 2'],
      });
      expect(multiTemplate.services[1].localizedNames?.hy).toEqual([
        'Logo 2',
        'Logo 2 2',
      ]);
      expect(
        parseCatalogServiceCountFromPrompt('create 8 services for catalog'),
      ).toBe(8);
      expect(
        parseBulkCatalogWithCountFromPrompt(
          'new service category Wax with 6 linked services',
        )?.categoryName,
      ).toBe('Wax');
      expect(
        parseBulkCatalogWithCountFromPrompt(
          'new Brow service category with 4 linked services',
        )?.categoryName,
      ).toBe('Brow');
      expect(
        parseLocalizedNamesFromPrompt(
          'add translations in Armenian and Russian for services',
        ),
      ).toEqual({
        hy: [],
        ru: [],
      });
      expect(
        parseLocalizedNamesFromPrompt(
          'translations in Armenian, Klingon, and Russian',
        ),
      ).toEqual({
        hy: [],
        ru: [],
      });
      expect(
        parseBulkCatalogWithCountFromPrompt(
          'service category Wax with 6 linked services',
        )?.categoryName,
      ).toBe('Wax');
    });

    it('detects bulk, category, deactivate, and list prompts', () => {
      expect(
        isBulkCreateCatalogPrompt('Create category Hair with Cut 60m $65'),
      ).toBe(true);
      expect(isBulkCreateCatalogPrompt('Add category Color')).toBe(false);
      expect(isCreateServiceCategoryPrompt('Add category Color')).toBe(true);
      expect(
        isDeactivateServicePrompt('Hide balayage from public booking'),
      ).toBe(true);
      expect(isDeactivateServicePrompt('deactivate package Spa')).toBe(false);
      expect(isListPackagesPrompt('list packages')).toBe(true);
      expect(isListPackagesPrompt('list package visits')).toBe(false);
      expect(isListSubscriptionPlansPrompt('show subscription plans')).toBe(
        true,
      );
    });

    it.each([
      ['Delete the service called QA Test Trim', 'QA Test Trim'],
      [
        'Remove the QA Test Trim service from my catalog permanently',
        'QA Test Trim',
      ],
      [
        'Delete service QA Test Trim from the business catalog. This is a catalog management delete_service action, not a cart or employee action.',
        'QA Test Trim',
      ],
      ['Deactivate the QA Test Trim service', 'QA Test Trim'],
    ] as const)(
      'e2e-bug.144 — %s → deactivate_service with serviceName',
      (prompt, serviceName) => {
        expect(isDeactivateServicePrompt(prompt)).toBe(true);
        expect(extractDeactivateServiceNameFromPrompt(prompt)).toBe(
          serviceName,
        );
        expect(
          rescueCatalogIntent(prompt, 'remove_service_from_cart')?.action,
        ).toBe('deactivate_service');
        expect(
          rescueCatalogIntent(prompt, 'unassign_employee_services')?.action,
        ).toBe('deactivate_service');
        expect(rescueCatalogIntent(prompt, 'deactivate_employee')?.action).toBe(
          'deactivate_service',
        );
        const rescued = rescueCatalogIntent(prompt, 'unknown');
        expect(rescued?.action).toBe('deactivate_service');
        expect(rescued?.params?.serviceName).toBe(serviceName);
      },
    );

    it('e2e-bug.151 — new service category called X is not a promo code', () => {
      const prompt = 'Add a new service category called Wellness';
      expect(isCreateServiceCategoryPrompt(prompt)).toBe(true);
      expect(rescueCatalogIntent(prompt, 'create_promo_code')).toEqual({
        action: 'create_service_category',
        rescueReason: 'service_category',
      });
      expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
        'create_service_category',
      );
      const params: Record<string, unknown> = {};
      enrichServiceCategoryRescueParams(
        'create_service_category',
        params,
        prompt,
      );
      expect(params.categoryName).toBe('Wellness');
    });

    it('e2e-bug.251 — catalog category named X is create_service_category', () => {
      const prompt = 'Add a new catalog category named QA Nails';
      expect(isCreateServiceCategoryPrompt(prompt)).toBe(true);
      expect(rescueCatalogIntent(prompt, 'import_services_from_menu')).toEqual({
        action: 'create_service_category',
        rescueReason: 'service_category',
      });
      const params: Record<string, unknown> = {};
      enrichServiceCategoryRescueParams(
        'create_service_category',
        params,
        prompt,
      );
      expect(params.categoryName).toBe('QA Nails');
    });

    it('detects package and subscription plan prompts', () => {
      expect(isCreatePackagePrompt('Create Spa Day package with massage')).toBe(
        true,
      );
      expect(isCreatePackagePrompt('Book spa day package visit')).toBe(false);
      expect(isUpdatePackagePrompt('update Spa package discount')).toBe(true);
      expect(isUpdatePackagePrompt('изменить Spa package')).toBe(true);
      expect(isDeactivatePackagePrompt('deactivate Spa package')).toBe(true);
      expect(isDuplicatePackagePrompt('duplicate Spa package')).toBe(true);
      expect(
        isCreateSubscriptionPlanPrompt('Add 12-month nail plan 24 visits'),
      ).toBe(true);
      expect(
        isUpdateSubscriptionPlanPrompt('update the nail subscription plan'),
      ).toBe(true);
      expect(isUpdateSubscriptionPlanPrompt('update membership pricing')).toBe(
        true,
      );
      expect(
        isDeactivateSubscriptionPlanPrompt('deactivate membership plan Gold'),
      ).toBe(true);
      expect(isAssignSubscriptionPrompt('Give Anna the massage plan')).toBe(
        true,
      );
      expect(isAssignSubscriptionPrompt('Add 12-month plan 24 visits')).toBe(
        false,
      );
    });

    it('detects catalog-notify multilingual package and plan prompts', () => {
      for (const scenario of CATALOG_NOTIFY_DASHBOARD_SCENARIOS.filter(
        (s) => s.localeHint === 'hy',
      )) {
        expect(rescueCatalogIntent(scenario.prompt, 'unknown')?.action).toBe(
          scenario.expectedAction,
        );
      }
    });

    it('detects gift card, multi-service, and compatibility prompts', () => {
      expect(
        isConfigureGiftCardProductsPrompt('Enable gift card presets'),
      ).toBe(true);
      expect(
        isCreateGiftCardBundlePrompt('create gift card bundle haircut beard'),
      ).toBe(true);
      expect(
        isConfigureMultiServiceSettingsPrompt(
          'Enable multi-service booking max 3 services',
        ),
      ).toBe(true);
      expect(
        isSetServiceCompatibilityPrompt('Block massage and peel same visit'),
      ).toBe(true);
    });
  });

  describe('rescue edge cases', () => {
    it('skips rescue when action already matches', () => {
      expect(
        rescueCatalogIntent(
          'Create Spa package with massage',
          'create_package',
        ),
      ).toBeNull();
      expect(
        rescueCatalogIntent('Add category Color', 'create_service_category'),
      ).toBeNull();
      expect(
        rescueCatalogIntent(
          'Create category Hair with Cut 60m $65',
          'create_services',
        ),
      ).toBeNull();
      expect(
        rescueCatalogIntent('Add category Color', 'create_service')?.action,
      ).toBe('create_service_category');
      expect(
        rescueCatalogIntent('Add category Color', 'create_services')?.action,
      ).toBe('create_service_category');
      expect(
        rescueCatalogIntent('Create Spa package with massage', 'create_booking')
          ?.action,
      ).toBe('create_package');
      expect(
        rescueCatalogIntent(
          'Create Spa package with massage',
          'create_package_booking',
        )?.action,
      ).toBe('create_package');
    });
  });

  describe('service category assignment prompts', () => {
    it('detects move-under-category phrasing', () => {
      const prompt = 'move Neck Massage under service category: Massage';
      expect(isAssignServiceCategoryPrompt(prompt)).toBe(true);
      expect(parseAssignServiceCategoryFromPrompt(prompt)).toEqual({
        serviceName: 'Neck Massage',
        categoryName: 'Massage',
      });
      expect(rescueCatalogIntent(prompt, 'unknown')?.rescueReason).toBe(
        'assign_service_category',
      );
    });

    it('extracts category for create_service prompts', () => {
      expect(
        extractCreateServiceCategoryFromPrompt(
          'Add Neck Massage 30min $40 under service category: Massage',
        ),
      ).toBe('Massage');
      expect(
        extractCreateServiceCategoryFromPrompt(
          'Add service Haircut under Hair category',
        ),
      ).toBe('Hair');
    });

    it('extracts quoted new service names for create_service prompts', () => {
      const prompt =
        "create a new service 'Men's haircut with head wash' price 15$ duration 40min";
      expect(extractCreateServiceNameFromPrompt(prompt)).toBe(
        "Men's haircut with head wash",
      );

      const params: Record<string, unknown> = {
        serviceName: "Men's Haircut",
      };
      enrichServiceCategoryRescueParams('create_service', params, prompt);
      expect(params.serviceName).toBe("Men's haircut with head wash");
      expect(params.serviceId).toBeUndefined();
    });

    it('extracts paraphrased unquoted and colon create_service names', () => {
      expect(
        extractCreateServiceNameFromPrompt(
          "create a new service men's haircut with head wash price 15$ duration 40min",
        ),
      ).toBe("men's haircut with head wash");
      expect(
        extractCreateServiceNameFromPrompt(
          "Offer a new treatment: men's haircut with head wash, 40 minutes, $15",
        ),
      ).toBe("men's haircut with head wash");
    });

    it('reconciles classifier snaps to catalog when prompt names a distinct offering', () => {
      const catalog = [{ name: "Men's Haircut" }];
      const prompt =
        "create a new service men's haircut with head wash price 15 duration 40";
      const params: Record<string, unknown> = { serviceName: "Men's Haircut" };

      reconcileCreateServiceNameFromPrompt(prompt, params, catalog);
      expect(params.serviceName).toBe("men's haircut with head wash");

      enrichCreateServiceParamsFromPrompt(params, prompt, catalog);
      expect(params.serviceName).toBe("men's haircut with head wash");
    });

    it('rejects provider-assignment phrasing and enriches rescue params', () => {
      expect(
        isAssignServiceCategoryPrompt(
          'Assign all services under Spa category to provider Mary',
        ),
      ).toBe(false);
      expect(
        parseAssignServiceCategoryFromPrompt(
          'move "Back Massage" to category Spa',
        ),
      ).toEqual({
        serviceName: 'Back Massage',
        categoryName: 'Spa',
      });

      const updateParams: Record<string, unknown> = {};
      enrichServiceCategoryRescueParams(
        'update_service',
        updateParams,
        'move Neck Massage under service category: Massage',
      );
      expect(updateParams).toEqual({
        serviceName: 'Neck Massage',
        categoryName: 'Massage',
      });

      const createParams: Record<string, unknown> = { categoryName: 'Hair' };
      enrichServiceCategoryRescueParams(
        'create_service',
        createParams,
        'Add trim under Massage category',
      );
      expect(createParams.categoryName).toBe('Hair');

      const bulkParams: Record<string, unknown> = {};
      enrichServiceCategoryRescueParams(
        'create_services',
        bulkParams,
        'Add services under Spa category: cut 30m $20',
      );
      expect(bulkParams.categoryName).toBe('Spa');
      expect(
        extractCreateServiceCategoryFromPrompt('hello world'),
      ).toBeUndefined();
      expect(
        rescueCatalogIntent(
          'move Neck Massage under service category: Massage',
          'unknown',
        )?.params,
      ).toEqual({
        serviceName: 'Neck Massage',
        categoryName: 'Massage',
      });
      expect(
        rescueCatalogIntent(
          'move Neck Massage under service category: Massage',
          'update_service',
        ),
      ).toBeNull();

      const prefilled: Record<string, unknown> = {
        serviceName: 'Keep Me',
        categoryName: 'Keep Cat',
      };
      enrichServiceCategoryRescueParams(
        'update_service',
        prefilled,
        'move Other under service category: OtherCat',
      );
      expect(prefilled).toEqual({
        serviceName: 'Keep Me',
        categoryName: 'Keep Cat',
      });
    });
  });

  describe('rescueCatalogIntent', () => {
    it('rescues all catalog intents from unknown', () => {
      expect(
        rescueCatalogIntent('Create category Hair with Cut 60m $65', 'unknown')
          ?.action,
      ).toBe('bulk_create_catalog');
      expect(rescueCatalogIntent('Add category Color', 'unknown')?.action).toBe(
        'create_service_category',
      );
      expect(
        rescueCatalogIntent(
          'Create Spa Day package with massage + facial',
          'unknown',
        )?.action,
      ).toBe('create_package');
      expect(
        rescueCatalogIntent('update Spa package discount', 'unknown')?.action,
      ).toBe('update_package');
      expect(
        rescueCatalogIntent('deactivate Spa package', 'unknown')?.action,
      ).toBe('deactivate_package');
      expect(
        rescueCatalogIntent('duplicate Spa package', 'unknown')?.action,
      ).toBe('duplicate_package');
      expect(
        rescueCatalogIntent('Add 12-month nail plan 24 visits', 'unknown')
          ?.action,
      ).toBe('create_subscription_plan');
      expect(
        rescueCatalogIntent('update nail subscription plan', 'unknown')?.action,
      ).toBe('update_subscription_plan');
      expect(
        rescueCatalogIntent(
          'Թարմացրի՛r nail club membership-ը և տեղեկացրի՛r հաճախորդներին',
          'unknown',
        )?.action,
      ).toBe('update_subscription_plan');
      expect(
        rescueCatalogIntent('deactivate nail subscription plan', 'unknown')
          ?.action,
      ).toBe('deactivate_subscription_plan');
      expect(
        rescueCatalogIntent('Give Anna the massage plan', 'unknown')?.action,
      ).toBe('assign_subscription_to_customer');
      expect(
        rescueCatalogIntent('Enable $50 gift card presets', 'unknown')?.action,
      ).toBe('configure_gift_card_products');
      expect(
        rescueCatalogIntent('create gift card bundle haircut beard', 'unknown')
          ?.action,
      ).toBe('create_gift_card_bundle');
      expect(
        rescueCatalogIntent(
          'Enable multi-service booking max 3 services',
          'unknown',
        )?.action,
      ).toBe('configure_multi_service_settings');
      expect(
        rescueCatalogIntent('Block massage same visit combo', 'unknown')
          ?.action,
      ).toBe('set_service_compatibility');
      expect(
        rescueCatalogIntent('Mark Haircut as featured', 'unknown')?.action,
      ).toBe('configure_service_featured');
      expect(
        rescueCatalogIntent(
          'Move all hair services under Hair category',
          'unknown',
        )?.action,
      ).toBe('bulk_assign_services_category');
      expect(
        rescueCatalogIntent(
          'Require 50% online prepayment for Spa Day package',
          'unknown',
        )?.action,
      ).toBe('configure_package_online_payment');
      expect(
        rescueCatalogIntent(
          'Require $25 deposit on featured services',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueCatalogIntent('Hide balayage from public catalog', 'unknown')
          ?.action,
      ).toBe('deactivate_service');
      expect(
        rescueCatalogIntent(
          'move Neck Massage under service category: Massage',
          'unknown',
        )?.action,
      ).toBe('update_service');
      expect(rescueCatalogIntent('list packages', 'unknown')?.action).toBe(
        'list_packages',
      );
      expect(
        rescueCatalogIntent('show subscription plans', 'unknown')?.action,
      ).toBe('list_subscription_plans');
    });

    it('rescues from misclassified actions', () => {
      expect(
        rescueCatalogIntent('Add category Color', 'create_service')?.action,
      ).toBe('create_service_category');
      expect(
        rescueCatalogIntent(
          'Create Spa Day package with massage',
          'create_package_booking',
        )?.action,
      ).toBe('create_package');
    });

    it('returns null for compound prompts and no match', () => {
      const compound =
        'Create category Hair with Cut 60m $65 and add Spa Day package with massage + facial';
      expect(rescueCatalogIntent(compound, 'unknown')).toBeNull();
      expect(rescueCatalogIntent('hello world', 'unknown')).toBeNull();
      expect(
        rescueCatalogIntent('update Spa package', 'update_package')?.action,
      ).toBe('update_package');
      expect(
        rescueCatalogIntent(
          'Hide balayage from catalog',
          'update_service_prices',
        ),
      ).toBeNull();
    });
  });

  describe('parsers and extractors', () => {
    it('parses service lines and skips duplicates', () => {
      const lines = parseServiceLinesFromText(
        "Cut 60m $65, Cut 60m $65, Men's cut 30m $35",
      );
      expect(lines).toHaveLength(2);
      expect(parseServiceLinesFromText('')).toHaveLength(0);
    });

    it('parses bulk catalog from category or menu', () => {
      const fromCategory = parseBulkCatalogFromPrompt(
        "Create category Hair with services: Women's cut 60m $65",
      );
      expect(fromCategory?.categoryName).toBe('Hair');

      const fromMenu = parseBulkCatalogFromPrompt(
        'Create catalog for Nails: Polish 45m $40',
      );
      expect(fromMenu?.categoryName).toBe('Nails');
      expect(parseBulkCatalogFromPrompt('Create category Empty')).toBeNull();
    });

    it('extracts package services, discounts, expiry, presets, and limits', () => {
      expect(
        extractPackageServiceNames('package with massage + facial 15% off'),
      ).toEqual(['massage', 'facial']);
      expect(extractDiscountFromPrompt('15% off')).toEqual({
        discountType: PackageDiscountType.PERCENT,
        discountValue: 15,
      });
      expect(extractDiscountFromPrompt('$10 off')).toEqual({
        discountType: PackageDiscountType.FIXED,
        discountValue: 10,
      });
      expect(extractDiscountFromPrompt('no discount')).toBeNull();
      expect(extractExpiresAtFromPrompt('expires 2026-12-31')).toBe(
        '2026-12-31',
      );
      expect(extractExpiresAtFromPrompt('expires on Dec 31, 2026')).toBe(
        'Dec 31, 2026',
      );
      expect(extractPresetAmounts('Enable $50 and $100 presets')).toEqual([
        50, 100,
      ]);
      expect(extractPresetAmounts('Enable $0 and $50 presets')).toEqual([50]);
      expect(
        extractMultiServiceLimits('max 3 services and 180 min cap'),
      ).toEqual({
        maxServiceCount: 3,
        maxDurationMinutes: 180,
      });
    });
  });

  describe('compound decomposition', () => {
    it('detects and decomposes multi-command prompts', () => {
      expect(isCatalogCompoundPrompt('short')).toBe(false);
      const prompt =
        "Create category Hair with Women's cut 60m $65 and add Spa Day package with massage + facial 15% off";
      expect(isCatalogCompoundPrompt(prompt)).toBe(true);
      const steps = decomposeCatalogCompoundPrompt(prompt);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.map((s) => s.action)).toContain('bulk_create_catalog');
      expect(steps.map((s) => s.action)).toContain('create_package');
    });

    it('classifies segments without draft and empty input', () => {
      const bulkNoDraft = decomposeCatalogCompoundPrompt(
        "Create catalog: Women's cut 60m $65",
      );
      expect(bulkNoDraft[0]?.action).toBe('bulk_create_catalog');
      expect(bulkNoDraft[0]?.params.catalogDraft).toBeUndefined();

      const membership = decomposeCatalogCompoundPrompt(
        'Create membership plan Gold for VIP',
      );
      expect(membership[0]?.action).toBe('create_subscription_plan');

      const maxDurationOnly = decomposeCatalogCompoundPrompt(
        'Enable multi-service booking 180 min cap',
      );
      expect(maxDurationOnly[0]?.params.maxDurationMinutes).toBe(180);

      const maxServicesOnly = decomposeCatalogCompoundPrompt(
        'Enable multi-service booking settings max 4 services',
      );
      expect(maxServicesOnly[0]?.params.maxServiceCount).toBe(4);

      const partialCompound = decomposeCatalogCompoundPrompt(
        "Create catalog: Women's cut 60m $65 and hello unrelated segment",
      );
      expect(partialCompound.map((s) => s.action)).toContain(
        'bulk_create_catalog',
      );

      expect(extractMultiServiceLimits('Enable multi-service booking')).toEqual(
        {},
      );
      expect(extractMultiServiceLimits('max 2 services only')).toEqual({
        maxServiceCount: 2,
      });

      const skippedSegment = decomposeCatalogCompoundPrompt(
        'Add category Color; totally unrelated words only; Enable $50 gift card presets',
      );
      expect(skippedSegment.map((s) => s.action)).toEqual([
        'create_service_category',
        'configure_gift_card_products',
      ]);

      const unnamedCategory = decomposeCatalogCompoundPrompt('Add category');
      expect(unnamedCategory[0]?.params.categoryName).toBeNull();

      const packageAlt = decomposeCatalogCompoundPrompt(
        'create 123 package Deluxe with massage + facial',
      );
      expect(packageAlt[0]?.action).toBe('create_package');
      expect(packageAlt[0]?.params.packageName).toBe('Deluxe');
    });

    it('decomposes semicolon and single-segment compound types', () => {
      const giftSteps = decomposeCatalogCompoundPrompt(
        'Enable $50 gift card presets; Enable multi-service booking max 3 services 180 min',
      );
      expect(giftSteps.map((s) => s.action)).toContain(
        'configure_gift_card_products',
      );
      expect(giftSteps.map((s) => s.action)).toContain(
        'configure_multi_service_settings',
      );

      const subStep = decomposeCatalogCompoundPrompt(
        'Add 12-month nail plan 24 visits for Nail Care',
      );
      expect(subStep[0]?.action).toBe('create_subscription_plan');

      const compat = decomposeCatalogCompoundPrompt(
        'Block massage and chemical peel same visit',
      );
      expect(compat[0]?.action).toBe('set_service_compatibility');

      const categoryOnly = decomposeCatalogCompoundPrompt('Add category Color');
      expect(categoryOnly[0]?.action).toBe('create_service_category');

      const deactivate = decomposeCatalogCompoundPrompt(
        'Hide balayage from public catalog',
      );
      expect(deactivate[0]?.action).toBe('deactivate_service');

      expect(decomposeCatalogCompoundPrompt('')).toEqual([]);
      expect(
        decomposeCatalogCompoundPrompt('not a catalog command at all here'),
      ).toEqual([]);

      const updateNotify = decomposeCatalogCompoundPrompt(
        'Update Glow package discount to 20% and notify customers',
      );
      expect(updateNotify[0]?.action).toBe('update_package');
      expect(updateNotify[0]?.params.notifyCustomers).toBe(true);
      expect(updateNotify[0]?.params.packageName).toBe('Glow');

      const skipNotify = decomposeCatalogCompoundPrompt(
        'Update Glow package discount to 20% and do not notify customers',
      );
      expect(skipNotify[0]?.params.notifyCustomers).toBe(false);
    });
  });

  it('registers catalog intents', () => {
    for (const intent of CATALOG_INTENTS) {
      expect(isCatalogIntent(intent)).toBe(true);
    }
    expect(isCatalogIntent('create_booking')).toBe(false);
  });

  describe('e2e-bug.157 — package vs gift-card-bundle', () => {
    it.each([...E2E157_CREATE_PACKAGE_SCENARIOS])(
      '$id routes to create_package even when misclassified as gift-card bundle',
      (row) => {
        expect(isCreatePackagePrompt(row.prompt)).toBe(true);
        expect(isCreateGiftCardBundlePrompt(row.prompt)).toBe(false);
        expect(
          rescueCatalogIntent(row.prompt, 'create_gift_card_bundle'),
        ).toMatchObject({
          action: row.expectedAction,
          rescueReason: row.rescueReason,
        });
        expect(rescueCatalogIntent(row.prompt, 'unknown')?.action).toBe(
          row.expectedAction,
        );
        const params = extractCreatePackageParamsFromPrompt(row.prompt);
        expect(params.packageName).toBe(row.packageName);
        expect(params.serviceNames).toEqual(
          expect.arrayContaining(row.serviceNames),
        );
        expect((params.serviceNames as string[]).length).toBe(
          row.serviceNames.length,
        );
      },
    );

    it.each([...E2E157_GIFT_CARD_BUNDLE_STILL_MATCHES])(
      '$id still rescues explicit gift-card bundles',
      (row) => {
        expect(isCreateGiftCardBundlePrompt(row.prompt)).toBe(true);
        expect(isCreatePackagePrompt(row.prompt)).toBe(false);
        expect(rescueCatalogIntent(row.prompt, 'unknown')?.action).toBe(
          row.expectedAction,
        );
      },
    );
  });
});
