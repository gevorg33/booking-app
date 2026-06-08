import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import {
  isIntentQualifiedInstall,
  isQualifiedActivatedUser,
} from './n99-qualified-activation.util.js';
import {
  N99_ACTIVATION_PATH_AB_DEFAULT_PROMOTED,
  N99_ACTIVATION_PATH_AB_DIMENSIONS,
  N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
  N99_ACTIVATION_PATH_AB_VARIANTS_BY_DIMENSION,
  N99_PAYMENT_TIMING_VARIANTS,
  N99_SIGN_IN_PLACEMENT_VARIANTS,
  N99_SLOT_PRESELECTION_VARIANTS,
  type N99ActivationPathAbDimension,
  type N99ActivationPathVariants,
  type N99PaymentTimingVariant,
  type N99SignInPlacementVariant,
  type N99SlotPreselectionVariant,
} from './n99-activation-path-ab.fixtures.js';

export {
  N99_ACTIVATION_PATH_AB_DEFAULT_PROMOTED,
  N99_ACTIVATION_PATH_AB_DIMENSIONS,
  N99_ACTIVATION_PATH_AB_FIXTURE_ROWS,
  N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
  N99_ACTIVATION_PATH_AB_PROMOTION_EXPECTATIONS,
  N99_ACTIVATION_PATH_AB_VARIANTS_BY_DIMENSION,
  N99_PAYMENT_TIMING_VARIANTS,
  N99_SIGN_IN_PLACEMENT_VARIANTS,
  N99_SLOT_PRESELECTION_VARIANTS,
  type N99ActivationPathAbDimension,
  type N99ActivationPathVariants,
  type N99PaymentTimingVariant,
  type N99SignInPlacementVariant,
  type N99SlotPreselectionVariant,
} from './n99-activation-path-ab.fixtures.js';

export interface ActivationPathAbVariantScore {
  dimension: N99ActivationPathAbDimension;
  variant: string;
  qualifiedInstalls: number;
  qualifiedActivated: number;
  qualifiedActivationRate: number | null;
  sufficientSample: boolean;
}

export interface ActivationPathAbDimensionReport {
  dimension: N99ActivationPathAbDimension;
  winner: string;
  promoted: string;
  promotionApplied: boolean;
  tieBreakApplied: boolean;
  scores: ActivationPathAbVariantScore[];
}

export interface ActivationPathAbPromotionReport {
  generatedAt: string;
  minSample: number;
  promoted: N99ActivationPathVariants;
  dimensions: ActivationPathAbDimensionReport[];
}

export interface ActivationPathAbExport {
  scores: ActivationPathAbVariantScore[];
  promoted: N99ActivationPathVariants;
  dimensions: ActivationPathAbDimensionReport[];
}

function uniqueAnonIds(rows: AppEventAnalyticsRow[]): string[] {
  return [...new Set(rows.map((row) => row.anonId))];
}

function installRowForUser(
  rows: AppEventAnalyticsRow[],
  anonId: string,
): AppEventAnalyticsRow | null {
  return rows.find((row) => row.anonId === anonId && row.event === 'app_installed') ?? null;
}

function readVariantFromRow(
  row: AppEventAnalyticsRow,
  dimension: N99ActivationPathAbDimension,
): string | null {
  const value = row.props?.[dimension];
  if (typeof value !== 'string') return null;
  return N99_ACTIVATION_PATH_AB_VARIANTS_BY_DIMENSION[dimension].includes(value)
    ? value
    : null;
}

export function resolveAnonActivationPathVariant(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  dimension: N99ActivationPathAbDimension,
): string | null {
  for (const row of rows) {
    if (row.anonId !== anonId) continue;
    const variant = readVariantFromRow(row, dimension);
    if (variant) return variant;
  }
  return null;
}

export function scoreActivationPathAbVariant(
  rows: AppEventAnalyticsRow[],
  dimension: N99ActivationPathAbDimension,
  variant: string,
  minSample = N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
): ActivationPathAbVariantScore {
  const anonIds = uniqueAnonIds(rows).filter(
    (anonId) => resolveAnonActivationPathVariant(rows, anonId, dimension) === variant,
  );

  let qualifiedInstalls = 0;
  let qualifiedActivated = 0;
  for (const anonId of anonIds) {
    const install = installRowForUser(rows, anonId);
    if (!install || !isIntentQualifiedInstall(install)) continue;
    qualifiedInstalls += 1;
    if (isQualifiedActivatedUser(rows, anonId)) qualifiedActivated += 1;
  }

  return {
    dimension,
    variant,
    qualifiedInstalls,
    qualifiedActivated,
    qualifiedActivationRate:
      qualifiedInstalls === 0 ? null : qualifiedActivated / qualifiedInstalls,
    sufficientSample: qualifiedInstalls >= minSample,
  };
}

export function computeActivationPathAbScores(
  rows: AppEventAnalyticsRow[],
  minSample = N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
): ActivationPathAbVariantScore[] {
  const scores: ActivationPathAbVariantScore[] = [];
  for (const dimension of N99_ACTIVATION_PATH_AB_DIMENSIONS) {
    for (const variant of N99_ACTIVATION_PATH_AB_VARIANTS_BY_DIMENSION[dimension]) {
      scores.push(scoreActivationPathAbVariant(rows, dimension, variant, minSample));
    }
  }
  return scores;
}

export function pickBestActivationPathVariant(
  scores: ActivationPathAbVariantScore[],
): { winner: ActivationPathAbVariantScore; tieBreakApplied: boolean } {
  if (scores.length === 0) {
    throw new Error('pickBestActivationPathVariant requires at least one score');
  }

  const sorted = [...scores].sort((left, right) => {
    const leftRate = left.qualifiedActivationRate ?? -1;
    const rightRate = right.qualifiedActivationRate ?? -1;
    if (rightRate !== leftRate) return rightRate - leftRate;
    if (right.qualifiedActivated !== left.qualifiedActivated) {
      return right.qualifiedActivated - left.qualifiedActivated;
    }
    return left.variant.localeCompare(right.variant);
  });

  const winner = sorted[0];
  const tiedAtTop = scores.filter(
    (entry) =>
      entry.qualifiedActivationRate === winner.qualifiedActivationRate &&
      entry.qualifiedActivated === winner.qualifiedActivated,
  );
  return { winner, tieBreakApplied: tiedAtTop.length > 1 };
}

export function promoteActivationPathVariants(
  rows: AppEventAnalyticsRow[],
  minSample = N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
): ActivationPathAbPromotionReport {
  const scores = computeActivationPathAbScores(rows, minSample);
  const promoted: N99ActivationPathVariants = {
    ...N99_ACTIVATION_PATH_AB_DEFAULT_PROMOTED,
  };
  const dimensions: ActivationPathAbDimensionReport[] = [];

  for (const dimension of N99_ACTIVATION_PATH_AB_DIMENSIONS) {
    const dimScores = scores.filter((entry) => entry.dimension === dimension);
    const eligible = dimScores.filter((entry) => entry.sufficientSample);
    const pool = eligible.length > 0 ? eligible : dimScores;
    const { winner, tieBreakApplied } = pickBestActivationPathVariant(pool);
    const promotionApplied = eligible.length > 0;
    if (promotionApplied) {
      (promoted as Record<N99ActivationPathAbDimension, string>)[dimension] =
        winner.variant;
    }
    dimensions.push({
      dimension,
      winner: winner.variant,
      promoted: promoted[dimension],
      promotionApplied,
      tieBreakApplied,
      scores: dimScores,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    minSample,
    promoted,
    dimensions,
  };
}

export function buildActivationPathAbExport(
  rows: AppEventAnalyticsRow[],
  minSample = N99_ACTIVATION_PATH_AB_MIN_SAMPLE,
): ActivationPathAbExport {
  const scores = computeActivationPathAbScores(rows, minSample);
  const promotion = promoteActivationPathVariants(rows, minSample);
  return {
    scores,
    promoted: promotion.promoted,
    dimensions: promotion.dimensions,
  };
}

export function readPromotedActivationPathFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): Partial<N99ActivationPathVariants> {
  const promoted: Partial<N99ActivationPathVariants> = {};
  const signIn = env.N99_ACTIVATION_PATH_AB_SIGN_IN_PLACEMENT?.trim();
  if (signIn && N99_SIGN_IN_PLACEMENT_VARIANTS.includes(signIn as N99SignInPlacementVariant)) {
    promoted.signInPlacement = signIn as N99SignInPlacementVariant;
  }
  const slot = env.N99_ACTIVATION_PATH_AB_SLOT_PRESELECTION?.trim();
  if (slot && N99_SLOT_PRESELECTION_VARIANTS.includes(slot as N99SlotPreselectionVariant)) {
    promoted.slotPreselection = slot as N99SlotPreselectionVariant;
  }
  const payment = env.N99_ACTIVATION_PATH_AB_PAYMENT_TIMING?.trim();
  if (
    payment &&
    N99_PAYMENT_TIMING_VARIANTS.includes(payment as N99PaymentTimingVariant)
  ) {
    promoted.paymentTiming = payment as N99PaymentTimingVariant;
  }
  return promoted;
}

export function resolveEffectivePromotedActivationPath(
  computed: N99ActivationPathVariants,
  envOverrides: Partial<N99ActivationPathVariants> = readPromotedActivationPathFromEnv(),
): N99ActivationPathVariants {
  return {
    signInPlacement: envOverrides.signInPlacement ?? computed.signInPlacement,
    slotPreselection: envOverrides.slotPreselection ?? computed.slotPreselection,
    paymentTiming: envOverrides.paymentTiming ?? computed.paymentTiming,
  };
}
