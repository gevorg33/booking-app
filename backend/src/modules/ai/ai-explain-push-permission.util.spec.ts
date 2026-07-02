import {
  EXPLAIN_PUSH_PERMISSION_PROMPTS,
  EXPLAIN_PUSH_PERMISSION_BOUNDARY_PROMPTS,
  EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_PUSH_PERMISSION_CLASSIFIER_RULES,
} from './ai-explain-push-permission.fixtures.js';
import { EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS } from './ai-explain-push-permission-multilingual.fixtures.js';
import {
  assemblePushPermissionSummary,
  buildMissingNotificationLines,
  isExplainPushPermissionIntent,
  isExplainPushPermissionPrompt,
  normalizePushPermissionState,
  parseExplainPushPermissionFromPrompt,
  rescueExplainPushPermissionIntent,
  resolveExplainPushPermissionAspect,
  resolvePushPermissionExplainContext,
  shouldOpenConsumerNotificationSettings,
} from './ai-explain-push-permission.util.js';
import { isExplainMyNotificationsPrompt } from './ai-explain-my-notifications.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_PUSH_PERMISSION_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-push-permission.util (ai-cmd-customer-4.13.2)', () => {
  it('exports classifier rules for explain_push_permission', () => {
    expect(CUSTOMER_EXPLAIN_PUSH_PERMISSION_CLASSIFIER_RULES).toContain(
      'explain_push_permission',
    );
  });

  it.each(EXPLAIN_PUSH_PERMISSION_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain_push_permission for $id',
    (_id, row) => {
      expect(isExplainPushPermissionPrompt(row.prompt)).toBe(true);
      expect(
        rescueExplainPushPermissionIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_push_permission');
      expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_push_permission',
      );
    },
  );

  it.each(
    EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_push_permission for $id', (_id, row) => {
    expect(isExplainPushPermissionPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_PUSH_PERMISSION_BOUNDARY_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isExplainPushPermissionPrompt(row.prompt)).toBe(false);
  });

  it.each(EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS)(
    'rescues explain_push_permission for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainPushPermissionIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_push_permission');
    },
  );

  it('does not steal explain_my_notifications salon policy prompts', () => {
    expect(
      isExplainMyNotificationsPrompt('Will you email me a reminder?'),
    ).toBe(true);
    expect(isExplainPushPermissionPrompt('Will you email me a reminder?')).toBe(
      false,
    );
  });

  it('resolves aspects from heuristics', () => {
    expect(
      resolveExplainPushPermissionAspect('Open notification settings'),
    ).toBe('open_settings');
    expect(
      resolveExplainPushPermissionAspect(
        'Why is Android asking for notification permission?',
      ),
    ).toBe('android_permission');
  });

  it('builds summaries for denied and provisional states', () => {
    const denied = assemblePushPermissionSummary('denied_reask', {
      permissionState: 'denied',
      platform: 'ios',
      pushRegistered: false,
      pushRemindersEnabled: true,
    });
    expect(denied).toContain('denied');
    const provisional = assemblePushPermissionSummary('provisional', {
      permissionState: 'provisional',
      platform: 'ios',
      pushRegistered: true,
      pushRemindersEnabled: true,
    });
    expect(provisional).toContain('provisional');
  });

  it('covers missing notification branches', () => {
    const lines = buildMissingNotificationLines({
      permissionState: 'prompt',
      platform: 'android',
      pushRegistered: false,
      pushRemindersEnabled: false,
    });
    expect(lines.length).toBeGreaterThan(2);
  });

  it('normalizes permission state', () => {
    expect(normalizePushPermissionState('full')).toBe('full');
    expect(normalizePushPermissionState('bogus')).toBe('unknown');
  });

  it('resolves context from params', () => {
    const ctx = resolvePushPermissionExplainContext(
      {
        pushPermissionState: 'denied',
        platform: 'android',
        pushReminders: false,
      },
      false,
    );
    expect(ctx.permissionState).toBe('denied');
    expect(ctx.pushRemindersEnabled).toBe(false);
  });

  it('opens settings for open_settings aspect', () => {
    expect(shouldOpenConsumerNotificationSettings('open_settings')).toBe(true);
    expect(shouldOpenConsumerNotificationSettings('missing_notification')).toBe(
      false,
    );
  });

  it('parses prompt aspects', () => {
    expect(
      parseExplainPushPermissionFromPrompt("Why didn't I get a notification?")
        ?.aspect,
    ).toBe('missing_notification');
  });

  it('recognizes intent id', () => {
    expect(isExplainPushPermissionIntent('explain_push_permission')).toBe(true);
  });

  it('returns null when action already matches', () => {
    expect(
      rescueExplainPushPermissionIntent(
        "Why didn't I get a notification?",
        'explain_push_permission',
      ),
    ).toBeNull();
  });

  it('maps eval golden cases', () => {
    expect(
      AI_COMMAND_EVAL_EXPLAIN_PUSH_PERMISSION_CASES.length,
    ).toBeGreaterThan(0);
  });

  it('covers how_it_works and android aspect summaries', () => {
    const how = assemblePushPermissionSummary('how_it_works', {
      permissionState: 'full',
      platform: 'android',
      pushRegistered: true,
      pushRemindersEnabled: true,
    });
    expect(how).toContain('Firebase');
    const android = assemblePushPermissionSummary('android_permission', {
      permissionState: 'prompt',
      platform: 'android',
      pushRegistered: null,
      pushRemindersEnabled: null,
    });
    expect(android).toContain('POST_NOTIFICATIONS');
  });

  it('covers unreachable permission branch in missing notification', () => {
    const lines = buildMissingNotificationLines({
      permissionState: 'unknown',
      platform: 'web',
      pushRegistered: true,
      pushRemindersEnabled: true,
    });
    expect(lines.length).toBeGreaterThan(0);
  });

  it('detects Armenian heuristic prompt not in fixtures', () => {
    expect(
      isExplainPushPermissionPrompt('Ինչու push-ը չի աշխատում հեռախոսում'),
    ).toBe(true);
  });

  it('detects Cyrillic heuristic prompt not in fixtures', () => {
    expect(
      isExplainPushPermissionPrompt('Уведомления заблокированы на телефоне'),
    ).toBe(true);
  });

  it('rejects empty prompt', () => {
    expect(isExplainPushPermissionPrompt('')).toBe(false);
  });
});
