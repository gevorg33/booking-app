import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS,
  EXPLAIN_APP_UPDATE_REQUIRED_BOUNDARY_PROMPTS,
  EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_APP_UPDATE_REQUIRED_CLASSIFIER_RULES,
} from './ai-explain-app-update-required.fixtures.js';
import { EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS } from './ai-explain-app-update-required-multilingual.fixtures.js';
import {
  assembleAppUpdateRequiredSummary,
  buildKillSwitchLines,
  buildSkipNudgeLines,
  buildUpdateNudgeLines,
  isExplainAppUpdateRequiredIntent,
  isExplainAppUpdateRequiredPrompt,
  parseExplainAppUpdateRequiredFromPrompt,
  rescueExplainAppUpdateRequiredIntent,
  resolveConsumerAppUpdateExplainContext,
  resolveExplainAppUpdateRequiredAspect,
  shouldDismissConsumerAppUpdateNudge,
} from './ai-explain-app-update-required.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_APP_UPDATE_REQUIRED_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-app-update-required.util (ai-cmd-customer-4.13.4)', () => {
  it('exports classifier rules for explain_app_update_required', () => {
    expect(CUSTOMER_EXPLAIN_APP_UPDATE_REQUIRED_CLASSIFIER_RULES).toContain(
      'explain_app_update_required',
    );
  });

  it.each(
    EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain_app_update_required for $id', (_id, row) => {
    expect(isExplainAppUpdateRequiredPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainAppUpdateRequiredIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_app_update_required');
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_app_update_required',
    );
  });

  it.each(
    EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_app_update_required for $id', (_id, row) => {
    expect(isExplainAppUpdateRequiredPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_APP_UPDATE_REQUIRED_BOUNDARY_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isExplainAppUpdateRequiredPrompt(row.prompt)).toBe(false);
  });

  it.each(EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS)(
    'rescues explain_app_update_required for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAppUpdateRequiredIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_app_update_required');
    },
  );

  it('resolves aspects and context', () => {
    expect(
      resolveExplainAppUpdateRequiredAspect('Why must I update the app?'),
    ).toBe('why_update');
    const ctx = resolveConsumerAppUpdateExplainContext({
      appVersion: '1.0.0',
      nativePlatform: 'ios',
    });
    expect(ctx.currentVersion).toBe('1.0.0');
    expect(ctx.platform).toBe('ios');
    expect(ctx.config).not.toBeNull();
  });

  it('builds summaries for gate states', () => {
    const summary = assembleAppUpdateRequiredSummary('skip_nudge', {
      currentVersion: '1.0.0',
      platform: 'ios',
      config: null,
      blocked: false,
      blockedReason: null,
      nudgeVisible: true,
      nudgeDismissed: false,
    });
    expect(summary).toContain('Not now');
    expect(
      buildKillSwitchLines({
        currentVersion: '1.0.0',
        platform: 'ios',
        config: {
          minSupportedVersion: '1.0.0',
          latestVersion: '1.1.0',
          updateRequired: false,
          killSwitch: true,
          message: 'Paused',
          storeUrl: null,
        },
        blocked: true,
        blockedReason: 'kill_switch',
        nudgeVisible: false,
        nudgeDismissed: false,
      })[0],
    ).toContain('Kill switch');
    expect(
      buildSkipNudgeLines({
        currentVersion: '1.0.0',
        platform: 'ios',
        config: null,
        blocked: false,
        blockedReason: null,
        nudgeVisible: false,
        nudgeDismissed: true,
      }).some((line) => line.includes('dismissed')),
    ).toBe(true);
  });

  it('parses prompt and recognizes intent id', () => {
    expect(
      parseExplainAppUpdateRequiredFromPrompt('Skip this update')?.aspect,
    ).toBe('skip_nudge');
    expect(
      isExplainAppUpdateRequiredIntent('explain_app_update_required'),
    ).toBe(true);
  });

  it('returns null when action already matches', () => {
    expect(
      rescueExplainAppUpdateRequiredIntent(
        'Why must I update the app?',
        'explain_app_update_required',
      ),
    ).toBeNull();
  });

  it('detects heuristic prompts not in fixtures', () => {
    expect(
      isExplainAppUpdateRequiredPrompt('Ինչու պետք է թարմացնեմ հավելվածը'),
    ).toBe(true);
    expect(isExplainAppUpdateRequiredPrompt('Пропустить обновление')).toBe(
      true,
    );
  });

  it('covers aspect resolution heuristics', () => {
    expect(
      resolveExplainAppUpdateRequiredAspect(
        'How does the app update gate work?',
      ),
    ).toBe('how_it_works');
    expect(
      resolveExplainAppUpdateRequiredAspect(
        'Why is there a banner about a newer version?',
      ),
    ).toBe('update_nudge');
  });

  it('decides dismiss client action from context', () => {
    const ctx = {
      currentVersion: '1.0.0',
      platform: 'ios' as const,
      config: null,
      blocked: false,
      blockedReason: null,
      nudgeVisible: true,
      nudgeDismissed: false,
    };
    expect(shouldDismissConsumerAppUpdateNudge('skip_nudge', ctx)).toBe(true);
    expect(shouldDismissConsumerAppUpdateNudge('why_update', ctx)).toBe(false);
  });

  it('registers eval cases', () => {
    expect(
      AI_COMMAND_EVAL_EXPLAIN_APP_UPDATE_REQUIRED_CASES.length,
    ).toBeGreaterThan(0);
  });

  it('covers gate state branches in summaries', () => {
    const blockedCtx = {
      currentVersion: '0.9.0',
      platform: 'ios' as const,
      config: {
        minSupportedVersion: '1.0.0',
        latestVersion: '1.2.0',
        updateRequired: false,
        killSwitch: false,
        message: 'Please update',
        storeUrl: 'https://apps.apple.com/app',
      },
      blocked: true,
      blockedReason: 'update_required' as const,
      nudgeVisible: false,
      nudgeDismissed: false,
    };
    expect(
      assembleAppUpdateRequiredSummary('why_update', blockedCtx),
    ).toContain('blocked');
    expect(
      assembleAppUpdateRequiredSummary('update_required', blockedCtx),
    ).toContain('0.9.0');
    expect(
      assembleAppUpdateRequiredSummary('kill_switch', {
        ...blockedCtx,
        blockedReason: 'kill_switch',
        config: {
          ...blockedCtx.config,
          killSwitch: true,
          message: 'Paused rollout',
        },
      }),
    ).toContain('Paused rollout');
    expect(
      assembleAppUpdateRequiredSummary('update_nudge', {
        ...blockedCtx,
        blocked: false,
        blockedReason: null,
        nudgeVisible: true,
        nudgeDismissed: false,
      }),
    ).toContain('nudge');
    expect(
      assembleAppUpdateRequiredSummary('skip_nudge', {
        ...blockedCtx,
        blocked: true,
        blockedReason: 'update_required',
        nudgeVisible: false,
        nudgeDismissed: false,
      }),
    ).toContain('blocking screen');
    expect(
      assembleAppUpdateRequiredSummary('skip_nudge', {
        ...blockedCtx,
        blocked: false,
        blockedReason: null,
        nudgeVisible: false,
        nudgeDismissed: true,
      }),
    ).toContain('dismissed');
    expect(
      assembleAppUpdateRequiredSummary('how_it_works', {
        ...blockedCtx,
        blocked: false,
        blockedReason: null,
        nudgeVisible: true,
        nudgeDismissed: false,
      }),
    ).toContain('soft update nudge');
  });

  it('rejects empty prompt and provider or OS update prompts', () => {
    expect(isExplainAppUpdateRequiredPrompt('')).toBe(false);
    expect(
      isExplainAppUpdateRequiredPrompt('Why must I update the provider app?'),
    ).toBe(false);
    expect(
      isExplainAppUpdateRequiredPrompt('How do I update iOS on my phone?'),
    ).toBe(false);
    expect(isExplainAppUpdateRequiredPrompt('Why does it say offline?')).toBe(
      false,
    );
  });

  it('resolves context defaults and web platform', () => {
    const webCtx = resolveConsumerAppUpdateExplainContext({
      appVersion: '1.0.0',
      nativePlatform: 'web',
    });
    expect(webCtx.config).toBeNull();
    expect(webCtx.blocked).toBe(false);
    const iosCtx = resolveConsumerAppUpdateExplainContext({
      currentVersion: '2.0.0',
      nativePlatform: 'ios',
      nudgeDismissed: true,
    });
    expect(iosCtx.nudgeDismissed).toBe(true);
  });

  it('covers aspect resolution for kill switch and update required cues', () => {
    expect(
      resolveExplainAppUpdateRequiredAspect(
        'This app version is temporarily unavailable',
      ),
    ).toBe('kill_switch');
    expect(
      resolveExplainAppUpdateRequiredAspect(
        "Why can't I book on this app version?",
      ),
    ).toBe('update_required');
    expect(
      resolveExplainAppUpdateRequiredAspect('Dismiss the update nudge for now'),
    ).toBe('skip_nudge');
  });

  it('returns null rescue when action already matches', () => {
    expect(
      rescueExplainAppUpdateRequiredIntent(
        'Skip this update',
        'explain_app_update_required',
      ),
    ).toBeNull();
  });

  it('computes nudge visibility from mobile config env', () => {
    const prevLatest = process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION;
    const prevMin = process.env.MOBILE_CONSUMER_IOS_MIN_VERSION;
    process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION = '2.0.0';
    process.env.MOBILE_CONSUMER_IOS_MIN_VERSION = '1.0.0';
    const ctx = resolveConsumerAppUpdateExplainContext({
      appVersion: '1.0.0',
      nativePlatform: 'ios',
    });
    expect(ctx.nudgeVisible).toBe(true);
    if (prevLatest === undefined) {
      delete process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION;
    } else {
      process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION = prevLatest;
    }
    if (prevMin === undefined) {
      delete process.env.MOBILE_CONSUMER_IOS_MIN_VERSION;
    } else {
      process.env.MOBILE_CONSUMER_IOS_MIN_VERSION = prevMin;
    }
  });

  it('builds why-update copy when no block is active', () => {
    expect(
      assembleAppUpdateRequiredSummary('why_update', {
        currentVersion: '2.0.0',
        platform: 'android',
        config: {
          minSupportedVersion: '1.0.0',
          latestVersion: '2.0.0',
          updateRequired: false,
          killSwitch: false,
          message: null,
          storeUrl: null,
        },
        blocked: false,
        blockedReason: null,
        nudgeVisible: false,
        nudgeDismissed: false,
      }),
    ).toContain('meets the minimum');
    expect(
      assembleAppUpdateRequiredSummary('why_update', {
        currentVersion: '1.0.0',
        platform: 'android',
        config: {
          minSupportedVersion: '1.0.0',
          latestVersion: '2.0.0',
          updateRequired: false,
          killSwitch: false,
          message: null,
          storeUrl: null,
        },
        blocked: false,
        blockedReason: null,
        nudgeVisible: true,
        nudgeDismissed: false,
      }),
    ).toContain('newer supported build');
    expect(
      buildUpdateNudgeLines({
        currentVersion: '1.0.0',
        platform: 'ios',
        config: null,
        blocked: true,
        blockedReason: 'kill_switch',
        nudgeVisible: false,
        nudgeDismissed: false,
      })[2],
    ).toContain('hard gate');
  });

  it('handles invalid semver and android platform resolution', () => {
    const ctx = resolveConsumerAppUpdateExplainContext({
      version: 'not-a-version',
      nativePlatform: 'android',
    });
    expect(ctx.currentVersion).toBe('not-a-version');
    expect(ctx.platform).toBe('android');
    expect(
      resolveExplainAppUpdateRequiredAspect('Why must I update the app?'),
    ).toBe('why_update');
  });
});
