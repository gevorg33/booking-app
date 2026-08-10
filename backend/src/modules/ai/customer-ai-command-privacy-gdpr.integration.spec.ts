import { validateCommand } from './command-completion.validator.js';
import {
  PRIVACY_EXPORT_PROMPTS,
  PRIVACY_DELETE_PROMPTS,
} from './ai-privacy-gdpr-customer.util.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from './ai-privacy-gdpr-multilingual.fixtures.js';
import { rescuePrivacyGdprCustomerIntent } from './ai-privacy-gdpr-customer.util.js';
import { handlePrivacyExportLogic } from './ai-privacy-export.logic.js';
import { handlePrivacyDeleteLogic } from './ai-privacy-delete.logic.js';

describe('customer-ai-command privacy GDPR integration (ai-cmd-customer-4.17.5)', () => {
  const privacyDeps = () => ({
    customerPrivacyService: {
      exportCustomerData: jest.fn(async () => ({ bookings: [] })),
      deleteCustomerData: jest.fn(async () => undefined),
    },
  });

  it.each(
    [...PRIVACY_EXPORT_PROMPTS, ...PRIVACY_DELETE_PROMPTS].map((row) => [
      row.id,
      row,
    ]),
  )('rescues privacy GDPR prompt $id', (_id, row) => {
    expect(rescuePrivacyGdprCustomerIntent(row.prompt, 'unknown')?.action).toBe(
      row.expectedAction,
    );
  });

  it.each(
    PRIVACY_GDPR_MULTILINGUAL_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues privacy GDPR i18n prompt $0', (_id, row) => {
    expect(rescuePrivacyGdprCustomerIntent(row.prompt, 'unknown')?.action).toBe(
      row.expectedAction,
    );
  });

  it.each(PRIVACY_EXPORT_PROMPTS.map((row) => [row.id, row] as const))(
    'validates and handles privacy_export $0',
    async (_id, row) => {
      expect(
        validateCommand({
          action: 'privacy_export',
          params: {},
          enrichedParams: {},
          entities: {},
          reasoning: 'test',
          confidence: 0.9,
          prompt: row.prompt,
        }).issues,
      ).toEqual([]);

      const result = await handlePrivacyExportLogic(
        privacyDeps(),
        'biz-1',
        { sessionCustomerId: 'c1' },
        row.prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.navigate).toMatchObject({
        path: 'account',
        query: { section: 'privacy', privacyAction: 'export' },
      });
    },
  );

  it.each(PRIVACY_DELETE_PROMPTS.map((row) => [row.id, row] as const))(
    'validates and previews privacy_delete without confirm $0',
    async (_id, row) => {
      expect(
        validateCommand({
          action: 'privacy_delete',
          params: {},
          enrichedParams: {},
          entities: {},
          reasoning: 'test',
          confidence: 0.9,
          prompt: row.prompt,
        }).issues,
      ).toEqual([]);

      const d = privacyDeps();
      const preview = await handlePrivacyDeleteLogic(
        d,
        'biz-1',
        { sessionCustomerId: 'c1' },
        row.prompt,
      );
      expect(preview.success).toBe(false);
      expect(preview.details?.requiresConfirmation).toBe(true);
      expect(
        d.customerPrivacyService.deleteCustomerData,
      ).not.toHaveBeenCalled();

      const confirmed = await handlePrivacyDeleteLogic(
        privacyDeps(),
        'biz-1',
        { sessionCustomerId: 'c1', confirm: true },
        row.prompt,
      );
      expect(confirmed.success).toBe(true);
      expect(confirmed.details?.navigate).toMatchObject({
        path: 'account',
        query: { section: 'privacy', privacyAction: 'delete' },
      });
    },
  );
});
