import { rescueConsumerClinicLabBookingIntent } from './ai-clinic-lab-booking.util.js';
import {
  BOOK_LAB_FROM_ORDER_BOUNDARY_PROMPTS,
  BOOK_LAB_FROM_ORDER_PROMPTS,
  BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS,
  CUSTOMER_BOOK_LAB_FROM_ORDER_CLASSIFIER_RULES,
} from './ai-book-lab-from-order.fixtures.js';
import { BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS } from './ai-book-lab-from-order-multilingual.fixtures.js';
import {
  buildBookLabFromOrderNavigate,
  extractTestNameFromBookLabFromOrderPrompt,
  formatBookLabFromOrderSummary,
  isBookLabFromOrderIntent,
  isBookLabFromOrderPrompt,
  parseBookLabFromOrderFromPrompt,
  rescueBookLabFromOrderIntent,
} from './ai-book-lab-from-order.util.js';
import {
  isBookLabCollectionPrompt,
  isListMyLabBookingRequestsPrompt,
} from './ai-clinic-lab-booking.util.js';
import { isBookLabCollectionNearestCompoundPrompt } from './ai-book-lab-collection-nearest.util.js';
import { AI_COMMAND_EVAL_BOOK_LAB_FROM_ORDER_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-book-lab-from-order.util (ai-cmd-customer-4.14.4)', () => {
  it('exports classifier rules for book_lab_from_order', () => {
    expect(CUSTOMER_BOOK_LAB_FROM_ORDER_CLASSIFIER_RULES).toContain(
      'book_lab_from_order',
    );
  });

  it.each(BOOK_LAB_FROM_ORDER_PROMPTS.map((row) => [row.id, row] as const))(
    'detects book_lab_from_order for $id',
    (_id, row) => {
      expect(isBookLabFromOrderPrompt(row.prompt)).toBe(true);
      expect(rescueBookLabFromOrderIntent(row.prompt, 'unknown')?.action).toBe(
        'book_lab_from_order',
      );
      expect(
        rescueConsumerClinicLabBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe('book_lab_from_order');
    },
  );

  it.each(
    BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual book_lab_from_order for $id', (_id, row) => {
    expect(isBookLabFromOrderPrompt(row.prompt)).toBe(true);
  });

  it.each(
    BOOK_LAB_FROM_ORDER_BOUNDARY_PROMPTS.map((row) => [row.id, row] as const),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isBookLabFromOrderPrompt(row.prompt)).toBe(false);
  });

  it.each(BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS)(
    'rescues book_lab_from_order for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueBookLabFromOrderIntent(prompt, misclassifiedAction)?.action,
      ).toBe('book_lab_from_order');
    },
  );

  it('parses order and test hints', () => {
    expect(
      parseBookLabFromOrderFromPrompt('Book collection for lab order ord-42')
        ?.orderId,
    ).toBe('ord-42');
    expect(
      extractTestNameFromBookLabFromOrderPrompt(
        'Book my CBC lab order collection',
      ),
    ).toBe('CBC');
    expect(isBookLabFromOrderIntent('book_lab_from_order')).toBe(true);
  });

  it('builds navigate and summaries', () => {
    expect(buildBookLabFromOrderNavigate({ orderId: 'ord-1' })).toEqual({
      path: '/lab-to-book',
      query: { section: 'my-lab-requests', orderId: 'ord-1' },
    });
    expect(
      formatBookLabFromOrderSummary({
        displayNames: 'CBC',
        collectionServiceName: 'Blood draw',
        orderCount: 1,
      }),
    ).toContain('Lab to book');
    expect(
      formatBookLabFromOrderSummary({
        displayNames: null,
        collectionServiceName: 'Blood draw',
        orderCount: 0,
      }),
    ).toContain('No open lab orders');
  });

  it('does not steal generic list or book collection prompts', () => {
    expect(
      isListMyLabBookingRequestsPrompt(
        'What lab appointments do I need to book?',
      ),
    ).toBe(true);
    expect(isBookLabCollectionPrompt('Book my lab collection')).toBe(true);
    expect(isBookLabFromOrderPrompt('Book my lab collection')).toBe(false);
    expect(
      isBookLabCollectionNearestCompoundPrompt('Book lab draw earliest slot'),
    ).toBe(true);
    expect(isBookLabFromOrderPrompt('Book lab draw earliest slot')).toBe(false);
  });

  it('returns null when action already matches', () => {
    expect(
      rescueBookLabFromOrderIntent(
        'Book collection for my lab order',
        'book_lab_from_order',
      ),
    ).toBeNull();
  });

  it('registers eval cases', () => {
    expect(AI_COMMAND_EVAL_BOOK_LAB_FROM_ORDER_CASES.length).toBeGreaterThan(0);
  });

  it('covers heuristic multilingual prompts', () => {
    expect(
      isBookLabFromOrderPrompt('Ամրագրիր հավաքումը իմ լաբ պատվերի համար'),
    ).toBe(true);
    expect(
      isBookLabFromOrderPrompt(
        'Забронируй забор для моего лабораторного заказа',
      ),
    ).toBe(true);
    expect(
      formatBookLabFromOrderSummary({
        displayNames: 'CBC, BMP',
        collectionServiceName: 'Blood draw',
        orderCount: 2,
      }),
    ).toContain('2 lab orders');
  });

  it('covers additional heuristic and order-id branches', () => {
    expect(
      isBookLabFromOrderPrompt('Schedule my draw from the lab to book screen'),
    ).toBe(true);
    expect(isBookLabFromOrderPrompt('Book my pending lab order today')).toBe(
      true,
    );
    expect(
      parseBookLabFromOrderFromPrompt(
        'Book lab order aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      )?.orderId,
    ).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(isBookLabFromOrderPrompt('')).toBe(false);
    expect(
      isBookLabFromOrderPrompt('Fill intake and then book blood draw'),
    ).toBe(false);
    expect(
      parseBookLabFromOrderFromPrompt('Book collection for lab order ord-99', {
        orderId: 'ord-override',
      })?.orderId,
    ).toBe('ord-override');
  });
});
