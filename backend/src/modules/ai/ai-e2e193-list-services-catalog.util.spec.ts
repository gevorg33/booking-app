import {
  E2E193_FILLER_FILTER_CASES,
  E2E193_LIST_SERVICES_PROMPTS,
  E2E193_NEGATIVE_PROMPTS,
} from './ai-e2e193-list-services-catalog.util.js';
import { isPlainServiceCatalogListPrompt } from './ai-list-services-catalog-cue.util.js';
import {
  enrichListServicesParamsFromPrompt,
  sanitizeListServicesFilterValue,
} from './ai-orchestration.helpers.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';
import { isCheckMultiServiceBlockAvailabilityPrompt } from './ai-schedule-resources.util.js';
import {
  isServiceCatalogBrowsePrompt,
  rescueServiceCatalogBrowseIntent,
} from './ai-service-catalog-browse.util.js';

describe('e2e-bug.193 list_services catalog browse', () => {
  it.each(
    E2E193_LIST_SERVICES_PROMPTS.filter((row) => row.expectFullCatalog).map(
      (row) => [row.id, row] as const,
    ),
  )('treats full-catalog prompt $id as list_services browse', (_id, row) => {
    expect(isPlainServiceCatalogListPrompt(row.prompt)).toBe(true);
    expect(isServiceCatalogBrowsePrompt(row.prompt)).toBe(true);
    expect(isCheckMultiServiceBlockAvailabilityPrompt(row.prompt)).toBe(false);
    expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(false);
    expect(
      rescueServiceCatalogBrowseIntent(
        row.prompt,
        'check_multi_service_block_availability',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'catalog_browse',
    });
    expect(
      enrichListServicesParamsFromPrompt(row.prompt, {
        serviceName: 'you offer',
        serviceCategory: 'are available',
      }),
    ).toMatchObject({ serviceName: null, serviceCategory: null });
  });

  it('keeps named offer filter for do you offer Swedish massage', () => {
    const prompt = 'do you offer Swedish massage?';
    expect(isServiceCatalogBrowsePrompt(prompt)).toBe(true);
    expect(isCheckMultiServiceBlockAvailabilityPrompt(prompt)).toBe(false);
    expect(rescueServiceCatalogBrowseIntent(prompt, 'unknown')?.action).toBe(
      'list_services',
    );
  });

  it.each(E2E193_FILLER_FILTER_CASES.map((row) => [row.id, row] as const))(
    'sanitizes filler filter $id',
    (_id, row) => {
      expect(sanitizeListServicesFilterValue(row.value)).toBe(row.expected);
    },
  );

  it.each(E2E193_NEGATIVE_PROMPTS.map((row) => [row.id, row] as const))(
    'negative $id stays off plain catalog list',
    (_id, row) => {
      if ('expectMultiServiceBlock' in row && row.expectMultiServiceBlock) {
        expect(isCheckMultiServiceBlockAvailabilityPrompt(row.prompt)).toBe(
          true,
        );
        expect(isPlainServiceCatalogListPrompt(row.prompt)).toBe(false);
      }
      if ('forbidMultiServiceBlock' in row && row.forbidMultiServiceBlock) {
        expect(isCheckMultiServiceBlockAvailabilityPrompt(row.prompt)).toBe(
          false,
        );
      }
    },
  );

  it('rescues what-services-are-available away from providers and multi-service', () => {
    const prompt = 'What services are available?';
    expect(isPlainServiceCatalogListPrompt(prompt)).toBe(true);
    expect(isCheckMultiServiceBlockAvailabilityPrompt(prompt)).toBe(false);
    expect(isCheckProvidersForServicePrompt(prompt)).toBe(false);
    expect(
      rescueServiceCatalogBrowseIntent(prompt, 'check_providers_for_service'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'catalog_browse',
    });
  });
});
