import {
  LIST_WAITLIST_ENTRIES_PROMPTS,
  OFFER_WAITLIST_SLOT_PROMPTS,
  WAITLIST_DASHBOARD_PROMPT_FIXTURES,
  WAITLIST_DASHBOARD_RESCUE_SCENARIOS,
} from './ai-waitlist-dashboard.fixtures.js';
import { WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS } from './ai-waitlist-dashboard-multilingual.fixtures.js';
import {
  enrichOfferWaitlistSlotParams,
  enrichWaitlistDashboardRescueParams,
  extractWaitlistOfferDate,
  extractWaitlistOfferEmployeeName,
  isListWaitlistEntriesPrompt,
  isOfferWaitlistSlotPrompt,
  isWaitlistDashboardIntent,
  rescueWaitlistDashboardIntent,
} from './ai-waitlist-dashboard.util.js';

describe('ai-waitlist-dashboard.util (ai-cmd-ext-2.11–2.12)', () => {
  it.each(WAITLIST_DASHBOARD_PROMPT_FIXTURES)(
    'rescueWaitlistDashboardIntent $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueWaitlistDashboardIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS)(
    'rescueWaitlistDashboardIntent multilingual $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueWaitlistDashboardIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(WAITLIST_DASHBOARD_RESCUE_SCENARIOS)(
    'rescues misclassified waitlist prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueWaitlistDashboardIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(LIST_WAITLIST_ENTRIES_PROMPTS)(
    'isListWaitlistEntriesPrompt $id',
    ({ prompt }) => {
      expect(isListWaitlistEntriesPrompt(prompt)).toBe(true);
      expect(isOfferWaitlistSlotPrompt(prompt)).toBe(false);
    },
  );

  it.each(OFFER_WAITLIST_SLOT_PROMPTS)(
    'isOfferWaitlistSlotPrompt $id',
    ({ prompt }) => {
      expect(isOfferWaitlistSlotPrompt(prompt)).toBe(true);
      expect(isListWaitlistEntriesPrompt(prompt)).toBe(false);
    },
  );

  it.each(OFFER_WAITLIST_SLOT_PROMPTS.filter((row) => row.expectedParams))(
    'enrichOfferWaitlistSlotParams $id',
    ({ prompt, expectedParams }) => {
      const params = enrichOfferWaitlistSlotParams(prompt, {});
      if (expectedParams?.employeeName) {
        expect(params.employeeName).toBe(expectedParams.employeeName);
      }
      if (expectedParams?.date) {
        expect(params.date).toBe(expectedParams.date);
      }
      if (expectedParams?.timeSlot) {
        expect(params.timeSlot).toBe(expectedParams.timeSlot);
      }
    },
  );

  it('detects HY/RU waitlist prompts and helpers', () => {
    expect(isListWaitlistEntriesPrompt('Ով է waitlist-ում')).toBe(true);
    expect(isListWaitlistEntriesPrompt('Кто в waitlist')).toBe(true);
    expect(
      isOfferWaitlistSlotPrompt('Առաջարկիր Friday 2pm gap waitlist-ին'),
    ).toBe(true);
    expect(isOfferWaitlistSlotPrompt('Предложи Friday 2pm gap waitlist')).toBe(
      true,
    );
    expect(extractWaitlistOfferDate('Offer tomorrow at 2pm')).toBe('tomorrow');
    expect(extractWaitlistOfferDate('Offer today at 2pm')).toBe('today');
    expect(
      extractWaitlistOfferEmployeeName("Notify about Maria's cancelled slot"),
    ).toBe('Maria');
    expect(isWaitlistDashboardIntent('list_waitlist_entries')).toBe(true);
    expect(
      enrichWaitlistDashboardRescueParams('list_waitlist_entries', {}, 'list'),
    ).toEqual({});
  });
});
