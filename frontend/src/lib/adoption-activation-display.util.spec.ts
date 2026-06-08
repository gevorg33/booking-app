import { describe, expect, it } from 'vitest';
import {
  buildActivationNorthStarSummary,
  buildQualifiedActivationSummary,
  buildQualifiedLocaleCohortRows,
  formatActivationRate,
  formatLocaleSpreadPoints,
  isLocaleSpreadHealthy,
  isNorthStarActivationHealthy,
  isQualifiedActivationGateHealthy,
} from './adoption-activation-display.util';

describe('adoption-activation-display.util (adopt-1.6)', () => {
  it('formats activation rate for the north-star card', () => {
    expect(formatActivationRate(1 / 3)).toBe('33.3%');
  });

  it('builds north-star summary labels from activation payload', () => {
    const summary = buildActivationNorthStarSummary({
      installedCount: 3,
      activatedCount: 1,
      activationRate: 1 / 3,
      windowDays: 7,
    });

    expect(summary.rateLabel).toBe('33.3%');
    expect(summary.progressLabel).toBe('1/3');
    expect(summary.windowDays).toBe(7);
  });

  it('flags healthy activation against a target threshold', () => {
    expect(
      isNorthStarActivationHealthy({
        installedCount: 4,
        activatedCount: 1,
        activationRate: 0.25,
        windowDays: 7,
      }),
    ).toBe(true);
    expect(
      isNorthStarActivationHealthy({
        installedCount: 4,
        activatedCount: 0,
        activationRate: 0,
        windowDays: 7,
      }),
    ).toBe(false);
  });

  it('buildQualifiedActivationSummary targets near 99% (n99-3)', () => {
    const summary = buildQualifiedActivationSummary({
      installedCount: 100,
      activatedCount: 99,
      activationRate: 0.99,
      windowDays: 7,
    });
    expect(summary.targetLabel).toBe('99%');
    expect(summary.healthy).toBe(true);
    expect(isQualifiedActivationGateHealthy({ met: true })).toBe(true);
  });

  it('buildQualifiedLocaleCohortRows formats per-locale qualified vs cold (n99-3.7)', () => {
    const rows = buildQualifiedLocaleCohortRows({
      byLocale: [
        {
          locale: 'en',
          sufficientSample: true,
          qualified: {
            installedCount: 34,
            activatedCount: 34,
            activationRate: 1,
            windowDays: 7,
          },
          cold: {
            installedCount: 4,
            activatedCount: 1,
            activationRate: 0.25,
            windowDays: 7,
          },
        },
      ],
    });
    expect(rows[0]?.locale).toBe('EN');
    expect(rows[0]?.qualifiedProgress).toBe('34/34');
    expect(isLocaleSpreadHealthy(0.02)).toBe(true);
    expect(isLocaleSpreadHealthy(0.05)).toBe(false);
    expect(formatLocaleSpreadPoints(0.025)).toBe('2.5 pts');
  });
});
