import {
  isServiceCatalogBrowsePrompt,
  rescueServiceCatalogBrowseIntent,
} from './ai-service-catalog-browse.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';

describe('ai-service-catalog-browse.util', () => {
  it.each([
    'recommend me face care services',
    'I want a pilling',
    'I want a face pilling',
    'show me massage services',
  ])('detects catalog browse prompt %s', (prompt) => {
    expect(isServiceCatalogBrowsePrompt(prompt)).toBe(true);
    expect(rescueServiceCatalogBrowseIntent(prompt, 'unknown')).toEqual({
      action: 'list_services',
      rescueReason: 'catalog_browse',
    });
  });

  it('does not steal provider rank prompts', () => {
    expect(
      isServiceCatalogBrowsePrompt('best rated massage specialist this week'),
    ).toBe(false);
  });

  it('does not steal explicit booking prompts', () => {
    expect(isServiceCatalogBrowsePrompt('book a massage tomorrow at 3pm')).toBe(
      false,
    );
  });

  it('enriches category keyword for recommend and want phrasing', () => {
    expect(
      enrichListServicesParamsFromPrompt('recommend me face care services', {}),
    ).toEqual({ serviceCategory: 'face care' });
    expect(enrichListServicesParamsFromPrompt('I want a pilling', {})).toEqual({
      serviceCategory: 'pilling',
    });
    expect(
      enrichListServicesParamsFromPrompt('I want a face pilling', {}),
    ).toEqual({ serviceCategory: 'face pilling' });
  });
});
