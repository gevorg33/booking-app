import type { PublicCustomerBookingItem } from './types.js';

export const REFERRAL_CODE_SCENARIOS = [
  { id: 'uuid-prefix', customerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', expected: 'A1B2C3D4' },
  { id: 'short-id', customerId: 'cust-99', expected: 'CUST99' },
] as const;

export const MOCK_COMPLETED_BOOKING: PublicCustomerBookingItem = {
  id: 'bk-rebook-1',
  serviceId: 'svc-haircut',
  serviceName: 'Haircut',
  employeeId: 'emp-1',
  employeeName: 'Anna',
  startTime: '2026-05-01T10:00:00.000Z',
  endTime: '2026-05-01T10:45:00.000Z',
  status: 'completed',
  paymentStatus: 'paid',
  canCancel: false,
  canReschedule: false,
};

export const SHARE_SALON_SCENARIOS = [
  {
    id: 'salon-only',
    slug: 'demo-salon',
    businessName: 'Demo Salon',
    expectUrlContains: '/book/demo-salon',
    expectQueryContains: 'src=share',
  },
  {
    id: 'with-service',
    slug: 'demo-salon',
    businessName: 'Demo Salon',
    serviceId: 'svc-haircut',
    serviceName: 'Haircut',
    expectUrlContains: '/book/demo-salon',
    expectQueryContains: 'serviceId=svc-haircut',
  },
] as const;

export const SHARE_BOOKING_SCENARIOS = [
  {
    id: 'completed-booking',
    slug: 'demo-salon',
    businessName: 'Demo Salon',
    booking: MOCK_COMPLETED_BOOKING,
    expectQueryContains: 'serviceId=svc-haircut',
  },
] as const;
