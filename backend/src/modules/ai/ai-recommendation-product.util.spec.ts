import {
  CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS,
  EXPLAIN_RECOMMENDATION_SETUP_PROMPTS,
  LINK_RECOMMENDED_PRODUCTS_PROMPTS,
} from './ai-recommendation-product.fixtures.js';
import {
  isCreateProductPrompt,
  isLinkProductToServicePrompt,
  isSuggestRetailUpsellPrompt,
} from './ai-retail-finance.util.js';
import {
  isConfigureRecommendationProductPrompt,
  isExplainRecommendationSetupPrompt,
  isLinkRecommendedProductsPrompt,
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
  rescueConfigureRecommendationProductIntent,
  rescueExplainRecommendationSetupIntent,
  rescueLinkRecommendedProductsIntent,
} from './ai-recommendation-product.util.js';

describe('ai-recommendation-product.util (ai-cmd-rec-1)', () => {
  it.each(CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS)(
    'detects configure recommendation product prompt $id',
    ({ prompt }) => {
      expect(isConfigureRecommendationProductPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS)(
    'parses configure recommendation product prompt $id',
    ({
      prompt,
      productName,
      imageUrl,
      externalLink,
      description,
      retailPrice,
      wantsImage,
      wantsLink,
      isUpdate,
    }) => {
      const parsed = parseConfigureRecommendationProductFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (productName) {
        expect(parsed?.productName?.toLowerCase()).toContain(
          productName.toLowerCase(),
        );
      }
      if (imageUrl) expect(parsed?.imageUrl).toBe(imageUrl);
      if (externalLink) expect(parsed?.externalLink).toBe(externalLink);
      if (description) expect(parsed?.description).toBe(description);
      if (retailPrice !== undefined)
        expect(parsed?.retailPrice).toBe(retailPrice);
      if (wantsImage) expect(parsed?.wantsImage).toBe(true);
      if (wantsLink) expect(parsed?.wantsLink).toBe(true);
      if (isUpdate) expect(parsed?.isUpdate).toBe(true);
    },
  );

  it('rescues unknown action to configure_recommendation_product', () => {
    expect(
      rescueConfigureRecommendationProductIntent(
        'Add a shampoo product for post-checkout with image and link',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
    });
  });

  it('does not rescue when action is already configure_recommendation_product', () => {
    expect(
      rescueConfigureRecommendationProductIntent(
        'Add a shampoo product for post-checkout with image and link',
        'configure_recommendation_product',
      ),
    ).toBeNull();
  });

  it('does not steal generic create_product prompts', () => {
    const prompt = 'Create product Shampoo sku SH-01 retail 18';
    expect(isConfigureRecommendationProductPrompt(prompt)).toBe(false);
    expect(isCreateProductPrompt(prompt)).toBe(true);
    expect(
      rescueConfigureRecommendationProductIntent(prompt, 'unknown'),
    ).toBeNull();
  });

  it('cross-excludes post-checkout product prompts from create_product', () => {
    const prompt =
      'Add a shampoo product for post-checkout with image and link';
    expect(isConfigureRecommendationProductPrompt(prompt)).toBe(true);
    expect(isCreateProductPrompt(prompt)).toBe(false);
  });

  it('does not steal link_product_to_service prompts', () => {
    const prompt = 'Link shampoo to haircut service';
    expect(isConfigureRecommendationProductPrompt(prompt)).toBe(false);
    expect(
      rescueConfigureRecommendationProductIntent(prompt, 'unknown'),
    ).toBeNull();
  });
});

describe('ai-recommendation-product link util (ai-cmd-rec-2)', () => {
  it.each(LINK_RECOMMENDED_PRODUCTS_PROMPTS)(
    'detects link recommended products prompt $id',
    ({ prompt }) => {
      expect(isLinkRecommendedProductsPrompt(prompt)).toBe(true);
    },
  );

  it.each(LINK_RECOMMENDED_PRODUCTS_PROMPTS)(
    'parses link recommended products prompt $id',
    ({ prompt, productNames, serviceName, categoryName }) => {
      const parsed = parseLinkRecommendedProductsFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.productNames.map((name) => name.toLowerCase())).toEqual(
        productNames.map((name) => name.toLowerCase()),
      );
      if (serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          serviceName.toLowerCase(),
        );
      }
      if (categoryName) {
        expect(parsed?.categoryName?.toLowerCase()).toContain(
          categoryName.toLowerCase(),
        );
      }
    },
  );

  it('rescues unknown action to link_recommended_products', () => {
    expect(
      rescueLinkRecommendedProductsIntent(
        'Recommend shampoo and conditioner after haircut service',
        'unknown',
      ),
    ).toEqual({
      action: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
    });
  });

  it('cross-excludes retail POS link and upsell prompts', () => {
    expect(
      isLinkProductToServicePrompt('Link shampoo to haircut service'),
    ).toBe(true);
    expect(
      isLinkRecommendedProductsPrompt('Link shampoo to haircut service'),
    ).toBe(false);
    expect(
      isSuggestRetailUpsellPrompt(
        'Recommend shampoo and conditioner after haircut service',
      ),
    ).toBe(false);
    expect(
      isLinkRecommendedProductsPrompt(
        'Link recommended products Shampoo and Conditioner to Haircut service',
      ),
    ).toBe(true);
    expect(
      isLinkProductToServicePrompt(
        'Link recommended products Shampoo and Conditioner to Haircut service',
      ),
    ).toBe(false);
  });
});

describe('ai-recommendation-product explain util (ai-cmd-rec-3)', () => {
  it.each(EXPLAIN_RECOMMENDATION_SETUP_PROMPTS)(
    'detects explain recommendation setup prompt $id',
    ({ prompt }) => {
      expect(isExplainRecommendationSetupPrompt(prompt)).toBe(true);
      expect(isLinkRecommendedProductsPrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_RECOMMENDATION_SETUP_PROMPTS)(
    'parses explain recommendation setup prompt $id',
    ({ prompt, serviceName, categoryName }) => {
      const parsed = parseExplainRecommendationSetupFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          serviceName.toLowerCase(),
        );
      }
      if (categoryName) {
        expect(parsed?.categoryName?.toLowerCase()).toContain(
          categoryName.toLowerCase(),
        );
      }
    },
  );

  it('rescues unknown action to explain_recommendation_setup', () => {
    expect(
      rescueExplainRecommendationSetupIntent(
        'Explain recommendation setup',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
    });
  });

  it('does not steal link mutate prompts', () => {
    const prompt = 'Recommend shampoo and conditioner after haircut service';
    expect(isExplainRecommendationSetupPrompt(prompt)).toBe(false);
    expect(isLinkRecommendedProductsPrompt(prompt)).toBe(true);
    expect(
      rescueExplainRecommendationSetupIntent(prompt, 'unknown'),
    ).toBeNull();
  });
});
