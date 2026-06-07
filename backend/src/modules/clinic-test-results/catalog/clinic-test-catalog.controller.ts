import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../../business/business.service.js';
import { ClinicTestCatalogService } from './clinic-test-catalog.service.js';
import {
  CreateClinicTestPanelDto,
  CreateClinicTestTypeDto,
  UpdateClinicTestPanelDto,
  UpdateClinicTestTypeDto,
  UpsertClinicTestPanelItemsDto,
  ImportClinicTestCatalogCsvDto,
} from './dto/clinic-test-catalog.dto.js';

@Controller('businesses/:businessId/clinic-test-results/catalog')
@UseGuards(JwtAuthGuard)
export class ClinicTestCatalogController {
  constructor(
    private readonly catalogService: ClinicTestCatalogService,
    private readonly businessService: BusinessService,
  ) {}

  @Get('test-types')
  async listTestTypes(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return { data: await this.catalogService.listTestTypes(businessId) };
  }

  @Get('test-types/:testTypeId')
  async getTestType(
    @Param('businessId') businessId: string,
    @Param('testTypeId') testTypeId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      data: await this.catalogService.getTestType(businessId, testTypeId),
    };
  }

  @Post('test-types')
  async createTestType(
    @Param('businessId') businessId: string,
    @Body() dto: CreateClinicTestTypeDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.createTestType(
        businessId,
        dto,
        membership.role,
      ),
    };
  }

  @Put('test-types/:testTypeId')
  async updateTestType(
    @Param('businessId') businessId: string,
    @Param('testTypeId') testTypeId: string,
    @Body() dto: UpdateClinicTestTypeDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.updateTestType(
        businessId,
        testTypeId,
        dto,
        membership.role,
      ),
    };
  }

  @Delete('test-types/:testTypeId')
  async deactivateTestType(
    @Param('businessId') businessId: string,
    @Param('testTypeId') testTypeId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.deactivateTestType(
        businessId,
        testTypeId,
        membership.role,
      ),
    };
  }

  @Get('test-panels')
  async listPanels(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return { data: await this.catalogService.listPanels(businessId) };
  }

  @Post('test-panels')
  async createPanel(
    @Param('businessId') businessId: string,
    @Body() dto: CreateClinicTestPanelDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.createPanel(
        businessId,
        dto,
        membership.role,
      ),
    };
  }

  @Put('test-panels/:panelId')
  async updatePanel(
    @Param('businessId') businessId: string,
    @Param('panelId') panelId: string,
    @Body() dto: UpdateClinicTestPanelDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.updatePanel(
        businessId,
        panelId,
        dto,
        membership.role,
      ),
    };
  }

  @Put('test-panels/:panelId/items')
  async upsertPanelItems(
    @Param('businessId') businessId: string,
    @Param('panelId') panelId: string,
    @Body() dto: UpsertClinicTestPanelItemsDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.upsertPanelItems(
        businessId,
        panelId,
        dto,
        membership.role,
      ),
    };
  }

  @Post('seed-playbook')
  async seedFromPlaybook(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.seedFromPlaybook(
        businessId,
        membership.role,
      ),
    };
  }

  @Post('import-csv')
  async importFromCsv(
    @Param('businessId') businessId: string,
    @Body() dto: ImportClinicTestCatalogCsvDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(
      businessId,
      user.id,
    );
    return {
      data: await this.catalogService.importFromCsv(
        businessId,
        dto.csv,
        membership.role,
      ),
    };
  }
}
