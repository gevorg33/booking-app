import {
  CREATE_TEST_ORDER_PROMPTS,
  LIST_TEST_ORDERS_PROMPTS,
  CLINIC_TEST_ORDER_RESCUE_SCENARIOS,
} from './ai-clinic-test-order.fixtures.js';
import { AWAITING_PATIENT_BOOKING_LIST_PROMPTS } from './ai-clinic-lab-booking.fixtures.js';
import {
  extractTestOrderNamesFromPrompt,
  extractVisitCustomerNameFromPrompt,
  isCreateTestOrderPrompt,
  isListTestOrdersPrompt,
  matchClinicCatalogItem,
  parseCreateTestOrderFromPrompt,
  parseListTestOrdersFromPrompt,
  rescueClinicTestOrderIntent,
} from './ai-clinic-test-order.util.js';

describe('ai-clinic-test-order.util', () => {
  it.each(CREATE_TEST_ORDER_PROMPTS)(
    'detects create test order prompt $id',
    ({ prompt, customerName, testNames }) => {
      expect(isCreateTestOrderPrompt(prompt)).toBe(true);
      const parsed = parseCreateTestOrderFromPrompt(prompt);
      expect(parsed?.customerName).toBe(customerName);
      expect(parsed?.testNames).toEqual(testNames);
    },
  );

  it.each(LIST_TEST_ORDERS_PROMPTS)(
    'detects list test orders prompt $id',
    ({ prompt }) => {
      expect(isListTestOrdersPrompt(prompt)).toBe(true);
      expect(parseListTestOrdersFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(AWAITING_PATIENT_BOOKING_LIST_PROMPTS)(
    'detects awaiting patient booking list prompt $id',
    ({ prompt }) => {
      expect(isListTestOrdersPrompt(prompt)).toBe(true);
      expect(
        parseListTestOrdersFromPrompt(prompt)?.awaitingPatientBooking,
      ).toBe(true);
    },
  );

  it('extracts visit customer names from possessive phrasing', () => {
    expect(
      extractVisitCustomerNameFromPrompt(
        "Order CBC and lipid panel for Maria's visit tomorrow",
      ),
    ).toBe('Maria');
  });

  it('splits comma and and-separated test names', () => {
    expect(
      extractTestOrderNamesFromPrompt(
        'Order CBC, BMP and lipid panel for John',
      ),
    ).toEqual(['CBC', 'BMP', 'lipid panel']);
  });

  it('matches catalog test types and panels by code or title', () => {
    const testTypes = [
      {
        id: 'type-1',
        code: 'CBC',
        title: 'Complete blood count',
        isActive: true,
      },
    ] as never[];
    const testPanels = [
      { id: 'panel-1', code: 'LIPID', title: 'Lipid panel', isActive: true },
    ] as never[];

    expect(
      matchClinicCatalogItem({ label: 'CBC', testTypes, testPanels })?.type,
    ).toBe('test_type');
    expect(
      matchClinicCatalogItem({ label: 'lipid panel', testTypes, testPanels })
        ?.type,
    ).toBe('test_panel');
  });

  it.each(CLINIC_TEST_ORDER_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueClinicTestOrderIntent(prompt, misclassifiedAction);
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  describe('multilingual helpers (i18n-clinic-v2-ai-1)', () => {
    it('does not treat my-results prompts as list_test_orders', () => {
      expect(
        isListTestOrdersPrompt('What is the status of my CBC result'),
      ).toBe(false);
      expect(isListTestOrdersPrompt('status of my latest result')).toBe(false);
      expect(
        isListTestOrdersPrompt('show status for my lipid result tomorrow'),
      ).toBe(false);
    });

    it('extracts Armenian customers from possessive lab-order phrasing', () => {
      expect(
        extractVisitCustomerNameFromPrompt(
          'Ցույց տուր Գևորգի լաբորատոր պատվերները',
        ),
      ).toBe('Գևորգ');
      expect(
        extractVisitCustomerNameFromPrompt('Ցուցադրի՛ր Անիի թեստի պատվերները'),
      ).toBe('Անի');
    });

    it('extracts Russian customers from visit and queue phrasing', () => {
      expect(
        extractVisitCustomerNameFromPrompt(
          'Закажи CBC для визита Марии завтра',
        ),
      ).toBe('Мария');
      expect(
        extractVisitCustomerNameFromPrompt(
          'Покажи тестовые заказы Джона в пятницу',
        ),
      ).toBe('Джон');
      expect(
        extractVisitCustomerNameFromPrompt(
          'Какие тестовые заказы у Марии на завтра',
        ),
      ).toBe('Мария');
    });
  });
});
