import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolvePublicImageUrl } from './resolve-public-image-url.js';

vi.mock('../services/api-base.js', () => ({
  getPublicApiBaseUrl: () => 'http://127.0.0.1:3001',
}));

describe('resolve-public-image-url', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined for blank urls', () => {
    expect(resolvePublicImageUrl(undefined)).toBeUndefined();
    expect(resolvePublicImageUrl('   ')).toBeUndefined();
  });

  it('prefixes relative paths with API base', () => {
    expect(resolvePublicImageUrl('/uploads/product.jpg')).toBe(
      'http://127.0.0.1:3001/uploads/product.jpg',
    );
  });

  it('normalizes protocol-relative urls', () => {
    expect(resolvePublicImageUrl('//cdn.example/img.jpg')).toBe('https://cdn.example/img.jpg');
  });

  it('keeps absolute https urls unchanged', () => {
    expect(resolvePublicImageUrl('https://cdn.example/img.jpg')).toBe(
      'https://cdn.example/img.jpg',
    );
  });

  it('rewrites localhost API image urls to current API origin', () => {
    expect(resolvePublicImageUrl('http://localhost:3001/uploads/product.jpg')).toBe(
      'http://127.0.0.1:3001/uploads/product.jpg',
    );
  });

  it('joins bare relative paths without a leading slash', () => {
    expect(resolvePublicImageUrl('uploads/product.jpg')).toBe(
      'http://127.0.0.1:3001/uploads/product.jpg',
    );
  });

  it('keeps same-origin local API urls unchanged', () => {
    expect(resolvePublicImageUrl('http://127.0.0.1:3001/uploads/product.jpg')).toBe(
      'http://127.0.0.1:3001/uploads/product.jpg',
    );
  });

  it('returns malformed absolute urls unchanged when parsing fails', () => {
    expect(resolvePublicImageUrl('http://%')).toBe('http://%');
  });

  it('does not rewrite non-API localhost ports', () => {
    expect(resolvePublicImageUrl('http://localhost:8080/uploads/product.jpg')).toBe(
      'http://localhost:8080/uploads/product.jpg',
    );
  });

  it('rewrites localhost without explicit port to API origin', () => {
    expect(resolvePublicImageUrl('http://localhost/uploads/product.jpg')).toBe(
      'http://127.0.0.1:3001/uploads/product.jpg',
    );
  });
});
