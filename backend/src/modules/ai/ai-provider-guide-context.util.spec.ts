import {
  mapProviderMobileGuideRoute,
  mergeProviderMobileGuideContext,
  readProviderMobileRouteTab,
} from './ai-provider-guide-context.util.js';
import { pickBestGuideFlowPlaybook } from './guide/guide-flow.corpus.util.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';

describe('ai-provider-guide-context.util (ai-guide-1.4.2)', () => {
  it.each([
    {
      id: 'today-tab',
      context: { mobileRoute: 'today', tab: 'today' },
      route: '/tabs/today',
      tab: 'today',
    },
    {
      id: 'calendar-tab',
      context: {
        screenContext: { route: '/tabs/calendar', tab: 'calendar', mobileRoute: 'schedule' },
      },
      route: '/tabs/calendar',
      tab: 'calendar',
    },
    {
      id: 'schedule-chip',
      context: { mobileRoute: 'schedule' },
      route: '/tabs/schedule',
      tab: 'schedule',
    },
    {
      id: 'profile-nested',
      context: {
        screenContext: { tab: 'profile' },
        mobileRoute: 'profile',
      },
      route: '/tabs/profile',
      tab: 'profile',
    },
    {
      id: 'explicit-route',
      context: { route: '/tabs/gift-cards' },
      route: '/tabs/gift-cards',
      tab: 'gift-cards',
    },
  ])('maps $id screen context to guide route', ({ context, route, tab }) => {
    expect(mapProviderMobileGuideRoute(context)).toBe(route);
    expect(readProviderMobileRouteTab(context)).toBe(tab);
  });

  it('prefers calendar tab over schedule mobileRoute chip alias', () => {
    const merged = mergeProviderMobileGuideContext({
      mobileRoute: 'schedule',
      screenContext: { tab: 'calendar', route: '/tabs/calendar' },
    });
    expect(mapProviderMobileGuideRoute(merged)).toBe('/tabs/calendar');
  });

  it('resolves route-primary playbooks per provider tab', () => {
    const messages = getFrontendGuideCorpusMessages('en');
    const tabs = [
      { route: '/tabs/today', topicId: 'provider-appointments' },
      { route: '/tabs/calendar', topicId: 'provider-calendar' },
      { route: '/tabs/schedule', topicId: 'provider-schedule-blocks' },
      { route: '/tabs/profile', topicId: 'provider-profile-settings' },
    ] as const;

    for (const row of tabs) {
      expect(resolveGuideFlowRoutePrimaryTopic(row.route)).toBe(row.topicId);
      const best = pickBestGuideFlowPlaybook(
        {
          prompt: 'What can I do on this page?',
          route: row.route,
          intent: 'explain_current_screen',
          locale: 'en',
          surface: 'provider',
        },
        messages,
      );
      expect(best?.topicId).toBe(row.topicId);
    }
  });
});
