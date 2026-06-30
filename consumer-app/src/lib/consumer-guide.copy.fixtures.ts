import { MOBILE_GUIDE_BUNDLE } from './mobile-guide/mobile-guide.bundle.ts';
import { buildConsumerGuideCopyScenarios } from './consumer-guide.copy.util.js';

/** Synced with bundled customer playbooks — ai-guide-1.9.4. */
export const CONSUMER_GUIDE_COPY_SCENARIOS = buildConsumerGuideCopyScenarios(
  MOBILE_GUIDE_BUNDLE,
);

export const CONSUMER_GUIDE_UI_COPY_KEYS = [
  'guidePageTitle',
  'guidePageSubtitle',
  'guidePageTopicsLabel',
  'guidePageBack',
  'guidePageOpenInApp',
  'guidePageAskSection',
  'guideWalkThroughTopic',
  'guidePageLoadError',
  'guidePageAccountEntryHint',
  'guidePageWelcomeLink',
  'assistantOpenGuideChip',
] as const;
