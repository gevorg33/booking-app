import {
  CONFIGURE_SERVICE_FEATURED_PROMPTS,
  extractFeaturedFlagFromPrompt,
  extractFeaturedServiceNameFromPrompt,
  extractFeaturedTierFromPrompt,
  isConfigureServiceFeaturedPrompt,
  parseConfigureServiceFeaturedFromPrompt,
  enrichConfigureServiceFeaturedParamsFromPrompt,
  rescueConfigureServiceFeaturedIntent,
} from './ai-configure-service-featured.util.js';

describe('ai-configure-service-featured.util', () => {
  it.each(CONFIGURE_SERVICE_FEATURED_PROMPTS)(
    'detects configure prompt $id',
    ({ prompt }) => {
      expect(isConfigureServiceFeaturedPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_SERVICE_FEATURED_PROMPTS)(
    'parses configure prompt $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureServiceFeaturedFromPrompt(prompt, {});
      expect(parsed).toMatchObject(paramsPartial ?? {});
    },
  );

  it('disambiguates featured metadata from deposit policy', () => {
    expect(
      isConfigureServiceFeaturedPrompt(
        'Require $25 deposit on featured services',
      ),
    ).toBe(false);
    expect(
      isConfigureServiceFeaturedPrompt(
        'Set 30% deposit on premium tier services',
      ),
    ).toBe(false);
    expect(isConfigureServiceFeaturedPrompt('Mark Haircut as featured')).toBe(
      true,
    );
  });

  it('rescues unknown action to configure_service_featured', () => {
    expect(
      rescueConfigureServiceFeaturedIntent(
        'Mark Haircut as featured',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_service_featured',
      rescueReason: 'configure_service_featured',
    });
  });

  it('enriches params from prompt', () => {
    expect(
      enrichConfigureServiceFeaturedParamsFromPrompt(
        {},
        'Set Haircut to premium tier',
      ),
    ).toMatchObject({ serviceName: 'Haircut', serviceTier: 'premium' });
  });
});
