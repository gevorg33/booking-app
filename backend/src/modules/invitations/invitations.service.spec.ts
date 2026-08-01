import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';

describe('InvitationsService', () => {
  const inviteRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((v: any) => Promise.resolve(v)),
    create: jest.fn((v: any) => v),
  };
  const memberRepo = {
    findOne: jest.fn(),
    save: jest.fn((v: any) => Promise.resolve(v)),
    create: jest.fn((v: any) => v),
  };
  const userRepo = {
    findOne: jest.fn(),
    save: jest.fn((v: any) => Promise.resolve({ id: 'user-1', ...v })),
    create: jest.fn((v: any) => v),
  };
  const employeeRepo = {
    findOne: jest.fn(),
    save: jest.fn((v: any) => Promise.resolve(v)),
    create: jest.fn((v: any) => v),
  };
  const emailService = { send: jest.fn() };
  const tenantContactService = {
    assertEmailAvailableForInvite: jest.fn(),
    assertEmailAvailableInTenant: jest.fn(),
    assertPhoneAvailableInTenant: jest.fn(),
  };
  const authService = {
    issueSessionForUser: jest.fn().mockResolvedValue({
      user: { id: 'user-1', email: 'new@biz.com' },
      business: { id: 'biz-1', name: 'Biz', slug: 'biz-slug' },
      employee: { id: 'emp-1', name: 'New Employee' },
      businesses: [],
      token: 'signed.jwt.token',
      requiresBusinessSelection: false,
    }),
  };

  const service = new InvitationsService(
    inviteRepo as any,
    memberRepo as any,
    userRepo as any,
    employeeRepo as any,
    emailService as any,
    tenantContactService as any,
    authService as any,
  );

  const baseInvite = {
    id: 'invite-1',
    businessId: 'biz-1',
    email: 'new@biz.com',
    role: MemberRole.CONTRIBUTOR,
    token: 'tok-abc',
    employeeName: 'New Employee',
    employeeId: null,
    acceptedAt: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    business: { id: 'biz-1', name: 'Biz', slug: 'biz-slug' },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    inviteRepo.save.mockImplementation((v: any) => Promise.resolve(v));
    inviteRepo.create.mockImplementation((v: any) => v);
    memberRepo.save.mockImplementation((v: any) => Promise.resolve(v));
    memberRepo.create.mockImplementation((v: any) => v);
    userRepo.create.mockImplementation((v: any) => v);
    userRepo.save.mockImplementation((v: any) => Promise.resolve({ id: 'user-1', ...v }));
    employeeRepo.save.mockImplementation((v: any) => Promise.resolve(v));
    employeeRepo.create.mockImplementation((v: any) => v);
    authService.issueSessionForUser.mockResolvedValue({
      user: { id: 'user-1', email: 'new@biz.com' },
      business: { id: 'biz-1', name: 'Biz', slug: 'biz-slug' },
      employee: { id: 'emp-1', name: 'New Employee' },
      businesses: [],
      token: 'signed.jwt.token',
      requiresBusinessSelection: false,
    });
  });

  describe('accept (e2e-bug.172)', () => {
    it('issues a real session for a brand-new account instead of the old bare {user, business} shape', async () => {
      inviteRepo.findOne.mockResolvedValue({ ...baseInvite });
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValueOnce({
        id: 'user-1',
        email: 'new@biz.com',
        firstName: 'New',
        lastName: 'Employee',
      });
      memberRepo.findOne.mockResolvedValue(null);
      employeeRepo.findOne.mockResolvedValue(null);

      const result = await service.accept('tok-abc', {
        firstName: 'New',
        lastName: 'Employee',
        password: 'supersecret1',
      });

      // The whole point of the fix: a real token comes back, not just {user, business}.
      expect(result.token).toBe('signed.jwt.token');
      expect(result.requiresBusinessSelection).toBe(false);
      expect(authService.issueSessionForUser).toHaveBeenCalledTimes(1);
      const [calledUser, calledHint] = authService.issueSessionForUser.mock.calls[0];
      expect(calledUser.id).toBe('user-1');
      // Must scope the session to the business the invite was actually for,
      // even if the account later turns out to belong to multiple businesses.
      expect(calledHint).toEqual({ businessId: 'biz-1' });
    });

    it('scopes the session to the invited business via businessId hint, not just "whatever comes back"', async () => {
      inviteRepo.findOne.mockResolvedValue({
        ...baseInvite,
        businessId: 'biz-2',
        business: { id: 'biz-2', name: 'Other Biz', slug: 'other-biz' },
      });
      userRepo.findOne.mockResolvedValue({
        id: 'user-existing',
        email: 'new@biz.com',
      });
      memberRepo.findOne.mockResolvedValue(null);
      employeeRepo.findOne.mockResolvedValue(null);

      await service.accept('tok-abc', {
        firstName: 'New',
        lastName: 'Employee',
      });

      expect(authService.issueSessionForUser).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-existing' }),
        { businessId: 'biz-2' },
      );
    });

    it('rejects an already-accepted invitation without ever touching the auth service', async () => {
      inviteRepo.findOne.mockResolvedValue({
        ...baseInvite,
        acceptedAt: new Date(),
      });

      await expect(
        service.accept('tok-abc', { firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(BadRequestException);
      expect(authService.issueSessionForUser).not.toHaveBeenCalled();
    });

    it('rejects an expired invitation without ever touching the auth service', async () => {
      inviteRepo.findOne.mockResolvedValue({
        ...baseInvite,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.accept('tok-abc', { firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(BadRequestException);
      expect(authService.issueSessionForUser).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown token', async () => {
      inviteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.accept('bad-token', { firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(NotFoundException);
      expect(authService.issueSessionForUser).not.toHaveBeenCalled();
    });

    it('requires a password only for brand-new accounts, still issues a session for existing ones', async () => {
      inviteRepo.findOne.mockResolvedValue({ ...baseInvite });
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'new@biz.com',
        firstName: 'Existing',
      });
      memberRepo.findOne.mockResolvedValue(null);
      employeeRepo.findOne.mockResolvedValue(null);

      const result = await service.accept('tok-abc', {
        firstName: 'Existing',
        lastName: 'User',
      });

      expect(result.token).toBe('signed.jwt.token');
      expect(authService.issueSessionForUser).toHaveBeenCalledTimes(1);
    });

    it('requires a password for a genuinely new account and never issues a session without one', async () => {
      inviteRepo.findOne.mockResolvedValue({ ...baseInvite });
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.accept('tok-abc', { firstName: 'New', lastName: 'Employee' }),
      ).rejects.toThrow(BadRequestException);
      expect(authService.issueSessionForUser).not.toHaveBeenCalled();
    });
  });
});
