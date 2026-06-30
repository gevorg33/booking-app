import { describe, expect, it } from 'vitest';
import { shouldShowPatientResultsTab } from './clinic-service.js';
import { consumerMobileGuide } from './mobile-guide/index.ts';
import {
  CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS,
  CONSUMER_CLINIC_GUIDE_TOPIC_ID,
} from './consumer-guide-clinic-gating.fixtures.js';
import {
  buildConsumerGuideListContext,
  isConsumerGuideTopicVisibleForBusiness,
  sanitizeConsumerGuideTopicId,
  shouldShowConsumerClinicGuideTopic,
} from './consumer-guide.util.js';

describe('consumer guide clinic gating (ai-guide-1.9.6)', () => {
  it.each(CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS)(
    'matches Results/Lab tab gate for $id',
    ({ businessType, showClinicGuide }) => {
      expect(shouldShowConsumerClinicGuideTopic(businessType)).toBe(showClinicGuide);
      expect(shouldShowPatientResultsTab(businessType)).toBe(showClinicGuide);

      const topics = consumerMobileGuide.listGuideTopics(
        buildConsumerGuideListContext({ businessType }),
      );
      expect(topics.some((row) => row.topicId === CONSUMER_CLINIC_GUIDE_TOPIC_ID)).toBe(
        showClinicGuide,
      );
    },
  );

  it.each(CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS)(
    'sanitizes hidden clinic topic deep links for $id',
    ({ businessType, showClinicGuide }) => {
      expect(
        sanitizeConsumerGuideTopicId(CONSUMER_CLINIC_GUIDE_TOPIC_ID, businessType),
      ).toBe(showClinicGuide ? CONSUMER_CLINIC_GUIDE_TOPIC_ID : null);
      expect(
        isConsumerGuideTopicVisibleForBusiness(CONSUMER_CLINIC_GUIDE_TOPIC_ID, businessType),
      ).toBe(showClinicGuide);
    },
  );

  it('keeps non-clinic topics visible for every business type', () => {
    for (const scenario of CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS) {
      expect(
        isConsumerGuideTopicVisibleForBusiness('consumer-getting-started', scenario.businessType),
      ).toBe(true);
      expect(
        sanitizeConsumerGuideTopicId('consumer-tabs', scenario.businessType),
      ).toBe('consumer-tabs');
    }
  });
});
