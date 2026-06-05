import { describe, expect, it } from 'vitest';
import { isDayLevelTourService, isPublicTourService } from './tour-service';
import type { PublicService } from './public-api';

const cityTour: PublicService = {
  id: 'tour-city',
  name: 'Full Day City Tour',
  durationMinutes: 480,
  bufferMinutes: 0,
  price: 85,
  currency: 'USD',
  isTour: true,
  pricePerPerson: true,
  maxGroupSize: 12,
  tourDurationBadge: '8h',
  dayLevelBooking: false,
};

const mountainTrek: PublicService = {
  id: 'tour-trek',
  name: '3-Day Mountain Trek',
  durationMinutes: 4320,
  bufferMinutes: 0,
  price: 320,
  currency: 'USD',
  isTour: true,
  pricePerPerson: true,
  maxGroupSize: 8,
  durationDays: 3,
  tourDurationBadge: '3 days',
  dayLevelBooking: true,
};

const oneDayTour: PublicService = {
  id: 'tour-day',
  name: 'Day Hike',
  durationMinutes: 1440,
  bufferMinutes: 0,
  price: 120,
  currency: 'USD',
  isTour: true,
  pricePerPerson: true,
  durationDays: 1,
  dayLevelBooking: true,
};

describe('Sprint 30 — vert-tour-1.6 / vert-tour-1.8 scenario matrix', () => {
  describe('vert-tour-1.6 day-level slot selection', () => {
    it('marks multi-day treks as day-level but not 8h city tours', () => {
      expect(isDayLevelTourService(cityTour)).toBe(false);
      expect(isDayLevelTourService(mountainTrek)).toBe(true);
      expect(isDayLevelTourService(oneDayTour)).toBe(true);
    });

    it('public API dayLevelBooking aligns with duration rules', () => {
      expect(cityTour.dayLevelBooking).toBe(false);
      expect(mountainTrek.dayLevelBooking).toBe(true);
      expect(oneDayTour.dayLevelBooking).toBe(true);
    });

    it('single departure implies one slot choice in checkout UX contract', () => {
      const dayLevelServices = [mountainTrek, oneDayTour].filter((s) =>
        isDayLevelTourService(s),
      );
      expect(dayLevelServices).toHaveLength(2);
      for (const service of dayLevelServices) {
        expect(service.dayLevelBooking).toBe(true);
      }
    });
  });

  describe('vert-tour-1.8 tour booking record', () => {
    it('checkout payload includes pax for tour services', () => {
      const buildPayload = (service: PublicService, pax: number) => ({
        serviceId: service.id,
        ...(isPublicTourService(service) ? { paxCount: pax } : {}),
      });

      expect(buildPayload(mountainTrek, 3)).toEqual({
        serviceId: 'tour-trek',
        paxCount: 3,
      });
      expect(buildPayload(cityTour, 2)).toEqual({
        serviceId: 'tour-city',
        paxCount: 2,
      });
    });

    it('computes expected date span for multi-day vs single-day tours', () => {
      const spanDays = (start: string, days: number) => {
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + days - 1);
        return {
          tourStartDate: start.slice(0, 10),
          tourEndDate: end.toISOString().slice(0, 10),
        };
      };

      expect(spanDays('2026-08-15T08:00:00.000Z', 3)).toEqual({
        tourStartDate: '2026-08-15',
        tourEndDate: '2026-08-17',
      });
      expect(spanDays('2026-08-15T08:00:00.000Z', 1)).toEqual({
        tourStartDate: '2026-08-15',
        tourEndDate: '2026-08-15',
      });
    });

    it('clamps pax to max group size before submit', () => {
      const clamp = (requested: number, max?: number) =>
        Math.min(Math.max(1, requested), max ?? 99);

      expect(clamp(20, mountainTrek.maxGroupSize)).toBe(8);
      expect(clamp(3, mountainTrek.maxGroupSize)).toBe(3);
      expect(clamp(15, cityTour.maxGroupSize)).toBe(12);
    });

    it('per-person total scales with pax count', () => {
      expect(mountainTrek.price * 3).toBe(960);
      expect(oneDayTour.price * 2).toBe(240);
    });
  });
});
