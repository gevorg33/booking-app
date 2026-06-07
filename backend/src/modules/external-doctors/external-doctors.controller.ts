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
  CreateExternalDoctorDto,
  ListExternalDoctorsQueryDto,
  UpdateExternalDoctorDto,
} from './dto/external-doctor.dto.js';
import { ExternalDoctorsService } from './external-doctors.service.js';

@Controller('businesses/:businessId/external-doctors')
@UseGuards(JwtAuthGuard)
export class ExternalDoctorsController {
  constructor(
    private readonly externalDoctorsService: ExternalDoctorsService,
  ) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListExternalDoctorsQueryDto,
  ) {
    return {
      data: await this.externalDoctorsService.listExternalDoctors(
        businessId,
        user.id,
        query,
      ),
    };
  }

  @Get(':doctorId')
  async getOne(
    @Param('businessId') businessId: string,
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.externalDoctorsService.getExternalDoctor(
        businessId,
        user.id,
        doctorId,
      ),
    };
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateExternalDoctorDto,
  ) {
    return {
      data: await this.externalDoctorsService.createExternalDoctor(
        businessId,
        user.id,
        dto,
      ),
    };
  }

  @Put(':doctorId')
  async update(
    @Param('businessId') businessId: string,
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateExternalDoctorDto,
  ) {
    return {
      data: await this.externalDoctorsService.updateExternalDoctor(
        businessId,
        user.id,
        doctorId,
        dto,
      ),
    };
  }
}
