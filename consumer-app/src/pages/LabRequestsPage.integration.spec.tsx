import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LabRequestsPage from './LabRequestsPage.js';

const replace = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace }),
  };
});

describe('LabRequestsPage integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    replace.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(initialPath: string) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[initialPath]}>
          <Route path="/s/:slug/lab-requests">
            <LabRequestsPage slug="city-clinic" />
          </Route>
        </MemoryRouter>,
      );
    });
  }

  it('redirects to lab-to-book when no booking token is present', async () => {
    render('/s/city-clinic/lab-requests');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(replace).toHaveBeenCalledWith('/s/city-clinic/lab-to-book');
  });

  it('redirects to book flow with clinicOrderToken prefill', async () => {
    render(
      '/s/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=token-abc',
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(replace).toHaveBeenCalledWith(
      '/s/city-clinic/book/svc-1?clinicOrderToken=token-abc',
    );
  });
});
