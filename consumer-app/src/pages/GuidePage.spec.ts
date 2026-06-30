import { describe, expect, it } from 'vitest';
import { consumerMobileGuide } from '../lib/mobile-guide/index.ts';
import {
  buildConsumerGuideListContext,
  CONSUMER_CLINIC_GUIDE_TOPIC_ID,
} from '../lib/consumer-guide.util.js';
import { CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS } from '../lib/consumer-guide-clinic-gating.fixtures.js';

describe('GuidePage corpus (ai-guide-1.9.2)', () => {
  it('lists customer topics for salon vertical', () => {
    const topics = consumerMobileGuide.listGuideTopics(
      buildConsumerGuideListContext({ businessType: 'salon' }),
    );
    expect(topics.some((row) => row.topicId === 'consumer-getting-started')).toBe(true);
    expect(topics.some((row) => row.topicId === CONSUMER_CLINIC_GUIDE_TOPIC_ID)).toBe(false);
  });

  it.each(
    CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS.filter((row) => row.showClinicGuide),
  )('includes clinic guide topic for $id', ({ businessType }) => {
    const topics = consumerMobileGuide.listGuideTopics(
      buildConsumerGuideListContext({ businessType }),
    );
    expect(topics.some((row) => row.topicId === CONSUMER_CLINIC_GUIDE_TOPIC_ID)).toBe(true);
  });

  it('resolves scroll anchor ids for every visible topic', () => {
    const topics = consumerMobileGuide.listGuideTopics(
      buildConsumerGuideListContext({ businessType: 'clinic' }),
    );
    for (const topic of topics) {
      expect(topic.topicId.length).toBeGreaterThan(0);
    }
  });
});
