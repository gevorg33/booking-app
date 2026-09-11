import {
  E2E84_PRIVACY_DELETE_AFFIRMATIONS,
  E2E84_PRIVACY_DELETE_FIRST_TURN,
  E2E84_PRIVACY_DELETE_NEGATIONS,
} from './ai-e2e84-privacy-delete-confirm.fixtures.js';
import { handlePrivacyDeleteLogic } from './ai-privacy-delete.logic.js';
import {
  enrichPrivacyDeleteConfirmFromPrompt,
  isPrivacyDeleteAffirmativePrompt,
  isPrivacyDeletePendingParams,
  rescuePrivacyDeleteConfirmIntent,
} from './ai-privacy-delete.util.js';
import { commandResultToPublicAssistantResult } from './customer-ai-command.util.js';

describe('e2e-bug.84 privacy_delete requires confirmation before erasure', () => {
  const deps = () => ({
    customerPrivacyService: {
      deleteCustomerData: jest.fn(async () => undefined),
    },
  });

  it.each(E2E84_PRIVACY_DELETE_FIRST_TURN)(
    '$id: first turn previews and does not delete',
    async ({ prompt }) => {
      const d = deps();
      const result = await handlePrivacyDeleteLogic(
        d,
        'biz-1',
        { sessionCustomerId: 'c1' },
        prompt,
      );
      expect(result.success).toBe(false);
      expect(result.details?.requiresConfirmation).toBe(true);
      expect(result.details?.privacyDeletePending).toBe(true);
      expect(result.details?.sessionContext).toMatchObject({
        privacyDeletePending: true,
        pendingAction: 'privacy_delete',
      });
      expect(result.summary).toMatch(/Reply yes to confirm/i);
      expect(
        d.customerPrivacyService.deleteCustomerData,
      ).not.toHaveBeenCalled();

      // e2e-bug.257 — pending must survive public assistant shaping via sessionContext.
      const publicResult = commandResultToPublicAssistantResult(result);
      expect(publicResult.sessionContext?.privacyDeletePending).toBe('true');
      expect(publicResult.sessionContext?.pendingAction).toBe('privacy_delete');
    },
  );

  it.each(E2E84_PRIVACY_DELETE_AFFIRMATIONS)(
    '$id: affirmative after pending executes erasure',
    async ({ prompt }) => {
      const d = deps();
      const result = await handlePrivacyDeleteLogic(
        d,
        'biz-1',
        {
          sessionCustomerId: 'c1',
          privacyDeletePending: true,
          requiresConfirmation: true,
          pendingAction: 'privacy_delete',
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.deleted).toBe(true);
      expect(d.customerPrivacyService.deleteCustomerData).toHaveBeenCalledWith(
        'biz-1',
        'c1',
      );
    },
  );

  it('explicit confirm=true executes without needing delete-language prompt', async () => {
    const d = deps();
    const result = await handlePrivacyDeleteLogic(
      d,
      'biz-1',
      { sessionCustomerId: 'c1', confirm: true },
      'yes',
    );
    expect(result.success).toBe(true);
    expect(d.customerPrivacyService.deleteCustomerData).toHaveBeenCalled();
  });

  it('bare yes without pending does not erase', async () => {
    const d = deps();
    const result = await handlePrivacyDeleteLogic(
      d,
      'biz-1',
      { sessionCustomerId: 'c1' },
      'yes',
    );
    expect(result.success).toBe(false);
    expect(d.customerPrivacyService.deleteCustomerData).not.toHaveBeenCalled();
  });

  it.each(E2E84_PRIVACY_DELETE_AFFIRMATIONS)(
    '$id: confirm rescue sets confirm when pending',
    ({ prompt }) => {
      expect(isPrivacyDeleteAffirmativePrompt(prompt)).toBe(true);
      const rescued = rescuePrivacyDeleteConfirmIntent(prompt, 'unknown', {
        privacyDeletePending: true,
      });
      expect(rescued?.action).toBe('privacy_delete');
      expect(rescued?.params.confirm).toBe(true);
      expect(
        enrichPrivacyDeleteConfirmFromPrompt(prompt, {
          privacyDeletePending: true,
        }).confirm,
      ).toBe(true);
    },
  );

  it.each(E2E84_PRIVACY_DELETE_NEGATIONS)(
    '$id: negation does not confirm pending erasure',
    ({ prompt }) => {
      expect(isPrivacyDeleteAffirmativePrompt(prompt)).toBe(false);
      expect(
        rescuePrivacyDeleteConfirmIntent(prompt, 'unknown', {
          privacyDeletePending: true,
        }),
      ).toBeNull();
    },
  );

  it('e2e-bug.257 — string pending flags from sessionContext count as pending', () => {
    expect(isPrivacyDeletePendingParams({ privacyDeletePending: 'true' })).toBe(
      true,
    );
    expect(
      rescuePrivacyDeleteConfirmIntent('yes', 'unknown', {
        privacyDeletePending: 'true',
      })?.action,
    ).toBe('privacy_delete');
  });
});
