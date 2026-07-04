import { describe, expect, it } from '@jest/globals';
import {
  isOnboardingIntent,
  isExplainOnboardingStatusPrompt,
  isSetBusinessTypePrompt,
  isRecommendCatalogPrompt,
  isApplyOnboardingCatalogPrompt,
  isApplyOnboardingSchedulePrompt,
  isSkipOnboardingSchedulePrompt,
  isApplyOnboardingPlaybookPrompt,
  isCompleteOnboardingPrompt,
  rescueOnboardingIntent,
} from './ai-onboarding.util.js';

describe('ai-onboarding.util (ai-cmd-dashboard-6.2)', () => {
  it('recognizes all 8 onboarding intents', () => {
    expect(isOnboardingIntent('explain_onboarding_status')).toBe(true);
    expect(isOnboardingIntent('set_business_type')).toBe(true);
    expect(isOnboardingIntent('recommend_catalog')).toBe(true);
    expect(isOnboardingIntent('apply_onboarding_catalog')).toBe(true);
    expect(isOnboardingIntent('apply_onboarding_schedule')).toBe(true);
    expect(isOnboardingIntent('skip_onboarding_schedule')).toBe(true);
    expect(isOnboardingIntent('apply_onboarding_playbook')).toBe(true);
    expect(isOnboardingIntent('complete_onboarding')).toBe(true);
    expect(isOnboardingIntent('cancel_bookings')).toBe(false);
  });

  it('detects each prompt style', () => {
    expect(isExplainOnboardingStatusPrompt('what step of onboarding are we on')).toBe(
      true,
    );
    expect(isSetBusinessTypePrompt('we are a spa')).toBe(true);
    expect(isRecommendCatalogPrompt('recommend a catalog for us')).toBe(true);
    expect(isApplyOnboardingCatalogPrompt('apply the recommended catalog')).toBe(
      true,
    );
    expect(isApplyOnboardingSchedulePrompt('apply the default schedule')).toBe(
      true,
    );
    expect(isSkipOnboardingSchedulePrompt('skip the schedule step')).toBe(true);
    expect(isApplyOnboardingPlaybookPrompt('apply our vertical playbook')).toBe(
      true,
    );
    expect(isCompleteOnboardingPrompt('finish onboarding')).toBe(true);
  });

  it('does not confuse apply_onboarding_schedule with the generic apply_schedule intent', () => {
    expect(isApplyOnboardingSchedulePrompt('apply the schedule template to next week')).toBe(
      false,
    );
  });

  describe('rescueOnboardingIntent', () => {
    it('returns null when already an onboarding intent', () => {
      expect(rescueOnboardingIntent('anything', 'complete_onboarding')).toBeNull();
    });

    it('rescues complete-onboarding phrasing', () => {
      expect(rescueOnboardingIntent('finish onboarding', 'unknown')).toEqual({
        action: 'complete_onboarding',
        rescueReason: 'complete',
      });
    });

    it('rescues set-business-type phrasing', () => {
      expect(rescueOnboardingIntent('we are a spa', 'unknown')).toEqual({
        action: 'set_business_type',
        rescueReason: 'business_type',
      });
    });

    it('returns null for unrelated prompts', () => {
      expect(
        rescueOnboardingIntent('cancel all bookings today', 'unknown'),
      ).toBeNull();
    });
  });
});
