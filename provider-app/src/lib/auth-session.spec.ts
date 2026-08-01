import { describe, expect, it, vi } from 'vitest';
import { finishProviderSession, unwrapAuthResult, type AuthResult } from './auth-session.js';

function buildResult(overrides: Partial<AuthResult> = {}): AuthResult {
  return {
    user: { id: 'user-1', email: 'a@b.com' },
    business: { id: 'biz-1', name: 'Biz', slug: 'biz-slug', membershipRole: 'owner' },
    employee: { id: 'emp-1', name: 'Employee' },
    businesses: [],
    token: 'signed.jwt.token',
    requiresBusinessSelection: false,
    ...overrides,
  };
}

describe('finishProviderSession (e2e-bug.172)', () => {
  it('establishes the session and returns true when access is allowed and a token/business are present', () => {
    const setAuth = vi.fn();
    const onAccessDenied = vi.fn();
    const onMissingSession = vi.fn();
    const result = buildResult();

    const ok = finishProviderSession(result, {
      canAccess: () => true,
      setAuth,
      onAccessDenied,
      onMissingSession,
    });

    expect(ok).toBe(true);
    expect(setAuth).toHaveBeenCalledWith(result.user, result.business, 'signed.jwt.token', {
      businesses: [],
      employee: result.employee,
    });
    expect(onAccessDenied).not.toHaveBeenCalled();
    expect(onMissingSession).not.toHaveBeenCalled();
  });

  it('does not call setAuth and reports access-denied when canAccess returns false', () => {
    const setAuth = vi.fn();
    const onAccessDenied = vi.fn();
    const onMissingSession = vi.fn();

    const ok = finishProviderSession(buildResult(), {
      canAccess: () => false,
      setAuth,
      onAccessDenied,
      onMissingSession,
    });

    expect(ok).toBe(false);
    expect(setAuth).not.toHaveBeenCalled();
    expect(onAccessDenied).toHaveBeenCalledTimes(1);
    expect(onMissingSession).not.toHaveBeenCalled();
  });

  it('does not call setAuth and reports missing-session when token is null', () => {
    const setAuth = vi.fn();
    const onAccessDenied = vi.fn();
    const onMissingSession = vi.fn();

    const ok = finishProviderSession(buildResult({ token: null }), {
      canAccess: () => true,
      setAuth,
      onAccessDenied,
      onMissingSession,
    });

    expect(ok).toBe(false);
    expect(setAuth).not.toHaveBeenCalled();
    expect(onMissingSession).toHaveBeenCalledTimes(1);
  });

  it('does not call setAuth and reports missing-session when business is null (multi-business selection pending)', () => {
    const setAuth = vi.fn();
    const onMissingSession = vi.fn();

    const ok = finishProviderSession(buildResult({ business: null }), {
      canAccess: () => true,
      setAuth,
      onAccessDenied: vi.fn(),
      onMissingSession,
    });

    expect(ok).toBe(false);
    expect(setAuth).not.toHaveBeenCalled();
    expect(onMissingSession).toHaveBeenCalledTimes(1);
  });

  it('checks access using the result employee/membershipRole, not hardcoded values', () => {
    const canAccess = vi.fn().mockReturnValue(true);
    const result = buildResult({
      employee: null,
      business: { id: 'biz-1', name: 'Biz', slug: 'biz-slug', membershipRole: 'manager' },
    });

    finishProviderSession(result, {
      canAccess,
      setAuth: vi.fn(),
      onAccessDenied: vi.fn(),
      onMissingSession: vi.fn(),
    });

    expect(canAccess).toHaveBeenCalledWith(null, 'manager');
  });
});

describe('unwrapAuthResult', () => {
  it('unwraps a {data: AuthResult} envelope', () => {
    const result = buildResult();
    expect(unwrapAuthResult({ data: result })).toEqual(result);
  });

  it('passes through a bare AuthResult with no envelope', () => {
    const result = buildResult();
    expect(unwrapAuthResult(result)).toEqual(result);
  });
});
