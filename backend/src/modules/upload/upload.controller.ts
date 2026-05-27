import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UploadService } from './upload.service.js';

const imagePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
  ],
});

const fileInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('businesses/:businessId/uploads')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(fileInterceptor)
  uploadAvatar(
    @Param('businessId') businessId: string,
    @UploadedFile(imagePipe) file: Express.Multer.File,
  ) {
    return this.uploadService.uploadAvatar(file, businessId);
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(fileInterceptor)
  uploadLogo(
    @Param('businessId') businessId: string,
    @UploadedFile(imagePipe) file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(file, businessId, 'logos');
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(fileInterceptor)
  uploadImage(
    @Param('businessId') businessId: string,
    @UploadedFile(imagePipe) file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(file, businessId);
  }
}
