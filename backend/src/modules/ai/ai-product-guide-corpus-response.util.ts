import type { GuideResponse, GuideStep } from './command-completion.types.js';
import type { GuideCorpusTopic } from './guide/ai-guide-corpus.types.js';
import { buildDashboardGuideTopicUrl } from './guide/dashboard-guide-corpus.manifest.js';
import type { ResolvedGuideCorpusTopic } from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import { enrichGuideResponseVoiceSummaries } from './ai-product-guide-voice.util.js';

function parseDashboardGuideNavigateUrl(url: string): {
  path: string;
  hash?: string;
} {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return { path: url };
  return {
    path: url.slice(0, hashIndex),
    hash: url.slice(hashIndex + 1),
  };
}

function resolveTopicNavigateTarget(
  topic: GuideCorpusTopic,
  topicId: GuideCorpusTopicId,
): GuideResponse['navigate'] {
  if (topic.navigate) {
    return { path: topic.navigate.path, hash: topic.navigate.hash };
  }
  return parseDashboardGuideNavigateUrl(buildDashboardGuideTopicUrl(topicId));
}

export function buildGuideResponseFromCorpus(
  resolved: ResolvedGuideCorpusTopic,
  topic: GuideCorpusTopic,
): GuideResponse {
  const stepTexts = resolved.content
    .filter((row) => row.kind === 'step')
    .map((row) => row.text);

  const steps: GuideStep[] = stepTexts.map((body, index) => ({
    title: `Step ${index + 1}`,
    body,
    navigate:
      index === 0 && topic.navigate
        ? { path: topic.navigate.path, hash: topic.navigate.hash }
        : undefined,
  }));

  if (steps.length === 0 && resolved.bullets.length > 0) {
    resolved.bullets.forEach((body, index) => {
      steps.push({
        title: `Tip ${index + 1}`,
        body,
      });
    });
  }

  if (steps.length === 0) {
    steps.push({
      title: resolved.title,
      body: resolved.summary ?? resolved.body ?? resolved.title,
      navigate: topic.navigate
        ? { path: topic.navigate.path, hash: topic.navigate.hash }
        : undefined,
    });
  }

  const summary =
    resolved.summary ??
    resolved.body ??
    `${resolved.title}${stepTexts.length ? ` — ${stepTexts.length} steps` : ''}`;

  return enrichGuideResponseVoiceSummaries({
    topicId: resolved.topicId,
    summary,
    steps,
    navigate: resolveTopicNavigateTarget(topic, resolved.topicId),
    sources: [
      {
        topicId: resolved.topicId,
        label: resolved.title,
        kind: 'topic',
      },
    ],
  });
}
