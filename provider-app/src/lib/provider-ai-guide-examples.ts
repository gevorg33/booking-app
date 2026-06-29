import {
  buildProviderAiExamples,
  type ProviderAiTranslateFn,
} from './provider-ai-examples';

export function buildProviderAiGuideExamples(t: ProviderAiTranslateFn): string[] {
  return [
    t('provider.exampleGuideToday'),
    t('provider.exampleGuideMarkPaid'),
    t('provider.exampleGuideBlockTime'),
    t('provider.exampleExplainPushSetup'),
  ];
}

export function resolveProviderAiExamples(
  t: ProviderAiTranslateFn,
  guideMode: boolean,
): string[] {
  return guideMode ? buildProviderAiGuideExamples(t) : buildProviderAiExamples(t);
}
