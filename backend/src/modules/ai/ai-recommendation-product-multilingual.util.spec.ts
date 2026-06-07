import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { MULTILINGUAL_RECOMMENDATION_PRODUCT_EVAL_SCENARIOS } from './ai-recommendation-product-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
  rescueConfigureRecommendationProductIntent,
  rescueExplainRecommendationSetupIntent,
  rescueLinkRecommendedProductsIntent,
} from './ai-recommendation-product.util.js';

describe('ai-recommendation-product-multilingual.util (ai-cmd-rec-4)', () => {
  const rescueService = new AiIntentRescueService();

  it('rescues recommendation product intents through AiIntentRescueService', () => {
    const configureRescued = rescueService.rescue({
      prompt: 'Ավելացրու շամպուն ապրանք checkout-ից հետո նկարի և հղման հետ',
      action: 'unknown',
      params: {},
    });
    expect(configureRescued?.action).toBe('configure_recommendation_product');

    const linkRescued = rescueService.rescue({
      prompt: 'Рекомендовать шампунь и кондиционер после стрижки',
      action: 'unknown',
      params: {},
    });
    expect(linkRescued?.action).toBe('link_recommended_products');

    const explainRescued = rescueService.rescue({
      prompt: 'Объясни настройку рекомендаций',
      action: 'unknown',
      params: {},
    });
    expect(explainRescued?.action).toBe('explain_recommendation_setup');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it.each(MULTILINGUAL_RECOMMENDATION_PRODUCT_EVAL_SCENARIOS)(
    'rescues multilingual recommendation product scenario $id',
    ({ prompt, expectedAction, paramsPartial }) => {
      if (expectedAction === 'configure_recommendation_product') {
        expect(
          rescueConfigureRecommendationProductIntent(prompt, 'unknown'),
        ).toEqual({
          action: 'configure_recommendation_product',
          rescueReason: 'configure_recommendation_product',
        });
        expect(
          parseConfigureRecommendationProductFromPrompt(
            prompt,
            paramsPartial ?? {},
          ),
        ).not.toBeNull();
        return;
      }

      if (expectedAction === 'link_recommended_products') {
        expect(rescueLinkRecommendedProductsIntent(prompt, 'unknown')).toEqual({
          action: 'link_recommended_products',
          rescueReason: 'link_recommended_products',
        });
        expect(
          parseLinkRecommendedProductsFromPrompt(prompt, paramsPartial ?? {}),
        ).not.toBeNull();
        return;
      }

      expect(rescueExplainRecommendationSetupIntent(prompt, 'unknown')).toEqual(
        {
          action: 'explain_recommendation_setup',
          rescueReason: 'explain_recommendation_setup',
        },
      );
      expect(
        parseExplainRecommendationSetupFromPrompt(prompt, paramsPartial ?? {}),
      ).not.toBeNull();
    },
  );
});
