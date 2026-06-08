import { EventType } from '../../../events/event-types.js';
import { BookingCompletedListener } from './booking-completed.listener.js';

describe('BookingCompletedListener (adopt-6.5)', () => {
  const bookingRepo = { findOne: jest.fn() };
  const appEventRepo = { save: jest.fn(), create: jest.fn((value) => value) };
  const inventoryService = { deductForService: jest.fn() };
  const reviewsService = { ensureReviewToken: jest.fn() };
  const notificationsService = { sendReviewRequest: jest.fn() };
  const referralProgramService = {
    processBookingCompleted: jest.fn().mockResolvedValue({ converted: false }),
  };
  const customerRebookingCadenceService = {
    persistLearnedCadenceForCompletedBooking: jest.fn(),
  };

  const listener = new BookingCompletedListener(
    bookingRepo as any,
    appEventRepo as any,
    inventoryService as any,
    reviewsService as any,
    notificationsService as any,
    referralProgramService as any,
    customerRebookingCadenceService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      business: { slug: 'demo-salon' },
      customer: { metadata: {} },
    });
    inventoryService.deductForService.mockResolvedValue(undefined);
    reviewsService.ensureReviewToken.mockResolvedValue(undefined);
    notificationsService.sendReviewRequest.mockResolvedValue(undefined);
  });

  it('persists learned rebooking cadence after visit completion', async () => {
    await listener.handle({
      eventType: EventType.BOOKING_COMPLETED,
      aggregateId: 'bk-1',
    } as any);

    expect(
      customerRebookingCadenceService.persistLearnedCadenceForCompletedBooking,
    ).toHaveBeenCalledWith('bk-1');
  });

  it('continues referral conversion when cadence persistence fails', async () => {
    customerRebookingCadenceService.persistLearnedCadenceForCompletedBooking.mockRejectedValue(
      new Error('db down'),
    );

    await listener.handle({
      eventType: EventType.BOOKING_COMPLETED,
      aggregateId: 'bk-1',
    } as any);

    expect(referralProgramService.processBookingCompleted).toHaveBeenCalledWith(
      'bk-1',
    );
  });
});
