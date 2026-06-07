import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ClinicLabRegistryService } from './clinic-lab-registry.service.js';
import {
  AssignClinicLabMachineDto,
  CreateClinicLabInfoDto,
  CreateClinicLabMachineDto,
  UpdateClinicLabInfoDto,
  UpdateClinicLabMachineDto,
} from './dto/clinic-lis.dto.js';

@Controller('businesses/:businessId/clinic-labs')
@UseGuards(JwtAuthGuard)
export class ClinicLabRegistryController {
  constructor(private readonly registryService: ClinicLabRegistryService) {}

  @Get()
  async listLabs(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.registryService.listLabInfo(businessId, user.id),
    };
  }

  @Get('external-options')
  async listExternalLabOptions(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.registryService.listExternalLabs(businessId, user.id),
    };
  }

  @Get('machines/options')
  async listMachineOptions(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.registryService.listLabMachineOptions(
        businessId,
        user.id,
      ),
    };
  }

  @Get('machines')
  async listMachines(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.registryService.listLabMachines(businessId, user.id),
    };
  }

  @Post('machines')
  async createMachine(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateClinicLabMachineDto,
  ) {
    return {
      data: await this.registryService.createLabMachine(
        businessId,
        user.id,
        dto,
      ),
    };
  }

  @Put('machines/:machineId')
  async updateMachine(
    @Param('businessId') businessId: string,
    @Param('machineId') machineId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateClinicLabMachineDto,
  ) {
    return {
      data: await this.registryService.updateLabMachine(
        businessId,
        user.id,
        machineId,
        dto,
      ),
    };
  }

  @Patch('specimens/:specimenId/lab-machine')
  async assignMachineToSpecimen(
    @Param('businessId') businessId: string,
    @Param('specimenId') specimenId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AssignClinicLabMachineDto,
  ) {
    return {
      data: await this.registryService.assignLabMachineToSpecimen(
        businessId,
        user.id,
        specimenId,
        dto,
      ),
    };
  }

  @Post()
  async createLab(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateClinicLabInfoDto,
  ) {
    return {
      data: await this.registryService.createLabInfo(businessId, user.id, dto),
    };
  }

  @Put(':labInfoId')
  async updateLab(
    @Param('businessId') businessId: string,
    @Param('labInfoId') labInfoId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateClinicLabInfoDto,
  ) {
    return {
      data: await this.registryService.updateLabInfo(
        businessId,
        user.id,
        labInfoId,
        dto,
      ),
    };
  }
}
