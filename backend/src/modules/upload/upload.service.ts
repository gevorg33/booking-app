import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_DOCUMENT_MIME = new Set(['application/pdf']);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export interface UploadedImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface UploadedDocument {
  url: string;
  publicId: string;
  bytes: number;
  mimeType: string;
}

@Injectable()
export class UploadService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      return;
    }

    if (cloudinaryUrl) {
      cloudinary.config({ secure: true });
      return;
    }

    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL).',
    );
  }

  async uploadImage(
    file: Express.Multer.File,
    businessId: string,
    subfolder = 'images',
  ): Promise<UploadedImage> {
    this.validateFile(file);

    const folder = `booking/${businessId}/${subfolder}`;

    const result = await this.uploadBuffer(file.buffer, folder);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  async uploadAvatar(
    file: Express.Multer.File,
    businessId: string,
  ): Promise<UploadedImage> {
    this.validateFile(file);

    const folder = `booking/${businessId}/avatars`;

    const result = await this.uploadBuffer(file.buffer, folder, {
      transformation: [
        { width: 512, height: 512, crop: 'fill', gravity: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  async uploadPatientChartDocument(
    file: Express.Multer.File,
    businessId: string,
    customerId: string,
  ): Promise<UploadedDocument> {
    this.validateDocumentFile(file);

    const folder = `booking/${businessId}/patient-documents/${customerId}`;
    const result = await this.uploadRawBuffer(
      file.buffer,
      folder,
      file.originalname,
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      mimeType: file.mimetype,
    };
  }

  private uploadRawBuffer(
    buffer: Buffer,
    folder: string,
    originalName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'raw',
            public_id: originalName.replace(/\.[^.]+$/, '').slice(0, 120),
          },
          (error, result) => {
            if (error || !result) {
              reject(
                new BadRequestException(
                  error?.message || 'Document upload failed',
                ),
              );
              return;
            }
            resolve(result);
          },
        )
        .end(buffer);
    });
  }

  private uploadBuffer(
    buffer: Buffer,
    folder: string,
    options: Record<string, unknown> = {},
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
            ...options,
          },
          (error, result) => {
            if (error || !result) {
              reject(
                new BadRequestException(
                  error?.message || 'Image upload failed',
                ),
              );
              return;
            }
            resolve(result);
          },
        )
        .end(buffer);
    });
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, and GIF images are allowed',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
  }

  private validateDocumentFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_DOCUMENT_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only PDF documents are allowed');
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new BadRequestException('Document must be 20 MB or smaller');
    }
  }
}
