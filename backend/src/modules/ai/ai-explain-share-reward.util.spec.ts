import {
  EXPLAIN_SHARE_REWARD_BOUNDARY_PROMPTS,
  EXPLAIN_SHARE_REWARD_PROMPTS,
  EXPLAIN_SHARE_REWARD_RESCUE_SCENARIOS,
} from './ai-explain-share-reward.fixtures.js';
import { EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS } from './ai-explain-share-reward-multilingual.fixtures.js';
import {
  assembleShareRewardSummary,
  buildExplainShareRewardNavigate,
  isExplainShareRewardIntent,
  isExplainShareRewardPrompt,
  parseExplainShareRewardFromPrompt,
  rescueExplainShareRewardIntent,
  resolveExplainShareRewardAspect,
} from './ai-explain-share-reward.util.js';

describe('ai-explain-share-reward.util (ai-cmd-customer-4.12.4)', () => {
  it.each(EXPLAIN_SHARE_REWARD_PROMPTS.map((row) => [row.id, row.prompt]))(
    'detects prompt %s',
    (_id, prompt) => {
      expect(isExplainShareRewardPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('detects multilingual prompt %s', (_id, prompt) => {
    expect(isExplainShareRewardPrompt(prompt)).toBe(true);
  });

  it.each(EXPLAIN_SHARE_REWARD_BOUNDARY_PROMPTS)(
    'rejects boundary prompt $id',
    ({ prompt }) => {
      expect(isExplainShareRewardPrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_SHARE_REWARD_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainShareRewardIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('parses aspects and assembles summaries', () => {
    expect(
      resolveExplainShareRewardAspect('Do I get points for sharing?'),
    ).toBe('how_it_works');
    const parsed = parseExplainShareRewardFromPrompt(
      'What happens when I share my booking?',
    );
    expect(parsed?.aspect).toBe('booking_reward');
    expect(
      assembleShareRewardSummary('cooldown', {
        enabled: true,
        bookingShareEnabled: true,
        salonShareEnabled: true,
        bookingRewardSummary: '25 points',
        salonRewardSummary: '50 points',
        cooldownHours: 24,
        bookingNextEligibleAt: null,
        salonNextEligibleAt: '2030-01-02T10:00:00.000Z',
      }),
    ).toMatch(/cooldown/i);
    expect(buildExplainShareRewardNavigate('booking_reward')).toEqual({
      path: 'account',
      query: { section: 'bookings' },
    });
  });

  it('recognizes explain_share_reward intent', () => {
    expect(isExplainShareRewardIntent('explain_share_reward')).toBe(true);
    expect(
      rescueExplainShareRewardIntent(
        'Do I get points for sharing?',
        'explain_share_reward',
      ),
    ).toBeNull();
  });

  it('detects Armenian and Cyrillic share reward prompts', () => {
    expect(
      isExplainShareRewardPrompt('Կիսվելու համար միավորներ ստանում եմ՞'),
    ).toBe(true);
    expect(isExplainShareRewardPrompt('Получу ли я баллы за публикацию?')).toBe(
      true,
    );
    expect(
      isExplainShareRewardPrompt(
        'Как работает награда за публикацию моей записи?',
      ),
    ).toBe(true);
  });

  it('rejects salon share action prompts without reward explain cues', () => {
    expect(isExplainShareRewardPrompt('Share salon link with my friend')).toBe(
      false,
    );
  });

  it('resolves aspects and assembles channel-specific summaries', () => {
    expect(
      resolveExplainShareRewardAspect('How do I claim my share reward?'),
    ).toBe('claim_flow');
    expect(
      resolveExplainShareRewardAspect(
        'Do I earn anything for sharing the salon link?',
      ),
    ).toBe('salon_reward');
    const disabledProgram = {
      enabled: false,
      bookingShareEnabled: false,
      salonShareEnabled: false,
      bookingRewardSummary: '25 points',
      salonRewardSummary: '50 points',
      cooldownHours: 24,
      bookingNextEligibleAt: null,
      salonNextEligibleAt: null,
    };
    expect(assembleShareRewardSummary('how_it_works', disabledProgram)).toMatch(
      /not enabled/i,
    );
    const bookingChannelOff = {
      ...disabledProgram,
      enabled: true,
      bookingShareEnabled: false,
      salonShareEnabled: true,
    };
    expect(
      assembleShareRewardSummary('booking_reward', bookingChannelOff),
    ).toMatch(/not enabled for this salon/i);
    expect(
      assembleShareRewardSummary('salon_reward', {
        ...bookingChannelOff,
        bookingShareEnabled: true,
        salonShareEnabled: false,
      }),
    ).toMatch(/not enabled for this salon/i);
    expect(
      assembleShareRewardSummary('cooldown', {
        ...bookingChannelOff,
        salonShareEnabled: true,
        bookingNextEligibleAt: '2030-01-02T10:00:00.000Z',
        salonNextEligibleAt: null,
      }),
    ).toMatch(/cooldown/i);
    expect(assembleShareRewardSummary('claim_flow', bookingChannelOff)).toMatch(
      /Sign in/i,
    );
    expect(
      assembleShareRewardSummary('booking_reward', {
        enabled: true,
        bookingShareEnabled: true,
        salonShareEnabled: true,
        bookingRewardSummary: '25 points',
        salonRewardSummary: '50 points',
        cooldownHours: 24,
        bookingNextEligibleAt: null,
        salonNextEligibleAt: null,
      }),
    ).toMatch(/25 points/);
    expect(
      assembleShareRewardSummary('salon_reward', {
        enabled: true,
        bookingShareEnabled: true,
        salonShareEnabled: true,
        bookingRewardSummary: '25 points',
        salonRewardSummary: '50 points',
        cooldownHours: 24,
        bookingNextEligibleAt: null,
        salonNextEligibleAt: null,
      }),
    ).toMatch(/50 points/);
    expect(
      resolveExplainShareRewardAspect('Do I get points for sharing?'),
    ).toBe('how_it_works');
  });

  it('returns null parse for non-share-reward prompts', () => {
    expect(parseExplainShareRewardFromPrompt('Share my booking')).toBeNull();
  });
});
