import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { I18nProvider } from '@/i18n/I18nProvider';
import { PublicCheckoutIntakeStep } from './public-checkout-intake-step';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
}));

vi.mock('@/lib/public-api', () => ({
  getPublicPreVisitIntakeConfig: vi.fn(),
  createPublicPreVisitIntakeDraft: vi.fn(),
  getPublicPreVisitIntakeFlow: vi.fn(),
  startPublicPreVisitIntake: vi.fn(),
  submitPublicPreVisitIntakeAnswer: vi.fn(),
}));

import {
  createPublicPreVisitIntakeDraft,
  getPublicPreVisitIntakeConfig,
  getPublicPreVisitIntakeFlow,
} from '@/lib/public-api';

const mockedGetConfig = vi.mocked(getPublicPreVisitIntakeConfig);
const mockedCreateDraft = vi.mocked(createPublicPreVisitIntakeDraft);
const mockedGetFlow = vi.mocked(getPublicPreVisitIntakeFlow);

describe('PublicCheckoutIntakeStep i18n integration (i18n-clinic-v2-8)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    mockedGetConfig.mockResolvedValue({
      offersPreVisitIntake: true,
      questionnaire: {
        id: 'q-1',
        code: 'pre-visit-intake',
        title: 'Pre-visit intake',
        revision: 1,
      },
    });
    mockedCreateDraft.mockResolvedValue({
      id: 'intake-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: null,
      questionnaireId: 'q-1',
      responseId: null,
      status: 'assigned',
      assignedByEmployeeId: null,
      completedAt: null,
      createdAt: '2026-06-07T09:00:00.000Z',
      updatedAt: '2026-06-07T09:00:00.000Z',
      questionnaire: {
        id: 'q-1',
        code: 'pre-visit-intake',
        title: 'Pre-visit intake',
        revision: 1,
      },
    });
    mockedGetFlow.mockResolvedValue({
      id: 'intake-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: null,
      questionnaireId: 'q-1',
      responseId: null,
      status: 'assigned',
      assignedByEmployeeId: null,
      completedAt: null,
      createdAt: '2026-06-07T09:00:00.000Z',
      updatedAt: '2026-06-07T09:00:00.000Z',
      questionnaire: {
        id: 'q-1',
        code: 'pre-visit-intake',
        title: 'Pre-visit intake',
        revision: 1,
      },
      introTitle: null,
      introBody: null,
      nextQuestion: null,
      answers: {},
      isCompleted: false,
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  function render(locale: 'en' | 'hy' | 'ru' = 'en') {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale={locale}>
            <PublicCheckoutIntakeStep
              slug="city-clinic"
              serviceId="svc-1"
              onSkip={() => undefined}
              onCompleted={() => undefined}
            />
          </I18nProvider>
        </QueryClientProvider>,
      );
    });
  }

  it('renders localized skip action when intake draft fails in Armenian', async () => {
    const hy = getMessages('hy');
    mockedCreateDraft.mockRejectedValueOnce(new Error('draft failed'));
    render('hy');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });

    expect(container.textContent).toContain(translate(hy, 'clinic.publicIntake.skip'));
    expect(container.textContent).toContain(translate(hy, 'clinic.intakeForm.loadFailed'));
  });

  it('renders localized skip action when intake draft fails in Russian', async () => {
    const ru = getMessages('ru');
    mockedCreateDraft.mockRejectedValueOnce(new Error('draft failed'));
    render('ru');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });

    expect(container.textContent).toContain(translate(ru, 'clinic.publicIntake.skip'));
    expect(container.textContent).toContain(translate(ru, 'clinic.intakeForm.loadFailed'));
  });
});
