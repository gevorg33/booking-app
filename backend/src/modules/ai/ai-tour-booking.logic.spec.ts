import { handleExplainTourBookingLogic } from './ai-tour-booking.logic.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';

describe('ai-tour-booking.logic', () => {
  const cityTour = makeService({
    id: 'svc-city',
    name: 'City Tour',
    price: 45,
    currency: 'EUR',
    durationMinutes: 480,
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 12,
      durationDays: 1,
    },
  });

  const mountainTrek = makeService({
    id: 'svc-mountain',
    name: 'Mountain Trek',
    price: 120,
    currency: 'EUR',
    durationMinutes: 2880,
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 8,
      durationDays: 3,
    },
  });

  const massage = makeService({
    id: 'svc-massage',
    name: 'Swedish Massage',
    price: 60,
    currency: 'EUR',
    durationMinutes: 60,
    metadata: {},
  });

  const serviceService = {
    findAll: jest.fn(async () => [cityTour, mountainTrek, massage]),
  };

  const deps = () => ({ serviceService });

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockImplementation(async () => [
      cityTour,
      mountainTrek,
      massage,
    ]);
  });

  it('explains max group size for a tour on the booking page', async () => {
    const result = await handleExplainTourBookingLogic(
      deps(),
      'biz-1',
      { serviceName: 'City Tour', aspect: 'groupSize' },
      'What is the max group size for City Tour on this booking page?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tour_booking');
    expect(result.summary).toContain('max group size 12');
    expect(result.details?.serviceName).toBe('City Tour');
  });

  it('explains per-person pricing', async () => {
    const result = await handleExplainTourBookingLogic(
      deps(),
      'biz-1',
      { serviceName: 'Mountain Trek', aspect: 'pricing' },
      'Is the Mountain Trek priced per person?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('per person');
    expect(result.summary).toContain('120');
    expect(result.details?.priceMultipliesByPax).toBe(true);
  });

  it('explains multi-day duration', async () => {
    const result = await handleExplainTourBookingLogic(
      deps(),
      'biz-1',
      { serviceName: 'Mountain Trek', aspect: 'duration' },
      'How many days does the Mountain Trek tour run?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('3 days');
    expect(result.details?.durationDays).toBe(3);
  });

  it('clarifies when service is missing', async () => {
    const result = await handleExplainTourBookingLogic(
      deps(),
      'biz-1',
      { aspect: 'groupSize' },
      'What is the max group size on this booking page?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('rejects non-tour catalog services', async () => {
    const result = await handleExplainTourBookingLogic(
      deps(),
      'biz-1',
      { serviceName: 'Swedish Massage' },
      'How long is Swedish Massage on the booking page?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('not configured as a tour');
  });
});
