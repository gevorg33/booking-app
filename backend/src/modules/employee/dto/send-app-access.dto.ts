import { IsEnum, IsOptional } from 'class-validator';
import { ASSIGNABLE_MEMBER_ROLES } from '../../business/dto/update-member-role.dto.js';

export class SendAppAccessDto {
  @IsOptional()
  @IsEnum(ASSIGNABLE_MEMBER_ROLES)
  role?: (typeof ASSIGNABLE_MEMBER_ROLES)[number];
}
