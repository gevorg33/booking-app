import { BookingStatus } from '../booking/entities/booking.entity.js';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService grouped confirmations', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const businessRepo = { findOne: jest.fn() };
  const logRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    create: jest.fn((v) => v),
  };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }), isConfigured: true };
  const smsService = { send: jest.fn() };
  const whatsappService = { sendBookingMessage: jest.fn(), shouldSkipImmediateAfterConfirmation: jest.fn() };
  const whatsappIntegrationService = { resolveRuntimeConfig: jest.fn().mockReturnValue(null) };
  const configService = { get: jest.fn(() => 'https://app.test') };

  const service = new NotificationsService(
    bookingRepo as any,
    businessRepo as any,
    logRepo as any,
    emailService as any,
    smsService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    configService as any,
  );

  const business = {
    id: 'biz-1',
    name: 'Pollin Clinic',
    slug: 'pollin',
    settings: { notifications: { sendConfirmationEmail: true, emailEnabled: true } },
  };

  const customer = {
    id: 'cust-1',
    name: 'Gevorg Gasparyan',
    email: 'gevorg@test.com',
    metadata: { notifications: { emailReminders: true } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.save.mockImplementation(async (b) => b);
  });

  it('sends one email listing all appointments in a multi-service group', async () => {
    const bookings = [
      {
        id: 'b-1',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        packagePurchaseId: null,
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T14:00:00Z'),
        endTime: new Date('2026-06-03T14:30:00Z'),
        customer,
        employee: { name: 'Margarita Simonyan' },
        service: { name: "girl's haircut" },
        business,
        metadata: { groupLabel: "girl's haircut + men's haircut + Baby haircut" },
      },
      {
        id: 'b-2',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        packagePurchaseId: null,
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T14:35:00Z'),
        endTime: new Date('2026-06-03T15:05:00Z'),
        customer,
        employee: { name: 'Margarita Simonyan' },
        service: { name: "men's haircut" },
        business,
        metadata: {},
      },
      {
        id: 'b-3',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        packagePurchaseId: null,
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T15:10:00Z'),
        endTime: new Date('2026-06-03T15:40:00Z'),
        customer,
        employee: { name: 'Margarita Simonyan' },
        service: { name: 'Baby haircut' },
        business,
        metadata: {},
      },
    ];

    bookingRepo.findOne.mockResolvedValue(bookings[0]);
    bookingRepo.find.mockResolvedValue(bookings);

    await service.sendMultiAppointmentConfirmation(['b-1', 'b-2', 'b-3']);

    expect(emailService.send).toHaveBeenCalledTimes(1);
    const payload = emailService.send.mock.calls[0][0];
    expect(payload.subject).toMatch(/3 appointments at Pollin Clinic/);
    expect(payload.text).toContain("girl's haircut");
    expect(payload.text).toContain("men's haircut");
    expect(payload.text).toContain('Baby haircut');
    expect(payload.text).toMatch(/Manage your booking/);
    expect(payload.html).toContain('>here</a>');
  });

  it('uses package name in grouped confirmation subject', async () => {
    const bookings = [
      {
        id: 'b-p1',
        businessId: 'biz-1',
        packagePurchaseId: 'purchase-1',
        multiServiceGroupId: null,
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-04T10:00:00Z'),
        endTime: new Date('2026-06-04T10:30:00Z'),
        customer,
        employee: { name: 'Alex' },
        service: { name: 'Facial' },
        business,
        metadata: { packageName: 'Summer glow package' },
      },
      {
        id: 'b-p2',
        businessId: 'biz-1',
        packagePurchaseId: 'purchase-1',
        multiServiceGroupId: null,
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-04T10:35:00Z'),
        endTime: new Date('2026-06-04T11:05:00Z'),
        customer,
        employee: { name: 'Alex' },
        service: { name: 'Massage' },
        business,
        metadata: { packageName: 'Summer glow package' },
      },
    ];

    bookingRepo.findOne.mockResolvedValue(bookings[0]);
    bookingRepo.find.mockResolvedValue(bookings);

    await service.sendMultiAppointmentConfirmation(['b-p1', 'b-p2']);

    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send.mock.calls[0][0].text).toContain('Summer glow package');
  });

  it('omits manage links when cancel and reschedule are disabled', async () => {
    const restrictedBusiness = {
      ...business,
      settings: {
        notifications: { sendConfirmationEmail: true, emailEnabled: true },
        publicBooking: {
          customerSelfService: { allowCancel: false, allowReschedule: false },
        },
      },
    };
    const booking = {
      id: 'b-single',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-05T10:00:00Z'),
      endTime: new Date('2026-06-05T10:30:00Z'),
      customer,
      employee: { name: 'Margarita Simonyan' },
      service: { name: "girl's haircut" },
      business: restrictedBusiness,
      metadata: {},
    };

    bookingRepo.findOne.mockResolvedValue(booking);

    await service.sendBookingConfirmation('b-single');

    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send.mock.calls[0][0].text).not.toMatch(/Manage your booking/);
    expect(emailService.send.mock.calls[0][0].html).not.toContain('>here</a>');
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('uses here link in single confirmation HTML instead of raw URL', async () => {
    const booking = {
      id: 'b-single',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-05T10:00:00Z'),
      endTime: new Date('2026-06-05T10:30:00Z'),
      customer,
      employee: { name: 'Margarita Simonyan' },
      service: { name: "girl's haircut" },
      business,
      metadata: {},
    };

    bookingRepo.findOne.mockResolvedValue(booking);

    await service.sendBookingConfirmation('b-single');

    const payload = emailService.send.mock.calls[0][0];
    expect(payload.html).toContain('Manage your booking');
    expect(payload.html).toContain('>here</a>');
    expect(payload.html).not.toMatch(/Manage your booking[^<]*https?:\/\//);
  });

  it('omits grouped manage links when cancel and reschedule are disabled', async () => {
    const restrictedBusiness = {
      ...business,
      settings: {
        notifications: { sendConfirmationEmail: true, emailEnabled: true },
        publicBooking: {
          customerSelfService: { allowCancel: false, allowReschedule: false },
        },
      },
    };
    const bookings = [
      {
        id: 'b-1',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T14:00:00Z'),
        endTime: new Date('2026-06-03T14:30:00Z'),
        customer,
        employee: { name: 'Margarita Simonyan' },
        service: { name: "girl's haircut" },
        business: restrictedBusiness,
        metadata: {},
      },
      {
        id: 'b-2',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T14:35:00Z'),
        endTime: new Date('2026-06-03T15:05:00Z'),
        customer,
        employee: { name: 'Margarita Simonyan' },
        service: { name: "men's haircut" },
        business: restrictedBusiness,
        metadata: {},
      },
    ];

    bookingRepo.findOne.mockResolvedValue(bookings[0]);
    bookingRepo.find.mockResolvedValue(bookings);

    await service.sendMultiAppointmentConfirmation(['b-1', 'b-2']);

    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send.mock.calls[0][0].text).not.toMatch(/Manage your booking/);
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });
});
