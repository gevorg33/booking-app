import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SalonTabRoute } from './SalonTabRoute.js';
import type { PublicBusinessProfile } from '../lib/types.js';

const replace = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace, push: vi.fn() }),
  };
});

const salonProfile = {
  id: 'biz-1',
  name: 'Demo Salon',
  slug: 'demo-salon',
  timezone: 'UTC',
  locale: 'en',
  currency: 'USD',
  branding: { primaryColor: '#336699' },
  publicBookingEnabled: true,
  businessType: 'salon',
} as PublicBusinessProfile;

const clinicProfile = {
  ...salonProfile,
  name: 'City Clinic',
  slug: 'city-clinic',
  businessType: 'clinic',
} as PublicBusinessProfile;

let tenantState = {
  slug: 'demo-salon',
  profile: salonProfile as PublicBusinessProfile | null,
  loading: false,
  error: '',
  fromCache: false,
};

vi.mock('../hooks/use-tenant-bootstrap.js', () => ({
  useTenantBootstrap: () => tenantState,
}));

vi.mock('../hooks/use-consumer-native-push.js', () => ({
  useConsumerNativePush: () => undefined,
}));

vi.mock('../lib/consumer-referral.util.js', () => ({
  captureReferralFromSearch: vi.fn(),
}));

vi.mock('./SalonTabChrome.js', () => ({
  SalonTabChrome: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="salon-tab-chrome">{children}</div>
  ),
}));

vi.mock('./SalonTabPageContent.js', () => ({
  SalonTabPageContent: ({ page }: { page: string }) => (
    <div data-testid="salon-tab-page">{page}</div>
  ),
}));

describe('SalonTabRoute (e2e-bug.43)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    tenantState = {
      slug: 'demo-salon',
      profile: salonProfile,
      loading: false,
      error: '',
      fromCache: false,
    };
    replace.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(page: 'results' | 'lab-to-book' | 'home', path: string) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <Route path="/s/:slug/:tab?">
            <SalonTabRoute page={page} />
          </Route>
        </MemoryRouter>,
      );
    });
  }

  it('redirects non-clinic /results deep links to home without mounting clinic content', () => {
    render('results', '/s/demo-salon/results');
    expect(replace).toHaveBeenCalledWith('/s/demo-salon/home');
    expect(container.querySelector('[data-testid="salon-tab-page"]')).toBeNull();
  });

  it('redirects non-clinic /lab-to-book deep links to home', () => {
    render('lab-to-book', '/s/demo-salon/lab-to-book');
    expect(replace).toHaveBeenCalledWith('/s/demo-salon/home');
    expect(container.querySelector('[data-testid="salon-tab-page"]')).toBeNull();
  });

  it('mounts clinic tabs for clinic businesses', () => {
    tenantState = {
      slug: 'city-clinic',
      profile: clinicProfile,
      loading: false,
      error: '',
      fromCache: false,
    };
    render('results', '/s/city-clinic/results');
    expect(replace).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="salon-tab-page"]')?.textContent).toBe(
      'results',
    );
  });

  it('e2e-bug.20: shows friendly salon-not-found with a way back (not raw axios)', () => {
    tenantState = {
      slug: 'not-a-real-salon-xyz',
      profile: null,
      loading: false,
      error: 'Salon not found',
      fromCache: false,
    };
    render('home', '/s/not-a-real-salon-xyz/home');
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Salon not found');
    expect(container.textContent).toContain('Find a salon');
    expect(container.textContent).not.toMatch(/Request failed with status code/i);
  });

  it('e2e-bug.4: salon-not-found back control is a native button (not ion-button)', () => {
    tenantState = {
      slug: 'not-a-real-salon-xyz',
      profile: null,
      loading: false,
      error: 'Salon not found',
      fromCache: false,
    };
    render('home', '/s/not-a-real-salon-xyz/home');
    const back = Array.from(container.querySelectorAll('button.consumer-action-button')).find(
      (el) => /Find a salon/i.test(el.textContent || ''),
    );
    expect(back).toBeTruthy();
    expect(back?.closest('ion-button')).toBeNull();
  });
});
