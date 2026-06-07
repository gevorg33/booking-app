import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConsumerMyLabBookingRequestsList } from './ConsumerMyLabBookingRequestsList.js';

describe('ConsumerMyLabBookingRequestsList', () => {
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
    props: Partial<React.ComponentProps<typeof ConsumerMyLabBookingRequestsList>> = {},
  ) {
    act(() => {
      root.render(
        <ConsumerMyLabBookingRequestsList
          slug="city-clinic"
          requests={[]}
          loading={false}
          error={null}
          locale="en"
          {...props}
        />,
      );
    });
  }

  it('renders empty state', () => {
    render();
    expect(container.textContent).toContain('No pending lab collection appointments.');
  });

  it('renders empty state in Armenian when locale is hy', () => {
    render({ locale: 'hy' });
    expect(container.textContent).toContain('Սպասող լաբորատոր հավաքման ամրագրումներ չկան');
  });

  it('renders pending lab booking requests with in-app book link', () => {
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

    const button = container.querySelector('ion-button');
    expect(button?.getAttribute('router-link')).toBe(
      '/s/city-clinic/book/svc-1?clinicOrderToken=token-abc',
    );
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
    expect(container.querySelector('ion-spinner')).toBeTruthy();
  });

  it('renders error state', () => {
    render({ error: 'Could not load lab booking requests' });
    expect(container.textContent).toContain('Could not load lab booking requests');
  });
});
