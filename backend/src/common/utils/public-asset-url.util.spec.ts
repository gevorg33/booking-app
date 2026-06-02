import { resolvePublicAssetUrl } from './public-asset-url.util.js';

describe('resolvePublicAssetUrl', () => {
  it('returns undefined for empty values', () => {
    expect(resolvePublicAssetUrl(undefined, 'http://localhost:3001')).toBeUndefined();
    expect(resolvePublicAssetUrl('  ', 'http://localhost:3001')).toBeUndefined();
  });

  it('prefixes relative paths with API base', () => {
    expect(resolvePublicAssetUrl('/uploads/logo.png', 'http://localhost:3001/')).toBe(
      'http://localhost:3001/uploads/logo.png',
    );
  });

  it('keeps absolute https URLs', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/logo.png';
    expect(resolvePublicAssetUrl(url, 'http://localhost:3001')).toBe(url);
  });

  it('normalizes protocol-relative URLs', () => {
    expect(resolvePublicAssetUrl('//cdn.example.com/logo.png', 'http://localhost:3001')).toBe(
      'https://cdn.example.com/logo.png',
    );
  });
});
