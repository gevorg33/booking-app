import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from './ai-provider-client-context.fixtures.js';
import {
  extractClientNoteBodyFromPrompt,
  extractCustomerNameFromClientPrompt,
  formatProviderClientHistoryText,
  formatProviderClientSummaryText,
  isAddClientNotePrompt,
  isShowClientHistoryPrompt,
  isSummarizeClientPrompt,
  rescueProviderClientContextIntent,
  resolveClientNoteBody,
} from './ai-provider-client-context.util.js';

describe('ai-provider-client-context.util (prov-exp-1.6)', () => {
  it.each(PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS)(
    'rescueProviderClientContextIntent — $id',
    ({ prompt, expectedAction }) => {
      expect(rescueProviderClientContextIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
    },
  );

  it('detects summarize vs history vs note prompts', () => {
    expect(isSummarizeClientPrompt('Summarize this client')).toBe(true);
    expect(isShowClientHistoryPrompt("Show Jane's visit history")).toBe(true);
    expect(isAddClientNotePrompt('Add staff note: latex allergy')).toBe(true);
    expect(isSummarizeClientPrompt("Show Jane's visit history")).toBe(false);
  });

  it('extracts note body and customer name from natural language', () => {
    expect(extractClientNoteBodyFromPrompt('Add staff note: allergic to latex')).toBe(
      'allergic to latex',
    );
    expect(
      extractClientNoteBodyFromPrompt(
        'Add a note for this client — wants extra toner',
      ),
    ).toBe('wants extra toner');
    expect(extractClientNoteBodyFromPrompt('Add a note for this client')).toBe(
      null,
    );
    expect(extractCustomerNameFromClientPrompt('Summarize Jane Doe')).toBe(
      'Jane Doe',
    );
  });

  it('formats client summary and visit history text', () => {
    const summary = formatProviderClientSummaryText({
      customerId: 'cust-1',
      name: 'Jane Doe',
      phone: null,
      email: null,
      loyaltyPointsBalance: 40,
      loyaltyPointsValue: 4,
      completedVisitCount: 3,
      lastCompletedVisitAt: '2026-05-01T11:00:00.000Z',
      noShowCount: 1,
      marketingOptIn: true,
      referral: null,
      badges: [],
      loyaltyQuickView: {
        pointsBalance: 40,
        pointsValue: 4,
        lifetimeEarned: 40,
        lastEarn: null,
        lastRedeem: null,
        staffCanAdjust: false,
      },
      recentCompletedVisits: [
        {
          bookingId: 'bk-1',
          serviceName: 'Color',
          providerName: 'Sam',
          completedAt: '2026-05-01T11:00:00.000Z',
        },
      ],
    });

    expect(summary).toContain('Jane Doe');
    expect(summary).toContain('40 loyalty pts');
    expect(summary).toContain('Color');

    const winBackSummary = formatProviderClientSummaryText({
      customerId: 'cust-2',
      name: 'Lapsed Client',
      phone: null,
      email: null,
      loyaltyPointsBalance: 0,
      loyaltyPointsValue: 0,
      completedVisitCount: 2,
      lastCompletedVisitAt: '2025-12-01T10:00:00.000Z',
      noShowCount: 0,
      marketingOptIn: false,
      referral: null,
      badges: [{ id: 'win_back', tone: 'tertiary' }],
      loyaltyQuickView: {
        pointsBalance: 0,
        pointsValue: 0,
        lifetimeEarned: 15,
        lastEarn: {
          points: 5,
          occurredAt: '2025-11-01T10:00:00.000Z',
          note: 'Earned from paid booking',
        },
        lastRedeem: null,
        staffCanAdjust: false,
      },
      recentCompletedVisits: [],
    });
    expect(winBackSummary).toContain('Win-back');
    expect(winBackSummary).toContain('last earn +5');

    const history = formatProviderClientHistoryText('Jane Doe', [
      {
        bookingId: 'bk-1',
        serviceName: 'Trim',
        providerName: 'Alex',
        completedAt: '2026-04-01T10:00:00.000Z',
      },
    ]);
    expect(history).toContain('Trim with Alex');
  });

  it('resolves note body from params before prompt', () => {
    expect(
      resolveClientNoteBody({ clientNote: 'VIP client' }, 'ignored'),
    ).toBe('VIP client');
  });

  it('rescues misclassified list_bookings to show_client_history', () => {
    expect(
      rescueProviderClientContextIntent(
        'Past visits for Jane',
        'list_bookings',
      )?.action,
    ).toBe('show_client_history');
  });
});
