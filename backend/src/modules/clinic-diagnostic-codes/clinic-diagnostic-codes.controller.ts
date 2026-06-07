import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreateClinicDiagnosticCodeDto,
  ListClinicDiagnosticCodesQueryDto,
  UpdateClinicDiagnosticCodeDto,
} from './dto/clinic-diagnostic-code.dto.js';
import { ClinicDiagnosticCodesService } from './clinic-diagnostic-codes.service.js';

@Controller('businesses/:businessId/clinic-diagnostic-codes')
@UseGuards(JwtAuthGuard)
export class ClinicDiagnosticCodesController {
  constructor(
    private readonly clinicDiagnosticCodesService: ClinicDiagnosticCodesService,
  ) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListClinicDiagnosticCodesQueryDto,
  ) {
    return {
      data: await this.clinicDiagnosticCodesService.listClinicDiagnosticCodes(
        businessId,
        user.id,
        query,
      ),
    };
  }

  @Get(':codeId')
  async getOne(
    @Param('businessId') businessId: string,
    @Param('codeId') codeId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.clinicDiagnosticCodesService.getClinicDiagnosticCode(
        businessId,
        user.id,
        codeId,
      ),
    };
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateClinicDiagnosticCodeDto,
  ) {
    return {
      data: await this.clinicDiagnosticCodesService.createClinicDiagnosticCode(
        businessId,
        user.id,
        dto,
      ),
    };
  }

  @Put(':codeId')
  async update(
    @Param('businessId') businessId: string,
    @Param('codeId') codeId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateClinicDiagnosticCodeDto,
  ) {
    return {
      data: await this.clinicDiagnosticCodesService.updateClinicDiagnosticCode(
        businessId,
        user.id,
        codeId,
        dto,
      ),
    };
  }
}
