import { describe, expect, it } from 'vitest';
import { getAppVersionGateCopy } from './app-version-gate-copy.util';

describe('app-version-gate-copy.util (adopt-5.5)', () => {
  it('returns localized provider gate copy', () => {
    expect(getAppVersionGateCopy('en').title).toContain('Update');
    expect(getAppVersionGateCopy('hy').updateAction).toContain('store');
    expect(getAppVersionGateCopy('ru').dismissAction).toBeTruthy();
  });
});
