import {
  buildAutoLabBookingRequestCallbackTaskDraft,
  buildAutoResultReviewTaskDraft,
  buildAutoSpecimenCollectionTaskDraft,
  isOverdueLabBookingRequestCallback,
  isOverdueSpecimenCollection,
  isResultInReviewQueue,
  isSpecimenInCollectionQueue,
  resolveLabBookingRequestCallbackDueAt,
  resolveResultReviewDueAt,
  resolveSpecimenCollectionDueAt,
  shouldResolveAutoLabBookingRequestCallbackTask,
  shouldResolveAutoResultReviewTask,
  shouldResolveAutoSpecimenCollectionTask,
} from './clinic-task-auto.util.js';
import {
  CLINIC_LAB_BOOKING_REQUEST_CALLBACK_SCENARIOS,
  CLINIC_OVERDUE_SPECIMEN_SCENARIOS,
  CLINIC_RESULT_REVIEW_AUTO_TASK_SCENARIOS,
} from './clinic-task-auto.fixtures.js';

describe('clinic-task-auto.util', () => {
  it.each(CLINIC_LAB_BOOKING_REQUEST_CALLBACK_SCENARIOS)(
    'lab booking request callback scenario $id => overdue=$overdue',
    ({ status, bookingRequestPushedAt, collectionBookingId, now, overdue }) => {
      expect(
        isOverdueLabBookingRequestCallback(
          {
            status,
            bookingRequestPushedAt,
            collectionBookingId,
          },
          now,
        ),
      ).toBe(overdue);
    },
  );

  it.each(CLINIC_OVERDUE_SPECIMEN_SCENARIOS)(
    'overdue specimen scenario $id => overdue=$overdue',
    ({ status, bookingStartTime, specimenCreatedAt, now, overdue }) => {
      expect(
        isOverdueSpecimenCollection(
          {
            status,
            bookingStartTime,
            specimenCreatedAt,
          },
          now,
        ),
      ).toBe(overdue);
    },
  );

  it.each(CLINIC_RESULT_REVIEW_AUTO_TASK_SCENARIOS)(
    'result review queue scenario $id',
    ({ status, shouldEnsure, shouldResolve }) => {
      expect(isResultInReviewQueue(status as never)).toBe(shouldEnsure);
      if (shouldResolve) {
        expect(
          shouldResolveAutoResultReviewTask('Completed', status as never),
        ).toBe(true);
      }
    },
  );

  it('resolves specimen collection tasks when leaving the collection queue', () => {
    expect(
      shouldResolveAutoSpecimenCollectionTask('NotCollected', 'Collected'),
    ).toBe(true);
    expect(
      shouldResolveAutoSpecimenCollectionTask(
        'NotCollected',
        'RecollectRequired',
      ),
    ).toBe(false);
  });

  it('builds auto-managed result review task drafts', () => {
    const completedAt = new Date('2026-06-23T12:00:00.000Z');
    const draft = buildAutoResultReviewTaskDraft({
      businessId: 'biz-1',
      resultId: 'result-1',
      customerId: 'cust-1',
      bookingId: 'book-1',
      testOrderId: 'order-1',
      testName: 'CBC',
      completedAt,
      assigneeEmployeeId: 'emp-1',
      // Pin the clock. resolveResultReviewDueAt clamps a due date that is
      // already past up to `now`, so without this the assertion below only
      // holds while the real clock is within CLINIC_RESULT_REVIEW_DUE_HOURS of
      // completedAt — i.e. it passed in June 2026 and rots thereafter.
      now: completedAt,
    });

    expect(draft).toEqual(
      expect.objectContaining({
        taskType: 'ResultReview',
        title: 'Review CBC',
        testResultId: 'result-1',
        isAutoManaged: true,
        priority: 'high',
        assigneeEmployeeId: 'emp-1',
      }),
    );
    expect(draft.dueAt).toEqual(
      resolveResultReviewDueAt(completedAt, completedAt),
    );
  });

  it('builds auto-managed overdue specimen collection task drafts', () => {
    const bookingStartTime = new Date('2026-06-23T10:00:00.000Z');
    const specimenCreatedAt = new Date('2026-06-23T09:00:00.000Z');
    const draft = buildAutoSpecimenCollectionTaskDraft({
      customerId: 'cust-1',
      bookingId: 'book-1',
      testOrderId: 'order-1',
      specimenId: 'spec-1',
      orderDisplayNames: 'Lipid panel',
      bookingStartTime,
      specimenCreatedAt,
      assigneeEmployeeId: 'emp-1',
    });

    expect(draft).toEqual(
      expect.objectContaining({
        taskType: 'SpecimenCollection',
        title: 'Collect Lipid panel',
        specimenId: 'spec-1',
        isAutoManaged: true,
      }),
    );
    expect(draft.dueAt).toEqual(
      resolveSpecimenCollectionDueAt({ bookingStartTime, specimenCreatedAt }),
    );
  });

  it('falls back to now when review due date is in the past', () => {
    const completedAt = new Date('2026-06-23T08:00:00.000Z');
    const now = new Date('2026-06-23T20:00:00.000Z');
    expect(resolveResultReviewDueAt(completedAt, now)).toEqual(now);
  });

  it('builds auto-managed lab booking request callback task drafts', () => {
    const pushedAt = new Date('2026-06-20T10:00:00.000Z');
    const draft = buildAutoLabBookingRequestCallbackTaskDraft({
      customerId: 'cust-1',
      bookingId: 'visit-booking-1',
      testOrderId: 'order-1',
      orderDisplayNames: 'CBC, Lipid panel',
      collectionServiceName: 'Lab blood draw',
      pushedAt,
      assigneeEmployeeId: 'emp-1',
    });

    expect(draft).toEqual(
      expect.objectContaining({
        taskType: 'PatientCallback',
        title: 'Follow up: CBC, Lipid panel collection not booked',
        testOrderId: 'order-1',
        isAutoManaged: true,
        priority: 'normal',
        assigneeEmployeeId: 'emp-1',
      }),
    );
    expect(draft.dueAt).toEqual(
      resolveLabBookingRequestCallbackDueAt(pushedAt),
    );
  });

  it('resolves lab booking request callback tasks when collection is booked', () => {
    expect(
      shouldResolveAutoLabBookingRequestCallbackTask({
        status: 'NotCollected',
        bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
        collectionBookingId: 'collection-booking-1',
      }),
    ).toBe(true);
    expect(
      shouldResolveAutoLabBookingRequestCallbackTask({
        status: 'NotCollected',
        bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
        collectionBookingId: null,
      }),
    ).toBe(false);
  });

  it('builds generic lab booking callback titles when order names are missing', () => {
    const draft = buildAutoLabBookingRequestCallbackTaskDraft({
      customerId: 'cust-1',
      testOrderId: 'order-1',
      pushedAt: new Date('2026-06-20T10:00:00.000Z'),
    });
    expect(draft.title).toBe('Follow up: lab order collection not booked');
    expect(draft.notes).toContain('3 days');
  });

  it('builds generic specimen titles when order names are missing', () => {
    const draft = buildAutoSpecimenCollectionTaskDraft({
      customerId: 'cust-1',
      testOrderId: 'order-1',
      specimenId: 'spec-1',
      specimenCreatedAt: new Date('2026-06-23T08:00:00.000Z'),
    });
    expect(draft.title).toBe('Collect specimen');
  });
});
