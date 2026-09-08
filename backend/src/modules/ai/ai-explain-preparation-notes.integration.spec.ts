import { validateCommand } from './command-completion.validator.js';
import { handleExplainPreparationNotesLogic } from './ai-explain-preparation-notes.logic.js';
import {
  EXPLAIN_PREPARATION_NOTES_PROMPTS,
  EXPLAIN_PREPARATION_NOTES_RESCUE_SCENARIOS,
} from './ai-explain-preparation-notes.fixtures.js';
import { rescueExplainPreparationNotesIntent } from './ai-explain-preparation-notes.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain preparation notes integration (ai-cmd-customer-4.3.4)', () => {
  const bookingRepo = { findOne: jest.fn(), find: jest.fn() };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'City Clinic',
    })),
  };
  const serviceRepo = { find: jest.fn(async () => []) };
  const deps = { bookingRepo, businessRepo, serviceRepo } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({
      id: 'book-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-07-15T14:00:00Z'),
      endTime: new Date('2026-07-15T15:00:00Z'),
      service: {
        id: 'svc-1',
        name: 'Lipid Panel',
        metadata: {
          serviceType: 'lab_test',
          requiresFasting: true,
          preparationNotes: 'Fast 12 hours before draw.',
        },
      },
    });
  });

  it.each(EXPLAIN_PREPARATION_NOTES_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, aspect }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_preparation_notes',
        params: { aspect, bookingId: 'book-1' },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleExplainPreparationNotesLogic(
        deps,
        'biz-1',
        { aspect, bookingId: 'book-1', sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_preparation_notes');
    },
  );

  it.each(EXPLAIN_PREPARATION_NOTES_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainPreparationNotesIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'preparation_notes',
      });
    },
  );
});
