import { Injectable } from '@nestjs/common';
import { ExternalDoctorsService } from '../external-doctors/external-doctors.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateExternalDoctorLogic,
  handleListExternalDoctorsLogic,
  handleUpdateExternalDoctorLogic,
  type ExternalDoctorsLogicDeps,
} from './ai-external-doctors.logic.js';
import { dispatchExternalDoctorsLogicIntent } from './ai-external-doctors-dispatch.util.js';
import type { ExternalDoctorsDispatchContext } from './ai-external-doctors-dispatch.build.js';

@Injectable()
export class AiExternalDoctorsService {
  private readonly deps: ExternalDoctorsLogicDeps;

  constructor(externalDoctorsService: ExternalDoctorsService) {
    this.deps = { externalDoctorsService };
  }

  handleCreateExternalDoctor(
    businessId: string,
    userId: string | undefined,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCreateExternalDoctorLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  handleUpdateExternalDoctor(
    businessId: string,
    userId: string | undefined,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateExternalDoctorLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  handleListExternalDoctors(
    businessId: string,
    userId: string | undefined,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleListExternalDoctorsLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not an external-doctors intent. */
  dispatchIntent(
    ctx: ExternalDoctorsDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchExternalDoctorsLogicIntent(this.deps, ctx);
  }
}
