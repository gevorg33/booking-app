import {
  EXPLAIN_OFFLINE_MODE_PROMPTS,
  EXPLAIN_OFFLINE_MODE_BOUNDARY_PROMPTS,
  EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES,
} from './ai-explain-offline-mode.fixtures.js';
import { EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS } from './ai-explain-offline-mode-multilingual.fixtures.js';
import {
  assembleOfflineModeSummary,
  buildQueuedChangesLines,
  buildWhyOfflineLines,
  isExplainOfflineModeIntent,
  isExplainOfflineModePrompt,
  parseExplainOfflineModeFromPrompt,
  rescueExplainOfflineModeIntent,
  resolveConsumerOfflineExplainContext,
  resolveExplainOfflineModeAspect,
} from './ai-explain-offline-mode.util.js';
import { isOfflineQueueStatusPrompt } from './ai-push-notifications.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_OFFLINE_MODE_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-offline-mode.util (ai-cmd-customer-4.13.3)', () => {
  it('exports classifier rules for explain_offline_mode', () => {
    expect(CUSTOMER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES).toContain(
      'explain_offline_mode',
    );
  });

  it.each(EXPLAIN_OFFLINE_MODE_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain_offline_mode for $id',
    (_id, row) => {
      expect(isExplainOfflineModePrompt(row.prompt)).toBe(true);
      expect(
        rescueExplainOfflineModeIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_offline_mode');
      expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_offline_mode',
      );
    },
  );

  it.each(
    EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_offline_mode for $id', (_id, row) => {
    expect(isExplainOfflineModePrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_OFFLINE_MODE_BOUNDARY_PROMPTS.map((row) => [row.id, row] as const),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isExplainOfflineModePrompt(row.prompt)).toBe(false);
  });

  it.each(EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS)(
    'rescues explain_offline_mode for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainOfflineModeIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_offline_mode');
    },
  );

  it('does not steal provider offline queue status prompts', () => {
    expect(isOfflineQueueStatusPrompt('Show offline queue status')).toBe(true);
    expect(isExplainOfflineModePrompt('Show offline queue status')).toBe(false);
  });

  it('resolves aspects and context', () => {
    expect(resolveExplainOfflineModeAspect('Why does it say offline?')).toBe(
      'why_offline',
    );
    const ctx = resolveConsumerOfflineExplainContext({
      online: false,
      offlineQueueCount: 2,
    });
    expect(ctx.queuedCount).toBe(2);
    expect(ctx.online).toBe(false);
  });

  it('builds summaries for offline states', () => {
    const summary = assembleOfflineModeSummary('will_sync', {
      online: false,
      queuedCount: 1,
      fromCache: false,
    });
    expect(summary).toContain('sync');
    expect(
      buildWhyOfflineLines({ online: false, queuedCount: 0, fromCache: true })
        .length,
    ).toBeGreaterThan(2);
    expect(
      buildQueuedChangesLines({
        online: true,
        queuedCount: 3,
        fromCache: false,
      })[0],
    ).toContain('3');
  });

  it('parses prompt and recognizes intent id', () => {
    expect(
      parseExplainOfflineModeFromPrompt('Will my booking sync?')?.aspect,
    ).toBe('will_sync');
    expect(isExplainOfflineModeIntent('explain_offline_mode')).toBe(true);
  });

  it('returns null when action already matches', () => {
    expect(
      rescueExplainOfflineModeIntent(
        'Why does it say offline?',
        'explain_offline_mode',
      ),
    ).toBeNull();
  });

  it('detects heuristic prompts not in fixtures', () => {
    expect(isExplainOfflineModePrompt('Ինչու offline է ցուցադրվում')).toBe(
      true,
    );
    expect(
      isExplainOfflineModePrompt('Почему изменения ждут синхронизации'),
    ).toBe(true);
  });

  it('covers aspect resolution heuristics', () => {
    expect(resolveExplainOfflineModeAspect('How does offline mode work?')).toBe(
      'how_it_works',
    );
    expect(
      resolveExplainOfflineModeAspect('Why am I seeing saved salon info?'),
    ).toBe('cached_browse');
    expect(
      resolveExplainOfflineModeAspect('How many changes are waiting to sync?'),
    ).toBe('queued_changes');
  });

  it('covers online and empty queue branches', () => {
    const willSyncOnline = assembleOfflineModeSummary('will_sync', {
      online: true,
      queuedCount: 0,
      fromCache: false,
    });
    expect(willSyncOnline).toContain('online');
    const queuedEmpty = assembleOfflineModeSummary('queued_changes', {
      online: false,
      queuedCount: 0,
      fromCache: false,
    });
    expect(queuedEmpty).toContain('No booking changes');
    const cached = assembleOfflineModeSummary('cached_browse', {
      online: true,
      queuedCount: 0,
      fromCache: true,
    });
    expect(cached).toContain('cached');
    const how = assembleOfflineModeSummary('how_it_works', {
      online: false,
      queuedCount: 2,
      fromCache: false,
    });
    expect(how).toContain('2 queued');
  });

  it('rejects empty prompt and provider offline queue', () => {
    expect(isExplainOfflineModePrompt('')).toBe(false);
    expect(isExplainOfflineModePrompt('Retry offline queued actions')).toBe(
      false,
    );
  });

  it('resolves context defaults', () => {
    const ctx = resolveConsumerOfflineExplainContext({});
    expect(ctx.online).toBe(true);
    expect(ctx.queuedCount).toBe(0);
    expect(ctx.fromCache).toBe(false);
  });
});
