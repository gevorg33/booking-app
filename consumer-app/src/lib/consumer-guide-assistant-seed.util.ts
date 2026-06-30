import {
  fireMobileGuideAssistantSeed,
  formatGuideTopicAskPrompt,
} from '@mobile-guide/mobile-guide-topic-ask.util.ts';

export function buildConsumerGuideTopicAskPrompt(
  topicTitle: string,
  walkThroughTemplate: string,
): string {
  return formatGuideTopicAskPrompt(topicTitle, walkThroughTemplate);
}

export function fireConsumerGuideAssistantSeed(input: {
  topicId: string;
  topicTitle: string;
  walkThroughTemplate: string;
}): void {
  fireMobileGuideAssistantSeed({
    topicId: input.topicId,
    prompt: buildConsumerGuideTopicAskPrompt(
      input.topicTitle,
      input.walkThroughTemplate,
    ),
  });
}
