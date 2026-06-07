import { EventType } from '../../../events/event-types.js';
import { BookingStatus } from '../../booking/entities/booking.entity.js';
import { ClinicLabBookingListener } from './clinic-lab-booking.listener.js';

describe('ClinicLabBookingListener', () => {
  const clinicTestOrderService = {
    maybeCreateOrderForBooking: jest.fn(),
  };
  const clinicTestOrderBookingRequestService = {
    fulfillBookingRequestForBooking: jest.fn(),
  };
  const bookingRepo = {
    findOne: jest.fn(),
  };
  const listener = new ClinicLabBookingListener(
    clinicTestOrderService as any,
    clinicTestOrderBookingRequestService as any,
    bookingRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({ metadata: {} });
  });

  it('fulfills booking requests and creates lab orders on booking.created', async () => {
    await listener.handleBookingCreated({
      aggregateId: 'booking-1',
      eventType: EventType.BOOKING_CREATED,
    } as any);
    expect(
      clinicTestOrderBookingRequestService.fulfillBookingRequestForBooking,
    ).toHaveBeenCalledWith('booking-1');
    expect(
      clinicTestOrderService.maybeCreateOrderForBooking,
    ).toHaveBeenCalledWith('booking-1');
  });

  it('skips auto-create when booking metadata carries clinic order token', async () => {
    bookingRepo.findOne.mockResolvedValue({
      metadata: { clinicOrderToken: 'token-1' },
    });
    await listener.handleBookingCreated({
      aggregateId: 'booking-1',
      eventType: EventType.BOOKING_CREATED,
    } as any);
    expect(
      clinicTestOrderService.maybeCreateOrderForBooking,
    ).not.toHaveBeenCalled();
  });

  it('skips auto-create when booking metadata carries staff-linked order id', async () => {
    bookingRepo.findOne.mockResolvedValue({
      metadata: { clinicStaffOrderId: 'order-1' },
    });
    await listener.handleBookingCreated({
      aggregateId: 'booking-1',
      eventType: EventType.BOOKING_CREATED,
    } as any);
    expect(
      clinicTestOrderService.maybeCreateOrderForBooking,
    ).not.toHaveBeenCalled();
  });

  it('creates lab orders when booking becomes confirmed', async () => {
    await listener.handleBookingUpdated({
      aggregateId: 'booking-1',
      eventType: EventType.BOOKING_UPDATED,
      payload: { status: BookingStatus.CONFIRMED },
    } as any);
    expect(
      clinicTestOrderService.maybeCreateOrderForBooking,
    ).toHaveBeenCalledWith('booking-1');
  });

  it('ignores non-confirmed booking updates', async () => {
    await listener.handleBookingUpdated({
      aggregateId: 'booking-1',
      eventType: EventType.BOOKING_UPDATED,
      payload: { status: BookingStatus.PENDING },
    } as any);
    expect(
      clinicTestOrderService.maybeCreateOrderForBooking,
    ).not.toHaveBeenCalled();
  });
});
