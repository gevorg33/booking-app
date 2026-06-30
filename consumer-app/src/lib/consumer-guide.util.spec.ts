import { describe, expect, it } from 'vitest';
import {
  buildConsumerGuideListContext,
  buildConsumerGuidePath,
  consumerGuideTopicElementId,
  parseConsumerGuideTopicId,
  resolveConsumerGuideNavigateHref,
  shouldShowConsumerClinicGuideTopic,
} from './consumer-guide.util.js';

describe('buildConsumerGuidePath', () => {
  it('builds salon guide route with optional topicId', () => {
    expect(buildConsumerGuidePath('glow-nails')).toBe('/s/glow-nails/guide');
    expect(buildConsumerGuidePath('glow-nails', { topicId: 'consumer-tabs' })).toBe(
      '/s/glow-nails/guide?topicId=consumer-tabs',
    );
  });
});

describe('parseConsumerGuideTopicId', () => {
  it('reads topicId from search string', () => {
    expect(parseConsumerGuideTopicId('?topicId=consumer-getting-started')).toBe(
      'consumer-getting-started',
    );
    expect(parseConsumerGuideTopicId('')).toBeNull();
  });
});

describe('buildConsumerGuideListContext', () => {
  it('maps clinic business type to clinic vertical', () => {
    expect(
      buildConsumerGuideListContext({ businessType: 'clinic', giftCardsPurchaseEnabled: false })
        .vertical,
    ).toBe('clinic');
    expect(shouldShowConsumerClinicGuideTopic('clinic')).toBe(true);
  });

  it('includes giftCards module when purchase is enabled', () => {
    expect(
      buildConsumerGuideListContext({ businessType: 'salon', giftCardsPurchaseEnabled: true })
        .enabledModules,
    ).toEqual(['giftCards']);
  });
});

describe('resolveConsumerGuideNavigateHref', () => {
  it('maps guide navigate target to guide route', () => {
    expect(
      resolveConsumerGuideNavigateHref('glow-nails', {
        path: 'guide',
        query: { topicId: 'consumer-assistant' },
      }),
    ).toBe('/s/glow-nails/guide?topicId=consumer-assistant');
  });

  it('maps home navigate target to salon home', () => {
    expect(
      resolveConsumerGuideNavigateHref('glow-nails', { path: 'home' }),
    ).toBe('/s/glow-nails/home');
  });
});

describe('consumerGuideTopicElementId', () => {
  it('prefixes topic ids for anchor scroll', () => {
    expect(consumerGuideTopicElementId('consumer-tabs')).toBe('guide-topic-consumer-tabs');
  });
});
