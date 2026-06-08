import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiTeamMembersService } from './ai-team-members.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { TEAM_MEMBER_SCENARIOS } from './ai-team-members.fixtures.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { TeamMembersService } from '../business/team-members.service.js';

describe('parity-2.1 team member role AI scenarios', () => {
  const teamMembersService = {
    updateRole: jest.fn(async () => ({
      id: 'mem-1',
      email: 'anna@example.com',
      role: MemberRole.MANAGER,
    })),
    updateRoleByEmployeeId: jest.fn(async () => ({
      id: 'mem-2',
      email: 'john@example.com',
      role: MemberRole.STAFF,
    })),
  };

  let teamMembers: AiTeamMembersService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiTeamMembersService,
        AiIntentRescueService,
        { provide: TeamMembersService, useValue: teamMembersService },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(async () => ({ id: 'biz-1', name: 'Test Salon' })),
          },
        },
      ],
    }).compile();

    teamMembers = module.get(AiTeamMembersService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue routing', () => {
    it.each(TEAM_MEMBER_SCENARIOS)(
      'rescues dashboard scenario $id',
      ({ prompt, expectedAction }) => {
        const result = rescue.rescue({ prompt, action: 'unknown', params: {} });
        expect(result?.action).toBe(expectedAction);
        expect(result?.rescued).toBe(true);
      },
    );
  });

  describe('handlers', () => {
    it('updates team member role for owner', async () => {
      const result = await teamMembers.handleUpdateTeamMemberRole(
        'biz-1',
        'owner-user',
        { memberId: 'mem-1', role: 'manager' },
      );
      expect(result.success).toBe(true);
      expect(teamMembersService.updateRole).toHaveBeenCalledWith(
        'biz-1',
        'mem-1',
        MemberRole.MANAGER,
        'owner-user',
      );
    });
  });
});
