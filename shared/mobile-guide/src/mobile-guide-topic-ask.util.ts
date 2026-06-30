/** ai-guide-1.9.15 — bridge static guide sections to mobile assistants. */

export const MOBILE_GUIDE_ASSISTANT_SEED_EVENT = 'mobile-guide:assistant-seed';

export interface MobileGuideAssistantSeedDetail {
  topicId: string;
  prompt: string;
}

export function formatGuideTopicAskPrompt(
  topicTitle: string,
  walkThroughTemplate: string,
): string {
  const title = topicTitle.trim();
  const template = walkThroughTemplate.trim();
  if (!title) return template;
  if (!template) return title;
  if (template.includes('{topic}')) {
    return template.replace(/\{topic\}/g, title);
  }
  return `${template} ${title}`.trim();
}

export function fireMobileGuideAssistantSeed(
  detail: MobileGuideAssistantSeedDetail,
): void {
  if (typeof window === 'undefined') return;
  const topicId = detail.topicId?.trim();
  const prompt = detail.prompt?.trim();
  if (!topicId || !prompt) return;
  window.dispatchEvent(
    new CustomEvent<MobileGuideAssistantSeedDetail>(MOBILE_GUIDE_ASSISTANT_SEED_EVENT, {
      detail: { topicId, prompt },
    }),
  );
}
