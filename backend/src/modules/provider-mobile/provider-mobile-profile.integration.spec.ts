import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService profile, calendar, and reviews', () => {
  const employeeRepo = { findOne: jest.fn(), save: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn() };
  const slotRepo = { find: jest.fn() };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const bookingService = { update: jest.fn(), cancel: jest.fn() };
  const retailPosService = { getBookingRetailSales: jest.fn() };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = { listLabQueue: jest.fn() };
  const clinicTestResultService = { listResultQueue: jest.fn() };
  const customerRepo = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const reviewRepo = { find: jest.fn() };
  const patientClinicalProfilesService = { getProfileForCustomer: jest.fn() };
  const patientClinicalProfileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(),
  };
  const clinicTasksService = {
    listClinicTasks: jest.fn(),
    claimClinicTask: jest.fn(),
    completeClinicTask: jest.fn(),
  };

  const service = new ProviderMobileService(
    employeeRepo as any,
    memberRepo as any,
    bookingRepo as any,
    slotRepo as any,
    businessService as any,
    bookingService as any,
    retailPosService as any,
    llm as any,
    clinicTestOrderService as any,
    clinicTestResultService as any,
    customerRepo as any,
    reviewRepo as any,
    patientClinicalProfilesService as any,
    patientClinicalProfileAccessService as any,
    clinicTasksService as any,
  );

  const linkedEmployee = {
    id: 'emp-1',
    name: 'Alex Provider',
    email: 'alex@salon.test',
    phone: '+15551234567',
    userId: 'user-1',
    businessId: 'biz-1',
    isActive: true,
    metadata: { title: 'Senior stylist', avatarUrl: 'https://cdn.test/alex.jpg' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    employeeRepo.save.mockImplementation(async (employee) => employee);
  });

  it('returns provider profile from employee metadata', async () => {
    const profile = await service.getProviderProfile('biz-1', 'user-1');

    expect(profile).toMatchObject({
      id: 'emp-1',
      name: 'Alex Provider',
      title: 'Senior stylist',
      avatarUrl: 'https://cdn.test/alex.jpg',
      viewMode: 'provider',
    });
  });

  it('rejects profile read when no linked employee exists', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(service.getProviderProfile('biz-1', 'user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('updates title and avatar for the linked provider only', async () => {
    const updated = await service.updateProviderProfile('biz-1', 'user-1', {
      title: 'Lead colorist',
      avatarUrl: 'https://cdn.test/new.jpg',
    });

    expect(employeeRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: 'Lead colorist',
          avatarUrl: 'https://cdn.test/new.jpg',
        }),
      }),
    );
    expect(updated.title).toBe('Lead colorist');
    expect(updated.avatarUrl).toBe('https://cdn.test/new.jpg');
  });

  it('rejects profile edits without a linked provider profile', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateProviderProfile('biz-1', 'other-user', { title: 'Hacker' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns bookings scoped to the selected day', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'book-1',
        startTime: new Date('2026-06-09T14:00:00.000Z'),
        endTime: new Date('2026-06-09T15:00:00.000Z'),
        updatedAt: new Date('2026-06-09T10:00:00.000Z'),
        status: 'confirmed',
        notes: null,
        service: { id: 'svc-1', name: 'Cut', price: 40, durationMinutes: 60, currency: null },
        customer: { id: 'cust-1', name: 'Sam' },
        employee: { id: 'emp-1', name: 'Alex Provider' },
        metadata: {},
      },
    ]);

    const result = await service.getBookingsByDate('biz-1', 'user-1', '2026-06-09');

    expect(result.date).toBe('2026-06-09');
    expect(result.bookings).toHaveLength(1);
    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          employeeId: 'emp-1',
        }),
      }),
    );
  });

  it('rejects invalid calendar date keys', async () => {
    await expect(
      service.getBookingsByDate('biz-1', 'user-1', 'not-a-date'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns reviews and average rating for linked employee', async () => {
    reviewRepo.find.mockResolvedValue([
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Great cut',
        customerName: 'Sam',
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
      },
      {
        id: 'rev-2',
        rating: 3,
        comment: null,
        customerName: null,
        createdAt: new Date('2026-06-02T10:00:00.000Z'),
      },
    ]);

    const result = await service.getProviderReviews('biz-1', 'user-1');

    expect(result.employeeId).toBe('emp-1');
    expect(result.reviewCount).toBe(2);
    expect(result.averageRating).toBe(4);
    expect(result.reviews[0]?.comment).toBe('Great cut');
  });

  it('returns empty reviews when manager has no linked employee', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);

    const result = await service.getProviderReviews('biz-1', 'user-1');

    expect(result).toEqual({
      employeeId: null,
      averageRating: null,
      reviewCount: 0,
      reviews: [],
    });
    expect(reviewRepo.find).not.toHaveBeenCalled();
  });
});
