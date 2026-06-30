import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import {
  DASHBOARD_GUIDE_NAV_ROUTES,
  DASHBOARD_GUIDE_NO_PRIMARY_ROUTES,
  DASHBOARD_ROUTE_PRIMARY_TOPIC,
  GUIDE_CORPUS_MATCH_THRESHOLD,
  pickBestGuideCorpusTopic,
  rankGuideCorpusTopics,
} from './ai-product-guide-ranking.util.js';

describe('ai-product-guide-ranking.util (ai-guide-1.2.1)', () => {
  const messages = getFrontendGuideCorpusMessages('en');

  it('ranks route-primary topics highest for explain_current_screen', () => {
    const ranked = rankGuideCorpusTopics(
      {
        prompt: 'What can I do on this page?',
        intent: 'explain_current_screen',
        route: '/dashboard/schedule',
      },
      messages,
    );
    expect(ranked[0]?.topicId).toBe('dashboard.core.schedule');
    expect(ranked[0]?.score).toBeGreaterThanOrEqual(GUIDE_CORPUS_MATCH_THRESHOLD);
  });

  it('honors explicit topicId over route', () => {
    const best = pickBestGuideCorpusTopic(
      {
        prompt: 'help',
        intent: 'guide_user_flow',
        route: '/dashboard/schedule',
        topicId: 'dashboard.ai.approval',
      },
      messages,
    );
    expect(best?.topicId).toBe('dashboard.ai.approval');
  });

  it('matches feature prompts to AI command bar topic', () => {
    const best = pickBestGuideCorpusTopic(
      {
        prompt: 'What does the command bar do on the dashboard?',
        intent: 'explain_app_feature',
      },
      messages,
    );
    expect(best?.topicId).toBe('dashboard.ai.command-bar');
  });

  it('ai-guide-1.1.6 — every dashboard nav route has a primary corpus topic', () => {
    for (const route of DASHBOARD_GUIDE_NAV_ROUTES) {
      if (DASHBOARD_GUIDE_NO_PRIMARY_ROUTES.includes(route)) continue;
      expect(DASHBOARD_ROUTE_PRIMARY_TOPIC[route]).toBeTruthy();
    }
  });
});
