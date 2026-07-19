import { describe, expect, it } from 'vitest';
import {
  checkoutClientReturnFields,
  resolveCheckoutReturnOrigin,
} from './checkout-client-surface.util.js';

describe('checkout-client-surface.util (e2e-bug.18)', () => {
  it.each([
    {
      id: 'e2e-bug.18-http-origin',
      origin: 'http://localhost:5174/s/demo/book',
      expected: 'http://localhost:5174',
    },
    {
      id: 'e2e-bug.18-https-origin',
      origin: 'https://book.example.com',
      expected: 'https://book.example.com',
    },
    {
      id: 'e2e-bug.18-skips-capacitor',
      origin: 'capacitor://localhost',
      expected: undefined,
    },
  ])('$id resolveCheckoutReturnOrigin', ({ origin, expected }) => {
    expect(resolveCheckoutReturnOrigin(origin)).toBe(expected);
  });

  it('always sets clientSurface consumer', () => {
    expect(checkoutClientReturnFields('http://127.0.0.1:5174')).toEqual({
      clientSurface: 'consumer',
      returnOrigin: 'http://127.0.0.1:5174',
    });
    expect(checkoutClientReturnFields('optischedule://book')).toEqual({
      clientSurface: 'consumer',
    });
  });
});
