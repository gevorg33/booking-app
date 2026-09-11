/**
 * D5 / §238 — `create_multi_service_booking` refuses an ambiguous service.
 *
 * The last site on `e2e-bug.514`, and the one the tracker classed as a contract
 * change rather than a migration: `handleCreateMultiServiceBookingLogic`
 * receives `resolveServices` as an **injected callback**
 * (`(list, p) => Service[]`), which cannot express "ambiguous" and is shared
 * with other callees.
 *
 * The callee's signature is indeed stuck. Its *injection site* is not — the
 * dispatch entry in `ai-booking-depth-dispatch.build.ts` holds `ctx.services`
 * and `ctx.params` and already returns `CommandResult` objects. Guarding there
 * needs no signature change anywhere.
 *
 * That is the fifth time in this campaign a "blocked" label described the
 * helper while the refusal belonged to the caller (§225, §228, §234, §235).
 */
import { BOOKING_DEPTH_DISPATCH_MAP } from './ai-booking-depth-dispatch.build.js';

const service = (id: string, name: string) => ({ id, name }) as never;

const MASSAGES = [
  service('svc-swedish', 'Swedish massage'),
  service('svc-deep', 'Deep tissue massage'),
];

const handler = () => {
  const h = BOOKING_DEPTH_DISPATCH_MAP.get('create_multi_service_booking');
  if (!h) throw new Error('dispatch entry missing');
  return h;
};

const ctxFor = (params: Record<string, unknown>) => ({
  // The dispatch entry resolves the business row first and refuses if it is
  // missing; the service guard sits after that on purpose, because "business
  // not found" is the more fundamental precondition.
  resolveBusinessRow: jest.fn(async () => ({ id: 'biz-1' })),
  businessId: 'biz-1',
  params,
  employees: [],
  services: MASSAGES,
  customers: [],
  resolveEmployee: jest.fn(),
  resolveServices: jest.fn(),
  resolveCustomer: jest.fn(),
  userId: 'user-1',
});

const svcFor = () =>
  ({
    businessRepo: { findOne: jest.fn().mockResolvedValue({ id: 'biz-1' }) },
    handleCreateMultiServiceBooking: jest.fn(async () => {
      throw new Error('booked on an ambiguous service');
    }),
  }) as never;

describe('create_multi_service_booking service ambiguity (D5, §238)', () => {
  it('books nothing when the service name matches two services', async () => {
    const svc = svcFor();
    const result: any = await handler()(
      svc,
      ctxFor({ serviceNames: ['massage'] }) as never,
    );

    expect(result.success).toBe(false);
    expect(
      (svc as never as { handleCreateMultiServiceBooking: jest.Mock })
        .handleCreateMultiServiceBooking,
    ).not.toHaveBeenCalled();
  });

  it('names both candidates', async () => {
    const result: any = await handler()(
      svcFor(),
      ctxFor({ serviceNames: ['massage'] }) as never,
    );

    expect(result.details?.clarify).toBe(true);
    expect(result.details?.requestedName).toBe('massage');
    expect(
      (result.details.candidates as Array<{ id: string }>)
        .map((c) => c.id)
        .sort(),
    ).toEqual(['svc-deep', 'svc-swedish']);
  });

  it('lets an unambiguous multi-service cart through', async () => {
    // Two *distinct* exact names is the ordinary multi-service case and must
    // not be mistaken for a tie — the whole point of this command.
    const svc = svcFor();
    await expect(
      handler()(
        svc,
        ctxFor({
          serviceNames: ['Swedish massage', 'Deep tissue massage'],
        }) as never,
      ),
    ).rejects.toThrow(/booked on an ambiguous service/);
  });
});
