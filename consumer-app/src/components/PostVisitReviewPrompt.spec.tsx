import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import { PostVisitReviewPrompt } from './PostVisitReviewPrompt.js';

const createPostBookingSupportTicket = vi.fn();
let lastAlertButtons: Array<{ text?: string; handler?: () => boolean | void }> = [];

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonAlert: (props: {
      buttons?: Array<{ text?: string; handler?: () => boolean | void }>;
      header?: string;
      message?: string;
    }) => {
      lastAlertButtons = props.buttons ?? [];
      return (
        <div data-testid="ion-alert">
          <span>{props.header}</span>
          <span>{props.message}</span>
        </div>
      );
    },
  };
});

vi.mock('../services/public-api.js', () => ({
  createPostBookingSupportTicket: (...args: unknown[]) =>
    createPostBookingSupportTicket(...args),
  submitCustomerReview: vi.fn(),
}));

vi.mock('../lib/app-analytics.js', () => ({
  track: vi.fn(),
}));

describe('PostVisitReviewPrompt (e2e-bug.42)', () => {
  let container: HTMLDivElement;
  let root: Root;
  const open = vi.fn();

  beforeEach(() => {
    createPostBookingSupportTicket.mockReset();
    lastAlertButtons = [];
    open.mockReset();
    vi.stubGlobal('open', open);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  function render(opts?: { zendeskWidgetConfigured?: boolean }) {
    act(() => {
      root.render(
        <PostVisitReviewPrompt
          isOpen
          slug="demo-salon"
          booking={{ id: 'bk-1', serviceName: 'Haircut' }}
          copy={CONSUMER_COPY_EN}
          customerToken="tok-1"
          customerEmail="customer@example.com"
          zendeskWidgetConfigured={opts?.zendeskWidgetConfigured ?? false}
          onClose={vi.fn()}
        />,
      );
    });
  }

  function unhappyHandler() {
    return lastAlertButtons.find(
      (button) => button.text === CONSUMER_COPY_EN.postBookingSatisfactionUnhappy,
    )?.handler;
  }

  it('keeps the satisfaction alert open while unhappy handoff runs (return false)', () => {
    render({ zendeskWidgetConfigured: false });
    const handler = unhappyHandler();
    expect(handler).toBeTypeOf('function');
    expect(handler?.()).toBe(false);
  });

  it('does not create a Zendesk ticket when the widget is not configured', async () => {
    render({ zendeskWidgetConfigured: false });
    const handler = unhappyHandler();
    await act(async () => {
      handler?.();
      await Promise.resolve();
    });
    expect(createPostBookingSupportTicket).not.toHaveBeenCalled();
  });

  it('creates a Zendesk ticket when the widget is configured', async () => {
    createPostBookingSupportTicket.mockResolvedValue({ id: 'zd-1' });
    render({ zendeskWidgetConfigured: true });
    const handler = unhappyHandler();
    await act(async () => {
      handler?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(createPostBookingSupportTicket).toHaveBeenCalledWith(
      'demo-salon',
      'tok-1',
      expect.objectContaining({ bookingId: 'bk-1' }),
    );
  });
});
