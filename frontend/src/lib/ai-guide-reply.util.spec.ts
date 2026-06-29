import { describe, expect, it } from 'vitest';
import type { AiGuideResponse } from '@/lib/ai-client.types';
import {
  buildGuideHandoffRequest,
  buildGuideStepNavigateUrl,
  extractGuideNavigate,
  extractStepNavigate,
  formatGuideAssistantText,
  hasInteractiveGuideSteps,
  resolveActiveGuideStepNavigate,
  resolveGuideHandoffPrompt,
  resolveGuideNavigateUrl,
} from './ai-guide-reply.util';

const sampleGuide: AiGuideResponse = {
  summary: 'Set up your weekly schedule.',
  topicId: 'dashboard.core.schedule',
  navigate: { path: '/dashboard/schedule' },
  steps: [
    {
      title: 'Open Schedule',
      body: 'Go to Schedule in the sidebar.',
      navigate: { path: '/dashboard/schedule' },
    },
    { title: 'Apply template', body: 'Pick a weekday template and apply it.' },
  ],
};

describe('ai-guide-reply.util', () => {
  it('detects interactive guide payloads', () => {
    expect(hasInteractiveGuideSteps(sampleGuide)).toBe(true);
    expect(hasInteractiveGuideSteps({ summary: 'x', steps: [] })).toBe(false);
  });

  it('formats numbered guide steps after the summary', () => {
    const text = formatGuideAssistantText(sampleGuide);
    expect(text).toContain('Set up your weekly schedule.');
    expect(text).toContain('1. Open Schedule');
    expect(text).toContain('2. Apply template');
  });

  it('falls back to summary when guide steps are absent', () => {
    expect(formatGuideAssistantText(undefined, 'Plain summary')).toBe('Plain summary');
  });

  it('extracts navigate target from guide payload', () => {
    expect(extractGuideNavigate(sampleGuide)).toEqual({
      path: '/dashboard/schedule',
    });
    expect(resolveGuideNavigateUrl(sampleGuide)).toBe('/dashboard/schedule');
  });

  it('prefers step navigate over guide navigate on early steps', () => {
    expect(extractStepNavigate(sampleGuide.steps[0])).toEqual({
      path: '/dashboard/schedule',
    });
    expect(resolveActiveGuideStepNavigate(sampleGuide, 0)).toEqual({
      path: '/dashboard/schedule',
    });
    expect(buildGuideStepNavigateUrl(sampleGuide, 0)).toBe('/dashboard/schedule');
  });

  it('falls back to guide navigate on the final step', () => {
    expect(resolveActiveGuideStepNavigate(sampleGuide, 1)).toEqual({
      path: '/dashboard/schedule',
    });
    expect(buildGuideStepNavigateUrl(sampleGuide, 1)).toBe('/dashboard/schedule');
  });

  it('resolves handoff execution prompts from relatedActions', () => {
    expect(
      resolveGuideHandoffPrompt({
        action: 'configure_service_online_payment',
        label: 'Configure online payment',
        prompt: 'Configure deposit prepayment for Massage',
      }),
    ).toBe('Configure deposit prepayment for Massage');
  });

  it('builds direct handoff API payload from relatedActions', () => {
    expect(
      buildGuideHandoffRequest({
        action: 'apply_schedule',
        label: 'Apply a schedule template',
        params: { allProviders: true },
        prompt: 'Apply the weekday schedule template',
      }),
    ).toEqual({
      action: 'apply_schedule',
      params: {
        allProviders: true,
        prompt: 'Apply the weekday schedule template',
      },
      source: 'product_guide',
    });
  });
});
