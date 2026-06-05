import { afterEach, describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import {
  AI_ROUTE_CONTEXT_HINTS,
  buildAiRequestContext,
  clearAiPageContext,
  getAiPageContext,
  getAiPageSuggestionGroups,
  getSuggestionsForRoute,
  setAiPageContext,
} from './ai-orchestration';

function tEn() {
  const messages = getMessages('en');
  return (key: string) => translate(messages, key);
}

describe('ai-orchestration sprint18 page coverage', () => {
  afterEach(() => {
    clearAiPageContext();
  });

  it('exposes onboarding route hint for classifier context', () => {
    expect(AI_ROUTE_CONTEXT_HINTS['/dashboard/onboarding']).toMatch(/setup_week_schedule/);
  });

  it('sets onboarding route hint on page context', () => {
    setAiPageContext({ route: '/dashboard/onboarding', scheduleTab: 'schedule' });
    expect(getAiPageContext().routeHint).toContain('apply_schedule');
    expect(getAiPageContext().scheduleTab).toBe('schedule');
  });

  it('buildAiRequestContext merges onboarding page context', () => {
    setAiPageContext({ route: '/dashboard/onboarding' });
    const ctx = buildAiRequestContext('/dashboard/onboarding', {}, getAiPageContext());
    expect(ctx.route).toBe('/dashboard/onboarding');
    expect(ctx.routeHint).toBeTruthy();
  });

  it('returns grouped customers and reports suggestions without translator', () => {
    const customers = getAiPageSuggestionGroups('/dashboard/customers');
    expect(customers).toHaveLength(2);
    expect(customers[0].items[0]).toMatch(/no-show/i);

    const reports = getAiPageSuggestionGroups('/dashboard/reports');
    expect(reports[0].items[0]).toMatch(/utilization/i);
  });

  it('returns localized sprint18 suggestions with translator', () => {
    const t = tEn();
    const customers = getSuggestionsForRoute('/dashboard/customers', t);
    expect(customers[0]).toBe(t('ai.prompts.findNoShowsCustomers'));

    const reports = getSuggestionsForRoute('/dashboard/reports', t);
    expect(reports[0]).toBe(t('ai.prompts.explainUtilizationDrop'));
  });
});
