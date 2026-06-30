import {
  fireMobileGuideAssistantSeed,
  formatGuideTopicAskPrompt,
} from '@mobile-guide/mobile-guide-topic-ask.util.ts';

export function buildProviderGuideTopicAskPrompt(
  topicTitle: string,
  walkThroughTemplate: string,
): string {
  return formatGuideTopicAskPrompt(topicTitle, walkThroughTemplate);
}

export function fireProviderGuideAssistantSeed(input: {
  topicId: string;
  topicTitle: string;
  walkThroughTemplate: string;
}): void {
  fireMobileGuideAssistantSeed({
    topicId: input.topicId,
    prompt: buildProviderGuideTopicAskPrompt(
      input.topicTitle,
      input.walkThroughTemplate,
    ),
  });
}
