import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuidePage from './GuidePage.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import {
  CONSUMER_CLINIC_GUIDE_TOPIC_ID,
  consumerGuideTopicElementId,
} from '../lib/consumer-guide.util.js';
import { consumerMobileGuide } from '../lib/mobile-guide/index.ts';

const replace = vi.fn();
const push = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace, push }),
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
  profile: salonProfile,
  loading: false,
  error: '',
};

vi.mock('../hooks/use-tenant-bootstrap.js', () => ({
  useTenantBootstrap: () => tenantState,
}));

vi.mock('../hooks/use-consumer-copy.js', () => ({
  useConsumerCopy: () => ({
    locale: 'en',
    copy: {
      guidePageTitle: 'Help & guide',
      guidePageSubtitle: 'Step-by-step help for booking and your account.',
      guidePageTopicsLabel: 'Topics',
      guidePageBack: 'Back',
      guidePageOpenInApp: 'Open in app',
      guidePageAskSection: 'Ask about this section',
      guideWalkThroughTopic: 'Walk me through {topic}',
      guidePageLoadError: 'Could not load the guide for this business.',
    },
  }),
}));

const fireConsumerGuideAssistantSeed = vi.fn();

vi.mock('../lib/consumer-guide-assistant-seed.util.js', () => ({
  fireConsumerGuideAssistantSeed: (...args: unknown[]) =>
    fireConsumerGuideAssistantSeed(...args),
}));

vi.mock('../components/ConsumerBookingAssistant.js', () => ({
  ConsumerBookingAssistant: () => (
    <div data-testid="consumer-booking-assistant">Booking assistant</div>
  ),
}));

function clinicTopicTitle(): string {
  const resolved = consumerMobileGuide.resolveGuidePlaybook(
    CONSUMER_CLINIC_GUIDE_TOPIC_ID,
    'en',
    { surface: 'customer', vertical: 'clinic' },
  );
  return resolved?.title ?? CONSUMER_CLINIC_GUIDE_TOPIC_ID;
}

describe('GuidePage (ai-guide-1.9.14)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tenantState = {
      slug: 'demo-salon',
      profile: salonProfile,
      loading: false,
      error: '',
    };
    replace.mockReset();
    push.mockReset();
    fireConsumerGuideAssistantSeed.mockReset();
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(initialPath: string) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[initialPath]}>
          <Route path="/s/:slug/guide">
            <GuidePage />
          </Route>
        </MemoryRouter>,
      );
    });
  }

  async function flushEffects(ms = 120) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  }

  it('renders guide TOC and section anchors', async () => {
    render('/s/demo-salon/guide');

    await flushEffects();

    expect(container.textContent).toContain('Help & guide');
    expect(container.textContent).toContain('Topics');
    expect(container.querySelector('.consumer-guide-toc')).toBeTruthy();
    expect(container.querySelector('#guide-topic-consumer-getting-started')).toBeTruthy();
  });

  it('activates topicId from query and scrolls to the section', async () => {
    render('/s/demo-salon/guide?topicId=consumer-getting-started');

    await flushEffects();

    const active = container.querySelector('.consumer-guide-toc__link--active');
    expect(active?.textContent).toMatch(/getting started/i);
    expect(scrollIntoView).toHaveBeenCalled();
    expect(
      document.getElementById(consumerGuideTopicElementId('consumer-getting-started')),
    ).toBeTruthy();
  });

  it('hides clinic guide topic for salon verticals', async () => {
    render('/s/demo-salon/guide');

    await flushEffects();

    expect(container.textContent).not.toContain(clinicTopicTitle());
    expect(
      container.querySelector(`#${consumerGuideTopicElementId(CONSUMER_CLINIC_GUIDE_TOPIC_ID)}`),
    ).toBeNull();
  });

  it('shows clinic guide topic for clinic businesses', async () => {
    tenantState = {
      slug: 'city-clinic',
      profile: clinicProfile,
      loading: false,
      error: '',
    };
    render('/s/city-clinic/guide');

    await flushEffects();

    expect(container.textContent).toContain(clinicTopicTitle());
    expect(
      container.querySelector(`#${consumerGuideTopicElementId(CONSUMER_CLINIC_GUIDE_TOPIC_ID)}`),
    ).toBeTruthy();
  });

  it('strips hidden clinic topicId deep links for salon tenants', async () => {
    render(`/s/demo-salon/guide?topicId=${CONSUMER_CLINIC_GUIDE_TOPIC_ID}`);

    await flushEffects();

    expect(replace).toHaveBeenCalledWith('/s/demo-salon/guide');
    expect(container.querySelector('.consumer-guide-toc__link--active')).toBeNull();
  });

  it('updates URL when a TOC entry is selected', async () => {
    render('/s/demo-salon/guide');

    await flushEffects();

    const tocButtons = Array.from(container.querySelectorAll('.consumer-guide-toc__link'));
    expect(tocButtons.length).toBeGreaterThan(1);

    await act(async () => {
      tocButtons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(replace).toHaveBeenCalledWith(expect.stringMatching(/topicId=[^&]+/));
  });

  it('mounts booking assistant so ask-about-section seed is received (e2e-bug.47)', async () => {
    render('/s/demo-salon/guide');

    await flushEffects();

    expect(container.querySelector('[data-testid="consumer-booking-assistant"]')).toBeTruthy();
  });

  it('seeds assistant from ask-about-section CTA with topicId', async () => {
    render('/s/demo-salon/guide');

    await flushEffects();

    const section = container.querySelector('#guide-topic-consumer-getting-started');
    const askButton = section?.querySelector('.consumer-guide-section__ask');
    expect(askButton).toBeTruthy();

    await act(async () => {
      askButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fireConsumerGuideAssistantSeed).toHaveBeenCalledWith({
      topicId: 'consumer-getting-started',
      topicTitle: expect.stringMatching(/getting started/i),
      walkThroughTemplate: 'Walk me through {topic}',
    });
  });
});
