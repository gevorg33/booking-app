import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { PublicMyLabBookingRequestsSection } from './public-my-lab-booking-requests-section';

describe('PublicMyLabBookingRequestsSection integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(
    props: Partial<React.ComponentProps<typeof PublicMyLabBookingRequestsSection>> = {},
  ) {
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <PublicMyLabBookingRequestsSection
            requests={[]}
            loading={false}
            error={null}
            locale="en"
            {...props}
          />
        </I18nProvider>,
      );
    });
  }

  it('renders empty state', () => {
    render();
    expect(container.textContent).toContain(
      'No pending lab collection appointments.',
    );
  });

  it('renders pending lab booking requests with book link', () => {
    render({
      requests: [
        {
          orderId: 'order-1',
          displayNames: 'CBC, Lipid panel',
          collectionServiceId: 'svc-1',
          collectionServiceName: 'Lab blood draw',
          token: 'token-abc',
          pushedAt: '2026-06-22T10:00:00.000Z',
          collectionBookingId: null,
          bookUrl:
            'https://app.test/book/city-clinic/any/availability?serviceId=svc-1&clinicOrderToken=token-abc',
        },
      ],
    });

    expect(container.textContent).toContain('CBC, Lipid panel');
    expect(container.textContent).toContain('Book: Lab blood draw');
    expect(container.textContent).toContain('Book collection');

    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toContain('clinicOrderToken=token-abc');
  });

  it('falls back to unnamed order label when display names are missing', () => {
    render({
      requests: [
        {
          orderId: 'order-2',
          displayNames: null,
          collectionServiceId: 'svc-1',
          collectionServiceName: 'Lab blood draw',
          token: 'token-2',
          pushedAt: '2026-06-22T11:00:00.000Z',
          collectionBookingId: null,
          bookUrl: 'https://app.test/book/city-clinic/any/availability',
        },
      ],
    });

    expect(container.textContent).toContain('Lab order');
  });

  it('renders loading state', () => {
    render({ loading: true });
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders error state', () => {
    render({ loading: false, error: 'Could not load lab booking requests' });
    expect(container.textContent).toContain('Could not load lab booking requests');
  });
});
