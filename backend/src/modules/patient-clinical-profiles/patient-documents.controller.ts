import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreatePatientDocumentDto } from './dto/create-patient-document.dto.js';
import { UpdatePatientDocumentReleaseDto } from './dto/update-patient-document-release.dto.js';
import { PatientDocumentsService } from './patient-documents.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';

const documentPipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^application\/pdf$/ }),
  ],
});

const documentInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

@Controller('businesses/:businessId/customers/:customerId/documents')
@UseGuards(JwtAuthGuard)
export class PatientDocumentsController {
  constructor(
    private readonly documentsService: PatientDocumentsService,
    private readonly accessService: PatientClinicalProfileAccessService,
  ) {}

  @Get()
  async listDocuments(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Query('category') category: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.documentsService.listDocumentsForCustomer(
        businessId,
        customerId,
        access,
        category,
      ),
    };
  }

  @Patch(':documentId/release')
  async updateDocumentRelease(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdatePatientDocumentReleaseDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.documentsService.updateDocumentReleaseForCustomer(
        businessId,
        customerId,
        documentId,
        access,
        dto.releasedToPatient,
      ),
    };
  }

  @Get(':documentId')
  async getDocument(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.documentsService.getDocumentForCustomer(
        businessId,
        customerId,
        documentId,
        access,
      ),
    };
  }

  @Post()
  @UseInterceptors(documentInterceptor)
  async uploadDocument(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: CreatePatientDocumentDto,
    @UploadedFile(documentPipe) file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.documentsService.uploadDocumentForCustomer(
        businessId,
        customerId,
        access,
        dto,
        file,
      ),
    };
  }
}
