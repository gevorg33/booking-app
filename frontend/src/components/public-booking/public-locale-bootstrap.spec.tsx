import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PublicLocaleBootstrap } from './public-locale-bootstrap';

describe('PublicLocaleBootstrap', () => {
  it('renders nothing (deprecated no-op)', () => {
    expect(PublicLocaleBootstrap({ businessLocale: 'hy' })).toBeNull();
    expect(renderToString(<PublicLocaleBootstrap businessLocale="en" />)).toBe('');
  });
});
