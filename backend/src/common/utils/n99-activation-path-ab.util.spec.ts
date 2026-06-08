import {
  buildActivationPathAbExport,
  computeActivationPathAbScores,
  promoteActivationPathVariants,
  readPromotedActivationPathFromEnv,
  resolveEffectivePromotedActivationPath,
  scoreActivationPathAbVariant,
} from './n99-activation-path-ab.util.js';
import {
  N99_ACTIVATION_PATH_AB_FIXTURE_ROWS,
  N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
  N99_ACTIVATION_PATH_AB_PROMOTION_EXPECTATIONS,
} from './n99-activation-path-ab.fixtures.js';
import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';

function toRows(
  fixtures: typeof N99_ACTIVATION_PATH_AB_FIXTURE_ROWS,
): AppEventAnalyticsRow[] {
  return fixtures.map((row) => ({
    anonId: row.anonId,
    event: row.event,
    platform: row.platform,
    appSurface: row.appSurface,
    locale: row.locale,
    tenantSlug: row.tenantSlug ?? null,
    createdAt: new Date(row.createdAt),
    props: row.props ?? null,
  }));
}

describe('n99-activation-path-ab.util (n99-3.8)', () => {
  const rows = toRows(N99_ACTIVATION_PATH_AB_FIXTURE_ROWS);

  it('scores qualified activation per variant with min sample gate', () => {
    const signInPre = scoreActivationPathAbVariant(rows, 'signInPlacement', 'pre_confirm', 2);
    expect(signInPre.qualifiedInstalls).toBe(2);
    expect(signInPre.qualifiedActivated).toBe(2);
    expect(signInPre.qualifiedActivationRate).toBe(1);
    expect(signInPre.sufficientSample).toBe(true);

    const signInPost = scoreActivationPathAbVariant(rows, 'signInPlacement', 'post_booking', 2);
    expect(signInPost.qualifiedInstalls).toBe(2);
    expect(signInPost.qualifiedActivated).toBe(1);
    expect(signInPost.qualifiedActivationRate).toBe(0.5);
  });

  it('promotes highest qualified activation when sample is sufficient', () => {
    const promotion = promoteActivationPathVariants(rows, 2);
    expect(promotion.promoted.signInPlacement).toBe(
      N99_ACTIVATION_PATH_AB_PROMOTION_EXPECTATIONS.signInPlacement,
    );
    expect(promotion.promoted.slotPreselection).toBe(
      N99_ACTIVATION_PATH_AB_PROMOTION_EXPECTATIONS.slotPreselection,
    );
    expect(promotion.promoted.paymentTiming).toBe(
      N99_ACTIVATION_PATH_AB_PROMOTION_EXPECTATIONS.paymentTiming,
    );
    expect(promotion.dimensions.every((entry) => entry.promotionApplied)).toBe(true);
  });

  it('keeps defaults when sample is below threshold', () => {
    const promotion = promoteActivationPathVariants(rows, N99_ACTIVATION_PATH_AB_MIN_SAMPLE);
    expect(promotion.promoted.signInPlacement).toBe('post_booking');
    expect(promotion.dimensions.every((entry) => !entry.promotionApplied)).toBe(true);
  });

  it('builds dashboard export with scores and promotion report', () => {
    const exported = buildActivationPathAbExport(rows, 2);
    expect(exported.scores).toHaveLength(6);
    expect(exported.dimensions).toHaveLength(3);
    expect(exported.promoted.signInPlacement).toBe('pre_confirm');
  });

  it('reads env overrides for promoted variants', () => {
    const overrides = readPromotedActivationPathFromEnv({
      N99_ACTIVATION_PATH_AB_SIGN_IN_PLACEMENT: 'pre_confirm',
      N99_ACTIVATION_PATH_AB_SLOT_PRESELECTION: 'manual_pick',
      N99_ACTIVATION_PATH_AB_PAYMENT_TIMING: 'online_first',
    });
    expect(overrides).toEqual({
      signInPlacement: 'pre_confirm',
      slotPreselection: 'manual_pick',
      paymentTiming: 'online_first',
    });
  });

  it('merges computed promotion with env overrides', () => {
    const merged = resolveEffectivePromotedActivationPath(
      {
        signInPlacement: 'post_booking',
        slotPreselection: 'nearest_auto',
        paymentTiming: 'pay_at_venue_default',
      },
      { signInPlacement: 'pre_confirm' },
    );
    expect(merged.signInPlacement).toBe('pre_confirm');
    expect(merged.slotPreselection).toBe('nearest_auto');
  });

  it('computeActivationPathAbScores returns all dimension variants', () => {
    const scores = computeActivationPathAbScores(rows, 2);
    expect(scores.map((entry) => `${entry.dimension}:${entry.variant}`)).toEqual([
      'signInPlacement:post_booking',
      'signInPlacement:pre_confirm',
      'slotPreselection:nearest_auto',
      'slotPreselection:manual_pick',
      'paymentTiming:pay_at_venue_default',
      'paymentTiming:online_first',
    ]);
  });
});
