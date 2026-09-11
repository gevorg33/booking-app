import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import { E2E82_HELPER_CASES } from './ai-e2e82-business-slug-resolve.fixtures.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';
import { handleShareMyBookingLogic } from './ai-share-my-booking.logic.js';
import { handleListProviderReviewsLogic } from './ai-list-provider-reviews.logic.js';
import { handleSubmitProviderReviewLogic } from './ai-submit-provider-review.logic.js';
import { handleSubmitReviewWithTokenLogic } from './ai-submit-review-with-token.logic.js';
import { handleRebookLastAppointmentLogic } from './ai-rebook-last-appointment.logic.js';
import { handlePickProviderForServiceLogic } from './ai-pick-provider-for-service.logic.js';
import { handleSwitchProviderSameTimeLogic } from './ai-switch-provider-same-time.logic.js';
import { handleUpdateMyLocaleLogic } from './ai-my-locale.logic.js';
import { handleUpdateMyProfileLogic } from './ai-update-my-profile.logic.js';

const BUSINESS_ID = 'biz-1';
const SLUG = 'glow-salon';

function businessRepo(slug: string | null = SLUG) {
  return {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) =>
      where.id === BUSINESS_ID && slug
        ? makeBusiness({ id: BUSINESS_ID, slug })
        : null,
    ),
  };
}

describe('e2e-bug.82 resolveBusinessSlugFromParamsOrId', () => {
  it.each(E2E82_HELPER_CASES)(
    '$id',
    async ({ params, businessId, repoSlug, expected }) => {
      const repo = {
        findOne: jest.fn(async () =>
          repoSlug ? makeBusiness({ id: businessId, slug: repoSlug }) : null,
        ),
      };
      await expect(
        resolveBusinessSlugFromParamsOrId(repo, businessId, { ...params }),
      ).resolves.toBe(expected);
    },
  );

  it('returns null when businessRepo is omitted and params.slug missing', async () => {
    await expect(
      resolveBusinessSlugFromParamsOrId(undefined, BUSINESS_ID, {}),
    ).resolves.toBeNull();
  });
});

describe('e2e-bug.82 handlers succeed without classifier params.slug', () => {
  it('e2e82-share-my-booking-no-params-slug', async () => {
    const result = await handleShareMyBookingLogic(
      {
        publicBookingService: {
          getCustomerShareRewards: jest.fn(async () => ({
            bookingShareEnabled: true,
            bookingRewardSummary: '50 points',
            salonShareEnabled: false,
            salonRewardSummary: '',
          })),
        } as any,
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      { sessionCustomerId: 'cust-1' },
      'Share my booking',
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-list-provider-reviews-no-params-slug', async () => {
    const result = await handleListProviderReviewsLogic(
      {
        employeeRepo: {
          find: jest.fn(async () => [
            { id: 'emp-1', name: 'Anna Smith', isActive: true },
          ]),
        } as any,
        serviceRepo: {} as any,
        reviewsService: {
          listPublicProviderReviews: jest.fn(async () => ({
            employeeId: 'emp-1',
            employeeName: 'Anna Smith',
            employeeRole: 'Stylist',
            avatarUrl: null,
            averageRating: 5,
            reviewCount: 1,
            page: 1,
            limit: 15,
            totalPages: 1,
            items: [],
          })),
        } as any,
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      { providerName: 'Anna' },
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-submit-provider-review-no-params-slug', async () => {
    const result = await handleSubmitProviderReviewLogic(
      {
        employeeRepo: {
          find: jest.fn(async () => [
            {
              id: 'emp-1',
              name: 'Anna',
              businessId: BUSINESS_ID,
              isActive: true,
            },
          ]),
        } as any,
        reviewsService: {
          submitProviderPortalReview: jest.fn(async () => ({
            id: 'rev-1',
            rating: 5,
            comment: null,
            customerName: 'Sam',
            createdAt: '2026-06-01T10:00:00.000Z',
          })),
        },
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      {
        providerName: 'Anna',
        rating: 5,
        sessionCustomerId: 'cust-1',
      },
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-submit-review-with-token-no-params-slug', async () => {
    const result = await handleSubmitReviewWithTokenLogic(
      {
        reviewsService: {
          getPublicContext: jest.fn(async () => ({
            businessName: 'Salon',
            employeeName: 'Anna',
            serviceName: 'Haircut',
            customerName: 'Guest',
            appointmentDate: '2026-06-01T10:00:00.000Z',
            appointmentEndDate: '2026-06-01T11:00:00.000Z',
            alreadySubmitted: false,
          })),
          submitPublic: jest.fn(async () => ({
            id: 'rev-1',
            rating: 5,
            comment: null,
            customerName: null,
            createdAt: '2026-06-01T10:00:00.000Z',
          })),
        },
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      { bookingId: 'book-1', token: 'tok-1', rating: 5 },
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-rebook-last-appointment-no-params-slug', async () => {
    const result = await handleRebookLastAppointmentLogic(
      {
        publicCustomerAuthService: {
          listBookings: jest.fn(async () => ({
            bookings: [
              {
                id: 'b1',
                serviceId: 'svc-1',
                serviceName: 'Haircut',
                employeeId: 'emp-1',
                employeeName: 'Alex',
                startTime: '2026-05-01T10:00:00.000Z',
                status: BookingStatus.COMPLETED,
              },
            ],
          })),
        },
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      { sessionCustomerId: 'cust-1' },
      'Rebook my last appointment',
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-pick-provider-same-as-last-no-params-slug', async () => {
    const result = await handlePickProviderForServiceLogic(
      {
        employeeRepo: {
          find: jest.fn(async () => [
            {
              id: 'emp-anna',
              name: 'Anna',
              businessId: BUSINESS_ID,
              isActive: true,
            },
          ]),
        } as any,
        serviceRepo: {
          find: jest.fn(async () => [
            {
              id: 'svc-color',
              name: 'Color',
              businessId: BUSINESS_ID,
              isActive: true,
            },
          ]),
        } as any,
        publicCustomerAuthService: {
          listBookings: jest.fn(async () => ({
            bookings: [
              {
                id: 'book-1',
                status: 'completed',
                startTime: '2026-06-01T10:00:00.000Z',
                employeeId: 'emp-anna',
                employeeName: 'Anna',
                serviceId: 'svc-color',
                serviceName: 'Color',
              },
            ],
          })),
        } as any,
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      { sessionCustomerId: 'cust-1' },
      'I want the same stylist as last time',
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-switch-provider-same-time-no-params-slug', async () => {
    const startTime = '2026-07-01T15:00:00.000Z';
    const timeSlot = formatTimeDisplay(startTime);
    const result = await handleSwitchProviderSameTimeLogic(
      {
        employeeRepo: {
          find: jest.fn(async () => [
            {
              id: 'emp-anna',
              name: 'Anna',
              businessId: BUSINESS_ID,
              isActive: true,
            },
          ]),
        } as any,
        serviceRepo: {
          findOne: jest.fn(async () => ({
            id: 'svc-haircut',
            name: 'Haircut',
            businessId: BUSINESS_ID,
            isActive: true,
          })),
        } as any,
        publicBookingService: {
          getServiceDaySlots: jest.fn(async () => ({
            date: '2026-07-01',
            serviceId: 'svc-haircut',
            serviceName: 'Haircut',
            slots: [
              {
                startTime,
                endTime: '2026-07-01T16:00:00.000Z',
                employeeId: 'emp-anna',
                employeeName: 'Anna',
              },
            ],
          })),
        } as any,
        businessRepo: businessRepo(),
      },
      BUSINESS_ID,
      {
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        timeSlot,
      },
      'Keep 3pm but different stylist',
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-update-my-locale-no-params-slug', async () => {
    const result = await handleUpdateMyLocaleLogic(
      {
        publicCustomerAuthService: {
          updatePreferredLocale: jest.fn(async () => ({
            preferredLocale: 'hy',
            storedLocale: 'hy',
          })),
        },
        businessRepo: businessRepo(),
      } as any,
      BUSINESS_ID,
      { sessionCustomerId: 'cust-1', preferredLocale: 'hy' },
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toContain('Business not found');
  });

  it('e2e82-update-my-profile-no-params-slug', async () => {
    const updateMyProfile = jest.fn(async () => ({
      id: 'cust-1',
      name: 'Jane Doe',
      phone: null,
    }));
    const result = await handleUpdateMyProfileLogic(
      {
        publicCustomerAuthService: { updateMyProfile },
        businessRepo: businessRepo(),
      } as any,
      BUSINESS_ID,
      { sessionCustomerId: 'cust-1' },
      'Update my name to Jane Doe',
    );
    expect(result.success).toBe(true);
    expect(updateMyProfile).toHaveBeenCalledWith(SLUG, 'cust-1', {
      name: 'Jane Doe',
      phone: undefined,
    });
  });
});
