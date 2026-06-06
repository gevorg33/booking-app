import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  buildEnglishRecommendationAnalyticsEvalScenarios,
  MULTILINGUAL_RECOMMENDATION_ANALYTICS_EVAL_SCENARIOS,
} from './ai-recommendation-analytics-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  isExplainRecommendationAnalyticsPrompt,
  parseExplainRecommendationAnalyticsFromPrompt,
  rescueExplainRecommendationAnalyticsIntent,
} from './ai-recommendation-analytics.util.js';
import {
  isSummarizeRecommendationPerformancePrompt,
  parseSummarizeRecommendationPerformanceFromPrompt,
  rescueSummarizeRecommendationPerformanceIntent,
} from './ai-recommendation-performance.util.js';

describe('ai-recommendation-analytics-multilingual.util (ai-cmd-rec-10)', () => {
  const rescueService = new AiIntentRescueService();

  it('rescues analytics and performance intents through AiIntentRescueService', () => {
    const analyticsRescued = rescueService.rescue({
      prompt: 'Բացատրիր recommendation analytics',
      action: 'unknown',
      params: {},
    });
    expect(analyticsRescued?.action).toBe('explain_recommendation_analytics');

    const performanceRescued = rescueService.rescue({
      prompt: 'Какой CTR у checkout recommendations',
      action: 'unknown',
      params: {},
    });
    expect(performanceRescued?.action).toBe('summarize_recommendation_performance');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it.each(MULTILINGUAL_RECOMMENDATION_ANALYTICS_EVAL_SCENARIOS)(
    'rescues multilingual recommendation analytics scenario $id',
    ({ prompt, expectedAction, aspect }) => {
      if (expectedAction === 'explain_recommendation_analytics') {
        expect(isExplainRecommendationAnalyticsPrompt(prompt)).toBe(true);
        expect(parseExplainRecommendationAnalyticsFromPrompt(prompt)?.aspect).toBe(
          aspect,
        );
        expect(rescueExplainRecommendationAnalyticsIntent(prompt, 'unknown')).toEqual({
          action: 'explain_recommendation_analytics',
          rescueReason: 'explain_recommendation_analytics',
        });
        return;
      }

      expect(isSummarizeRecommendationPerformancePrompt(prompt)).toBe(true);
      expect(parseSummarizeRecommendationPerformanceFromPrompt(prompt)?.aspect).toBe(
        aspect,
      );
      expect(
        rescueSummarizeRecommendationPerformanceIntent(prompt, 'unknown'),
      ).toEqual({
        action: 'summarize_recommendation_performance',
        rescueReason: 'summarize_recommendation_performance',
      });
    },
  );

  it('maps EN analytics and performance prompts into multilingual eval set', () => {
    const english = buildEnglishRecommendationAnalyticsEvalScenarios();
    expect(english.length).toBe(24);
    expect(AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES.length).toBe(
      40,
    );
  });
});
