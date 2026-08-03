import {
  E2E296_CLASSIFIER_RANGE_OVERRIDE_CASES,
  E2E296_OPEN_EVENING_CONTROLS,
  E2E296_SAME_DAY_DAY_PART_CASES,
} from './ai-e2e296-recommend-day-part-window.fixtures.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-booking-param-hints.util.js';
import { enrichFlexibleAvailabilitySingleWindowFromPrompt } from './ai-flexible-availability.util.js';
import { resolvePublicAvailabilityDateKeys } from './ai-orchestration.helpers.js';
import {
  buildProviderRankDiscoveryRescueParams,
  rescueServiceRankDiscoveryIntent,
} from './ai-service-rank-discovery.util.js';
import { toIsoDay } from '../../common/utils/date-format.util.js';

const TZ = 'Asia/Yerevan';

describe('e2e-bug.296 recommend someone day-part stays same-day', () => {
  it.each(E2E296_SAME_DAY_DAY_PART_CASES)(
    'enrich single-window $id',
    ({ prompt, expectTimeOfDay, expectRelativeDate, expectKeysLen }) => {
      const enriched = enrichFlexibleAvailabilitySingleWindowFromPrompt(
        prompt,
        {},
      );
      expect(enriched.timeOfDay).toBe(expectTimeOfDay);
      expect(enriched.date).toBe(expectRelativeDate);

      const publicEnriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        {},
        [],
        'recommend_specialists',
      );
      expect(publicEnriched.timeOfDay).toBe(expectTimeOfDay);
      expect(publicEnriched.date).toBe(expectRelativeDate);

      const keys = resolvePublicAvailabilityDateKeys(
        publicEnriched,
        undefined,
        TZ,
      );
      expect(keys).toHaveLength(expectKeysLen);
    },
  );

  it.each(E2E296_SAME_DAY_DAY_PART_CASES)(
    'provider-rank rescue params $id',
    ({ prompt, expectTimeOfDay, expectRelativeDate, expectKeysLen }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        'check_availability',
        'public',
      );
      expect(rescued?.action).toBe('recommend_specialists');
      expect(rescued?.params.timeOfDay).toBe(expectTimeOfDay);
      expect(rescued?.params.date).toBe(expectRelativeDate);

      const built = buildProviderRankDiscoveryRescueParams(prompt);
      expect(built.timeOfDay).toBe(expectTimeOfDay);
      expect(built.date).toBe(expectRelativeDate);
      expect(
        resolvePublicAvailabilityDateKeys(built, undefined, TZ),
      ).toHaveLength(expectKeysLen);
    },
  );

  it.each(E2E296_CLASSIFIER_RANGE_OVERRIDE_CASES)(
    'clears classifier 14-day range for $id',
    ({
      prompt,
      seedParams,
      expectRelativeDate,
      expectTimeOfDay,
      expectKeysLen,
    }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        JSON.parse(JSON.stringify(seedParams)) as Record<string, unknown>,
        [],
        'recommend_specialists',
      );
      expect(enriched.date).toBe(expectRelativeDate);
      expect(enriched.timeOfDay).toBe(expectTimeOfDay);
      expect(enriched.dateFrom).toBeUndefined();
      expect(enriched.dateTo).toBeUndefined();
      const windows = enriched.availabilityWindows as
        | Array<{ date?: string; timeOfDay?: string }>
        | undefined;
      if (Array.isArray(windows) && windows.length > 0) {
        for (const window of windows) {
          expect(window.date).toBe(expectRelativeDate);
        }
      }
      expect(
        resolvePublicAvailabilityDateKeys(enriched, undefined, TZ),
      ).toHaveLength(expectKeysLen);
    },
  );

  it('inherits top-level date onto dateless windows at resolve time', () => {
    const keys = resolvePublicAvailabilityDateKeys(
      {
        date: 'today',
        timeOfDay: 'evening',
        availabilityWindows: [{ timeOfDay: 'evening' }],
      },
      undefined,
      TZ,
    );
    expect(keys).toHaveLength(1);
  });

  // e2e-bug.296 — UTC-normalized "today" must still recover via prompt for
  // this evening (parity with tonight) when resolve receives the prompt.
  it('recover same-day keys after UTC-skewed today for this evening', () => {
    const skewed = {
      date: toIsoDay('today', 'UTC'),
      timeOfDay: 'evening' as const,
      serviceCategory: 'massage',
    };
    const tonightKeys = resolvePublicAvailabilityDateKeys(
      { ...skewed },
      'recommend someone for massage tonight',
      TZ,
    );
    const eveningKeys = resolvePublicAvailabilityDateKeys(
      { ...skewed },
      'recommend someone for massage this evening',
      TZ,
    );
    expect(tonightKeys).toHaveLength(1);
    expect(eveningKeys).toHaveLength(1);
    expect(eveningKeys[0]).toBe(tonightKeys[0]);
  });

  it.each(E2E296_OPEN_EVENING_CONTROLS)(
    'open evening control $id',
    ({ prompt, expectTimeOfDay, allowMultiDay }) => {
      const enriched = enrichFlexibleAvailabilitySingleWindowFromPrompt(
        prompt,
        {},
      );
      expect(enriched.timeOfDay).toBe(expectTimeOfDay);
      if (allowMultiDay) {
        expect(enriched.date == null || enriched.date === undefined).toBe(true);
      }
    },
  );
});
